# GoEazy Architecture

This document provides a technical overview of the GoEazy platform architecture for contributors and developers.

## System Overview

GoEazy is a **single-page application (SPA)** built with React, powered by Supabase as a Backend-as-a-Service (BaaS).

```
┌─────────────────────────────────────────────────────┐
│                     CLIENT (SPA)                     │
│                                                     │
│  React 19 + Vite 8 + React Router 7                │
│  ├── Redux Toolkit (Global State)                   │
│  ├── React Hook Form + Zod (Form Validation)        │
│  ├── Tailwind CSS + Framer Motion (UI)              │
│  ├── i18next (Internationalization: EN/HI)          │
│  ├── Swiper 12 (Image Galleries)                    │
│  └── Mapbox GL (Maps)                               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    SUPABASE (BaaS)                   │
│                                                     │
│  ├── PostgreSQL Database (with RLS)                 │
│  ├── GoTrue Authentication (Google + Email)         │
│  ├── S3-Compatible Storage (Property Images)        │
│  ├── Edge Functions (Payment Verification)          │
│  └── Realtime (Future: Notifications)               │
│                                                     │
├─────────────────────────────────────────────────────┤
│                 EXTERNAL SERVICES                    │
│                                                     │
│  ├── Razorpay (Payment Gateway)                     │
│  ├── Mapbox (Maps & Geocoding)                      │
│  └── Vercel (Hosting & CDN)                         │
└─────────────────────────────────────────────────────┘
```

## User Roles & Permissions

| Role | Access Level | Key Capabilities |
|------|-------------|------------------|
| **Guest** | Public | Browse properties, view search page |
| **Tenant** (`user`) | Authenticated | Save properties, book visits, unlock contacts (₹9), view dashboard |
| **Landlord** (`landlord`) | Authenticated | List properties (₹199), manage listings, view analytics |
| **Service Provider** (`service_provider`) | Authenticated | List services, manage service listings |
| **System Admin** (`admin`) | Privileged | Verify providers, view platform metrics, manage approvals |

Roles are stored in `user_metadata` via Supabase Auth and enforced via:
- **Frontend**: `<ProtectedRoute allowedRoles={[...]}>`
- **Backend**: PostgreSQL Row Level Security (RLS) policies

## Frontend Architecture

### Routing (`App.jsx`)

All routes are defined in `src/App.jsx` using React Router 7:

- **Public routes**: `/search`, `/property/:id`, `/nearby`, `/services/:id`, `/about`, legal pages
- **Protected routes**: `/dashboard`, `/settings`, `/landlord/*`, `/service-provider/*`, `/systemadmin`
- **Lazy-loaded**: All pages except `Home`, `Search`, `NotFound`, and `NearbyServices` are code-split via `React.lazy()`

### State Management

```
Redux Store (src/store/)
├── authSlice     — User session, profile, role, loading state
├── propertySlice — Property listings, filters, search state
├── serviceSlice  — Nearby services data
└── uiSlice       — Mobile menu, search panel, active category
```

### Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `hooks/useAuth.js` | Session management, sign-in/out, role detection |
| `useProperties` | `hooks/useProperties.js` | Property CRUD, search, pagination, saved properties |
| `useServices` | `hooks/useServices.js` | Service provider CRUD and filtering |

### Component Organization

```
components/
├── auth/          # AuthModal, AuthGateModal, ProtectedRoute, RoleSelectionModal
├── common/        # ErrorBoundary, ScrollToTop, SkipToContent, OnboardingQuiz
├── home/          # Landing page sections
├── layout/        # Layout wrapper, Navbar, Footer
├── map/           # Mapbox integration components
├── property/      # PropertyCard, PropertyForm, property detail sections
├── services/      # ServiceCard, service-related components
├── ui/            # Reusable primitives: Button, Modal, Input, Badge, Skeleton
└── legal/         # Privacy, Terms, Cookie, Refund policy components
```

### UI Component Library (`components/ui/`)

| Component | Description |
|-----------|-------------|
| `Button` | Styled button with variants (primary, secondary, outline) |
| `Modal` | Accessible dialog with focus trapping, escape key, backdrop |
| `Input` | Form input with label, error state, and icon support |
| `Badge` | Status/tag badge with color variants |
| `Skeleton` | Loading placeholder with shimmer animation |

## Backend Architecture (Supabase)

### Database Schema

Key tables (see `supabase/schema.sql`):

- **`profiles`** — Extended user data (name, avatar, phone, role)
- **`properties`** — Property listings with metadata
- **`services`** — Service provider listings
- **`reviews`** — Property and service reviews
- **`saved_properties`** — User bookmarks
- **`recently_viewed`** — 72-hour rolling view history
- **`site_visits`** — Visit booking requests

### Row Level Security (RLS)

All tables use RLS policies. Key principles:
- Users can only read/modify their own data
- Property reads are gated by role and payment status
- Sensitive fields (lat, lng, contact) are behind RPC functions

### Edge Functions (`supabase/functions/`)

| Function | Purpose |
|----------|---------|
| `verify-payment` | Validates Razorpay HMAC signature and payment amount before creating property |

### Payment Flow

```
1. Landlord fills property form
2. Frontend initiates Razorpay checkout (₹199)
3. Razorpay returns payment_id + signature
4. Frontend calls Supabase Edge Function with payment proof
5. Edge Function verifies HMAC-SHA256 signature with Razorpay API
6. Edge Function cross-checks payment amount (₹199.00)
7. On success: property is inserted into database
8. Frontend shows success animation
```

## Build & Deployment

### Development
```bash
npm run dev     # Vite dev server at localhost:5173
```

### Production Build
```bash
npm run build   # Output to dist/
npm run preview # Preview production build locally
```

### Deployment
- Hosted on **Vercel** with automatic deployments from `main`
- Configuration in `vercel.json` (SPA fallback routing)
- Environment variables set in Vercel dashboard

## Key Design Decisions

1. **React.lazy for heavy pages** — Prevents TDZ (Temporal Dead Zone) errors from Rolldown bundling circular dependencies
2. **Mapbox loaded from CDN** — Avoids Vite/Rolldown Web Worker bundling issues
3. **Console filtering in index.html** — Suppresses third-party noise for clean production console
4. **Mock data fallback** — App works without Supabase credentials using `MOCK_PROPERTIES` in constants
5. **Anti-copy protection** — Disabled in development, active in production (commented out in index.html)

---

For contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).
