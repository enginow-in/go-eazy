<div align="center">

# GoEazy

**The Housing Standard for Uttarakhand**

A premium real estate ecosystem for students and professionals — broker-free, transparent, and built for the future.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[Live Demo](https://go-eazy.vercel.app) · [Report Bug](https://github.com/enginow-in/go-eazy/issues/new?template=bug_report.md) · [Request Feature](https://github.com/enginow-in/go-eazy/issues/new?template=feature_request.md)

</div>

---

## Overview

GoEazy solves the student housing crisis in Uttarakhand by connecting landlords directly with tenants — no brokers, no hidden fees. Built with a production-grade architecture, it features secure payments, real-time maps, and a premium user experience.

**Key Features:**

- **Broker-Free Listings** — Direct landlord-to-tenant pipeline
- **Secure Payments** — Razorpay integration with HMAC signature verification
- **Real-Time Maps** — Mapbox-powered location picker and viewer
- **Role-Based Access** — Separate dashboards for Tenants, Landlords, and Admins
- **Multi-Language** — English and Hindi support via i18next
- **Responsive Design** — Mobile-first UI with skeleton loaders and smooth animations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 3, Framer Motion |
| State | Redux Toolkit, React Context |
| Backend | Supabase (PostgreSQL, Edge Functions, Auth, Storage) |
| Payments | Razorpay |
| Maps | Mapbox GL JS |
| Forms | React Hook Form + Zod validation |
| UI | Radix UI primitives, Lucide icons, Swiper |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **npm** 9+ (comes with Node)
- A [Supabase](https://supabase.com) account (free tier works)
- A [Razorpay](https://razorpay.com) account (for payments)
- A [Mapbox](https://mapbox.com) access token (for maps)

### Installation

```bash
# 1. Fork the repository
# Click the "Fork" button on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/go-eazy.git
cd go-eazy

# 3. Install dependencies
npm install

# 4. Set up environment variables
cp .env.example .env
```

### Environment Variables

Edit `.env` with your credentials:

```env
# Required — Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Required — Razorpay (for payments)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
VITE_RAZORPAY_KEY_SECRET=xxxxx

# Required — Maps
VITE_MAPBOX_TOKEN=pk.eyJ1xxxxx

# Optional
VITE_REDIRECT_URL=http://localhost:5173/search
```

### Development

```bash
# Start the dev server
npm run dev

# The app will be available at http://localhost:5173
```

### Production

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

---

## Project Structure

```
go-eazy/
├── public/                  # Static assets (favicon, images)
├── src/
│   ├── assets/              # Images and static resources
│   ├── components/
│   │   ├── auth/            # Auth modals, role selection, protected routes
│   │   ├── common/          # AppInitializer, OnboardingQuiz, ScrollToTop
│   │   ├── home/            # Hero, CityChips, PropertySection
│   │   ├── layout/          # Navbar, Footer, Layout, BannerSlider
│   │   ├── legal/           # Terms, Privacy policy layouts
│   │   ├── map/             # LocationPicker, LocationViewer (Mapbox)
│   │   ├── property/        # PropertyCard, PropertyForm, RecommendedSection
│   │   ├── services/        # ServiceCard
│   │   └── ui/              # Button, Badge, Skeleton, FormError, ThemeToggle
│   ├── context/             # ThemeContext (dark mode)
│   ├── hooks/               # useAuth, useDebounce, useScrollToTop
│   ├── i18n/                # en.js, hi.js translations
│   ├── lib/                 # Supabase client, utilities
│   ├── pages/               # Home, Search, PropertyDetail, Settings, Dashboards
│   └── store/               # Redux slices (auth, UI, search)
├── .env.example             # Environment variable template
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Architecture

### Authentication Flow

```
User → AuthModal → Supabase Auth → JWT (ES256)
                                    ↓
                              Role Check → Dashboard
                              (tenant / landlord / admin)
```

### Payment Flow

```
Landlord → PropertyForm → Razorpay Checkout
                ↓
     Edge Function verifies HMAC signature
                ↓
     PostgreSQL RLS allows property creation
```

### Security Layers

| Layer | Protection |
|-------|-----------|
| Database | Row Level Security (RLS) — users can only access their own data |
| API | Supabase Edge Functions verify payment signatures before writes |
| Auth | ES256 JWT with role-based access control |
| Frontend | Protected routes redirect unauthenticated users |

---

## Contributing

We welcome contributions! Here's how to get started:

### Quick Start

```bash
# 1. Pick an issue from the Issues tab
#    Look for "good first issue" or "help wanted" labels

# 2. Create a branch
git checkout -b feat/your-feature-name

# 3. Make your changes
#    - Write clean, readable code
#    - Follow the existing code style
#    - Test your changes locally

# 4. Commit with a clear message
git commit -m "feat: add your feature description"

# 5. Push and create a PR
git push origin feat/your-feature-name
```

### Code Style

- **Components** — Functional components with hooks
- **Naming** — PascalCase for components, camelCase for functions
- **CSS** — Tailwind utility classes (no custom CSS unless necessary)
- **State** — Redux for global state, local state for component-specific data
- **Comments** — Keep code self-documenting; avoid unnecessary comments

### PR Guidelines

1. **One feature per PR** — Keep changes focused
2. **Clear description** — Explain what and why, not just how
3. **Test locally** — Run `npm run dev` and verify your changes
4. **No breaking changes** — Ensure existing functionality works
5. **Update docs** — If adding a feature, update the README if needed

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Roadmap

| Version | Status | Features |
|---------|--------|----------|
| v3.2 | Latest | Auth hardening, onboarding v2, site visits, reviews |
| v3.1 | Released | Security overhaul, recommended properties, premium UI |
| v3.3 | Planned | Performance optimization, unit tests, CI/CD pipeline |
| v4.0 | Planned | Mobile app, real-time chat, advanced analytics |

---

## Support

If you find GoEazy helpful, give it a ⭐ on GitHub — it helps others discover the project.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for Uttarakhand students

**GoEazy** — Simplifying. Seamlessly.

</div>
