# Contributing to GoEazy

Thank you for your interest in contributing to GoEazy! This guide will help you get started quickly.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Need Help?](#need-help)

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Git** installed and configured
- A GitHub account

## Development Setup

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/go-eazy.git
cd go-eazy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous key |
| `VITE_RAZORPAY_KEY_ID` | No | Razorpay public key (for payment features) |

> **Note:** The app runs with mock data if Supabase credentials are missing. You can develop most UI features without a Supabase account.

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Verify Your Setup

```bash
npm run lint    # Check for linting errors
npm run build   # Verify production build works
```

## Project Structure

```
go-eazy/
├── public/                 # Static assets (favicon, images)
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication components (AuthModal, ProtectedRoute)
│   │   ├── common/         # Shared components (ErrorBoundary, ScrollToTop)
│   │   ├── home/           # Home page components
│   │   ├── layout/         # Layout, Navbar, Footer
│   │   ├── map/            # Map-related components
│   │   ├── property/       # Property cards, forms, details
│   │   ├── services/       # Service provider components
│   │   ├── ui/             # Reusable UI primitives (Button, Modal, Input)
│   │   └── legal/          # Legal page components
│   ├── hooks/              # Custom React hooks (useAuth, useProperties)
│   ├── lib/                # Third-party client configs (Supabase)
│   ├── pages/              # Route-level page components
│   ├── store/              # Redux Toolkit slices
│   ├── utils/              # Helpers, constants
│   ├── App.jsx             # Root component with routing
│   ├── main.jsx            # Entry point
│   └── i18n.js             # Internationalization config (EN/HI)
├── supabase/               # Supabase config, migrations, edge functions
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json
```

For a deeper dive, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Making Changes

### Branch Naming Convention

Use descriptive branch names with these prefixes:

| Prefix | Use For | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/dark-mode` |
| `fix/` | Bug fixes | `fix/search-pagination` |
| `docs/` | Documentation | `docs/api-reference` |
| `refactor/` | Code refactoring | `refactor/property-hooks` |
| `ci/` | CI/CD changes | `ci/add-testing-pipeline` |
| `style/` | UI/styling only | `style/mobile-navbar` |

### Workflow

```bash
# 1. Create a feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. Make your changes

# 3. Stage and commit (follow conventional commits)
git add -A
git commit -m "feat: add dark mode toggle to settings page"

# 4. Push to your fork
git push origin feature/your-feature-name

# 5. Open a Pull Request on GitHub
```

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `ci`, `chore`

## Coding Standards

### JavaScript/React
- Use **functional components** with hooks (no class components except ErrorBoundary)
- Use **named exports** for page and component files
- Prefer **arrow functions** for component definitions
- Use React's `lazy()` and `Suspense` for new page-level components

### Styling
- Use **Tailwind CSS** utility classes (no inline styles or CSS modules)
- Follow the existing design tokens in `tailwind.config.js`
- Brand color: `#CA3433` (Persian Red)
- Font: Plus Jakarta Sans / Sora

### State Management
- **Redux Toolkit** for global state (auth, properties, services, UI)
- **React Hook Form + Zod** for form state and validation
- **Local state** (`useState`) for component-level UI state

### File Naming
- Components: `PascalCase.jsx` (e.g., `PropertyCard.jsx`)
- Hooks: `camelCase.js` with `use` prefix (e.g., `useProperties.js`)
- Utils: `camelCase.js` (e.g., `helpers.js`)

## Pull Request Process

1. Ensure your code passes `npm run lint` and `npm run build`
2. Write a clear PR description explaining **what** and **why**
3. Include screenshots/recordings for UI changes
4. Link related issues if applicable
5. Keep PRs focused — one feature/fix per PR
6. Respond to review comments promptly

## Need Help?

- Check existing [Issues](https://github.com/enginow-in/go-eazy/issues) for context
- Look at [Pull Requests](https://github.com/enginow-in/go-eazy/pulls) for contribution examples
- Read the [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details

---

Happy Contributing ❤️
