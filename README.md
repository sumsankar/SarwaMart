# SarwaMart

**Fresh From The Source** — A B2B aqua-products marketplace connecting seafood farmers, aggregators and fisheries (sellers) with wholesalers, processors, exporters and retailers (buyers) across India.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [User Roles & Flows](#user-roles--flows)
  - [Authentication](#authentication)
  - [Registration & Onboarding](#registration--onboarding)
  - [Seller](#seller)
  - [Buyer](#buyer)
  - [Negotiation](#negotiation)
  - [Invoices](#invoices)
  - [Shared Screens](#shared-screens)
- [Architecture](#architecture)
- [Design System](#design-system)
- [Localisation](#localisation)
- [Build & Deployment](#build--deployment)

---

## Overview

SarwaMart is a React Native mobile application (iOS, Android, Web) that operates as a **B2B bidding and sourcing platform for Indian aqua products** — fish, prawns, crabs, lobsters and squid. The platform supports two distinct user personas:

| Role | Who | Core Actions |
|---|---|---|
| **Seller** | Farmers, aggregators, fisheries | List catch for bidding, receive and respond to bids, submit proposals on buyer requests, negotiate deals |
| **Buyer** | Wholesalers, processors, exporters, retailers | Browse live listings and place bids, post purchase requests, receive seller proposals, negotiate and confirm deals |

> **Current State:** The application is a fully-navigable prototype with rich mock data. There is no backend or API integration — all data is generated in `src/constants/mockData.ts`.

---

## Tech Stack

| Concern | Library / Tool |
|---|---|
| Framework | React Native 0.81.5 (New Architecture enabled) |
| Platform SDK | Expo SDK 54 |
| Language | TypeScript 5.9 |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| State Management | Zustand 5 |
| Local Persistence | AsyncStorage |
| Animations | React Native Reanimated 4, Expo Linear Gradient |
| Gestures | React Native Gesture Handler 2.28 |
| Build & Distribution | EAS Build |

---

## Getting Started

**Prerequisites:** Node.js 18+, npm, Expo CLI (`npm install -g expo-cli`), and either Expo Go on a device or a platform simulator.

```bash
# Install dependencies
npm install

# Start the Expo development server
npm start

# Open on specific platform
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Browser
```

Scan the QR code in your terminal with **Expo Go** (iOS/Android) to open on a physical device.

---

## Project Structure

```
SarwaMart/
├── App.tsx                        # Root component (providers + navigator)
├── index.ts                       # Expo entry point
├── app.json                       # Expo config (bundle ID, icons, splash)
├── eas.json                       # EAS build profiles (dev, preview, production)
├── assets/                        # App icons and splash images
└── src/
    ├── navigation/
    │   └── RootNavigator.tsx      # Single flat stack + SellerTabNavigator + BuyerTabNavigator
    ├── store/
    │   └── appStore.ts            # Zustand: auth state, role, selected item/request, toast
    ├── constants/
    │   ├── tokens.ts              # Design tokens: colors (T) and status pill styles
    │   ├── i18n.ts                # Zustand i18n store (en/te) and useI18n hook
    │   └── mockData.ts            # All application data: items, requests, bids, proposals, invoices
    ├── components/ui/             # Shared UI primitives
    └── screens/
        ├── auth/                  # Splash, Login, MobileEntry, OTP, PINSetup, PINLogin
        ├── registration/          # RolePicker, AccountType, PersonalDetails, Products, UnderReview
        ├── public/                # PublicLandingScreen (unauthenticated home)
        ├── seller/                # SellerHome, MyItems, CreateItem, ItemDetailSeller,
        │                          # NegotiationScreen, BuyerRequestsList, BuyerRequestDetail, MyProposals
        ├── buyer/                 # BuyerHome, ItemsForBidList, ItemDetailBuyer, PlaceBid,
        │                          # MyBids, MyRequests, CreateRequest, MyRequestDetail
        └── shared/                # InvoiceList, InvoiceDetail, Notifications, Profile, Language
```

---

## User Roles & Flows

### Authentication

The app launches on **SplashScreen** (2s animated logo), which routes to **PublicLandingScreen** where users choose to log in or create an account.

**Login flow:**
1. **MobileEntryScreen** — enter Indian mobile number
2. **OTPScreen** — 6-digit OTP verification with 60-second countdown and resend
3. **PINLoginScreen** — returning users log in with their saved 4-digit PIN
4. **PINSetupScreen** — new users create and confirm a 4-digit PIN

Role and login state are persisted to AsyncStorage (`sm_role`, `sm_logged_in`) so the app restores session on re-launch.

---

### Registration & Onboarding

New users flow through a 5-step registration funnel after OTP verification:

```
RolePickerScreen → AccountTypeScreen → PersonalDetailsScreen → ProductsScreen → UnderReviewScreen
```

| Screen | Purpose |
|---|---|
| **RolePicker** | Choose Seller or Buyer |
| **AccountType** | Individual or Company |
| **PersonalDetails** | Name, email, address, region |
| **Products** | Select traded aqua product categories |
| **UnderReview** | Confirmation that account is under 24-hour admin review |

---

### Seller

The seller authenticated shell is a **4-tab bottom navigator:**

| Tab | Screen | Purpose |
|---|---|---|
| Home | `SellerHomeScreen` | Horizontal carousels: own listings + incoming buyer requests. Search bar and multi-filter sheet (Status / Category / Grade / Freshness). |
| My Items | `MyItemsScreen` | Full list of own listings with status filters |
| My Proposals | `MyProposalsScreen` | Proposals submitted on buyer requests, with status tracking |
| My Invoices | `InvoiceListScreen` | Receivable invoices (SarwaMart owes seller for delivered goods) |

**Additional seller stack screens:**

- **CreateItemScreen** — Form to list a new item: product category, quantity, starting price (₹/kg), grade, freshness, photos (up to 4), validity period
- **ItemDetailSellerScreen** — Full listing detail with live bid list (sorted by highest price), countdown timer, and access to negotiate each bid
- **NegotiationScreen** — Chat-style thread per deal (see [Negotiation](#negotiation))
- **BuyerRequestsListScreen** — Full list of all buyer purchase requests
- **BuyerRequestDetailScreen** — Detail view with a Submit Proposal CTA

---

### Buyer

The buyer authenticated shell is a **4-tab bottom navigator:**

| Tab | Screen | Purpose |
|---|---|---|
| Home | `BuyerHomeScreen` | Live items carousel + own requests carousel. Quick action buttons (Post Request, My Bids, My Requests). Search and filter sheet. |
| My Bids | `MyBidsScreen` | Bids placed by the buyer, with negotiation status |
| My Requests | `MyRequestsScreen` | Purchase requests posted by the buyer |
| My Invoices | `InvoiceListScreen` | Payable invoices (buyer owes SarwaMart for received goods) |

**Additional buyer stack screens:**

- **ItemsForBidListScreen** — Full catalogue of live seller listings
- **ItemDetailBuyerScreen** — Listing detail with grade, freshness, location, active bid count, countdown timer
- **PlaceBidScreen** — Bid form: Full / Partial quantity toggle, price per kg, delivery preference (Pickup / Delivery / Either), note to seller
- **CreateRequestScreen** — Post a purchase request: product, variety, grade, required quantity, expected price, "open to counter offers" toggle, needed-by date, reference images
- **MyRequestDetailScreen** — Own request detail with list of received seller proposals (accept / counter / decline per proposal)

---

### Negotiation

`NegotiationScreen` is a **chat-style deal thread** shared between both roles. It is reached from:
- Seller: ItemDetailSeller → a bid → "Negotiate"
- Buyer: MyBids → a bid in "negotiating" status

**Thread message types:**
| Type | Description |
|---|---|
| `system` | Timestamped event labels (e.g. "Buyer placed a bid at ₹230/kg") |
| `offer` | Structured price card with qty/total, color-coded by sender (navy = seller, amber = buyer). Shows Accept / Counter / Reject actions on the latest offer. |
| `bubble` | Free-text chat messages |

**Finalising a deal:** Tapping **Accept** opens a confirmation bottom sheet showing the deal breakdown including the 2% platform fee and the net amount the seller receives. Confirming navigates back.

---

### Invoices

`InvoiceListScreen` and `InvoiceDetailScreen` are shared between both roles, differentiated by `useAppStore().role`:

| Role | Direction | Meaning |
|---|---|---|
| Seller | `receivable` | SarwaMart owes the seller (payment for delivered goods) |
| Buyer | `payable` | Buyer owes SarwaMart (payment for received goods) |

Invoice statuses: `settled`, `payment pending`, `pending`, `disputed`. The list shows summary totals (total receivable / total settled this month for sellers; total payable / total paid for buyers).

---

### Shared Screens

| Screen | Features |
|---|---|
| **NotificationsScreen** | Grouped by Today / Yesterday / This Week. Mark-all-read action. Notification types: new bids, listing approved, counter offers, invoice settlements, registration status. |
| **ProfileScreen** | Hero card (name, role badge, KYC status), deal count and rating stats. Section list: Personal Details, Products & Subproducts, Regions & Areas, KYC & Documents, Bank Account Details, Security, Preferences. |
| **LanguageScreen** | Switch between English and Telugu (తెలుగు) |

---

## Architecture

### Navigation

A single `RootNavigator` (native stack, `headerShown: false`, `slide_from_right` animation) contains **all screens** in a flat list. Nested tab navigators (`SellerTabNavigator`, `BuyerTabNavigator`) are themselves screens in the root stack — this means any stack screen can be pushed on top of the tab shell without breaking the tab bar.

All route names and params are typed via `RootStackParams` in `src/navigation/RootNavigator.tsx`.

### Data Passing Between Screens

Navigation params are intentionally minimal (`undefined` for most screens). Detail context is passed through the Zustand store:

```ts
// Before navigating to a detail screen:
setSelectedItem(item);
nav.navigate('ItemDetailSeller');

// In the detail screen:
const { selectedItem } = useAppStore();
```

### State Management

**`useAppStore`** (`src/store/appStore.ts`) — global runtime state:
- `role: 'seller' | 'buyer'` — which tab navigator to show
- `isLoggedIn: boolean` — auth gate
- `selectedItem`, `selectedRequest` — detail context passed between screens
- `toast` — global success/error/info toast (auto-dismisses after 2.5s)
- `logout()` — clears AsyncStorage and resets state

**`useI18n`** (`src/constants/i18n.ts`) — language store:
- `t(key)` — returns translated string, falls back to English
- `setLang('en' | 'te')` — switches language app-wide

### Mock Data Generators

Rather than static arrays for every scenario, several exports in `mockData.ts` are **deterministic generator functions** that derive realistic data from item/request IDs:

- `bidsForItem(item)` — generates N bids with price drift of -3% to +18% over starting price, partial-quantity buyers, and status progression. Sorted by highest bid first.
- `proposalsForRequest(req)` — generates N proposals with price drift of -8% to +12% over expected price, partial quantities, and status based on request status.
- `proposalsForRequest` and `bidsForItem` produce the same output for the same inputs every call (no random state).

---

## Design System

All styling is done with React Native `StyleSheet.create`. There is **no third-party UI library**.

### Color Tokens — `src/constants/tokens.ts`

Import as `import { T } from '../constants/tokens'`. Never hardcode hex values.

| Token | Value | Usage |
|---|---|---|
| `T.navy` | `#1B3770` | Primary brand, seller theme, CTAs |
| `T.amber` | `#E8921A` | Secondary, buyer theme, urgency |
| `T.green` | `#2D7A35` | Success, accepted state |
| `T.danger` | `#A32D2D` | Errors, rejected, destructive |
| `T.bg` | `#F5F7FA` | Screen backgrounds |
| `T.card` | `#FFFFFF` | Card surfaces |
| `T.text1` | `#1A1C2E` | Primary text |
| `T.text2` | `#5A5E7A` | Secondary text |
| `T.text3` | `#8A8FA8` | Placeholder / meta text |
| `T.hairline` | `#E2E5EF` | Borders and dividers |

### Status Badge Colors — `STATUS_PILL`

```ts
import { STATUS_PILL } from '../constants/tokens';
// Keys: 'live' | 'pending' | 'sold' | 'expired' | 'negotiating' |
//       'approved' | 'rejected' | 'under review' | 'settled' | 'payment pending'
```

### Shared UI Components — `src/components/ui/`

| Component | Purpose |
|---|---|
| `AppBar` | Top bar with logo, notifications bell and drawer/avatar |
| `Header` | Screen-level header with back button, title, optional right slot |
| `AppDrawer` | Side drawer (role-aware menu items) |
| `BannerCarousel` | Auto-scrolling promotional banner with `LinearGradient` |
| `StatusPill` | Coloured status badge using `STATUS_PILL` tokens |
| `CountdownTimer` | Seeded countdown display (deterministic from `seedSeconds`) |
| `Button` | Primary / secondary variants, full-width option |
| `Input` | Styled text input with label and error state |
| `Keypad` | Numeric keypad used for PIN entry |
| `PINDots` | 4-dot PIN progress indicator |
| `Card` | Generic surface wrapper |
| `Icon` | Thin icon wrapper (Expo Vector Icons) |
| `Logo` | SarwaMart wordmark (light and dark variants) |
| `Avatar` | Initials-based avatar with configurable size and background |
| `Toast` | Overlay toast driven by `useAppStore().toast` |
| `SectionHeader` | List section title with "See all →" action |
| `SegTabs` | Segmented tab control |

---

## Localisation

The app supports **English (`en`)** and **Telugu (`te`)**.

All user-facing strings must use the `useI18n` hook:

```ts
import { useI18n } from '../../constants/i18n';

const { t } = useI18n();
// ...
<Text>{t('sendOTP')}</Text>
```

To add a new string, add the key to both `en` and `te` objects in `src/constants/i18n.ts`. The `t()` function falls back to the English value if a key is missing from the active language.

Users switch language via **Profile → Language** (`LanguageScreen`). Language preference is held in the `useI18n` Zustand store (not yet persisted to AsyncStorage).

---

## Build & Deployment

Builds are managed via **EAS Build** (Expo Application Services).

```bash
# Install EAS CLI
npm install -g eas-cli

# Authenticate
eas login

# Build profiles (defined in eas.json)
eas build --profile development --platform ios      # Dev client (internal)
eas build --profile preview --platform android      # Internal preview APK
eas build --profile production --platform all       # Production build (auto-increments version)

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

**Build profiles:**

| Profile | Distribution | Notes |
|---|---|---|
| `development` | Internal | Development client enabled; for Expo dev builds |
| `preview` | Internal | Production-like binary for internal testing |
| `production` | Store | Auto-increments build number via `appVersionSource: remote` |

**App identifiers:**
- Android package: `com.sum.sarwamart`
- EAS Project ID: `f208e125-d541-4e4a-bca3-42fe86bac6d0`
