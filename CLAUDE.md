# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR to open on device)
npm run ios        # Open in iOS simulator
npm run android    # Open in Android emulator
npm run web        # Open in browser
```

No test runner is configured. No lint script is defined in package.json.

For EAS builds:
```bash
eas build --platform ios
eas build --platform android
```

## Architecture

SarwaMart is an aqua-products marketplace app (React Native + Expo SDK 54, TypeScript, new architecture enabled). There is **no backend** — all data is mock data defined in `src/constants/mockData.ts`.

### State Management

Two Zustand stores, no Context API:

- **`src/store/appStore.ts`** — `useAppStore`: auth state (`isLoggedIn`, `role: 'seller'|'buyer'`), selected item/request passed between screens, and a global toast. Role and login state are persisted to AsyncStorage under keys `sm_role` and `sm_logged_in`.
- **`src/constants/i18n.ts`** — `useI18n`: language selection (`en`/`te` Telugu) and `t(key)` translation helper. All UI strings must use `t(key)`.

### Navigation

A single flat `RootNavigator` (native stack) defined in `src/navigation/RootNavigator.tsx` contains all screens. Two nested tab navigators sit inside it: `SellerTabNavigator` and `BuyerTabNavigator`, reached via the `SellerTabs` and `BuyerTabs` stack screens respectively.

All route names and their params are typed in `RootStackParams`. Screens receive no prop-passed data — shared detail context (selected item, selected request) goes through `useAppStore.setSelectedItem` / `setSelectedRequest` before navigating, then is read from the store in the destination screen.

Auth flow: `Splash → PublicLanding → Login → MobileEntry → OTP → PINSetup/PINLogin → RolePicker → AccountType → PersonalDetails → Products → UnderReview → SellerTabs or BuyerTabs`

### Design System

**`src/constants/tokens.ts`** exports two objects — always import as `{ T, STATUS_PILL }`:

- `T` — all color tokens (navy, green, amber, bg, card, text1–text3, hairline, etc.)
- `STATUS_PILL` — per-status badge styles keyed by status string (`live`, `pending`, `sold`, `expired`, `negotiating`, `approved`, `rejected`, `under review`, `settled`, `payment pending`)

Never hardcode hex colors; always use `T.*`.

### Screen Organization

Screens are split by role under `src/screens/`:
- `auth/` — splash, login, OTP, PIN flows
- `registration/` — role picker through under-review
- `seller/` — seller home, items CRUD, negotiation, buyer requests
- `buyer/` — buyer home, bidding, requests
- `shared/` — invoices, notifications, profile, language (role-aware where needed)

`InvoiceListScreen` is reused for both seller and buyer tabs; it reads `useAppStore` role to filter `invoicesForRole(role)` from mock data.

### Mock Data

`src/constants/mockData.ts` contains all data. Several exports are generator functions that produce deterministic results from item/request IDs:
- `bidsForItem(item)` — generates bids for a seller's item
- `proposalsForRequest(req)` — generates proposals for a buyer request
- `invoicesForRole(role)` — filters invoices by role
