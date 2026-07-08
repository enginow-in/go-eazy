# Contributing to GoEazy (Beginner-Friendly)

Thanks for taking the time to contribute to **GoEazy**! ❤️

GoEazy is a real-estate web application built with:
- **React 19**
- **Vite**
- **Redux Toolkit**
- **Tailwind CSS**
- **Supabase** (Postgres + RLS + Edge Functions)

This guide is designed to help first-time contributors get set up quickly and submit a high-quality Pull Request.

---

## Table of Contents
1. How to contribute
2. Fork & clone
3. Set up local development
4. Environment variables (Supabase)
5. Branch naming conventions
6. Make changes
7. Commit message best practices
8. Submit a Pull Request
9. What happens next

---

## 1) How to contribute
You can contribute in many ways:
- Fix a bug or UI issue
- Improve documentation
- Refactor a part of the codebase (carefully)
- Add features (if a good issue exists for it)
- Improve accessibility or performance

Before starting, it’s often helpful to comment on the related GitHub **Issue** (if there is one) so we can coordinate.

---

## 2) Fork & clone
### Fork the repo
1. Open the repository on GitHub.
2. Click **Fork**.

### Clone your fork
Run:

```bash
git clone https://github.com/<your-username>/go-eazy.git
cd go-eazy
```

### Add the upstream remote (recommended)
This keeps you in sync with the main repo:

```bash
git remote add upstream https://github.com/enginow-in/go-eazy.git
```

---

## 3) Set up local development
### Install dependencies
```bash
npm install
```

### Start the dev server
```bash
npm run dev
```

Then open the URL shown in your terminal (usually `http://localhost:5173`).

### Build (optional)
```bash
npm run build
```

### Lint (optional)
```bash
npm run lint
```

> Note: ESLint availability can depend on your local environment. If `npm run lint` fails due to missing tooling, just ensure your code still passes TypeScript/React runtime checks and keep changes small and clean.

---

## 4) Environment variables (Supabase)
The frontend connects to Supabase using values like:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Create a `.env` file in the project root:

```bash
# .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If you don’t have these yet, you may still be able to run the UI with fallback/mock behavior, but real data access will require proper Supabase credentials.

---

## 5) Branch naming conventions
Branch names make it easy for maintainers to understand what you’re doing.

Use one of these prefixes:
- `feature/` — a new feature
- `bugfix/` — a bug fix
- `hotfix/` — urgent fix (prod issues)
- `docs/` — documentation-only changes
- `refactor/` — non-functional code cleanup
- `test/` — tests
- `chore/` — build/config/maintenance

Examples:
```bash
git checkout -b feature/login-page
git checkout -b bugfix/property-filters
git checkout -b docs/update-readme
```

Keep branch names short and descriptive.

---

## 6) Make changes
### Keep PRs focused
Smaller PRs are easier to review.

### Follow existing patterns
This repo already uses:
- React components under `src/components/`
- route pages under `src/pages/`
- hooks under `src/hooks/`
- Redux slices under `src/store/`
- Supabase logic under `supabase/`

### Test the UI flow you touched
Before submitting, verify:
- the page loads
- inputs/forms work
- navigation works
- no obvious console errors

---

## 7) Commit message best practices
Use clear, readable commit messages.

A simple convention:
- `feat: add ...`
- `fix: resolve ...`
- `docs: update ...`
- `chore: update ...`

Example:
```bash
git commit -m "fix: handle empty search results"
```

---

## 8) Submit a Pull Request
1. Push your branch:

```bash
git push origin <branch-name>
```

2. Open a PR on GitHub:
- base branch: typically `main`
- compare branch: your new branch

3. Fill out the PR template (if present) including:
- What you changed
- Why you changed it
- Screenshots (for UI changes)
- How you tested it

---

## 9) What happens next
After you submit:
- maintainers review your PR
- you may receive feedback or requests for changes
- once approved, it may be merged

Thank you again for contributing—your work helps make GoEazy better for the community. 🏔️

