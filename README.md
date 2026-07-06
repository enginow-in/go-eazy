# GoEazy | The Housing Standard for Uttarakhand 🏔️

**GoEazy** is a premium, high-performance real estate ecosystem tailored for students and professionals. Born out of the struggle to find quality housing in Dehradun and Srinagar, it combines a **Red Dot award-tier aesthetic** with **industrial-grade engineering**.

---

## 🚀 The Mission: Solving the Student Housing Crisis

In student hubs like Uttarakhand, finding a PG or Room is often a nightmare of hidden brokers and unverified listings. **GoEazy** was built to destroy these barriers:
- **Broker-Free Transparency**: Direct landlord-to-student pipeline.
- **Micro-Payment Economy**: Pay only for what you need (verified contacts or listing placement).
- **Quality Benchmarking**: High-definition UI that reflects the quality of living standards we aim to provide.

---

## 🏆 Production-Grade & Scalable

While built for a hackathon, GoEazy is engineered to handle real-world traffic:
- **Cloud-Native**: Fully serverless architecture using Supabase (Edge Functions + PostgreSQL).
- **Edge Deployment**: Latency-optimized global delivery for images and assets.
- **Industrial RLS**: Row Level Security policies that can scale to millions of users without security leaks.

---

## ✨ The Experience

### 🔍 Intelligence-Driven Search
- **Zero-Latency Discovery**: Real-time property filtering powered by a high-performance debounced search engine.
- **Cinematic Sliders**: High-definition property galleries using **Swiper 12** with brand-exclusive, floating navigation icons.
- **Adaptive Layouts**: Switch between a dense **Management List** and a visual **Discovery Grid** seamlessly.

### 🏠 Landlord Command Center (v2.0)
- **Pay-to-Go-Live**: Secure **Razorpay** integration (₹199) for property listings with real-time payment verification.
- **Insight Tracking**: Real-time profile and property view analytics.
- **Professional Dashboard**: Smart 2-card preview grid with an expandable **Management List View** for full portfolio control.
- **Persian Red Success Pipeline**: Physics-backed animations and verified listing notifications.

### 🔑 Master System Admin Panel (v2.2)
- **Role-Based Access Control**: Hardened authentication preventing unauthorized access via intelligent deep-checks and seamless routing.
- **Service Verification Pipeline**: Built-in review system to verify, reject, and inspect documents of local service providers securely.
- **Live Platform Metrics**: Real-time telemetry governing platform health across Users, Properties, and Service Providers.

### 🛡️ Content Integrity & Security
- **Anti-Copy Engine**: Global protection against text selection and unauthorized content scraping.
- **Image Theft Protection**: Disabled right-click, image dragging, and context menus globally.
- **Developer Shield**: Hard-blocked developer tools (`F12`), "View Source" (`Ctrl+U`), and page saving (`Ctrl+S`).

## 💎 Luxury UX & Interface Design

User experience is the core of GoEazy. We've implemented several "Premium-Only" design patterns to ensure the platform feels alive and responsive:

- **Zero Layout Shift (ZLS) Architecture**: Custom skeleton loaders for properties, profiles, and dashboards ensure that the UI never "jumps" as data loads.
- **Mobile-First Responsive Grid**: A smart 2-column mobile layout that mimics high-end native apps like Instagram and Airbnb, providing 2x the information density on small screens.
- **Micro-Interaction Suite**: 
  - **Physics-Based Scroll**: Smooth category scrolling and scroll-to-top navigation.
  - **Brand-Exclusive Sliders**: Custom-engineered navigation buttons for property images.
  - **Dynamic Toggles**: Seamless switching between "Preview" and "Management" modes in the Landlord dashboard.
- **Console Hygiene**: A patched Vite runtime and global console filters ensure that even "under the hood," the project feels professional and production-ready.
- **Optimized Navigation**: Smart redirection patterns that preserve context and reduce "Auth-Walls" for renters.

---

## 🛠️ Performance Engineering (Tech Stack)

### The Frontend Engine
- **React 19 Core**: Leveraging the latest concurrent rendering features for 60FPS UI interactions.
- **Vite 8 Runtime**: Near-instant module replacement with a custom **Log-Silencing Plugin** for a clean development experience.
- **Tailwind + Framer Motion**: A custom design system fused with physics-based animations for a truly fluid "Premium" feel.

### The Backend Infrastructure (Supabase)
- **PostgreSQL Power**: Robust data integrity and complex relational mapping for property metadata.
- **GoTrue Security**: Military-grade JWT authentication (ES256) with custom **Edge Functions** for secure payment verification.
- **S3-Compatible Storage**: Distributed CDN for global HD property image delivery.

---

## 🛡️ Security & Architecture

### Backend Gating (Supabase + Edge Functions)
- **Zero-Trust Database**: Powered by **PostgreSQL Row Level Security (RLS)**. No user can read, modify, or delete another user's property data, even if they have the ID.
- **Payment-Gated API**: Property creation is **not allowed directly** via the client. It is strictly gated behind a secure Supabase Edge Function that verifies the **Razorpay HMAC Signature** and payment status before touching the database.
- **ES256 JWT Validation**: Using high-entropy Elliptic Curve signatures for user session validation, ensuring sessions cannot be spoofed.

### Content Protection Engine
- **Anti-Scraping Layer**: Global selection disabling and context-menu blocking to prevent automated or manual content theft.
- **Developer Shield**: Active monitoring and blocking of `F12`, `Ctrl+Shift+I/J/C`, and `Ctrl+U` to keep the underlying structure secure from casual inspection.
- **No-Drag Implementation**: Images are locked from browser native drag-and-drop to prevent easy local saving.

### Payment Integrity
- **HMAC Verification**: Every transaction is cross-verified on the server using `SHA-256` HMAC signatures provided by Razorpay.
- **Amount Cross-Check**: The backend verifies the exact payment amount (₹199.00) against the Razorpay API to prevent "Zero-Payment" payload tampering.

---

## 🏎️ Smart Optimizations

- **Server-Side Storage Governance**: Implemented an automated pruning mechanism for "Recently Viewed" data. Records are strictly maintained on a 72-hour rolling window via PostgreSQL intervals, ensuring zero database bloat and maintaining high-performance query execution for the User Dashboard.
- **Intelligent Debouncing**: Drastically reduced API overhead by optimizing search persistence.
- **Zero Layout Shift (ZLS)**: Custom-engineered skeleton shimmers ensure the UI feels loaded even before the data arrives.
- **SEO & Search Visibility**: Built-in JSON-LD schemas and high-resolution favicon systems for top-tier Google Search presentation.

---

## 📈 Roadmap & Versions
- **v3.2.0 (Latest)**: 🔐 **Major Release: Authentication Hardening & Onboarding v2**:
  - **Forced Auth Modal**: Implemented a global authentication gate for search results to ensure only registered users can access platform data.
  - **Universal Role Selection**: All new users (Google & Email) are now prompted for a role upon first login.
  - **Tiered Onboarding**: Redesigned the onboarding quiz to trigger exclusively for Tenants, while Landlords and Service Providers are routed directly to their specialized dashboards.
  - **Site Visit Booking**: New interactive visit request system integrated into the gated contact flow.
  - **Unified Reviews System**: Property-specific ratings and reviews with automatic average calculation and reviewer verification.
  - **UX Refinement**: Cleaned Dashboard interface with optimized notification positioning and box-less icon aesthetic.
- **v3.1.0**: 🛡️ **Major Release: Security Hardening & UI Overhaul**:
  - **Tiered Data Access**: Implemented a "Zero-Trust" frontend model. Restricted all public API fetches to non-sensitive fields to prevent scraping via browser dev tools.
  - **Secure RPC Gating**: Sensitive information (Latitude, Longitude, Contact Details) is now strictly gated behind PostgreSQL RPC functions that verify user authorization/payment before retrieval.
  - **Recommended for You**: Intelligence-driven horizontal slider on the Search page for personalized property discovery.
  - **Premium UI Restoration**: Re-engineered the Property and Service detail galleries with Swiper 12 and brand-exclusive "Floating" navigation.
- **v2.4**: 🎨 **UI Enhancement & Stability Release**:
  - **Swiper Engine Fix**: Resolved navigation button collisions on Property and Service details.
  - **Pricing Transparency**: Explicit "Pay ₹9 to Unlock Details" button labels and "/ month" form indicators.
  - **Lighter Uploads**: Updated image limits to 1-3 photos with a 7MB size restriction for better performance.
  - **Console Hygiene**: Hard-blocked Chrome `aria-labelledby` and state-persistence warnings.
- **v2.3**: 🚀 **Map Gating & Auth Persistence**: 
  - Integrated secure **Mapbox location tracking** with native map gating behind ₹9 micro-transactions.
  - Role persistence in `user_metadata` to fix Google Sign-in role loss gaps.
  - Swept app telemetry and optimized Canvas `willReadFrequently` performance.
- **v2.2**: 🔐 **Major Release**: 
  - System Admin Dashboard, Hardened RBAC Security, and Service Provider approvals.
  - Complete backend & frontend Uttarakhand Localization.
  - Implemented dynamic Bento-style admin cards for analytics and approval queue.
  - Optimized the SystemAdmin dashboard with GoEazy Light Theme and mobile-first horizontal scrolling stats.
- **v2.0**: 🚀 **Major Release**: Monetized Listing Flow, Dashboard Redesign, and Advanced Content Protection.
- **v1.2**: Landlord Analytics update and Full SEO Branding.

---
# Enginow Open Source Program

Welcome to the Enginow Open Source Program!

Our mission is to help students learn software development by contributing to real-world projects.

Whether you're a beginner or an experienced developer, there's something for everyone.

## What You'll Learn

- React
- Next.js
- TypeScript
- Node.js
- MongoDB
- APIs
- Git & GitHub
- UI/UX
- Testing

## Who Can Contribute?

Everyone.

Students
Developers
Designers
Technical Writers

## Getting Started

1. Fork the repository
2. Clone it
3. Install dependencies
4. Create a new branch
5. Make changes
6. Submit a Pull Request

Happy Contributing ❤️

--

© 2026 GoEazy Platform. **Simplifying. Seamlessly.**
