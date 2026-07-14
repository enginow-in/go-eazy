# 🏔️ GoEazy

## 📖 Overview

**GoEazy** is a modern, open-source housing platform built to simplify the process of finding verified rental accommodations for students and working professionals in **Uttarakhand**. Born out of the real struggle to find quality housing in **Dehradun** and **Srinagar**, GoEazy removes the dependency on brokers by connecting tenants directly with landlords through a transparent, secure, and user-friendly ecosystem.

The platform is built on a scalable full-stack architecture — **React 19, Vite, Tailwind CSS, Redux Toolkit, Supabase (PostgreSQL + Edge Functions), and Razorpay** — with secure authentication, role-based access control, real-time data management, payment-gated listings, and cloud-based media storage.

What started as a hackathon build is now evolving into a **community-driven open-source initiative**, with an active roadmap focused on documentation, contributor experience, testing, and CI/CD.

---

## 🚀 Mission

Finding a PG or rental room in student hubs like Uttarakhand is often a nightmare of hidden brokers, unverified listings, and inflated fees. GoEazy exists to remove those barriers:

- 🤝 **Broker-Free Transparency** — Direct landlord-to-tenant pipeline, no middlemen.
- 💸 **Micro-Payment Economy** — Pay only for what you use: verified contact details or listing placement.
- ✅ **Quality Benchmarking** — A polished, high-density UI that reflects the standard of living the platform promotes.

---

## 👥 User Roles & Dashboards

GoEazy supports four distinct user roles, each with a dedicated workflow:

| Role | Capabilities |
|---|---|
| **Tenant** | Search & filter listings, request site visits, unlock verified contact details, leave reviews |
| **Landlord** | Publish payment-gated listings, track profile/property analytics, manage portfolio via a dashboard |
| **Service Provider** | Register services, submit documents for verification, get discovered by tenants |
| **System Admin** | Approve/reject service providers, monitor platform-wide telemetry, manage RBAC |

---

## ✨ Key Features

### 🔍 Intelligence-Driven Search
- Real-time, debounced property filtering with minimal API overhead
- Cinematic property galleries powered by Swiper 12 with custom floating navigation
- Adaptive **Grid** and **List** views for discovery vs. management

### 🏠 Landlord Command Center
- **Pay-to-Go-Live**: Secure Razorpay integration (₹199) for listing publication, verified via server-side signature checks
- Real-time profile and property view analytics
- Expandable management dashboard for full portfolio control

### 🔑 System Admin Panel
- Role-Based Access Control (RBAC) with deep-checked, hardened authentication routing
- Built-in verification pipeline for reviewing, approving, or rejecting service provider documents
- Live platform telemetry across users, properties, and service providers

### 🛡️ Trust & Verification
- Site visit booking system integrated into the gated contact flow
- Unified property reviews with automatic rating aggregation and reviewer verification
- Tiered onboarding — tenants complete a preference quiz, landlords/providers route straight to their dashboards

### 💎 Interface & UX
- Zero Layout Shift (ZLS) architecture with skeleton loaders for properties, profiles, and dashboards
- Mobile-first, Instagram/Airbnb-style responsive grid for high information density
- Physics-based scroll and micro-interactions throughout via Framer Motion

---

## 🛠️ Tech Stack

**Frontend**
- React 19 (concurrent rendering)
- Vite 8 build tooling
- Tailwind CSS + Framer Motion
- Redux Toolkit for state management

**Backend**
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- GoTrue authentication with ES256-signed JWTs
- S3-compatible object storage / CDN for property images

**Payments**
- Razorpay, with HMAC (SHA-256) signature verification on every transaction

---

## 🛡️ Security & Architecture

Security is a core design principle, not an afterthought:

- **Zero-Trust Database** — PostgreSQL Row-Level Security (RLS) ensures no user can read, modify, or delete another user's data, even with the record ID.
- **Payment-Gated API** — Property creation is never handled client-side; it's strictly processed through a Supabase Edge Function that verifies the Razorpay HMAC signature and payment status before writing to the database.
- **Tiered Data Access** — Public API responses expose only non-sensitive fields. Sensitive data (coordinates, contact details) is gated behind authorization-checked PostgreSQL RPC functions.
- **JWT Validation** — Sessions are signed with high-entropy ES256 elliptic-curve keys to prevent spoofing.
- **Payment Integrity** — Every Razorpay transaction is cross-verified server-side, including an exact amount check to prevent tampered "zero-payment" payloads.

---

## 🏎️ Performance & Optimization

- **Server-Side Storage Governance** — "Recently Viewed" records are automatically pruned on a 72-hour rolling window via PostgreSQL intervals, keeping the dataset lean.
- **Intelligent Debouncing** — Search input is debounced to minimize redundant API calls.
- **Zero Layout Shift** — Custom skeleton shimmers keep perceived load time low.
- **SEO-Ready** — JSON-LD structured data and optimized favicon/meta setup for search visibility.

---

## 📈 Roadmap

| Version | Highlights |
|---|---|
| **v3.2.0** (Latest) | Global auth gate for search, universal role selection, tiered onboarding, site visit booking, unified reviews system |
| **v3.1.0** | Zero-trust frontend data model, secure RPC gating for sensitive fields, "Recommended for You" slider, gallery overhaul |
| **v2.4** | Swiper navigation fixes, pricing transparency labels, lighter image uploads (1–3 photos, 7MB cap) |
| **v2.3** | Mapbox integration with payment-gated map access, role persistence fix for Google Sign-in, telemetry cleanup |
| **v2.2** | System Admin dashboard, hardened RBAC, service provider approvals, full Uttarakhand localization |
| **v2.0** | Monetized listing flow, dashboard redesign, content protection layer |
| **v1.2** | Landlord analytics, full SEO branding |

### What's Next
GoEazy is moving toward a community-first open-source model. Upcoming priorities:

- 📚 Improved setup docs & contributor onboarding
- 🧪 Automated testing (unit + integration)
- ⚙️ GitHub Actions CI/CD workflows
- 🧱 Refactored, more modular project architecture
- 🏷️ Beginner-friendly `good first issue` labels

---

## 🚀 Getting Started

```bash
# 1. Fork and clone the repository
git clone https://github.com/<your-username>/goeazy.git
cd goeazy

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Add your Supabase URL/keys, Razorpay keys, and Mapbox token

# 4. Run the development server
npm run dev
```

> **Note:** You'll need a [Supabase](https://supabase.com) project (PostgreSQL + Edge Functions) and a [Razorpay](https://razorpay.com) account to run the full feature set locally.

---

## 🤝 Contributing

GoEazy is part of the **Enginow Open Source Program** — helping students learn real-world software development by contributing to production-grade projects.

**What you'll practice:** React · Next.js · TypeScript · Node.js · MongoDB · REST APIs · Git & GitHub · UI/UX · Testing

**Who can contribute:** Students, developers, designers, and technical writers — everyone is welcome.

### How to Contribute
1. Fork the repository
2. Clone your fork locally
3. Install dependencies
4. Create a feature branch (`git checkout -b feature/your-feature`)
5. Make your changes
6. Submit a Pull Request with a clear description

Please open an issue first for significant changes so we can discuss the approach.

---

## 📄 License

This project is open source under the **MIT License**.

---

**© 2026 GoEazy Plateform
*Simplifying. Seamlessly.* ❤️