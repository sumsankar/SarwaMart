# SarwaMart — .NET 8 API Implementation Plan

## 1. Architecture Overview

```
SarwaMart.API          <- ASP.NET Core Web API (Controllers, Middleware)
SarwaMart.Application  <- CQRS Commands/Queries, Validators, DTOs, Interfaces
SarwaMart.Domain       <- Entities, Enums, Domain Events, Value Objects
SarwaMart.Infrastructure <- EF Core, Repositories, External Services (SMS, Storage)
SarwaMart.Shared       <- Common Result<T>, PagedList<T>, Guard helpers
```

**Key libraries:**

| Concern | Package |
|---|---|
| CQRS | MediatR |
| Validation | FluentValidation |
| Mapping | AutoMapper |
| ORM | EF Core 8 + SQL Server |
| Auth | JWT Bearer + custom OTP |
| Real-time | SignalR (negotiation chat) |
| Logging | Serilog -> Seq |
| API docs | Swashbuckle (OpenAPI 3) |
| File storage | Azure Blob / AWS S3 (abstracted) |
| Rate limiting | ASP.NET Core built-in (sliding window) |
| Caching | IMemoryCache / IDistributedCache (Redis) |
| PDF generation | QuestPDF |
| Background jobs | Quartz.NET |
| Push notifications | Firebase FCM |

---

## 2. SQL Database Schema

### 2.1 Users & Auth

```sql
-- Core user identity
CREATE TABLE Users (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Phone         VARCHAR(15)      NOT NULL UNIQUE,
    Name          NVARCHAR(150)    NULL,
    Email         NVARCHAR(254)    NULL,
    PINHash       VARCHAR(128)     NULL,          -- BCrypt of 6-digit PIN
    Role          TINYINT          NOT NULL DEFAULT 0,  -- 0=Unset,1=Seller,2=Buyer
    AccountType   TINYINT          NOT NULL DEFAULT 0,  -- 0=Unset,1=Individual,2=Company
    Status        TINYINT          NOT NULL DEFAULT 1,  -- 1=Pending,2=UnderReview,3=Approved,4=Rejected,5=Suspended
    Rating        DECIMAL(3,2)     NOT NULL DEFAULT 0,
    TotalDeals    INT              NOT NULL DEFAULT 0,
    MemberSince   DATE             NULL,
    State         NVARCHAR(100)    NULL,
    City          NVARCHAR(100)    NULL,
    Pincode       VARCHAR(10)      NULL,
    Address       NVARCHAR(500)    NULL,
    BranchId      UNIQUEIDENTIFIER NULL REFERENCES Branches(Id), -- selected during registration
    IsVerified    BIT              NOT NULL DEFAULT 0,
    IsActive      BIT              NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Users_BranchId (BranchId)
);

-- OTP codes (TTL = 10 minutes, single-use)
CREATE TABLE OtpCodes (
    Id            BIGINT IDENTITY   PRIMARY KEY,
    Phone         VARCHAR(15)       NOT NULL,
    CodeHash      VARCHAR(128)      NOT NULL,     -- BCrypt hash of 6-digit OTP
    ExpiresAt     DATETIME2         NOT NULL,
    IsUsed        BIT               NOT NULL DEFAULT 0,
    AttemptCount  TINYINT           NOT NULL DEFAULT 0,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_OtpCodes_Phone (Phone)
);

-- Refresh tokens
CREATE TABLE RefreshTokens (
    Id            BIGINT IDENTITY   PRIMARY KEY,
    UserId        UNIQUEIDENTIFIER  NOT NULL REFERENCES Users(Id),
    TokenHash     VARCHAR(128)      NOT NULL UNIQUE,
    DeviceInfo    NVARCHAR(200)     NULL,
    ExpiresAt     DATETIME2         NOT NULL,
    RevokedAt     DATETIME2         NULL,
    CreatedAt     DATETIME2         NOT NULL DEFAULT GETUTCDATE()
);
```

### 2.2 Branches & Service Areas

```sql
-- SarwaMart branch offices — each serves a geographic coverage area
CREATE TABLE Branches (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    Code          VARCHAR(10)      NOT NULL UNIQUE,  -- e.g. "AP-VJA", "TN-CHE"
    Name          NVARCHAR(150)    NOT NULL,          -- e.g. "Vijayawada Branch"
    AddressLine1  NVARCHAR(200)    NOT NULL,
    AddressLine2  NVARCHAR(200)    NULL,
    City          NVARCHAR(100)    NOT NULL,
    State         NVARCHAR(100)    NOT NULL,
    Pincode       VARCHAR(10)      NOT NULL,
    Phone         VARCHAR(15)      NULL,
    Email         NVARCHAR(254)    NULL,
    ManagerUserId UNIQUEIDENTIFIER NULL REFERENCES Users(Id), -- assigned BranchAdmin
    IsActive      BIT              NOT NULL DEFAULT 1,
    AllowCrossBranchTrade BIT      NOT NULL DEFAULT 1, -- sellers/buyers can trade outside branch
    CreatedAt     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Branches_State (State),
    INDEX IX_Branches_IsActive (IsActive)
);

-- Pincodes / districts served by each branch (many-to-one)
-- Used to auto-suggest the nearest branch during registration
CREATE TABLE BranchServiceAreas (
    Id          BIGINT IDENTITY     PRIMARY KEY,
    BranchId    UNIQUEIDENTIFIER    NOT NULL REFERENCES Branches(Id) ON DELETE CASCADE,
    AreaType    TINYINT             NOT NULL,  -- 1=Pincode, 2=District, 3=State
    AreaValue   NVARCHAR(100)       NOT NULL,  -- "530001" or "West Godavari" or "Andhra Pradesh"
    INDEX IX_BranchServiceAreas_BranchId (BranchId),
    INDEX IX_BranchServiceAreas_AreaValue (AreaType, AreaValue)
);

-- Office staff ↔ branch many-to-many mapping
-- SuperAdmin: no rows needed (bypasses all branch checks at code level)
-- Admin / BranchAdmin: one or more rows, configured by SuperAdmin
-- Sellers / Buyers: NOT stored here — their single home branch lives in Users.BranchId
CREATE TABLE UserBranchAccess (
    Id          BIGINT IDENTITY         PRIMARY KEY,
    UserId      UNIQUEIDENTIFIER        NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    BranchId    UNIQUEIDENTIFIER        NOT NULL REFERENCES Branches(Id),
    GrantedBy   UNIQUEIDENTIFIER        NOT NULL REFERENCES Users(Id),
    GrantedAt   DATETIME2               NOT NULL DEFAULT GETUTCDATE(),
    RevokedBy   UNIQUEIDENTIFIER        NULL REFERENCES Users(Id),
    RevokedAt   DATETIME2               NULL,
    IsActive    BIT                     NOT NULL DEFAULT 1,
    CONSTRAINT UQ_UserBranchAccess UNIQUE (UserId, BranchId),
    INDEX IX_UserBranchAccess_UserId (UserId),
    INDEX IX_UserBranchAccess_BranchId (BranchId)
);
```

### 2.3 Product Taxonomy

```sql
-- Master category list (Fish, Prawn, Crab, Lobster, Squid, Shellfish)
CREATE TABLE ProductCategories (
    Id            TINYINT          PRIMARY KEY,
    Name          NVARCHAR(50)     NOT NULL UNIQUE,
    Emoji         NVARCHAR(5)      NULL,
    SortOrder     TINYINT          NOT NULL DEFAULT 0,
    IsActive      BIT              NOT NULL DEFAULT 1
);

-- Subcategory / variety (Rohu, Catla, Tiger Prawn, etc.)
CREATE TABLE ProductSubcategories (
    Id            SMALLINT         PRIMARY KEY IDENTITY,
    CategoryId    TINYINT          NOT NULL REFERENCES ProductCategories(Id),
    Name          NVARCHAR(100)    NOT NULL,
    IsActive      BIT              NOT NULL DEFAULT 1,
    UNIQUE (CategoryId, Name)
);

-- User -> product category associations (onboarding step)
CREATE TABLE UserProductCategories (
    UserId        UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CategoryId    TINYINT          NOT NULL REFERENCES ProductCategories(Id),
    PRIMARY KEY (UserId, CategoryId)
);

-- User -> specific variety associations
CREATE TABLE UserProductSubcategories (
    UserId           UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    SubcategoryId    SMALLINT         NOT NULL REFERENCES ProductSubcategories(Id),
    PRIMARY KEY (UserId, SubcategoryId)
);
```

### 2.3 Listings (Seller Items)

```sql
CREATE TABLE Listings (
    Id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SellerId            UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CategoryId          TINYINT          NOT NULL REFERENCES ProductCategories(Id),
    SubcategoryId       SMALLINT         NULL  REFERENCES ProductSubcategories(Id),
    Name                NVARCHAR(150)    NOT NULL,        -- e.g. "Fresh Rohu"
    Quantity            DECIMAL(10,2)    NOT NULL,        -- total quantity listed
    QuantityAllocated   DECIMAL(10,2)    NOT NULL DEFAULT 0, -- sum of all confirmed deal quantities
    UOM                 NVARCHAR(10)     NOT NULL DEFAULT 'kg',
    PricePerUnit        DECIMAL(10,2)    NOT NULL,        -- seller's starting/floor price
    Freshness           TINYINT          NOT NULL,  -- 1=Live,2=FreshOnIce,3=Frozen,4=Processed
    Grade               TINYINT          NOT NULL,  -- 1=A,2=B,3=Mixed
    Region              NVARCHAR(150)    NULL,         -- free-text village/area within branch
    BranchId            UNIQUEIDENTIFIER NOT NULL REFERENCES Branches(Id),
    AllowPartialBids    BIT              NOT NULL DEFAULT 1, -- seller permits partial quantity bids
    MinBidQuantity      DECIMAL(10,2)    NULL,             -- optional minimum per bid
    ValidityHours       SMALLINT         NOT NULL DEFAULT 48,
    Status              TINYINT          NOT NULL DEFAULT 1,
        -- 1=Draft, 2=PendingApproval, 3=Live, 4=PartiallyAllocated,
        -- 5=FullyAllocated, 6=Expired, 7=Rejected, 8=Cancelled
    RejectionReason     NVARCHAR(500)    NULL,             -- populated by admin on rejection
    ReviewedBy          UNIQUEIDENTIFIER NULL REFERENCES Users(Id), -- admin who approved/rejected
    ReviewedAt          DATETIME2        NULL,
    ExpiresAt           DATETIME2        NULL,
    ActiveBidCount      INT              NOT NULL DEFAULT 0,
    CreatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    -- Computed: QuantityRemaining = Quantity - QuantityAllocated (use in application layer)
    CONSTRAINT CK_Listings_AllocatedLEQuantity CHECK (QuantityAllocated <= Quantity),
    CONSTRAINT CK_Listings_MinBidQty CHECK (MinBidQuantity IS NULL OR MinBidQuantity > 0),
    INDEX IX_Listings_SellerId (SellerId),
    INDEX IX_Listings_BranchId_Status (BranchId, Status),
    INDEX IX_Listings_Status_CategoryId (Status, CategoryId),
    INDEX IX_Listings_ExpiresAt (ExpiresAt) WHERE Status IN (3, 4),
    INDEX IX_Listings_PendingApproval (BranchId, Status) WHERE Status = 2
);

CREATE TABLE ListingImages (
    Id          BIGINT IDENTITY     PRIMARY KEY,
    ListingId   UNIQUEIDENTIFIER    NOT NULL REFERENCES Listings(Id) ON DELETE CASCADE,
    Url         NVARCHAR(500)       NOT NULL,
    IsCover     BIT                 NOT NULL DEFAULT 0,
    SortOrder   TINYINT             NOT NULL DEFAULT 0
);
```

### 2.4 Buyer Requests

```sql
CREATE TABLE BuyerRequests (
    Id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    BuyerId             UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CategoryId          TINYINT          NOT NULL REFERENCES ProductCategories(Id),
    SubcategoryId       SMALLINT         NULL  REFERENCES ProductSubcategories(Id),
    ProductName         NVARCHAR(150)    NOT NULL,
    Quantity            DECIMAL(10,2)    NOT NULL,        -- total quantity required
    QuantityAllocated   DECIMAL(10,2)    NOT NULL DEFAULT 0, -- sum of all confirmed deal quantities
    UOM                 NVARCHAR(10)     NOT NULL DEFAULT 'kg',
    ExpectedPrice       DECIMAL(10,2)    NOT NULL,
    GradePreference     TINYINT          NOT NULL DEFAULT 0,  -- 0=Any,1=A,2=B
    Location            NVARCHAR(200)    NULL,        -- free-text delivery location within branch
    BranchId            UNIQUEIDENTIFIER NOT NULL REFERENCES Branches(Id),
    DeliveryPref        TINYINT          NOT NULL DEFAULT 3,  -- 1=Pickup,2=Delivery,3=Either
    NeededBy            DATE             NULL,
    Description         NVARCHAR(500)    NULL,
    OpenToCounter       BIT              NOT NULL DEFAULT 1,
    AllowPartialFill    BIT              NOT NULL DEFAULT 1, -- buyer accepts partial proposals
    MinProposalQuantity DECIMAL(10,2)    NULL,             -- optional minimum per proposal
    Status              TINYINT          NOT NULL DEFAULT 1,
        -- 1=Draft, 2=PendingApproval, 3=Live, 4=PartiallyFulfilled,
        -- 5=FullyFulfilled, 6=Expired, 7=Cancelled, 8=Rejected
    RejectionReason     NVARCHAR(500)    NULL,             -- populated by admin on rejection
    ReviewedBy          UNIQUEIDENTIFIER NULL REFERENCES Users(Id), -- admin who approved/rejected
    ReviewedAt          DATETIME2        NULL,
    ProposalCount       INT              NOT NULL DEFAULT 0,
    ExpiresAt           DATETIME2        NULL,
    CreatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT CK_BuyerRequests_AllocatedLEQuantity CHECK (QuantityAllocated <= Quantity),
    INDEX IX_BuyerRequests_BuyerId (BuyerId),
    INDEX IX_BuyerRequests_BranchId_Status (BranchId, Status),
    INDEX IX_BuyerRequests_Status_CategoryId (Status, CategoryId),
    INDEX IX_BuyerRequests_PendingApproval (BranchId, Status) WHERE Status = 2
);

CREATE TABLE RequestImages (
    Id          BIGINT IDENTITY     PRIMARY KEY,
    RequestId   UNIQUEIDENTIFIER    NOT NULL REFERENCES BuyerRequests(Id) ON DELETE CASCADE,
    Url         NVARCHAR(500)       NOT NULL
);
```

### 2.5 Bids & Proposals

```sql
-- Buyer bids on a seller Listing
-- Multiple buyers can hold accepted bids on the same listing (partial allocation model)
CREATE TABLE Bids (
    Id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    BuyerId           UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    ListingId         UNIQUEIDENTIFIER NOT NULL REFERENCES Listings(Id),
    PricePerUnit      DECIMAL(10,2)    NOT NULL,  -- buyer's offered price
    QuantityRequested DECIMAL(10,2)    NOT NULL,  -- quantity buyer wants
    QuantityAllocated DECIMAL(10,2)    NOT NULL DEFAULT 0, -- quantity actually confirmed in deal
    Note              NVARCHAR(500)    NULL,
    Status            TINYINT          NOT NULL DEFAULT 1,
        -- 1=Pending, 2=Negotiating, 3=Countered, 4=Accepted, 5=Declined,
        -- 6=Expired, 7=PartiallyAccepted (deal confirmed for less than requested)
    ExchangeCount     TINYINT          NOT NULL DEFAULT 0,
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE (BuyerId, ListingId),  -- one active bid per buyer per listing
    CONSTRAINT CK_Bids_AllocatedLERequested CHECK (QuantityAllocated <= QuantityRequested),
    INDEX IX_Bids_ListingId (ListingId),
    INDEX IX_Bids_BuyerId (BuyerId)
);

-- Seller proposals on a BuyerRequest
-- Multiple sellers can hold accepted proposals on the same buyer request (partial fill model)
CREATE TABLE Proposals (
    Id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SellerId          UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    RequestId         UNIQUEIDENTIFIER NOT NULL REFERENCES BuyerRequests(Id),
    PricePerUnit      DECIMAL(10,2)    NOT NULL,
    QuantityOffered   DECIMAL(10,2)    NOT NULL,  -- quantity seller proposes to supply
    QuantityAllocated DECIMAL(10,2)    NOT NULL DEFAULT 0, -- quantity confirmed in deal
    Note              NVARCHAR(500)    NULL,
    DeliveryInfo      NVARCHAR(200)    NULL,
    Status            TINYINT          NOT NULL DEFAULT 1,
        -- 1=Pending, 2=Countered, 3=Accepted, 4=Declined, 5=Expired,
        -- 6=Negotiating, 7=PartiallyAccepted
    ExchangeCount     TINYINT          NOT NULL DEFAULT 0,
    CreatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE (SellerId, RequestId),
    CONSTRAINT CK_Proposals_AllocatedLEOffered CHECK (QuantityAllocated <= QuantityOffered),
    INDEX IX_Proposals_RequestId (RequestId),
    INDEX IX_Proposals_SellerId (SellerId)
);

-- Tracks each confirmed allocation slice: which buyer got how much of a listing,
-- or which seller fulfilled how much of a request. One row per confirmed deal.
CREATE TABLE Allocations (
    Id              BIGINT IDENTITY     PRIMARY KEY,
    SourceType      TINYINT             NOT NULL,  -- 1=Listing, 2=BuyerRequest
    SourceId        UNIQUEIDENTIFIER    NOT NULL,  -- Listings.Id or BuyerRequests.Id
    DealId          UNIQUEIDENTIFIER    NOT NULL REFERENCES Deals(Id),
    BuyerId         UNIQUEIDENTIFIER    NOT NULL REFERENCES Users(Id),
    SellerId        UNIQUEIDENTIFIER    NOT NULL REFERENCES Users(Id),
    QuantityAllocated DECIMAL(10,2)     NOT NULL,
    PricePerUnit    DECIMAL(10,2)       NOT NULL,
    AllocationType  TINYINT             NOT NULL,  -- 1=Full, 2=Partial
    AllocatedAt     DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Allocations_Source (SourceType, SourceId),
    INDEX IX_Allocations_DealId (DealId)
);
```

### 2.6 Negotiation Threads & Messages

```sql
-- One thread per Bid OR per Proposal
CREATE TABLE NegotiationThreads (
    Id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    SourceType  TINYINT          NOT NULL,  -- 1=Bid, 2=Proposal
    SourceId    UNIQUEIDENTIFIER NOT NULL,  -- FK to Bids.Id or Proposals.Id
    BuyerId     UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    SellerId    UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    IsResolved  BIT              NOT NULL DEFAULT 0,
    CreatedAt   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_NegThread_SourceId (SourceType, SourceId)
);

CREATE TABLE NegotiationMessages (
    Id            BIGINT IDENTITY      PRIMARY KEY,
    ThreadId      UNIQUEIDENTIFIER     NOT NULL REFERENCES NegotiationThreads(Id),
    FromUserId    UNIQUEIDENTIFIER     NOT NULL REFERENCES Users(Id),
    MessageType   TINYINT              NOT NULL,  -- 1=Text,2=Offer,3=SystemEvent
    TextContent   NVARCHAR(1000)       NULL,       -- for type=Text/System
    PricePerUnit  DECIMAL(10,2)        NULL,       -- for type=Offer
    Quantity      DECIMAL(10,2)        NULL,
    TotalAmount   DECIMAL(12,2)        NULL,
    OfferAction   TINYINT              NULL,       -- 1=Initial,2=Counter,3=Accept,4=Reject
    CreatedAt     DATETIME2            NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_NegMsg_ThreadId (ThreadId)
);
```

### 2.7 Deals, Invoices & Payments

```sql
-- One Deal row per confirmed negotiation — a listing or request can have MULTIPLE deals
-- (one per buyer/seller pair), enabling partial and multi-party allocation.
CREATE TABLE Deals (
    Id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    ThreadId         UNIQUEIDENTIFIER NOT NULL REFERENCES NegotiationThreads(Id),
    BuyerId          UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    SellerId         UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    ListingId        UNIQUEIDENTIFIER NULL  REFERENCES Listings(Id),
    RequestId        UNIQUEIDENTIFIER NULL  REFERENCES BuyerRequests(Id),
    ProductName      NVARCHAR(200)    NOT NULL,
    QuantityOriginal DECIMAL(10,2)    NOT NULL,  -- what was bid/proposed
    QuantityFinal    DECIMAL(10,2)    NOT NULL,  -- agreed quantity (may be less — partial)
    UOM              NVARCHAR(10)     NOT NULL DEFAULT 'kg',
    PricePerUnit     DECIMAL(10,2)    NOT NULL,
    Subtotal         DECIMAL(12,2)    NOT NULL,  -- QuantityFinal * PricePerUnit
    PlatformFee      DECIMAL(10,2)    NOT NULL,  -- 2% of Subtotal
    GSTAmount        DECIMAL(10,2)    NOT NULL,  -- 5% of Subtotal
    SellerReceivable DECIMAL(12,2)    NOT NULL,  -- Subtotal - PlatformFee
    BuyerPayable     DECIMAL(12,2)    NOT NULL,  -- Subtotal + GSTAmount
    AllocationType   TINYINT          NOT NULL,  -- 1=Full, 2=Partial
    Status           TINYINT          NOT NULL DEFAULT 1,  -- 1=Confirmed,2=Disputed,3=Cancelled
    ConfirmedAt      DATETIME2        NULL,
    CreatedAt        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Deals_ListingId (ListingId),
    INDEX IX_Deals_RequestId (RequestId)
);

CREATE TABLE Invoices (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    InvoiceNumber   VARCHAR(30)      NOT NULL UNIQUE,   -- INV-2025-S0412
    DealId          UNIQUEIDENTIFIER NOT NULL REFERENCES Deals(Id),
    Direction       TINYINT          NOT NULL,  -- 1=Payable(buyer owes),2=Receivable(seller receives)
    ForRole         TINYINT          NOT NULL,  -- 1=Seller,2=Buyer
    OwnerId         UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    CounterpartyId  UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    AmountNum       DECIMAL(12,2)    NOT NULL,
    Status          TINYINT          NOT NULL DEFAULT 1,  -- 1=Pending,2=PaymentPending,3=Settled,4=Disputed,5=Overdue
    DueDate         DATE             NULL,
    SettledAt       DATETIME2        NULL,
    UTR             VARCHAR(50)      NULL,       -- payment reference
    InvoiceDate     DATE             NOT NULL,
    CreatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Invoices_OwnerId (OwnerId),
    INDEX IX_Invoices_Status (Status)
);

CREATE TABLE InvoiceLineItems (
    Id          BIGINT IDENTITY     PRIMARY KEY,
    InvoiceId   UNIQUEIDENTIFIER    NOT NULL REFERENCES Invoices(Id) ON DELETE CASCADE,
    Description NVARCHAR(200)       NOT NULL,
    Detail      NVARCHAR(200)       NULL,
    Amount      DECIMAL(12,2)       NOT NULL,
    IsDeduction BIT                 NOT NULL DEFAULT 0
);

CREATE TABLE InvoiceTimeline (
    Id          BIGINT IDENTITY     PRIMARY KEY,
    InvoiceId   UNIQUEIDENTIFIER    NOT NULL REFERENCES Invoices(Id) ON DELETE CASCADE,
    Label       NVARCHAR(100)       NOT NULL,
    OccurredAt  DATETIME2           NOT NULL,
    Note        NVARCHAR(200)       NULL,
    SortOrder   TINYINT             NOT NULL
);
```

### 2.8 RBAC — Roles, Permissions & Admin

```sql
-- System roles (seeded, not user-created)
-- 1=SuperAdmin, 2=Admin, 3=Seller, 4=Buyer
CREATE TABLE Roles (
    Id          TINYINT         PRIMARY KEY,
    Name        NVARCHAR(50)    NOT NULL UNIQUE,
    Description NVARCHAR(200)   NULL,
    IsSystem    BIT             NOT NULL DEFAULT 1
);

-- Fine-grained permission catalogue
-- e.g. listings.create, listings.approve, bids.place, invoices.settle, users.suspend
CREATE TABLE Permissions (
    Id          SMALLINT        PRIMARY KEY IDENTITY,
    Name        NVARCHAR(100)   NOT NULL UNIQUE,  -- "resource.action" convention
    Description NVARCHAR(200)   NULL,
    Group       NVARCHAR(50)    NULL               -- grouping for admin UI display
);

-- Role -> Permission assignments (seeded)
CREATE TABLE RolePermissions (
    RoleId        TINYINT   NOT NULL REFERENCES Roles(Id),
    PermissionId  SMALLINT  NOT NULL REFERENCES Permissions(Id),
    PRIMARY KEY (RoleId, PermissionId)
);

-- User -> Role assignments (a user has exactly one primary role from onboarding,
-- but can hold additional admin roles if promoted)
CREATE TABLE UserRoles (
    UserId      UNIQUEIDENTIFIER NOT NULL REFERENCES Users(Id),
    RoleId      TINYINT          NOT NULL REFERENCES Roles(Id),
    AssignedBy  UNIQUEIDENTIFIER NULL REFERENCES Users(Id),
    AssignedAt  DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY (UserId, RoleId)
);

-- Audit log for all permission-sensitive actions
CREATE TABLE AuditLogs (
    Id            BIGINT IDENTITY     PRIMARY KEY,
    UserId        UNIQUEIDENTIFIER    NULL REFERENCES Users(Id),
    Action        NVARCHAR(100)       NOT NULL,   -- e.g. "listings.approve"
    Resource      NVARCHAR(100)       NULL,        -- e.g. "Listing"
    ResourceId    NVARCHAR(100)       NULL,
    OldValues     NVARCHAR(MAX)       NULL,        -- JSON snapshot before
    NewValues     NVARCHAR(MAX)       NULL,        -- JSON snapshot after
    IpAddress     VARCHAR(45)         NULL,
    UserAgent     NVARCHAR(300)       NULL,
    CorrelationId UNIQUEIDENTIFIER    NULL,
    CreatedAt     DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_AuditLogs_UserId (UserId),
    INDEX IX_AuditLogs_Resource (Resource, ResourceId)
);
```

### 2.9 Notifications

```sql
CREATE TABLE Notifications (
    Id          BIGINT IDENTITY     PRIMARY KEY,
    UserId      UNIQUEIDENTIFIER    NOT NULL REFERENCES Users(Id),
    GroupLabel  NVARCHAR(50)        NULL,    -- "Today", "Yesterday", "This Week"
    IconName    NVARCHAR(50)        NULL,
    Title       NVARCHAR(200)       NOT NULL,
    Body        NVARCHAR(500)       NULL,
    IsRead      BIT                 NOT NULL DEFAULT 0,
    DeepLink    NVARCHAR(300)       NULL,    -- navigation target
    CreatedAt   DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
    INDEX IX_Notifications_UserId_IsRead (UserId, IsRead)
);
```

---

## 3. Project Structure

```
src/
+-- SarwaMart.Domain/
|   +-- Entities/
|   |   +-- User.cs
|   |   +-- OtpCode.cs
|   |   +-- RefreshToken.cs
|   |   +-- ProductCategory.cs
|   |   +-- ProductSubcategory.cs
|   |   +-- Listing.cs
|   |   +-- ListingImage.cs
|   |   +-- BuyerRequest.cs
|   |   +-- Bid.cs
|   |   +-- Proposal.cs
|   |   +-- NegotiationThread.cs
|   |   +-- NegotiationMessage.cs
|   |   +-- Deal.cs
|   |   +-- Invoice.cs
|   |   +-- InvoiceLineItem.cs
|   |   +-- Notification.cs
|   |   +-- Branch.cs
|   |   +-- BranchServiceArea.cs
|   |   +-- Role.cs
|   |   +-- Permission.cs
|   |   +-- RolePermission.cs
|   |   +-- UserRoleAssignment.cs
|   |   +-- AuditLog.cs
|   +-- Enums/
|   |   +-- UserRole.cs, UserStatus.cs, AccountType.cs, Permission.cs
|   |   +-- ListingStatus.cs, FreshnessType.cs, GradeType.cs
|   |   +-- BidStatus.cs, ProposalStatus.cs
|   |   +-- MessageType.cs, OfferAction.cs
|   |   +-- InvoiceStatus.cs, InvoiceDirection.cs
|   |   +-- DealStatus.cs
|   +-- Events/
|       +-- BidPlacedEvent.cs
|       +-- DealConfirmedEvent.cs
|       +-- InvoiceSettledEvent.cs
|
+-- SarwaMart.Application/
|   +-- Common/
|   |   +-- Result.cs                    -- Result<T> / Error pattern
|   |   +-- PagedList.cs
|   |   +-- Interfaces/
|   |   |   +-- IAppDbContext.cs
|   |   |   +-- ICurrentUserService.cs
|   |   |   +-- IPermissionService.cs
|   |   |   +-- ISmsService.cs
|   |   |   +-- IFileStorageService.cs
|   |   |   +-- INotificationService.cs
|   |   |   +-- IAuditService.cs
|   |   +-- Behaviours/
|   |       +-- ValidationBehaviour.cs
|   |       +-- LoggingBehaviour.cs
|   |       +-- AuthorizationBehaviour.cs  -- checks IPermissionService
|   |       +-- AuditBehaviour.cs          -- writes AuditLog for commands
|   +-- Features/
|       +-- Auth/
|       |   +-- Commands/SendOtp, VerifyOtp, SetupPin, LoginWithPin, RefreshToken, Logout
|       |   +-- Queries/GetCurrentUser
|       +-- Registration/
|       |   +-- Commands/SetRole, SetAccountType, SavePersonalDetails, SelectBranch, SaveProducts, SubmitForReview
|       |   +-- Queries/GetRegistrationStatus
|       +-- Branches/
|       |   +-- Queries/GetAllBranches, GetBranchById, GetNearestBranch, GetBranchServiceAreas
|       +-- Listings/
|       |   +-- Commands/CreateListing, UpdateListing, DeleteListing, UpdateListingStatus
|       |   +-- Queries/GetMyListings, GetAllListings, GetListingById
|       +-- BuyerRequests/
|       |   +-- Commands/CreateRequest, UpdateRequest, CancelRequest
|       |   +-- Queries/GetMyRequests, GetAllRequests, GetRequestById
|       +-- Bids/
|       |   +-- Commands/PlaceBid, UpdateBid, AcceptBid, DeclineBid
|       |   +-- Queries/GetBidsForListing, GetMyBids, GetBidById
|       +-- Proposals/
|       |   +-- Commands/SubmitProposal, UpdateProposal, AcceptProposal, DeclineProposal
|       |   +-- Queries/GetProposalsForRequest, GetMyProposals
|       +-- Negotiation/
|       |   +-- Commands/SendMessage, SendOffer, AcceptOffer, CounterOffer, RejectOffer, ConfirmDeal
|       |   +-- Queries/GetThread, GetThreadMessages
|       +-- Invoices/
|       |   +-- Queries/GetMyInvoices, GetInvoiceDetail
|       +-- Notifications/
|       |   +-- Commands/MarkAsRead, MarkAllAsRead
|       |   +-- Queries/GetMyNotifications
|       +-- Profile/
|       |   +-- Commands/UpdateProfile
|       |   +-- Queries/GetProfile
|       +-- Admin/
|           +-- Commands/ApproveUser, RejectUser, SuspendUser, AssignRole,
|           |            ApproveListing, RejectListing,
|           |            ApproveRequest, RejectRequest,
|           |            CreateBranch, UpdateBranch, DeactivateBranch, AssignBranchManager
|           +-- Queries/GetPendingUsers, GetAllUsers,
|                        GetPendingListings, GetPendingRequests,
|                        GetBranches, GetBranchUsers, GetBranchActivity,
|                        GetAuditLogs
|
+-- SarwaMart.Infrastructure/
|   +-- Persistence/
|   |   +-- AppDbContext.cs
|   |   +-- Configurations/  (IEntityTypeConfiguration per entity)
|   |   +-- Migrations/
|   +-- Services/
|   |   +-- SmsService.cs           (Twilio / MSG91)
|   |   +-- FileStorageService.cs   (Azure Blob)
|   |   +-- NotificationService.cs  (FCM push)
|   |   +-- InvoiceNumberService.cs
|   |   +-- PermissionService.cs    (loads role->permissions, caches per user)
|   |   +-- AuditService.cs         (writes AuditLog rows)
|   +-- Jobs/
|   |   +-- ListingExpiryJob.cs    (Quartz.NET)
|   |   +-- RequestExpiryJob.cs
|   +-- DependencyInjection.cs
|
+-- SarwaMart.API/
    +-- Controllers/
    |   +-- AuthController.cs
    |   +-- RegistrationController.cs
    |   +-- BranchesController.cs
    |   +-- ListingsController.cs
    |   +-- BuyerRequestsController.cs
    |   +-- BidsController.cs
    |   +-- ProposalsController.cs
    |   +-- NegotiationController.cs
    |   +-- InvoicesController.cs
    |   +-- NotificationsController.cs
    |   +-- ProfileController.cs
    |   +-- Admin/
    |       +-- AdminUsersController.cs
    |       +-- AdminListingsController.cs
    |       +-- AdminRequestsController.cs
    |       +-- AdminInvoicesController.cs
    |       +-- AdminAuditController.cs
    |       +-- AdminBranchesController.cs
    +-- Authorization/
    |   +-- PermissionRequirement.cs
    |   +-- PermissionAuthorizationHandler.cs
    |   +-- ResourceOwnerRequirement.cs
    |   +-- ResourceOwnerHandler.cs
    |   +-- Policies.cs                  -- policy name constants
    +-- Hubs/
    |   +-- NegotiationHub.cs       (SignalR)
    +-- Middleware/
    |   +-- ExceptionMiddleware.cs
    |   +-- CorrelationIdMiddleware.cs
    +-- Program.cs
```

---

## 4. API Endpoints

### 4.1 Auth  `POST /api/v1/auth/...`

| Method | Path | Description |
|---|---|---|
| POST | `/otp/send` | Send OTP to phone number |
| POST | `/otp/verify` | Verify OTP -> returns short-lived token |
| POST | `/pin/setup` | First-time PIN setup (requires otp-verified token) |
| POST | `/pin/login` | Login with phone + PIN -> returns JWT + refresh |
| POST | `/token/refresh` | Exchange refresh token for new JWT |
| POST | `/logout` | Revoke refresh token |

### 4.2 Registration  `PUT /api/v1/registration/...`

| Method | Path | Body | Step |
|---|---|---|---|
| PUT | `/role` | `{ role: "seller" or "buyer" }` | Step 1 |
| PUT | `/account-type` | `{ accountType: "individual" or "company" }` | Step 2 |
| PUT | `/personal-details` | `{ name, email, state, city, pincode, address }` | Step 3 |
| PUT | `/branch` | `{ branchId }` | Step 4 — branch selected from `/branches?state=X` |
| PUT | `/products` | `{ categoryIds[], subcategoryIds[] }` | Step 5 |
| POST | `/submit` | Submit for admin review → status → UnderReview | Final |
| GET | `/status` | Returns current onboarding step + status + selectedBranch | — |

### 4.x Branches  `BASE /api/v1/branches`  _(Public)_

| Method | Path | Notes |
|---|---|---|
| GET | `/` | List all active branches — filter by `state`, `city` |
| GET | `/{id}` | Branch detail including address and service areas |
| GET | `/nearest` | Query: `?pincode=530001` or `?state=AP&city=Vijayawada` — returns best match |

### 4.3 Listings  `BASE /api/v1/listings`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Public | Filter: `branchId`, category, status, region, minPrice, maxPrice. Defaults to caller's branch. Paged. |
| GET | `/{id}` | Public | Single listing with seller stats (anonymized) |
| GET | `/mine` | Seller | Seller's own listings with bid counts |
| POST | `/` | Seller | Create listing (status=Draft) |
| PUT | `/{id}` | Seller | Update while Draft/Pending |
| DELETE | `/{id}` | Seller | Soft delete (status=Cancelled) |
| POST | `/{id}/submit` | Seller | Submit draft for admin approval |
| POST | `/{id}/images` | Seller | Upload up to 4 images (multipart) |

### 4.4 Buyer Requests  `BASE /api/v1/requests`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | Seller | Demand feed — only `Live` and `PartiallyFulfilled` requests visible |
| GET | `/{id}` | Authenticated | |
| GET | `/mine` | Buyer | Own requests in all statuses including Draft/Pending/Rejected |
| POST | `/` | Buyer | Creates with status=`Draft` |
| PUT | `/{id}` | Buyer | Edit own request while `Draft` or `PendingApproval` only |
| POST | `/{id}/submit` | Buyer | Submit draft for admin review → status=`PendingApproval` |
| DELETE | `/{id}` | Buyer | Cancel — only while `Draft` or `PendingApproval` |

### 4.5 Bids  `BASE /api/v1/bids`

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/` | Buyer | `{ listingId, pricePerUnit, quantity, note }` |
| GET | `/mine` | Buyer | My bids with status |
| GET | `/listing/{listingId}` | Seller | All bids on seller's listing |
| GET | `/{id}` | Buyer or Seller | |
| PUT | `/{id}` | Buyer | Update pending bid |

### 4.6 Proposals  `BASE /api/v1/proposals`

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/` | Seller | `{ requestId, pricePerUnit, quantity, note, deliveryInfo }` |
| GET | `/mine` | Seller | My proposals with status |
| GET | `/request/{requestId}` | Buyer | Proposals on buyer's request |
| GET | `/{id}` | Seller or Buyer | |
| PUT | `/{id}` | Seller | Update pending proposal |

### 4.7 Negotiation  `BASE /api/v1/negotiation`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/thread/{sourceType}/{sourceId}` | Buyer+Seller | Get or create thread |
| GET | `/thread/{threadId}/messages` | Buyer+Seller | Paged messages |
| POST | `/thread/{threadId}/message` | Either | Send text message |
| POST | `/thread/{threadId}/offer` | Either | Send price offer |
| PUT | `/thread/{threadId}/offer/{msgId}/accept` | Counterparty | Accept offer |
| PUT | `/thread/{threadId}/offer/{msgId}/counter` | Counterparty | Counter with new price |
| PUT | `/thread/{threadId}/offer/{msgId}/reject` | Counterparty | Reject offer |
| POST | `/thread/{threadId}/confirm` | Either | Confirm deal -> creates Deal + 2 Invoices |

**SignalR Hub:** `wss://api/hubs/negotiation`

| Event | Direction | Description |
|---|---|---|
| `JoinThread(threadId)` | Client -> Server | Subscribe to thread room |
| `LeaveThread(threadId)` | Client -> Server | Unsubscribe |
| `NewMessage` | Server -> Client | Text message received |
| `OfferReceived` | Server -> Client | Offer posted in thread |
| `OfferActioned` | Server -> Client | Offer accepted/countered/rejected |
| `DealConfirmed` | Server -> Client | Deal finalised, invoices created |

### 4.8 Invoices  `BASE /api/v1/invoices`

| Method | Path | Auth |
|---|---|---|
| GET | `/` | Authenticated — filter: role, status, direction |
| GET | `/{id}` | Invoice owner |
| GET | `/{id}/pdf` | Invoice owner — returns PDF stream |
| POST | `/{id}/dispute` | Invoice owner |

### 4.9 Notifications  `BASE /api/v1/notifications`

| Method | Path |
|---|---|
| GET | `/` |
| PUT | `/{id}/read` |
| PUT | `/read-all` |

### 4.10 Profile  `BASE /api/v1/profile`

| Method | Path |
|---|---|
| GET | `/` |
| PUT | `/` |
| GET | `/stats` |

---

## 5. Cross-Cutting Concerns

### Authentication & Authorization

- JWT Bearer tokens — access token TTL: 15 min, refresh token TTL: 30 days
- Refresh token stored as HttpOnly cookie (web) or secure device storage (mobile)
- Policy-based RBAC: `RequireSeller`, `RequireBuyer`, `RequireAdmin`, `RequireSuperAdmin`, `RequireApproved` — see Section 9 for full implementation
- OTP brute-force protection: max 5 attempts per phone per 10 min (rate limiter + Redis counter)
- PIN: BCrypt cost factor 12; account locked after 5 consecutive failures
- All permission-sensitive commands emit an `AuditLog` row via `AuditBehaviour`

### Validation (FluentValidation)

- Phone: E.164 format (`^\+?[1-9]\d{9,14}$`)
- Price / Quantity: positive decimals, max 9,999,999
- OTP: exactly 6 digits
- PIN: exactly 6 digits, not all-same digit (e.g. 111111 rejected)
- All string fields: trimmed, max-length enforced, no raw HTML

### Error Handling

- Global `ExceptionMiddleware` returning RFC 7807 `ProblemDetails`
- Business rule failures use `Result<T>` — no exceptions for expected paths
- HTTP status mapping:
  - 400 — validation error
  - 401 — unauthenticated
  - 403 — forbidden (wrong role, not owner)
  - 404 — not found
  - 409 — conflict (e.g. duplicate bid on same listing)
  - 422 — unprocessable (business rule violation)
  - 500 — unexpected server error

### Listings & Requests Auto-Expiry

Background `IHostedService` (Quartz.NET) runs every 15 minutes:
- Marks `Listings` where `ExpiresAt < NOW AND Status IN (Live, PartiallyAllocated)` → `Expired`
- Marks `BuyerRequests` where `ExpiresAt < NOW AND Status IN (Live, PartiallyFulfilled)` → `Expired`
- Marks pending `Bids` / `Proposals` on expired entities → `Expired`
- Fires push notifications to affected users via FCM

Admin stale-review reminder — runs daily at 08:00 IST:
- Finds `Listings` and `BuyerRequests` with `Status = PendingApproval` older than 24 hours
- Sends an internal admin notification: "X listings and Y requests are awaiting review"

### Platform Fee Calculation

```
PlatformFee      = ROUND(Subtotal * 0.02, 2)   // 2%
GSTAmount        = ROUND(Subtotal * 0.05, 2)   // 5%
SellerReceivable = Subtotal - PlatformFee
BuyerPayable     = Subtotal + GSTAmount
```

All fee values are stored immutably on the `Deals` row at confirmation time.

### Anonymization Rules

- Sellers never see a buyer's real name — API always returns `anonymizedName` (e.g. `Buyer #4837`)
- Buyers never see a seller's real name — API returns `Seller #2031`
- Real identity is revealed only via SarwaMart admin panel after deal settlement
- Counterparty response shape: `{ anonymizedName, rating, totalDeals, isVerified }` — no PII

### Caching Strategy

| Data | Cache | TTL |
|---|---|---|
| Public listings feed | Redis | 2 min |
| Product taxonomy (categories/subs) | IMemoryCache | 24 h |
| User stats (rating, deals) | Redis | 5 min |
| Invoice PDF | Blob storage (pre-generated) | Permanent |

---

## 6. Implementation Phases

### Phase 1 — Foundation (Week 1-2)
- [ ] Solution skeleton with 5 projects, NuGet packages
- [ ] EF Core setup, migrations for Users + Auth tables
- [ ] RBAC tables seed: Roles, Permissions, RolePermissions
- [ ] `PermissionService`, `ICurrentUserService`, `PermissionAuthorizationHandler`
- [ ] `SendOtp` -> `VerifyOtp` -> `SetupPin` -> `LoginWithPin` commands
- [ ] JWT + refresh token infrastructure (permissions embedded as claims)
- [ ] Product taxonomy seed data

### Phase 2 — Onboarding (Week 2-3)
- [ ] Registration commands (role, account type, personal details, products)
- [ ] Admin-facing status update endpoint (Pending -> Approved/Rejected)
- [ ] Push notification on approval/rejection

### Phase 3 — Core Marketplace (Week 3-5)
- [ ] Listings CRUD + image upload (Azure Blob)
- [ ] BuyerRequests CRUD
- [ ] Bids (place, list, update)
- [ ] Proposals (place, list, update)

### Phase 4 — Negotiation & Deals (Week 5-7)
- [ ] NegotiationThread creation (auto-created on first bid/proposal)
- [ ] Message & Offer REST endpoints
- [ ] SignalR hub for real-time chat
- [ ] Deal confirmation -> atomic Invoice generation (2 invoices per deal, 1 transaction)

### Phase 5 — Invoices & Notifications (Week 7-8)
- [ ] Invoice list + detail endpoint
- [ ] PDF generation with QuestPDF
- [ ] Dispute flow
- [ ] Background expiry job (Quartz.NET)
- [ ] FCM push notifications for all key events (bid received, offer countered, deal confirmed, invoice settled)

### Phase 6 — Polish & Production Readiness (Week 8-10)
- [ ] Rate limiting (sliding window — per IP and per user)
- [ ] Redis distributed cache for listings feed and user stats
- [ ] Full Serilog structured logging -> Seq
- [ ] Swagger/OpenAPI with JWT auth scheme
- [ ] Integration test suite (WebApplicationFactory + Testcontainers for SQL)
- [ ] Mobile app API integration (swap mock data for real endpoints)

---

## 7. Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| CQRS | MediatR | Clean separation of reads/writes; pipeline behaviours for logging, validation, caching |
| No Repository over EF Core | Query via `IAppDbContext` in handlers | EF Core DbContext is already the abstraction; extra repos add boilerplate without benefit |
| Anonymization | Computed in Application layer, never stored | Real identity never leaks through any API response |
| Real-time negotiation | SignalR over polling | Low-latency bidding chat; scales horizontally via Azure SignalR Service |
| One thread per bid/proposal | Single thread, not per message | Keeps full history together; maps cleanly to the mobile chat screen |
| Invoice generation | Synchronous within `ConfirmDeal` handler | Atomic — deal + invoices committed in one DB transaction, no partial state |
| Platform fee | Stored on `Deals` row at confirmation | Immutable audit trail; fee rate changes don't affect historical records |
| Enum storage | TINYINT in SQL, C# enum | Compact, fast; descriptive in code, efficient on disk |

---

## 8. Domain Entity Summary

| Entity | Table | Key Fields |
|---|---|---|
| Branch | Branches | Code, Name, City, State, Pincode, ManagerUserId, AllowCrossBranchTrade, IsActive |
| BranchServiceArea | BranchServiceAreas | BranchId, AreaType, AreaValue |
| User | Users | Phone, Role, AccountType, Status, PINHash, Rating, BranchId |
| OtpCode | OtpCodes | Phone, CodeHash, ExpiresAt, IsUsed |
| RefreshToken | RefreshTokens | UserId, TokenHash, ExpiresAt, RevokedAt |
| ProductCategory | ProductCategories | Name, Emoji |
| ProductSubcategory | ProductSubcategories | CategoryId, Name |
| Listing | Listings | SellerId, BranchId, CategoryId, Quantity, QuantityAllocated, PricePerUnit, Freshness, Grade, AllowPartialBids, MinBidQuantity, Status, ExpiresAt |
| ListingImage | ListingImages | ListingId, Url, IsCover |
| BuyerRequest | BuyerRequests | BuyerId, BranchId, CategoryId, Quantity, QuantityAllocated, ExpectedPrice, AllowPartialFill, MinProposalQuantity, DeliveryPref, OpenToCounter, Status |
| Bid | Bids | BuyerId, ListingId, PricePerUnit, QuantityRequested, QuantityAllocated, Status, ExchangeCount |
| Proposal | Proposals | SellerId, RequestId, PricePerUnit, QuantityOffered, QuantityAllocated, DeliveryInfo, Status |
| NegotiationThread | NegotiationThreads | SourceType, SourceId, BuyerId, SellerId |
| NegotiationMessage | NegotiationMessages | ThreadId, FromUserId, MessageType, PricePerUnit, Quantity, OfferAction |
| Deal | Deals | ThreadId, BuyerId, SellerId, QuantityOriginal, QuantityFinal, AllocationType, Subtotal, PlatformFee, SellerReceivable, BuyerPayable |
| Allocation | Allocations | SourceType, SourceId, DealId, BuyerId, SellerId, QuantityAllocated, AllocationType |
| Invoice | Invoices | InvoiceNumber, DealId, Direction, ForRole, OwnerId, AmountNum, Status, DueDate |
| InvoiceLineItem | InvoiceLineItems | InvoiceId, Description, Amount, IsDeduction |
| InvoiceTimeline | InvoiceTimeline | InvoiceId, Label, OccurredAt |
| Notification | Notifications | UserId, Title, Body, IsRead, DeepLink |
| Role | Roles | Name, IsSystem |
| Permission | Permissions | Name (resource.action), Group |
| RolePermission | RolePermissions | RoleId, PermissionId |
| UserRoleAssignment | UserRoles | UserId, RoleId, AssignedBy |
| AuditLog | AuditLogs | UserId, Action, Resource, ResourceId, OldValues, NewValues |

---

## 9. RBAC Implementation

### 9.1 Role & Permission Design

#### System Roles (seeded, immutable)

| Id | Role | Description |
|---|---|---|
| 1 | SuperAdmin | Full system access including role management and branch management |
| 2 | Admin | Platform-wide operations — approve listings/requests, settle invoices, manage users across all branches |
| 3 | BranchAdmin | Branch-scoped operations — approve listings/requests, manage users within their assigned branch only |
| 4 | Seller | Approved seller — list items, submit proposals, negotiate |
| 5 | Buyer | Approved buyer — browse listings, place bids, post requests |

> **BranchAdmin** holds the same approval permissions as Admin but their scope is automatically restricted to their assigned branch. They cannot act on entities from other branches.

> A user holds exactly one marketplace role (Seller or Buyer) assigned during onboarding. Admin/SuperAdmin are elevated roles granted separately via `UserRoles`.

#### Permission Catalogue (seeded)

```
Group: Users
  users.view             - View any user profile (Admin+)
  users.approve          - Approve pending registrations (Admin+)
  users.reject           - Reject registrations (Admin+)
  users.suspend          - Suspend active accounts (Admin+)
  users.assign_role      - Grant/revoke roles (SuperAdmin only)

Group: Listings
  listings.create        - Create a new listing (Seller)
  listings.update_own    - Edit own listing (Seller)
  listings.delete_own    - Cancel own listing (Seller)
  listings.approve       - Approve pending listing (Admin+)
  listings.reject        - Reject listing with reason (Admin+)
  listings.view_all      - See all listings including pending (Admin+)

Group: BuyerRequests
  requests.create        - Post a buyer request (Buyer)
  requests.update_own    - Edit own draft/pending request (Buyer)
  requests.cancel_own    - Cancel own request (Buyer)
  requests.approve       - Approve a pending buyer request (Admin+)
  requests.reject        - Reject a pending buyer request with reason (Admin+)
  requests.view_all      - See all requests including pending/rejected (Admin+)

Group: Bids
  bids.place             - Place a bid on a listing (Buyer)
  bids.update_own        - Modify own pending bid (Buyer)
  bids.view_on_listing   - View bids on own listing (Seller)
  bids.view_all          - View all bids platform-wide (Admin+)

Group: Proposals
  proposals.submit       - Submit proposal on a request (Seller)
  proposals.update_own   - Modify own pending proposal (Seller)
  proposals.view_on_request - View proposals on own request (Buyer)
  proposals.view_all     - View all proposals platform-wide (Admin+)

Group: Negotiation
  negotiation.participate - Send messages and offers in own thread (Seller+Buyer)
  negotiation.view_all    - View any thread (Admin+)

Group: Invoices
  invoices.view_own      - View own invoices (Seller + Buyer)
  invoices.settle        - Mark invoice settled + record UTR (Admin+)
  invoices.view_all      - View all invoices (Admin+)
  invoices.export        - Bulk export invoices as CSV (Admin+)

Group: Disputes
  disputes.raise         - Raise a dispute on own invoice (Seller + Buyer)
  disputes.resolve       - Resolve / close a dispute (Admin+)

Group: Branches
  branches.view          - View branch list and detail (Public / all authenticated)
  branches.create        - Create a new branch (SuperAdmin only)
  branches.update        - Update branch details and service areas (SuperAdmin only)
  branches.deactivate    - Deactivate a branch (SuperAdmin only)
  branches.assign_manager - Assign a BranchAdmin to a branch (SuperAdmin only)
  branches.view_activity - View branch-level listings, requests, users report (Admin+)

Group: Audit
  audit.view             - Read audit log (Admin+)
  audit.export           - Export audit log CSV (SuperAdmin)
```

#### Role → Permission Matrix

| Permission | SuperAdmin | Admin | BranchAdmin | Seller | Buyer |
|---|:---:|:---:|:---:|:---:|:---:|
| users.view | Y | Y | Y (branch) | | |
| users.approve | Y | Y | Y (branch) | | |
| users.reject | Y | Y | Y (branch) | | |
| users.suspend | Y | Y | Y (branch) | | |
| users.assign_role | Y | | | | |
| listings.create | | | | Y | |
| listings.update_own | | | | Y | |
| listings.delete_own | | | | Y | |
| listings.approve | Y | Y | Y (branch) | | |
| listings.reject | Y | Y | Y (branch) | | |
| listings.view_all | Y | Y | Y (branch) | | |
| requests.create | | | | | Y |
| requests.update_own | | | | | Y |
| requests.cancel_own | | | | | Y |
| requests.approve | Y | Y | Y (branch) | | |
| requests.reject | Y | Y | Y (branch) | | |
| requests.view_all | Y | Y | Y (branch) | | |
| bids.place | | | | | Y |
| bids.update_own | | | | | Y |
| bids.view_on_listing | | | | Y | |
| bids.view_all | Y | Y | Y (branch) | | |
| proposals.submit | | | | Y | |
| proposals.update_own | | | | Y | |
| proposals.view_on_request | | | | | Y |
| proposals.view_all | Y | Y | Y (branch) | | |
| negotiation.participate | | | | Y | Y |
| negotiation.view_all | Y | Y | Y (branch) | | |
| invoices.view_own | | | | Y | Y |
| invoices.settle | Y | Y | Y (branch) | | |
| invoices.view_all | Y | Y | Y (branch) | | |
| invoices.export | Y | Y | | | |
| disputes.raise | | | | Y | Y |
| disputes.resolve | Y | Y | Y (branch) | | |
| branches.view | Y | Y | Y | Y | Y |
| branches.create | Y | | | | |
| branches.update | Y | | | | |
| branches.deactivate | Y | | | | |
| branches.assign_manager | Y | | | | |
| branches.view_activity | Y | Y | Y (own) | | |
| audit.view | Y | Y | Y (branch) | | |
| audit.export | Y | | | | |

> **(branch)** — BranchAdmin can only see and act on entities belonging to their assigned branch (`Users.BranchId = currentUser.BranchId`).

---

### 9.2 JWT Claims Design

Permissions are embedded directly in the access token to avoid a DB round-trip on every request.

```json
{
  "sub": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "phone": "+919876543210",
  "role": "Seller",
  "status": "Approved",
  "branchIds": [
    "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  ],
  "permissions": [
    "listings.create",
    "listings.update_own",
    "listings.delete_own",
    "bids.view_on_listing",
    "proposals.submit",
    "proposals.update_own",
    "negotiation.participate",
    "invoices.view_own",
    "disputes.raise"
  ],
  "iat": 1748000000,
  "exp": 1748000900
}
```

**`branchIds` claim rules by role:**

| Role | `branchIds` in JWT | Meaning |
|---|---|---|
| SuperAdmin | *(omitted)* | Code-level bypass — has access to every branch |
| Admin | `["id1", "id2", ...]` | All branches assigned via `UserBranchAccess` |
| BranchAdmin | `["id1", "id2", ...]` | One or more branches assigned via `UserBranchAccess` |
| Seller / Buyer | `["id1"]` | Single home branch chosen at registration (`Users.BranchId`) |

> The `permissions` and `branchIds` arrays are re-read from DB on each token refresh, ensuring any access change takes effect within 15 minutes (access token TTL).

---

### 9.3 Domain Layer — Permission Enum

```csharp
// SarwaMart.Domain/Enums/Permission.cs
public enum Permission
{
    // Users
    UsersView,
    UsersApprove,
    UsersReject,
    UsersSuspend,
    UsersAssignRole,

    // Listings
    ListingsCreate,
    ListingsUpdateOwn,
    ListingsDeleteOwn,
    ListingsApprove,
    ListingsReject,
    ListingsViewAll,

    // Buyer Requests
    RequestsCreate,
    RequestsUpdateOwn,
    RequestsCancelOwn,
    RequestsApprove,
    RequestsReject,
    RequestsViewAll,

    // Bids
    BidsPlace,
    BidsUpdateOwn,
    BidsViewOnListing,
    BidsViewAll,

    // Proposals
    ProposalsSubmit,
    ProposalsUpdateOwn,
    ProposalsViewOnRequest,
    ProposalsViewAll,

    // Negotiation
    NegotiationParticipate,
    NegotiationViewAll,

    // Invoices
    InvoicesViewOwn,
    InvoicesSettle,
    InvoicesViewAll,
    InvoicesExport,

    // Disputes
    DisputesRaise,
    DisputesResolve,

    // Audit
    AuditView,
    AuditExport,
}
```

---

### 9.4 Application Layer — Interfaces & Attribute

```csharp
// SarwaMart.Application/Common/Interfaces/ICurrentUserService.cs
public interface ICurrentUserService
{
    Guid UserId { get; }
    string Role { get; }                        // "Seller" | "Buyer" | "BranchAdmin" | "Admin" | "SuperAdmin"
    string Status { get; }                      // "Approved" | "Pending" etc.
    IReadOnlyList<Guid> BranchIds { get; }      // branches accessible to this user
                                                //   SuperAdmin  → empty (bypassed at code level)
                                                //   Admin/BranchAdmin → 1-N branches from UserBranchAccess
                                                //   Seller/Buyer → 1 home branch from Users.BranchId
    bool IsAuthenticated { get; }
    bool HasPermission(Permission permission);
    bool IsInRole(string role);

    /// <summary>
    /// Returns true when the user may act on an entity that belongs to <paramref name="branchId"/>.
    /// SuperAdmin always returns true. All other roles must have the branch in BranchIds.
    /// </summary>
    bool HasBranchAccess(Guid branchId);

    /// <summary>True when the user is assigned to more than one branch (Admin or multi-branch BranchAdmin).</summary>
    bool IsMultiBranchUser { get; }

    /// <summary>True for BranchAdmin and below — queries are automatically scoped to accessible branches.</summary>
    bool IsBranchScoped { get; }
}

// SarwaMart.Application/Common/Interfaces/IPermissionService.cs
public interface IPermissionService
{
    Task<IReadOnlyList<Permission>> GetPermissionsAsync(Guid userId, CancellationToken ct);
    Task<bool> HasPermissionAsync(Guid userId, Permission permission, CancellationToken ct);
}

// Marker attribute placed on Command/Query records to declare required permission
// SarwaMart.Application/Common/Attributes/RequirePermissionAttribute.cs
[AttributeUsage(AttributeTargets.Class)]
public sealed class RequirePermissionAttribute(Permission permission) : Attribute
{
    public Permission Permission { get; } = permission;
}
```

---

### 9.5 Application Layer — Authorization Pipeline Behaviour

```csharp
// SarwaMart.Application/Common/Behaviours/AuthorizationBehaviour.cs
public sealed class AuthorizationBehaviour<TRequest, TResponse>(
    ICurrentUserService currentUser)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        var attr = typeof(TRequest)
            .GetCustomAttribute<RequirePermissionAttribute>();

        if (attr is not null)
        {
            if (!currentUser.IsAuthenticated)
                throw new UnauthorizedException();

            if (!currentUser.HasPermission(attr.Permission))
                throw new ForbiddenException(
                    $"Permission '{attr.Permission}' is required.");
        }

        return await next();
    }
}
```

---

### 9.6 Application Layer — Audit Pipeline Behaviour

```csharp
// SarwaMart.Application/Common/Behaviours/AuditBehaviour.cs
// Marker interface — place on commands that must be audited
public interface IAuditableRequest
{
    string AuditResource { get; }
    string? AuditResourceId { get; }
}

public sealed class AuditBehaviour<TRequest, TResponse>(
    ICurrentUserService currentUser,
    IAuditService auditService)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IAuditableRequest
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken ct)
    {
        var response = await next();

        await auditService.LogAsync(new AuditEntry
        {
            UserId     = currentUser.UserId,
            Action     = typeof(TRequest).Name,    // e.g. "ApproveListing"
            Resource   = request.AuditResource,    // "Listing"
            ResourceId = request.AuditResourceId,  // listing GUID
        }, ct);

        return response;
    }
}
```

---

### 9.7 Infrastructure Layer — PermissionService

```csharp
// SarwaMart.Infrastructure/Services/PermissionService.cs
public sealed class PermissionService(
    IAppDbContext db,
    IMemoryCache cache)
    : IPermissionService
{
    private static string CacheKey(Guid userId) => $"perms:{userId}";

    public async Task<IReadOnlyList<Permission>> GetPermissionsAsync(
        Guid userId, CancellationToken ct)
    {
        return await cache.GetOrCreateAsync(CacheKey(userId), async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15);

            return await db.UserRoles
                .Where(ur => ur.UserId == userId)
                .SelectMany(ur => ur.Role.RolePermissions)
                .Select(rp => (Permission)rp.PermissionId)
                .Distinct()
                .ToListAsync(ct);
        }) ?? [];
    }

    public async Task<bool> HasPermissionAsync(
        Guid userId, Permission permission, CancellationToken ct)
    {
        var perms = await GetPermissionsAsync(userId, ct);
        return perms.Contains(permission);
    }

    // Call on role change or token refresh to invalidate cached permissions
    public void InvalidateCache(Guid userId) =>
        cache.Remove(CacheKey(userId));
}
```

---

### 9.8 Infrastructure Layer — CurrentUserService

```csharp
// SarwaMart.Infrastructure/Services/CurrentUserService.cs
public sealed class CurrentUserService(IHttpContextAccessor accessor)
    : ICurrentUserService
{
    private readonly ClaimsPrincipal? _user = accessor.HttpContext?.User;

    public Guid UserId =>
        Guid.Parse(_user?.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

    public string Role =>
        _user?.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    public string Status =>
        _user?.FindFirstValue("status") ?? string.Empty;

    public bool IsAuthenticated =>
        _user?.Identity?.IsAuthenticated ?? false;

    // All branches accessible to this user — read from JWT claims (no DB hit on hot path)
    // Token refresh re-reads from UserBranchAccess, so changes propagate within 15 min
    public IReadOnlyList<Guid> BranchIds =>
        (_user?.Claims
            .Where(c => c.Type == "branchIds")
            .Select(c => Guid.TryParse(c.Value, out var g) ? g : (Guid?)null)
            .Where(g => g.HasValue)
            .Select(g => g!.Value)
            .ToList()
        ?? []).AsReadOnly();

    // SuperAdmin: role check bypasses the list entirely
    public bool HasBranchAccess(Guid branchId) =>
        IsInRole("SuperAdmin") || BranchIds.Contains(branchId);

    public bool IsMultiBranchUser => BranchIds.Count > 1;

    // Sellers, Buyers, BranchAdmin are branch-scoped; Admin and SuperAdmin are not
    public bool IsBranchScoped =>
        !IsInRole("SuperAdmin") && !IsInRole("Admin");

    // Reads permissions baked into JWT — no DB call on hot path
    public bool HasPermission(Permission permission)
    {
        var name = permission.ToString();
        return _user?.Claims
            .Where(c => c.Type == "permissions")
            .Any(c => c.Value.Equals(name, StringComparison.OrdinalIgnoreCase))
            ?? false;
    }

    public bool IsInRole(string role) =>
        _user?.IsInRole(role) ?? false;
}
```

---

### 9.9 API Layer — PermissionRequirement & Handler

```csharp
// SarwaMart.API/Authorization/PermissionRequirement.cs
public sealed class PermissionRequirement(Permission permission)
    : IAuthorizationRequirement
{
    public Permission Permission { get; } = permission;
}

// SarwaMart.API/Authorization/PermissionAuthorizationHandler.cs
public sealed class PermissionAuthorizationHandler(ICurrentUserService currentUser)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        if (currentUser.HasPermission(requirement.Permission))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
```

---

### 9.10 API Layer — Resource Ownership Handler

```csharp
// SarwaMart.API/Authorization/ResourceOwnerRequirement.cs
// Used where ownership check (userId == entity.OwnerId) must run alongside role check
public sealed class ResourceOwnerRequirement : IAuthorizationRequirement { }

// SarwaMart.API/Authorization/ResourceOwnerHandler.cs
public sealed class ResourceOwnerHandler(ICurrentUserService currentUser)
    : AuthorizationHandler<ResourceOwnerRequirement, IOwnedResource>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ResourceOwnerRequirement requirement,
        IOwnedResource resource)
    {
        // Admins bypass ownership — they can act on any resource
        if (currentUser.IsInRole("Admin") || currentUser.IsInRole("SuperAdmin"))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (resource.OwnerId == currentUser.UserId)
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}

// Marker interface on entities/DTOs that have an owner
public interface IOwnedResource
{
    Guid OwnerId { get; }
}
```

---

### 9.11 API Layer — Policy Registration

```csharp
// SarwaMart.API/Authorization/Policies.cs
public static class Policies
{
    public const string RequireSeller          = nameof(RequireSeller);
    public const string RequireBuyer           = nameof(RequireBuyer);
    public const string RequireAdmin           = nameof(RequireAdmin);
    public const string RequireSuperAdmin      = nameof(RequireSuperAdmin);
    public const string RequireApproved        = nameof(RequireApproved);
    public const string CanCreateListing       = nameof(CanCreateListing);
    public const string CanApproveListing      = nameof(CanApproveListing);
    public const string CanApproveRequest      = nameof(CanApproveRequest);
    public const string CanPlaceBid            = nameof(CanPlaceBid);
    public const string CanSubmitProposal      = nameof(CanSubmitProposal);
    public const string CanSettleInvoice       = nameof(CanSettleInvoice);
    public const string CanViewAuditLog        = nameof(CanViewAuditLog);
    public const string CanAssignRole          = nameof(CanAssignRole);
    public const string ResourceOwner          = nameof(ResourceOwner);
}

// SarwaMart.API/Program.cs (authorization setup)
builder.Services.AddAuthorization(options =>
{
    // Role-based composite policies
    options.AddPolicy(Policies.RequireSeller,
        p => p.RequireAuthenticatedUser().RequireRole("Seller"));

    options.AddPolicy(Policies.RequireBuyer,
        p => p.RequireAuthenticatedUser().RequireRole("Buyer"));

    options.AddPolicy(Policies.RequireAdmin,
        p => p.RequireAuthenticatedUser().RequireRole("Admin", "SuperAdmin"));

    options.AddPolicy(Policies.RequireSuperAdmin,
        p => p.RequireAuthenticatedUser().RequireRole("SuperAdmin"));

    options.AddPolicy(Policies.RequireApproved,
        p => p.RequireAuthenticatedUser().RequireClaim("status", "Approved"));

    // Fine-grained permission policies
    options.AddPolicy(Policies.CanCreateListing,
        p => p.AddRequirements(new PermissionRequirement(Permission.ListingsCreate)));

    options.AddPolicy(Policies.CanApproveListing,
        p => p.AddRequirements(new PermissionRequirement(Permission.ListingsApprove)));

    options.AddPolicy(Policies.CanApproveRequest,
        p => p.AddRequirements(new PermissionRequirement(Permission.RequestsApprove)));

    options.AddPolicy(Policies.CanPlaceBid,
        p => p.AddRequirements(new PermissionRequirement(Permission.BidsPlace)));

    options.AddPolicy(Policies.CanSubmitProposal,
        p => p.AddRequirements(new PermissionRequirement(Permission.ProposalsSubmit)));

    options.AddPolicy(Policies.CanSettleInvoice,
        p => p.AddRequirements(new PermissionRequirement(Permission.InvoicesSettle)));

    options.AddPolicy(Policies.CanViewAuditLog,
        p => p.AddRequirements(new PermissionRequirement(Permission.AuditView)));

    options.AddPolicy(Policies.CanAssignRole,
        p => p.AddRequirements(new PermissionRequirement(Permission.UsersAssignRole)));

    options.AddPolicy(Policies.ResourceOwner,
        p => p.AddRequirements(new ResourceOwnerRequirement()));
});

// Register handlers
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, ResourceOwnerHandler>();
```

---

### 9.12 Controller Usage Examples

```csharp
// Seller-only endpoint — permission check via policy
[HttpPost]
[Authorize(Policy = Policies.CanCreateListing)]
public async Task<IActionResult> CreateListing(CreateListingCommand command, ...)
{ ... }

// Admin-only endpoint
[HttpPut("{id}/approve")]
[Authorize(Policy = Policies.CanApproveListing)]
public async Task<IActionResult> ApproveListing(Guid id, ...)
{ ... }

// Resource-owner check in the handler (not controller) — seller can only edit own listing
[HttpPut("{id}")]
[Authorize(Policy = Policies.RequireApproved)]
public async Task<IActionResult> UpdateListing(Guid id, UpdateListingCommand command)
{
    // ResourceOwnerHandler runs inside Application layer handler
    var result = await _mediator.Send(command with { ListingId = id });
    return result.IsSuccess ? Ok(result.Value) : result.ToProblemDetails();
}

// SuperAdmin-only endpoint
[HttpPost("{userId}/roles")]
[Authorize(Policy = Policies.CanAssignRole)]
public async Task<IActionResult> AssignRole(Guid userId, AssignRoleCommand command, ...)
{ ... }
```

---

### 9.13 Command — Declaring Required Permission

```csharp
// Permissions declared at command level — enforced by AuthorizationBehaviour
[RequirePermission(Permission.ListingsCreate)]
public sealed record CreateListingCommand(
    string Name,
    int CategoryId,
    decimal Quantity,
    string UOM,
    decimal PricePerUnit,
    int Freshness,
    int Grade,
    string? Region,
    int ValidityHours
) : IRequest<Result<Guid>>, IAuditableRequest
{
    public string AuditResource   => "Listing";
    public string? AuditResourceId => null;  // populated after creation
}

[RequirePermission(Permission.ListingsApprove)]
public sealed record ApproveListingCommand(Guid ListingId)
    : IRequest<Result>, IAuditableRequest
{
    public string AuditResource    => "Listing";
    public string? AuditResourceId => ListingId.ToString();
}

[RequirePermission(Permission.UsersAssignRole)]
public sealed record AssignRoleCommand(Guid TargetUserId, int RoleId)
    : IRequest<Result>, IAuditableRequest
{
    public string AuditResource    => "UserRole";
    public string? AuditResourceId => TargetUserId.ToString();
}
```

---

### 9.14 Admin API Endpoints

`BASE /api/v1/admin`

| Method | Path | Policy | Description |
|---|---|---|---|
| GET | `/users` | RequireAdmin | List all users, filter by role/status |
| GET | `/users/{id}` | RequireAdmin | Full user profile (unmasked) |
| PUT | `/users/{id}/approve` | CanApproveListing | Approve pending registration |
| PUT | `/users/{id}/reject` | UsersReject | Reject with reason |
| PUT | `/users/{id}/suspend` | UsersSuspend | Suspend active account |
| POST | `/users/{id}/roles` | CanAssignRole | Add role to user (SuperAdmin only) |
| DELETE | `/users/{id}/roles/{roleId}` | CanAssignRole | Remove role (SuperAdmin only) |
| GET | `/listings/pending` | RequireAdmin | Listings awaiting approval |
| PUT | `/listings/{id}/approve` | CanApproveListing | Approve listing -> status=Live |
| PUT | `/listings/{id}/reject` | CanApproveListing | Reject listing with reason |
| GET | `/invoices` | RequireAdmin | All invoices with filters |
| PUT | `/invoices/{id}/settle` | CanSettleInvoice | Mark settled + record UTR |
| PUT | `/disputes/{id}/resolve` | DisputesResolve | Close a dispute |
| GET | `/audit` | CanViewAuditLog | Paginated audit log |
| GET | `/audit/export` | AuditExport | CSV download of audit log |

---

### 9.15 RBAC Seed Data (SQL)

```sql
-- Seed roles
INSERT INTO Roles (Id, Name, Description) VALUES
(1, 'SuperAdmin', 'Full platform access'),
(2, 'Admin',      'Marketplace operations'),
(3, 'Seller',     'Approved aqua farmer / seller'),
(4, 'Buyer',      'Approved buyer / procurement');

-- Seed permissions (excerpt — repeat for all permissions above)
INSERT INTO Permissions (Name, [Group]) VALUES
('users.view',            'Users'),
('users.approve',         'Users'),
('users.reject',          'Users'),
('users.suspend',         'Users'),
('users.assign_role',     'Users'),
('listings.create',       'Listings'),
('listings.update_own',   'Listings'),
('listings.delete_own',   'Listings'),
('listings.approve',      'Listings'),
('listings.reject',       'Listings'),
('listings.view_all',     'Listings'),
('requests.create',       'BuyerRequests'),
('requests.update_own',   'BuyerRequests'),
('requests.cancel_own',   'BuyerRequests'),
('requests.approve',      'BuyerRequests'),
('requests.reject',       'BuyerRequests'),
('bids.place',            'Bids'),
('bids.update_own',       'Bids'),
('bids.view_on_listing',  'Bids'),
('proposals.submit',      'Proposals'),
('proposals.update_own',  'Proposals'),
('proposals.view_on_request', 'Proposals'),
('negotiation.participate','Negotiation'),
('invoices.view_own',     'Invoices'),
('invoices.settle',       'Invoices'),
('invoices.view_all',     'Invoices'),
('invoices.export',       'Invoices'),
('disputes.raise',        'Disputes'),
('disputes.resolve',      'Disputes'),
('audit.view',            'Audit'),
('audit.export',          'Audit');

-- Assign permissions to roles (SuperAdmin gets everything)
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT 1, Id FROM Permissions;  -- SuperAdmin

-- Admin gets everything except users.assign_role and audit.export
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT 2, Id FROM Permissions
WHERE Name NOT IN ('users.assign_role', 'audit.export');

-- Verify Admin has request moderation permissions
-- (covered by the SELECT above — requests.approve and requests.reject are included)

-- Seller permissions
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT 3, Id FROM Permissions
WHERE Name IN (
    'listings.create','listings.update_own','listings.delete_own',
    'bids.view_on_listing',
    'proposals.submit','proposals.update_own',
    'negotiation.participate',
    'invoices.view_own','disputes.raise'
);

-- Buyer permissions
INSERT INTO RolePermissions (RoleId, PermissionId)
SELECT 4, Id FROM Permissions
WHERE Name IN (
    'requests.create','requests.update_own','requests.cancel_own',
    'bids.place','bids.update_own',
    'proposals.view_on_request',
    'negotiation.participate',
    'invoices.view_own','disputes.raise'
);
```

---

## 10. User Access — UI Screens & API Endpoints per Role

### 10.1 Role Hierarchy

```
SuperAdmin
    └── Admin          (web portal only — no mobile app)
Seller                 (mobile app — approved marketplace user)
Buyer                  (mobile app — approved marketplace user)
Unauthenticated / Pending  (mobile app — limited to auth & onboarding)
```

---

### 10.2 Unauthenticated / Pending User

Covers all visitors before login and users who have submitted registration but are awaiting admin approval.

#### UI Screens Accessible

| Screen | Condition |
|---|---|
| SplashScreen | Always |
| PublicLandingScreen | Always |
| LoginScreen | Always |
| MobileEntryScreen | Always |
| OTPScreen | After entering phone |
| PINSetupScreen | First login only (no existing PIN) |
| PINLoginScreen | Returning user with PIN set |
| RolePickerScreen | After OTP verified, no role set yet |
| AccountTypeScreen | After role selected |
| PersonalDetailsScreen | After account type selected — collects name, email, state, city, pincode, address |
| BranchSelectionScreen | After personal details — shows nearest branches based on pincode/state; user selects one |
| ProductsScreen | After branch selected |
| UnderReviewScreen | After registration submitted — user is locked here until branch admin or admin approves |

> **Wall:** once status = `UnderReview`, user cannot navigate past onboarding. All marketplace screens are unreachable until Admin sets status = `Approved`.

#### API Endpoints Accessible

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/v1/auth/otp/send` | Phone number required |
| POST | `/api/v1/auth/otp/verify` | Returns short-lived OTP token |
| POST | `/api/v1/auth/pin/setup` | Requires OTP-verified token; first time only |
| POST | `/api/v1/auth/pin/login` | Returns JWT access + refresh token |
| POST | `/api/v1/auth/token/refresh` | Returns new JWT |
| POST | `/api/v1/auth/logout` | Revokes refresh token |
| GET | `/api/v1/listings` | Read-only browse; no bids allowed |
| GET | `/api/v1/listings/{id}` | Read-only detail |
| GET | `/api/v1/branches?state=X` | Public — fetch branches to populate BranchSelectionScreen |
| GET | `/api/v1/branches/nearest?pincode=X` | Public — auto-suggest nearest branch |
| PUT | `/api/v1/registration/role` | Requires authenticated JWT |
| PUT | `/api/v1/registration/account-type` | Requires authenticated JWT |
| PUT | `/api/v1/registration/personal-details` | Requires authenticated JWT |
| PUT | `/api/v1/registration/branch` | Requires authenticated JWT — saves selected branchId |
| PUT | `/api/v1/registration/products` | Requires authenticated JWT |
| POST | `/api/v1/registration/submit` | Submits for review → notifies assigned BranchAdmin |
| GET | `/api/v1/registration/status` | Polls onboarding step + approval status + branch info |

**Blocked from:** all `/listings` write endpoints, `/bids`, `/requests`, `/proposals`, `/negotiation`, `/invoices`, `/admin`.

---

### 10.3 Seller (Role = Seller, Status = Approved)

#### UI Screens Accessible

| Screen | Purpose |
|---|---|
| SellerHomeScreen | Dashboard — active listings summary, market demand feed preview, banners |
| MyItemsScreen | Full list of own listings with status pills and bid counts |
| CreateItemScreen | Form to create a new listing (product, qty, price, freshness, grade, validity) |
| ItemDetailSellerScreen | Own listing detail — view all bids, listing metrics |
| NegotiationScreen | Chat + offer thread with a specific buyer on a bid |
| BuyerRequestsListScreen | Public demand feed — all live buyer requests |
| BuyerRequestDetailScreen | Single buyer request detail — submit a proposal |
| MyProposalsScreen | List of own proposals submitted on buyer requests |
| InvoiceListScreen | Own receivable invoices (seller view — SarwaMart owes seller) |
| InvoiceDetailScreen | Invoice detail with line items, payment timeline, PDF download |
| NotificationsScreen | All notifications — bids received, proposal countered, invoice settled |
| ProfileScreen | Own profile — name, region, rating, total deals |
| LanguageScreen | Language toggle (EN / Telugu) |

**Blocked screens:** BuyerHomeScreen, ItemsForBidListScreen, ItemDetailBuyerScreen, PlaceBidScreen, MyBidsScreen, MyRequestsScreen, CreateRequestScreen, MyRequestDetailScreen.

#### API Endpoints Accessible

**Listings (own)**

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/listings` | Public |
| GET | `/api/v1/listings/{id}` | Public |
| GET | `/api/v1/listings/mine` | `listings.update_own` |
| POST | `/api/v1/listings` | `listings.create` |
| PUT | `/api/v1/listings/{id}` | `listings.update_own` — own listing only |
| DELETE | `/api/v1/listings/{id}` | `listings.delete_own` — own listing only |
| POST | `/api/v1/listings/{id}/submit` | `listings.create` — triggers admin review |
| POST | `/api/v1/listings/{id}/images` | `listings.update_own` — multipart, max 4 images |

**Buyer Requests (read — demand feed, approved only)**

| Method | Endpoint | Permission | Notes |
|---|---|---|---|
| GET | `/api/v1/requests` | Seller | Returns only `Live` and `PartiallyFulfilled` requests — admin-approved only |
| GET | `/api/v1/requests/{id}` | Seller | Only accessible if request status is `Live` or `PartiallyFulfilled` |

**Proposals**

| Method | Endpoint | Permission |
|---|---|---|
| POST | `/api/v1/proposals` | `proposals.submit` |
| GET | `/api/v1/proposals/mine` | `proposals.submit` |
| GET | `/api/v1/proposals/{id}` | Own proposal only |
| PUT | `/api/v1/proposals/{id}` | `proposals.update_own` — pending status only |

**Bids (view incoming on own listings)**

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/bids/listing/{listingId}` | `bids.view_on_listing` — own listing only |
| GET | `/api/v1/bids/{id}` | Own listing's bid only |

**Negotiation**

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/negotiation/thread/{sourceType}/{sourceId}` | `negotiation.participate` |
| GET | `/api/v1/negotiation/thread/{threadId}/messages` | `negotiation.participate` |
| POST | `/api/v1/negotiation/thread/{threadId}/message` | `negotiation.participate` |
| POST | `/api/v1/negotiation/thread/{threadId}/offer` | `negotiation.participate` |
| PUT | `/api/v1/negotiation/thread/{threadId}/offer/{msgId}/accept` | `negotiation.participate` |
| PUT | `/api/v1/negotiation/thread/{threadId}/offer/{msgId}/counter` | `negotiation.participate` |
| PUT | `/api/v1/negotiation/thread/{threadId}/offer/{msgId}/reject` | `negotiation.participate` |
| POST | `/api/v1/negotiation/thread/{threadId}/confirm` | `negotiation.participate` |

**Invoices**

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/invoices` | `invoices.view_own` — direction=receivable |
| GET | `/api/v1/invoices/{id}` | `invoices.view_own` — own invoice only |
| GET | `/api/v1/invoices/{id}/pdf` | `invoices.view_own` |
| POST | `/api/v1/invoices/{id}/dispute` | `disputes.raise` |

**Shared**

| Method | Endpoint |
|---|---|
| GET | `/api/v1/notifications` |
| PUT | `/api/v1/notifications/{id}/read` |
| PUT | `/api/v1/notifications/read-all` |
| GET | `/api/v1/profile` |
| PUT | `/api/v1/profile` |
| GET | `/api/v1/profile/stats` |

**Explicitly blocked:** `POST /bids`, `POST /requests`, `GET /requests/mine`, `GET /proposals/request/{id}`, all `/admin/` endpoints.

---

### 10.4 Buyer (Role = Buyer, Status = Approved)

#### UI Screens Accessible

| Screen | Purpose |
|---|---|
| BuyerHomeScreen | Dashboard — featured listings, market banners, quick filters |
| ItemsForBidListScreen | Full paginated listings available to bid on |
| ItemDetailBuyerScreen | Listing detail — view seller stats (anonymized), existing bid status |
| PlaceBidScreen | Place or update a bid — quantity, price, note |
| MyBidsScreen | All own bids with status (pending, negotiating, accepted) |
| MyRequestsScreen | Own posted buyer requests with proposal counts |
| CreateRequestScreen | Form to post a new buyer request |
| MyRequestDetailScreen | Request detail — view proposals received from sellers |
| NegotiationScreen | Chat + offer thread with a specific seller on a proposal or bid |
| InvoiceListScreen | Own payable invoices (buyer view — buyer owes SarwaMart) |
| InvoiceDetailScreen | Invoice detail with line items, payment timeline, PDF download |
| NotificationsScreen | All notifications — proposal received, offer countered, invoice due |
| ProfileScreen | Own profile — name, region, rating, total deals |
| LanguageScreen | Language toggle (EN / Telugu) |

**Blocked screens:** SellerHomeScreen, MyItemsScreen, CreateItemScreen, ItemDetailSellerScreen, BuyerRequestsListScreen, BuyerRequestDetailScreen, MyProposalsScreen.

#### API Endpoints Accessible

**Listings (browse and bid)**

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/listings` | Public — browse all live listings |
| GET | `/api/v1/listings/{id}` | Public — listing detail |

**Bids**

| Method | Endpoint | Permission |
|---|---|---|
| POST | `/api/v1/bids` | `bids.place` |
| GET | `/api/v1/bids/mine` | `bids.place` |
| GET | `/api/v1/bids/{id}` | Own bid only |
| PUT | `/api/v1/bids/{id}` | `bids.update_own` — pending status only |

**Buyer Requests**

| Method | Endpoint | Permission | Notes |
|---|---|---|---|
| GET | `/api/v1/requests/mine` | `requests.create` | Returns all own requests including Draft, PendingApproval, Rejected |
| GET | `/api/v1/requests/{id}` | Own request only | |
| POST | `/api/v1/requests` | `requests.create` | Created with status=`Draft` |
| PUT | `/api/v1/requests/{id}` | `requests.update_own` | Edit allowed only while `Draft` or `PendingApproval` |
| POST | `/api/v1/requests/{id}/submit` | `requests.create` | Submit draft → status=`PendingApproval`; admin notified |
| DELETE | `/api/v1/requests/{id}` | `requests.cancel_own` | Allowed only while `Draft` or `PendingApproval` |

**Proposals (view incoming on own requests)**

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/proposals/request/{requestId}` | `proposals.view_on_request` — own request only |
| GET | `/api/v1/proposals/{id}` | Own request's proposal only |

**Negotiation**

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/negotiation/thread/{sourceType}/{sourceId}` | `negotiation.participate` |
| GET | `/api/v1/negotiation/thread/{threadId}/messages` | `negotiation.participate` |
| POST | `/api/v1/negotiation/thread/{threadId}/message` | `negotiation.participate` |
| POST | `/api/v1/negotiation/thread/{threadId}/offer` | `negotiation.participate` |
| PUT | `/api/v1/negotiation/thread/{threadId}/offer/{msgId}/accept` | `negotiation.participate` |
| PUT | `/api/v1/negotiation/thread/{threadId}/offer/{msgId}/counter` | `negotiation.participate` |
| PUT | `/api/v1/negotiation/thread/{threadId}/offer/{msgId}/reject` | `negotiation.participate` |
| POST | `/api/v1/negotiation/thread/{threadId}/confirm` | `negotiation.participate` |

**Invoices**

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/api/v1/invoices` | `invoices.view_own` — direction=payable |
| GET | `/api/v1/invoices/{id}` | `invoices.view_own` — own invoice only |
| GET | `/api/v1/invoices/{id}/pdf` | `invoices.view_own` |
| POST | `/api/v1/invoices/{id}/dispute` | `disputes.raise` |

**Shared**

| Method | Endpoint |
|---|---|
| GET | `/api/v1/notifications` |
| PUT | `/api/v1/notifications/{id}/read` |
| PUT | `/api/v1/notifications/read-all` |
| GET | `/api/v1/profile` |
| PUT | `/api/v1/profile` |
| GET | `/api/v1/profile/stats` |

**Explicitly blocked:** `POST /listings`, `GET /listings/mine`, `POST /proposals`, `GET /bids/listing/{id}`, all `/admin/` endpoints.

---

### 10.5 Admin (Role = Admin)

No mobile app. Accesses a dedicated **web admin portal** only. All endpoints are under `/api/v1/admin/` and require `RequireAdmin` policy.

#### User Management

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/users` | `users.view` | List all users — filter by role, status, region, date |
| GET | `/admin/users/{id}` | `users.view` | Full unmasked user profile including phone, email, address |
| GET | `/admin/users/pending` | `users.view` | Shortcut — users with status=UnderReview |
| PUT | `/admin/users/{id}/approve` | `users.approve` | Set status=Approved, fire approval notification |
| PUT | `/admin/users/{id}/reject` | `users.reject` | Set status=Rejected with mandatory reason, fire rejection notification |
| PUT | `/admin/users/{id}/suspend` | `users.suspend` | Set status=Suspended, revoke all active refresh tokens |

#### Listing Moderation

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/listings/pending` | `listings.view_all` | All listings with status=PendingApproval |
| GET | `/admin/listings` | `listings.view_all` | All listings — filter by status, seller, category, date |
| GET | `/admin/listings/{id}` | `listings.view_all` | Listing detail including seller real identity |
| PUT | `/admin/listings/{id}/approve` | `listings.approve` | Set status=Live, stamp ExpiresAt, notify seller |
| PUT | `/admin/listings/{id}/reject` | `listings.reject` | Set status=Rejected, store RejectionReason, notify seller |

#### Buyer Request Moderation

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/requests/pending` | `requests.view_all` | All buyer requests with status=PendingApproval |
| GET | `/admin/requests` | `requests.view_all` | All requests — filter by status, buyer, category, date |
| GET | `/admin/requests/{id}` | `requests.view_all` | Request detail including buyer real identity |
| PUT | `/admin/requests/{id}/approve` | `requests.approve` | Set status=Live, stamp ExpiresAt, notify buyer |
| PUT | `/admin/requests/{id}/reject` | `requests.reject` | Set status=Rejected, store RejectionReason, notify buyer |

#### Invoice & Payment Operations

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/invoices` | `invoices.view_all` | All invoices — filter by status, role, direction, date range |
| GET | `/admin/invoices/{id}` | `invoices.view_all` | Full invoice with real buyer and seller identity |
| PUT | `/admin/invoices/{id}/settle` | `invoices.settle` | Record UTR, set status=Settled, update InvoiceTimeline, notify both parties |
| GET | `/admin/invoices/export` | `invoices.export` | CSV download of filtered invoices |

#### Dispute Management

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/disputes` | `invoices.view_all` | All invoices with status=Disputed |
| PUT | `/admin/disputes/{id}/resolve` | `disputes.resolve` | Close dispute — set resolution note, update invoice status |

#### Audit Log

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/audit` | `audit.view` | Paginated audit log — filter by user, action, resource, date |

**Admin CANNOT:** assign or revoke roles (`users.assign_role` — SuperAdmin only), export audit log (`audit.export` — SuperAdmin only).

---

### 10.6 SuperAdmin (Role = SuperAdmin)

Everything Admin can do, plus the following:

#### Role Management

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| POST | `/admin/users/{id}/roles` | `users.assign_role` | Assign Admin or SuperAdmin role to any user |
| DELETE | `/admin/users/{id}/roles/{roleId}` | `users.assign_role` | Revoke a role from a user |
| GET | `/admin/roles` | `users.assign_role` | List all system roles and their permission sets |

#### Extended Audit

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/admin/audit/export` | `audit.export` | Full CSV export of audit log with all fields |

---

### 10.7 SignalR — Per-Role Hub Access

`wss://api/hubs/negotiation` — JWT required in query string or Authorization header.

| Event | Who can call/receive | Condition |
|---|---|---|
| `JoinThread(threadId)` | Seller, Buyer | Must be BuyerId or SellerId of that thread |
| `LeaveThread(threadId)` | Seller, Buyer | Must be thread participant |
| `NewMessage` (receive) | Seller, Buyer | Thread participant only |
| `OfferReceived` (receive) | Seller, Buyer | Thread participant only |
| `OfferActioned` (receive) | Seller, Buyer | Thread participant only |
| `DealConfirmed` (receive) | Seller, Buyer | Thread participant only |
| Admin join (read-only) | Admin, SuperAdmin | `negotiation.view_all` — can observe any thread |

Thread participant check is enforced server-side in `NegotiationHub.OnConnectedAsync` — non-participants are disconnected immediately.

---

### 10.8 Complete Role × Screen × Endpoint Matrix

| Area | Unauth/Pending | Seller | Buyer | Admin | SuperAdmin |
|---|:---:|:---:|:---:|:---:|:---:|
| **Auth & Onboarding** | | | | | |
| OTP / PIN login | Y | Y | Y | Y | Y |
| Registration screens | Y | — | — | — | — |
| UnderReviewScreen | Y | — | — | — | — |
| **Listings** | | | | | |
| Browse listings (GET /) | Read | Y | Y | Y | Y |
| Create listing | — | Y | — | — | — |
| Edit / delete own listing | — | Y | — | — | — |
| Submit listing for approval | — | Y | — | — | — |
| Approve / reject listing | — | — | — | Y | Y |
| View all listings (admin) | — | — | — | Y | Y |
| **Bids** | | | | | |
| Place a bid | — | — | Y | — | — |
| View own bids | — | — | Y | — | — |
| View bids on own listing | — | Y | — | — | — |
| View all bids (admin) | — | — | — | Y | Y |
| **Buyer Requests** | | | | | |
| Post buyer request (Draft) | — | — | Y | — | — |
| Submit request for approval | — | — | Y | — | — |
| View own requests (all statuses) | — | — | Y | — | — |
| Browse demand feed (Live only) | — | Y | — | — | — |
| Approve / reject buyer request | — | — | — | Y | Y |
| View all requests (admin) | — | — | — | Y | Y |
| **Proposals** | | | | | |
| Submit proposal | — | Y | — | — | — |
| View own proposals | — | Y | — | — | — |
| View proposals on own request | — | — | Y | — | — |
| View all proposals (admin) | — | — | — | Y | Y |
| **Negotiation** | | | | | |
| Participate in thread | — | Y | Y | — | — |
| View any thread (admin) | — | — | — | Y | Y |
| SignalR real-time chat | — | Y | Y | Read | Read |
| **Invoices** | | | | | |
| View own invoices | — | Y | Y | — | — |
| Download PDF | — | Y | Y | — | — |
| Raise dispute | — | Y | Y | — | — |
| View all invoices | — | — | — | Y | Y |
| Settle invoice (UTR) | — | — | — | Y | Y |
| Resolve dispute | — | — | — | Y | Y |
| Export invoices CSV | — | — | — | Y | Y |
| **Users (Admin)** | | | | | |
| View all users | — | — | — | Y | Y |
| Approve / reject user | — | — | — | Y | Y |
| Suspend user | — | — | — | Y | Y |
| Assign / revoke roles | — | — | — | — | Y |
| **Audit** | | | | | |
| View audit log | — | — | — | Y | Y |
| Export audit log CSV | — | — | — | — | Y |
| **Profile & Notifications** | | | | | |
| View / edit own profile | Y (post-login) | Y | Y | Y | Y |
| Receive notifications | — | Y | Y | — | — |

---

### 10.9 HTTP Status Codes by Role Violation

| Scenario | HTTP Status | Reason |
|---|---|---|
| No JWT provided | 401 | Missing or expired token |
| Valid JWT, wrong role (e.g. Buyer hits `POST /listings`) | 403 | `RequireSeller` policy fails |
| Valid JWT, correct role, wrong owner (e.g. editing another seller's listing) | 403 | `ResourceOwnerHandler` fails |
| Approved seller/buyer hits `/admin/` endpoint | 403 | `RequireAdmin` policy fails |
| Admin hits `POST /admin/users/{id}/roles` | 403 | `CanAssignRole` — SuperAdmin only |
| Pending user hits any marketplace endpoint | 403 | `RequireApproved` claim check fails |
| Valid token but user suspended mid-session | 403 | `status` claim = `Suspended` |

---

## 11. Partial & Full Allocation Model

### 11.1 Core Concept

A single seller listing or buyer request can be fulfilled by **multiple counterparties simultaneously**. Each accepted bid or proposal creates an independent `Deal` and a corresponding `Allocation` record. The listing/request remains `Live` or transitions to `PartiallyAllocated` until its entire quantity is consumed or it expires.

```
Listing: 500 kg Fresh Rohu @ ₹145/kg
│
├── Bid #1 — Buyer A — 200 kg — Accepted → Deal #1 (partial)
├── Bid #2 — Buyer B — 150 kg — Accepted → Deal #2 (partial)
├── Bid #3 — Buyer C — 150 kg — Accepted → Deal #3 (full — listing now FullyAllocated)
└── Bid #4 — Buyer D — 100 kg — Declined (no remaining quantity)

Buyer Request: 300 kg Pomfret @ ₹380/kg
│
├── Proposal #1 — Seller X — 200 kg — Accepted → Deal #4 (partial)
└── Proposal #2 — Seller Y — 100 kg — Accepted → Deal #5 (full — request now FullyFulfilled)
```

---

### 11.2 Listing Status Transitions

```
Draft
  └─[submit]──► Pending
                  └─[admin approves]──► Live
                                          ├─[bid accepted, qty partial]──► PartiallyAllocated
                                          │    └─[more bids accepted, qty reaches total]──► FullyAllocated
                                          ├─[ExpiresAt reached]──► Expired
                                          └─[seller cancels]──► Cancelled

PartiallyAllocated
  ├─[more bids accepted, qty reaches total]──► FullyAllocated
  └─[ExpiresAt reached]──► Expired (remaining qty unallocated — existing deals still valid)
```

| Status | Value | Meaning | Admin action needed | Accepts bids? |
|---|---|---|---|---|
| Draft | 1 | Created, not submitted | — | No |
| PendingApproval | 2 | Submitted, awaiting admin review | Approve / Reject | No |
| Live | 3 | Admin approved, visible to buyers | — | Yes |
| PartiallyAllocated | 4 | Some quantity committed, remainder open | — | Yes |
| FullyAllocated | 5 | All quantity committed in deals | — | No |
| Expired | 6 | Validity period elapsed | — | No |
| Rejected | 7 | Admin rejected with reason | — | No |
| Cancelled | 8 | Seller cancelled | — | No |

> **Re-submission:** A seller can edit a `Rejected` listing to address admin feedback, then resubmit — moves back to `PendingApproval` and clears `RejectionReason`.

---

### 11.3 Buyer Request Status Transitions

```
Draft
  └─[buyer submits]──► PendingApproval
                          ├─[admin approves]──► Live
                          │                      ├─[proposal accepted, qty partial]──► PartiallyFulfilled
                          │                      │    └─[more proposals, qty = total]──► FullyFulfilled
                          │                      ├─[ExpiresAt reached]──► Expired
                          │                      └─[buyer cancels]──► Cancelled
                          └─[admin rejects]──► Rejected
                                                └─[buyer edits & resubmits]──► PendingApproval

PartiallyFulfilled
  ├─[more proposals accepted, qty reaches total]──► FullyFulfilled
  └─[ExpiresAt reached]──► Expired (existing deals remain valid)
```

| Status | Value | Meaning | Admin action needed | Accepts proposals? |
|---|---|---|---|---|
| Draft | 1 | Created, not yet submitted | — | No |
| PendingApproval | 2 | Submitted, awaiting admin review | Approve / Reject | No |
| Live | 3 | Admin approved, visible to sellers | — | Yes |
| PartiallyFulfilled | 4 | Some quantity committed, remainder open | — | Yes |
| FullyFulfilled | 5 | All quantity committed in deals | — | No |
| Expired | 6 | Validity period elapsed | — | No |
| Cancelled | 7 | Buyer cancelled | — | No |
| Rejected | 8 | Admin rejected with reason | — | No |

> **Re-submission:** A buyer can edit a `Rejected` request to address the admin's feedback, then resubmit — this moves it back to `PendingApproval` and clears `RejectionReason`.

---

### 11.4 Business Rules

#### Bid Rules
1. A buyer can only hold **one active bid per listing** at any time.
2. `QuantityRequested` must satisfy: `MinBidQuantity <= qty <= Listing.QuantityRemaining` at time of placement.
3. `Listing.QuantityRemaining = Listing.Quantity - Listing.QuantityAllocated` (computed, not stored).
4. If `AllowPartialBids = false`, buyer must bid for the full remaining quantity.
5. During negotiation the seller may counter with a **lower quantity** (partial acceptance) — buyer can accept or counter.
6. On deal confirmation: `QuantityFinal` is stamped on the Deal; `Listing.QuantityAllocated += QuantityFinal`.
7. If `Listing.QuantityAllocated = Listing.Quantity` → status → `FullyAllocated`.
8. If `0 < Listing.QuantityAllocated < Listing.Quantity` → status → `PartiallyAllocated`.
9. All other pending bids on the same listing remain open against the remaining quantity.
10. Declining a bid does **not** affect `QuantityAllocated`.

#### Proposal Rules
1. A seller can only hold **one active proposal per request** at any time.
2. `QuantityOffered` must satisfy: `MinProposalQuantity <= qty <= Request.QuantityRemaining`.
3. If `AllowPartialFill = false`, seller must offer the full remaining quantity.
4. On deal confirmation: `Request.QuantityAllocated += QuantityFinal`.
5. If `Request.QuantityAllocated = Request.Quantity` → status → `FullyFulfilled`.
6. If `0 < Request.QuantityAllocated < Request.Quantity` → status → `PartiallyFulfilled`.
7. All other pending proposals on the same request remain open against the remaining quantity.

#### Concurrency Guard
- `QuantityAllocated` updates use **optimistic concurrency** (EF Core `RowVersion` / `ROWVERSION` SQL column).
- If two deals are confirmed simultaneously for the same listing, the second transaction re-checks `QuantityRemaining` after acquiring a row-level lock (`UPDLOCK` hint on the Listings row).
- If `QuantityRemaining < QuantityFinal` at lock time → reject with `409 Conflict — Insufficient remaining quantity`.

---

### 11.5 SQL — Remaining Quantity Views

```sql
-- Real-time remaining quantity for listings
CREATE VIEW vw_ListingAvailability AS
SELECT
    l.Id,
    l.Name,
    l.Quantity                                  AS QuantityTotal,
    l.QuantityAllocated,
    l.Quantity - l.QuantityAllocated            AS QuantityRemaining,
    CAST(l.QuantityAllocated / l.Quantity * 100
         AS DECIMAL(5,1))                       AS AllocationPct,
    l.Status,
    l.UOM,
    l.PricePerUnit,
    l.AllowPartialBids,
    l.MinBidQuantity,
    l.ExpiresAt
FROM Listings l;

-- Real-time remaining quantity for buyer requests
CREATE VIEW vw_RequestAvailability AS
SELECT
    r.Id,
    r.ProductName,
    r.Quantity                                  AS QuantityTotal,
    r.QuantityAllocated,
    r.Quantity - r.QuantityAllocated            AS QuantityRemaining,
    CAST(r.QuantityAllocated / r.Quantity * 100
         AS DECIMAL(5,1))                       AS FulfillmentPct,
    r.Status,
    r.UOM,
    r.ExpectedPrice,
    r.AllowPartialFill,
    r.MinProposalQuantity,
    r.ExpiresAt
FROM BuyerRequests r;

-- All allocation slices for a listing — shows every buyer who has a confirmed deal
CREATE VIEW vw_ListingAllocations AS
SELECT
    a.SourceId                                  AS ListingId,
    a.DealId,
    a.BuyerId,
    a.QuantityAllocated,
    a.PricePerUnit,
    a.AllocationType,                           -- 1=Full, 2=Partial
    a.AllocatedAt,
    d.Status                                    AS DealStatus
FROM Allocations a
JOIN Deals d ON d.Id = a.DealId
WHERE a.SourceType = 1;  -- 1 = Listing

-- All allocation slices for a buyer request — shows every seller who has a confirmed deal
CREATE VIEW vw_RequestAllocations AS
SELECT
    a.SourceId                                  AS RequestId,
    a.DealId,
    a.SellerId,
    a.QuantityAllocated,
    a.PricePerUnit,
    a.AllocationType,
    a.AllocatedAt,
    d.Status                                    AS DealStatus
FROM Allocations a
JOIN Deals d ON d.Id = a.DealId
WHERE a.SourceType = 2;  -- 2 = BuyerRequest
```

---

### 11.6 Domain Layer — Listing & Request Aggregate Methods

```csharp
// SarwaMart.Domain/Entities/Listing.cs (relevant methods)
public class Listing
{
    public decimal Quantity { get; private set; }
    public decimal QuantityAllocated { get; private set; }
    public decimal QuantityRemaining => Quantity - QuantityAllocated;
    public bool AllowPartialBids { get; private set; }
    public decimal? MinBidQuantity { get; private set; }
    public ListingStatus Status { get; private set; }

    // Called when a deal is confirmed against this listing
    public Result Allocate(decimal quantity)
    {
        if (Status is not (ListingStatus.Live or ListingStatus.PartiallyAllocated))
            return Result.Failure("Listing is not open for allocation.");

        if (quantity <= 0 || quantity > QuantityRemaining)
            return Result.Failure(
                $"Requested {quantity} exceeds remaining {QuantityRemaining}.");

        QuantityAllocated += quantity;

        Status = QuantityAllocated >= Quantity
            ? ListingStatus.FullyAllocated
            : ListingStatus.PartiallyAllocated;

        return Result.Success();
    }

    // Called when a deal is cancelled — releases allocation back
    public void Deallocate(decimal quantity)
    {
        QuantityAllocated = Math.Max(0, QuantityAllocated - quantity);
        if (Status == ListingStatus.FullyAllocated)
            Status = ListingStatus.PartiallyAllocated;
    }
}

// SarwaMart.Domain/Entities/BuyerRequest.cs (relevant methods)
public class BuyerRequest
{
    public decimal Quantity { get; private set; }
    public decimal QuantityAllocated { get; private set; }
    public decimal QuantityRemaining => Quantity - QuantityAllocated;
    public bool AllowPartialFill { get; private set; }
    public decimal? MinProposalQuantity { get; private set; }
    public BuyerRequestStatus Status { get; private set; }

    public Result Fulfill(decimal quantity)
    {
        if (Status is not (BuyerRequestStatus.Live or BuyerRequestStatus.PartiallyFulfilled))
            return Result.Failure("Request is not open for fulfillment.");

        if (quantity <= 0 || quantity > QuantityRemaining)
            return Result.Failure(
                $"Proposed {quantity} exceeds remaining {QuantityRemaining}.");

        QuantityAllocated += quantity;

        Status = QuantityAllocated >= Quantity
            ? BuyerRequestStatus.FullyFulfilled
            : BuyerRequestStatus.PartiallyFulfilled;

        return Result.Success();
    }

    public void Unfulfill(decimal quantity)
    {
        QuantityAllocated = Math.Max(0, QuantityAllocated - quantity);
        if (Status == BuyerRequestStatus.FullyFulfilled)
            Status = BuyerRequestStatus.PartiallyFulfilled;
    }
}
```

---

### 11.7 Application Layer — ConfirmDeal Command (Allocation Logic)

```csharp
[RequirePermission(Permission.NegotiationParticipate)]
public sealed record ConfirmDealCommand(
    Guid ThreadId,
    decimal QuantityFinal,   // agreed quantity — may differ from original bid/proposal
    decimal PricePerUnit
) : IRequest<Result<Guid>>, IAuditableRequest
{
    public string AuditResource    => "Deal";
    public string? AuditResourceId => ThreadId.ToString();
}

public sealed class ConfirmDealHandler(
    IAppDbContext db,
    ICurrentUserService currentUser,
    IInvoiceNumberService invoiceNumbers)
    : IRequestHandler<ConfirmDealCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        ConfirmDealCommand cmd, CancellationToken ct)
    {
        // 1. Load thread — verify caller is a participant
        var thread = await db.NegotiationThreads
            .Include(t => t.Bid).ThenInclude(b => b!.Listing)
            .Include(t => t.Proposal).ThenInclude(p => p!.Request)
            .FirstOrDefaultAsync(t => t.Id == cmd.ThreadId, ct);

        if (thread is null) return Result.NotFound();
        if (thread.BuyerId != currentUser.UserId &&
            thread.SellerId != currentUser.UserId)
            return Result.Forbidden();

        // 2. Resolve source (listing or request) and lock the row
        Listing? listing = null;
        BuyerRequest? request = null;

        if (thread.SourceType == NegotiationSourceType.Bid)
        {
            // UPDLOCK prevents concurrent allocation on same listing
            listing = await db.Listings
                .FromSqlRaw("SELECT * FROM Listings WITH (UPDLOCK) WHERE Id = {0}",
                    thread.Bid!.ListingId)
                .FirstAsync(ct);

            var allocResult = listing.Allocate(cmd.QuantityFinal);
            if (!allocResult.IsSuccess) return allocResult;
        }
        else
        {
            request = await db.BuyerRequests
                .FromSqlRaw("SELECT * FROM BuyerRequests WITH (UPDLOCK) WHERE Id = {0}",
                    thread.Proposal!.RequestId)
                .FirstAsync(ct);

            var fulfillResult = request.Fulfill(cmd.QuantityFinal);
            if (!fulfillResult.IsSuccess) return fulfillResult;
        }

        // 3. Calculate financials
        var subtotal         = cmd.QuantityFinal * cmd.PricePerUnit;
        var platformFee      = Math.Round(subtotal * 0.02m, 2);
        var gst              = Math.Round(subtotal * 0.05m, 2);
        var allocationType   = cmd.QuantityFinal < (listing?.Quantity ?? request!.Quantity)
                               ? AllocationType.Partial : AllocationType.Full;

        // 4. Create Deal
        var deal = new Deal
        {
            ThreadId         = cmd.ThreadId,
            BuyerId          = thread.BuyerId,
            SellerId         = thread.SellerId,
            ListingId        = listing?.Id,
            RequestId        = request?.Id,
            ProductName      = listing?.Name ?? request!.ProductName,
            QuantityOriginal = thread.Bid?.QuantityRequested ?? thread.Proposal!.QuantityOffered,
            QuantityFinal    = cmd.QuantityFinal,
            UOM              = listing?.UOM ?? request!.UOM,
            PricePerUnit     = cmd.PricePerUnit,
            Subtotal         = subtotal,
            PlatformFee      = platformFee,
            GSTAmount        = gst,
            SellerReceivable = subtotal - platformFee,
            BuyerPayable     = subtotal + gst,
            AllocationType   = allocationType,
            Status           = DealStatus.Confirmed,
            ConfirmedAt      = DateTime.UtcNow,
        };
        db.Deals.Add(deal);

        // 5. Create Allocation record
        db.Allocations.Add(new Allocation
        {
            SourceType        = thread.SourceType == NegotiationSourceType.Bid ? 1 : 2,
            SourceId          = listing?.Id ?? request!.Id,
            DealId            = deal.Id,
            BuyerId           = thread.BuyerId,
            SellerId          = thread.SellerId,
            QuantityAllocated = cmd.QuantityFinal,
            PricePerUnit      = cmd.PricePerUnit,
            AllocationType    = allocationType,
        });

        // 6. Update bid/proposal allocated quantity and status
        if (thread.Bid is not null)
        {
            thread.Bid.QuantityAllocated = cmd.QuantityFinal;
            thread.Bid.Status = cmd.QuantityFinal < thread.Bid.QuantityRequested
                ? BidStatus.PartiallyAccepted : BidStatus.Accepted;
        }
        else if (thread.Proposal is not null)
        {
            thread.Proposal.QuantityAllocated = cmd.QuantityFinal;
            thread.Proposal.Status = cmd.QuantityFinal < thread.Proposal.QuantityOffered
                ? ProposalStatus.PartiallyAccepted : ProposalStatus.Accepted;
        }

        // 7. Generate 2 invoices (seller receivable + buyer payable)
        var sellerInvoice = BuildInvoice(deal, InvoiceDirection.Receivable,
            forRole: UserRole.Seller, ownerId: thread.SellerId,
            counterpartyId: thread.BuyerId, invoiceNumbers.Next("S"));

        var buyerInvoice = BuildInvoice(deal, InvoiceDirection.Payable,
            forRole: UserRole.Buyer, ownerId: thread.BuyerId,
            counterpartyId: thread.SellerId, invoiceNumbers.Next("B"));

        db.Invoices.AddRange(sellerInvoice, buyerInvoice);

        thread.IsResolved = true;

        // All changes in a single transaction
        await db.SaveChangesAsync(ct);

        return Result.Success(deal.Id);
    }
}
```

---

### 11.8 API Response — Listing Detail with Allocation Info

```json
GET /api/v1/listings/{id}

{
  "id": "3fa85f64-...",
  "name": "Fresh Rohu",
  "category": "Fish",
  "quantityTotal": 500,
  "quantityAllocated": 350,
  "quantityRemaining": 150,
  "allocationPct": 70.0,
  "uom": "kg",
  "pricePerUnit": 145.00,
  "allowPartialBids": true,
  "minBidQuantity": 50,
  "status": "PartiallyAllocated",
  "freshness": "FreshOnIce",
  "grade": "A",
  "region": "West Godavari, AP",
  "expiresAt": "2026-05-26T10:00:00Z",
  "activeBidCount": 4,
  "allocations": [
    {
      "buyerAnonymized": "Buyer #4837",
      "quantityAllocated": 200,
      "pricePerUnit": 148.00,
      "allocationType": "Partial",
      "allocatedAt": "2026-05-24T08:30:00Z"
    },
    {
      "buyerAnonymized": "Buyer #4859",
      "quantityAllocated": 150,
      "pricePerUnit": 145.00,
      "allocationType": "Partial",
      "allocatedAt": "2026-05-24T10:15:00Z"
    }
  ],
  "seller": {
    "anonymizedName": "Seller #2031",
    "rating": 4.8,
    "totalDeals": 43,
    "isVerified": true
  }
}
```

---

### 11.9 API Response — Buyer Request with Fulfillment Info

```json
GET /api/v1/requests/{id}

{
  "id": "7ab12cd3-...",
  "productName": "Pomfret",
  "quantityTotal": 300,
  "quantityAllocated": 200,
  "quantityRemaining": 100,
  "fulfillmentPct": 66.7,
  "uom": "kg",
  "expectedPrice": 380.00,
  "allowPartialFill": true,
  "minProposalQuantity": 50,
  "status": "PartiallyFulfilled",
  "location": "Hyderabad, AP",
  "openToCounter": true,
  "expiresAt": "2026-05-27T18:00:00Z",
  "proposalCount": 4,
  "allocations": [
    {
      "sellerAnonymized": "Seller #2073",
      "quantityAllocated": 200,
      "pricePerUnit": 378.00,
      "allocationType": "Partial",
      "allocatedAt": "2026-05-24T09:00:00Z"
    }
  ],
  "buyer": {
    "anonymizedName": "Buyer #4821",
    "rating": 4.6,
    "totalDeals": 19,
    "isVerified": true
  }
}
```

---

### 11.10 Negotiation — Partial Quantity Offer Flow

During negotiation either party can propose a different quantity alongside a price counter. The `NegotiationMessage` table already stores `Quantity` per offer message, enabling this flow:

```
Seller lists 500 kg @ ₹145/kg  (AllowPartialBids = true, MinBidQuantity = 50)

Buyer A bids 200 kg @ ₹140/kg
  └── Seller counters: 200 kg @ ₹148/kg   [offer msg: price=148, qty=200]
        └── Buyer accepts: 200 kg @ ₹148/kg
              └── ConfirmDeal(qty=200, price=148) → Deal, Allocation
                    Listing: QuantityAllocated=200, Status=PartiallyAllocated

Buyer B bids 300 kg @ ₹145/kg
  └── Seller counters: 150 kg @ ₹145/kg   [offer msg: price=145, qty=150 — partial counter]
        └── Buyer accepts 150 kg
              └── ConfirmDeal(qty=150, price=145) → Deal, Allocation
                    Listing: QuantityAllocated=350, Status=PartiallyAllocated

Buyer C bids 150 kg @ ₹146/kg
  └── No counter — direct accept
        └── ConfirmDeal(qty=150, price=146) → Deal, Allocation
              Listing: QuantityAllocated=500, Status=FullyAllocated
              → No new bids accepted
```

---

### 11.11 Edge Cases & Enforcement

| Scenario | Enforcement |
|---|---|
| Buyer bids more than `QuantityRemaining` | `FluentValidation` on `PlaceBidCommand` + domain check in `Listing.Allocate()` |
| Two buyers simultaneously win the last 100 kg | `UPDLOCK` row lock on Listings during `ConfirmDeal` — second transaction gets `409 Conflict` |
| Seller counters with qty > original bid | Counter rejected — `400 Bad Request`; counter quantity cannot exceed `QuantityRequested` |
| Deal cancelled after allocation | `Listing.Deallocate(qty)` restores `QuantityRemaining`; listing status reverts if needed |
| Listing expires while `PartiallyAllocated` | Expiry job sets status=`Expired`; existing confirmed deals and invoices remain intact |
| Buyer requests `AllowPartialFill = false` | All proposals must offer exactly `QuantityRemaining`; validated in `SubmitProposalCommand` |
| Seller changes price post-partial allocation | Not permitted — existing deals are immutable; new bids negotiate independently |

---

## 12. Admin Approval Workflow — Listings & Buyer Requests

### 12.1 End-to-End Flow

```
SELLER LISTING
─────────────
Seller creates listing (status=Draft)
  └─ POST /listings            → 201, id returned

Seller edits as needed (status=Draft)
  └─ PUT /listings/{id}        → 200

Seller submits for review
  └─ POST /listings/{id}/submit → status → PendingApproval
                                  Admin notification sent

Admin reviews content, price, category accuracy
  ├─ Approve  → PUT /admin/listings/{id}/approve
  │              status → Live
  │              ExpiresAt = NOW + ValidityHours
  │              Seller push notification: "Your listing is now live"
  │
  └─ Reject   → PUT /admin/listings/{id}/reject  { reason: "..." }
                 status → Rejected
                 RejectionReason stored
                 Seller push notification: "Your listing was rejected — [reason]"
                 Seller can edit and resubmit

BUYER REQUEST
─────────────
Buyer creates request (status=Draft)
  └─ POST /requests            → 201, id returned

Buyer edits as needed (status=Draft)
  └─ PUT /requests/{id}        → 200

Buyer submits for review
  └─ POST /requests/{id}/submit → status → PendingApproval
                                  Admin notification sent

Admin reviews product, quantity, price reasonableness
  ├─ Approve  → PUT /admin/requests/{id}/approve
  │              status → Live
  │              ExpiresAt = NOW + default validity (configurable, default 7 days)
  │              Listing visible to all sellers in demand feed
  │              Buyer push notification: "Your request is now live"
  │
  └─ Reject   → PUT /admin/requests/{id}/reject  { reason: "..." }
                 status → Rejected
                 RejectionReason stored
                 Buyer push notification: "Your request was rejected — [reason]"
                 Buyer can edit and resubmit
```

---

### 12.2 What Admins Check

**Listing review criteria:**
- Product name and category match (no misclassification)
- Price is within reasonable market range (no price gouging or unrealistic floor)
- Quantity is achievable for the stated region and freshness type
- Images are appropriate (if uploaded)
- Seller account is verified and in good standing

**Buyer Request review criteria:**
- Product and quantity are genuine (not speculative or duplicate)
- Expected price is realistic for the product and region
- Description does not contain contact details (platform rules — all communication via app)
- Buyer account is verified and in good standing

---

### 12.3 Application Layer — Approve & Reject Commands

```csharp
// Approve a Listing
[RequirePermission(Permission.ListingsApprove)]
public sealed record ApproveListingCommand(Guid ListingId)
    : IRequest<Result>, IAuditableRequest
{
    public string AuditResource    => "Listing";
    public string? AuditResourceId => ListingId.ToString();
}

public sealed class ApproveListingHandler(
    IAppDbContext db,
    ICurrentUserService currentUser,
    INotificationService notifications)
    : IRequestHandler<ApproveListingCommand, Result>
{
    public async Task<Result> Handle(ApproveListingCommand cmd, CancellationToken ct)
    {
        var listing = await db.Listings
            .FirstOrDefaultAsync(l => l.Id == cmd.ListingId, ct);

        if (listing is null) return Result.NotFound();
        if (listing.Status != ListingStatus.PendingApproval)
            return Result.Failure("Listing is not pending approval.");

        listing.Status     = ListingStatus.Live;
        listing.ExpiresAt  = DateTime.UtcNow.AddHours(listing.ValidityHours);
        listing.ReviewedBy = currentUser.UserId;
        listing.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        await notifications.SendAsync(listing.SellerId,
            title: "Listing Approved",
            body:  $"Your listing '{listing.Name}' is now live.",
            deepLink: $"listing/{listing.Id}");

        return Result.Success();
    }
}

// Reject a Listing
[RequirePermission(Permission.ListingsReject)]
public sealed record RejectListingCommand(Guid ListingId, string Reason)
    : IRequest<Result>, IAuditableRequest
{
    public string AuditResource    => "Listing";
    public string? AuditResourceId => ListingId.ToString();
}

public sealed class RejectListingHandler(
    IAppDbContext db,
    ICurrentUserService currentUser,
    INotificationService notifications)
    : IRequestHandler<RejectListingCommand, Result>
{
    public async Task<Result> Handle(RejectListingCommand cmd, CancellationToken ct)
    {
        var listing = await db.Listings
            .FirstOrDefaultAsync(l => l.Id == cmd.ListingId, ct);

        if (listing is null) return Result.NotFound();
        if (listing.Status != ListingStatus.PendingApproval)
            return Result.Failure("Listing is not pending approval.");

        listing.Status          = ListingStatus.Rejected;
        listing.RejectionReason = cmd.Reason;
        listing.ReviewedBy      = currentUser.UserId;
        listing.ReviewedAt      = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        await notifications.SendAsync(listing.SellerId,
            title: "Listing Rejected",
            body:  $"Your listing '{listing.Name}' was not approved: {cmd.Reason}",
            deepLink: $"listing/{listing.Id}");

        return Result.Success();
    }
}

// Approve a Buyer Request
[RequirePermission(Permission.RequestsApprove)]
public sealed record ApproveRequestCommand(Guid RequestId, int ValidityDays = 7)
    : IRequest<Result>, IAuditableRequest
{
    public string AuditResource    => "BuyerRequest";
    public string? AuditResourceId => RequestId.ToString();
}

public sealed class ApproveRequestHandler(
    IAppDbContext db,
    ICurrentUserService currentUser,
    INotificationService notifications)
    : IRequestHandler<ApproveRequestCommand, Result>
{
    public async Task<Result> Handle(ApproveRequestCommand cmd, CancellationToken ct)
    {
        var request = await db.BuyerRequests
            .FirstOrDefaultAsync(r => r.Id == cmd.RequestId, ct);

        if (request is null) return Result.NotFound();
        if (request.Status != BuyerRequestStatus.PendingApproval)
            return Result.Failure("Request is not pending approval.");

        request.Status     = BuyerRequestStatus.Live;
        request.ExpiresAt  = DateTime.UtcNow.AddDays(cmd.ValidityDays);
        request.ReviewedBy = currentUser.UserId;
        request.ReviewedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        await notifications.SendAsync(request.BuyerId,
            title: "Request Approved",
            body:  $"Your request for '{request.ProductName}' is now live.",
            deepLink: $"request/{request.Id}");

        return Result.Success();
    }
}

// Reject a Buyer Request
[RequirePermission(Permission.RequestsReject)]
public sealed record RejectRequestCommand(Guid RequestId, string Reason)
    : IRequest<Result>, IAuditableRequest
{
    public string AuditResource    => "BuyerRequest";
    public string? AuditResourceId => RequestId.ToString();
}

public sealed class RejectRequestHandler(
    IAppDbContext db,
    ICurrentUserService currentUser,
    INotificationService notifications)
    : IRequestHandler<RejectRequestCommand, Result>
{
    public async Task<Result> Handle(RejectRequestCommand cmd, CancellationToken ct)
    {
        var request = await db.BuyerRequests
            .FirstOrDefaultAsync(r => r.Id == cmd.RequestId, ct);

        if (request is null) return Result.NotFound();
        if (request.Status != BuyerRequestStatus.PendingApproval)
            return Result.Failure("Request is not pending approval.");

        request.Status          = BuyerRequestStatus.Rejected;
        request.RejectionReason = cmd.Reason;
        request.ReviewedBy      = currentUser.UserId;
        request.ReviewedAt      = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        await notifications.SendAsync(request.BuyerId,
            title: "Request Rejected",
            body:  $"Your request for '{request.ProductName}' was not approved: {cmd.Reason}",
            deepLink: $"request/{request.Id}");

        return Result.Success();
    }
}
```

---

### 12.4 Re-submission Flow

Both sellers and buyers can fix and resubmit rejected content:

```csharp
// Resubmit a rejected listing (seller)
[RequirePermission(Permission.ListingsCreate)]
public sealed record ResubmitListingCommand(Guid ListingId)
    : IRequest<Result>, IAuditableRequest
{
    public string AuditResource    => "Listing";
    public string? AuditResourceId => ListingId.ToString();
}

// Handler checks: Status == Rejected AND SellerId == currentUser.UserId
// Then: Status = PendingApproval, RejectionReason = null, ReviewedBy = null, ReviewedAt = null
// Sends admin notification: "A listing has been resubmitted after rejection"

// Same pattern applies to ResubmitRequestCommand for buyers.
```

---

### 12.5 Notification Events Summary

| Event | Recipient | Channel | Trigger |
|---|---|---|---|
| Listing submitted for review | Admin (broadcast) | In-app + email digest | `POST /listings/{id}/submit` |
| Listing approved | Seller | Push + In-app | Admin approves |
| Listing rejected | Seller | Push + In-app | Admin rejects |
| Listing resubmitted | Admin (broadcast) | In-app | Seller resubmits |
| Request submitted for review | Admin (broadcast) | In-app + email digest | `POST /requests/{id}/submit` |
| Request approved | Buyer | Push + In-app | Admin approves |
| Request rejected | Buyer | Push + In-app | Admin rejects |
| Request resubmitted | Admin (broadcast) | In-app | Buyer resubmits |
| Pending review > 24 h | Admin | In-app (daily digest) | Quartz.NET daily job |

---

### 12.6 Approval Edge Cases

| Scenario | Behaviour |
|---|---|
| Seller edits a `PendingApproval` listing | Allowed — edit resets the review clock; admin re-reviews |
| Seller tries to edit a `Live` listing | Blocked (`403`) — listing is locked once live; must cancel and relist |
| Buyer edits a `PendingApproval` request | Allowed — same reset behaviour as listings |
| Buyer edits a `Live` request | Blocked (`403`) — request is locked once live |
| Admin approves a listing whose seller was suspended | `422` — suspended seller's listings cannot go live |
| Admin approves a request whose buyer was suspended | `422` — suspended buyer's requests cannot go live |
| Seller submits a `Draft` listing that has no images | Allowed — images are optional at submission time |
| Same listing submitted twice | `409 Conflict` — `PendingApproval` listings cannot be resubmitted |

---

## 13. Configuration-Driven Branch Access

### 13.1 Access Model Overview

Branch access is **configuration-driven** — SuperAdmin can assign any office user to any set of branches at any time without a code change or deployment.

| Role | Branch Access Model | Configured Via |
|---|---|---|
| **SuperAdmin** | All branches, always | Hard-coded role bypass — no `UserBranchAccess` rows needed |
| **Admin** | Any subset of branches | SuperAdmin assigns via admin portal |
| **BranchAdmin** | One or more branches | SuperAdmin or Admin assigns via admin portal |
| **Seller** | Single home branch (from registration) | Chosen by user at registration; editable by Admin |
| **Buyer** | Single home branch (from registration) | Chosen by user at registration; editable by Admin |

---

### 13.2 How Branch Access Is Loaded

Branch access is resolved **at login / token refresh**, embedded in the JWT, and re-resolved on every token refresh:

```
Login / Token Refresh
│
├─ Role == SuperAdmin?
│    └─ branchIds claim OMITTED from JWT
│       HasBranchAccess(any) → always true at runtime
│
├─ Role == Admin or BranchAdmin?
│    └─ SELECT BranchId FROM UserBranchAccess
│       WHERE UserId = @userId AND IsActive = 1
│       → emit one "branchIds" claim per row
│
└─ Role == Seller or Buyer?
     └─ SELECT BranchId FROM Users WHERE Id = @userId
        → emit one "branchIds" claim (single home branch)
```

JWT refresh (every 15 minutes) re-executes this query, so any branch access change SuperAdmin makes is effective within one token lifetime — no logout required.

---

### 13.3 Runtime Enforcement in Query Handlers

Every handler that returns branch-scoped data applies the branch filter consistently:

```csharp
// Pattern used in GetListingsQueryHandler, GetRequestsQueryHandler, AdminGetPendingReviewHandler, etc.
var query = db.Listings.AsQueryable();

if (currentUser.IsBranchScoped)
{
    // Restrict to only the branches this user can see
    query = query.Where(l => currentUser.BranchIds.Contains(l.BranchId));
}
// SuperAdmin and Admin with IsBranchScoped=false → no WHERE clause added → sees all branches
```

Command handlers (approve, reject, edit) call `HasBranchAccess` on the entity's branch before proceeding:

```csharp
// Example: BranchAdmin tries to approve a listing
var listing = await db.Listings.FirstOrDefaultAsync(l => l.Id == cmd.ListingId, ct);
if (listing is null) return Result.NotFound();

if (!currentUser.HasBranchAccess(listing.BranchId))
    return Result.Forbidden("You do not have access to this branch.");
```

---

### 13.4 Admin Endpoints — Branch Access Configuration

```
GET    /api/v1/admin/users/{userId}/branch-access          — list branches assigned to a user
POST   /api/v1/admin/users/{userId}/branch-access          — assign one or more branches
DELETE /api/v1/admin/users/{userId}/branch-access/{branchId} — revoke a specific branch
PUT    /api/v1/admin/users/{userId}/branch-access          — replace full set of branches (bulk update)
GET    /api/v1/admin/branches/{branchId}/users             — list all office users assigned to a branch
```

**POST /admin/users/{userId}/branch-access** request body:
```json
{
  "branchIds": [
    "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "1c2deb4d-9a3f-4bad-9bdd-3c1e8g77bff1"
  ]
}
```

**Permission guard:** Only `SuperAdmin` can call these endpoints (enforced via `[RequirePermission(Permission.BranchesAssignAccess)]`).

---

### 13.5 Application Layer — Assign Branch Access Command

```csharp
[RequirePermission(Permission.BranchesAssignAccess)]
public sealed record AssignBranchAccessCommand(Guid TargetUserId, IReadOnlyList<Guid> BranchIds)
    : IRequest<Result>, IAuditableRequest
{
    public string AuditResource    => "UserBranchAccess";
    public string? AuditResourceId => TargetUserId.ToString();
}

public sealed class AssignBranchAccessHandler(
    IAppDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<AssignBranchAccessCommand, Result>
{
    public async Task<Result> Handle(AssignBranchAccessCommand cmd, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == cmd.TargetUserId, ct);
        if (user is null) return Result.NotFound();

        // Only Admin / BranchAdmin roles may have UserBranchAccess rows
        if (user.Role is not (UserRole.Admin or UserRole.BranchAdmin))
            return Result.Failure("Branch access configuration applies only to Admin and BranchAdmin users.");

        // Deactivate removed branches
        var existing = await db.UserBranchAccess
            .Where(x => x.UserId == cmd.TargetUserId && x.IsActive)
            .ToListAsync(ct);

        foreach (var row in existing.Where(x => !cmd.BranchIds.Contains(x.BranchId)))
        {
            row.IsActive  = false;
            row.RevokedBy = currentUser.UserId;
            row.RevokedAt = DateTime.UtcNow;
        }

        // Add new branches
        var existingBranchIds = existing.Select(x => x.BranchId).ToHashSet();
        foreach (var branchId in cmd.BranchIds.Where(id => !existingBranchIds.Contains(id)))
        {
            db.UserBranchAccess.Add(new UserBranchAccess
            {
                UserId    = cmd.TargetUserId,
                BranchId  = branchId,
                GrantedBy = currentUser.UserId,
                GrantedAt = DateTime.UtcNow,
                IsActive  = true
            });
        }

        await db.SaveChangesAsync(ct);
        return Result.Success();
    }
}
```

---

### 13.6 Permission Addition

Add one new permission to the RBAC permission list:

| Permission Constant | Value String | Description |
|---|---|---|
| `BranchesAssignAccess` | `branches.assign_access` | Grant / revoke branch access for office users |

**Permission matrix row (SuperAdmin only):**

| Permission | SuperAdmin | Admin | BranchAdmin | Seller | Buyer |
|---|---|---|---|---|---|
| `branches.assign_access` | ✓ | — | — | — | — |

---

### 13.7 Seed Data — Initial Branch Access

```sql
-- After seeding users and branches, assign initial access via UserBranchAccess
-- SuperAdmin: no rows needed
-- Example: assign the Vijayawada BranchAdmin to two branches
INSERT INTO UserBranchAccess (UserId, BranchId, GrantedBy, IsActive)
VALUES
  ('<<branch-admin-user-id>>', '<<AP-VJA-branch-id>>', '<<super-admin-user-id>>', 1),
  ('<<branch-admin-user-id>>', '<<AP-ELR-branch-id>>', '<<super-admin-user-id>>', 1);

-- Example: Admin user gets access to all branches
INSERT INTO UserBranchAccess (UserId, BranchId, GrantedBy, IsActive)
SELECT '<<admin-user-id>>', Id, '<<super-admin-user-id>>', 1
FROM Branches
WHERE IsActive = 1;
```

---

### 13.8 Edge Cases

| Scenario | Behaviour |
|---|---|
| BranchAdmin has no branches assigned yet | `BranchIds` is empty; all scoped queries return empty results; no data exposed |
| Admin removes a branch from a BranchAdmin mid-session | Effective on next token refresh (≤ 15 min); in-flight requests using old token complete normally |
| SuperAdmin calls a branch-scoped endpoint | Branch filter is not applied; full platform-wide data returned |
| Seller/Buyer tries to view listings from another branch | Listings feed defaults to their home branch; cross-branch view only if `AllowCrossBranchTrade = 1` on that branch |
| BranchAdmin assigned to Branch A tries to approve a listing from Branch B | `HasBranchAccess(branchB.Id)` → false → `403 Forbidden` |
| Admin is assigned to 0 branches | Same as BranchAdmin with no branches — empty results; SuperAdmin must assign at least one branch |
