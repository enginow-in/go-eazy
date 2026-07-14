1. Fork the repository.

2. Clone your fork.

3. Create a new branch.

git checkout -b feature/login-page

4. Commit changes.

5. Push.

6. Open a Pull Request.

# Contributing to GoEazy

Thank you for your interest and giving us the opportunity in contributing to GoEazy! This guide will help you understand our workflow and standards.

---

## Getting Started

### 1. Fork the Repository

```bash
# Fork at https://github.com/enginow-in/go-eazy
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/go-eazy.git
cd go-eazy
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linter (before every commit)
npm run lint

# Build for production
npm run build
```

### 3. Create a Feature Branch

Use this naming convention:

```bash
# Format: feature/issue-#NUMBER-brief-description
git checkout -b feature/issue-#42-dark-mode-toggle

# Other prefixes:
# - fix/issue-#123-auth-modal-overflow
# - refactor/issue-#456-extract-useAuth-hook
# - docs/issue-#789-security-md-update
# - chore/issue-#999-bump-vite-8.1
```

**Why this matters**: 
- Links commits to GitHub issues
- Enables automated release notes
- Makes code review history searchable

---

## Commit Message Standards (Conventional Commits)

Every commit should follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- `feat:` — New feature (e.g., dark mode, payment flow)
- `fix:` — Bug fix (e.g., RLS bypass, auth modal)
- `refactor:` — Code restructuring without changing behavior
- `docs:` — Documentation updates (README, SECURITY.md, etc.)
- `test:` — Add or update tests
- `chore:` — Dependencies, build config, no functional change
- `perf:` — Performance optimization

### Examples:

**Good:**
```
feat(auth): add role persistence in user_metadata

- Implement role survival across Google Sign-in redirects
- Test with AuthGateModal role selection flow
- Fixes authorization bypass in ProtectedRoute
```

**Good:**
```
fix(payment): add amount cross-check in razorpay webhook verification

- Validate exact ₹199.00 amount before database write
- Prevent zero-payment tampering exploit
- Added HMAC signature validation testing in SECURITY.md
```

**Avoid:**
```
updated files
fixed stuff
asdf
```

### Commit Message Checklist:
- [ ] Type is one of: feat, fix, refactor, docs, test, chore, perf
- [ ] Scope is clear (e.g., `(auth)`, `(property)`, `(payment)`)
- [ ] Subject is lowercase and imperative ("add", not "adds" or "added")
- [ ] Subject under 50 characters
- [ ] Body explains *why*, not *what*
- [ ] References issue number: `Fixes #123` or `Closes #456`

---

## Pull Request Standards

### Before You Push

1. **Run linter** — Fix all errors
   ```bash
   npm run lint
   ```

2. **Test mobile responsiveness** — Use Chrome DevTools (375px viewport)
   ```
   - Search page: 2-column grid intact
   - Property detail: images swipe smoothly
   - Auth modal: form readable on small screens
   ```

3. **Check console hygiene** — No red/yellow warnings (except Vite notices)
   ```javascript
   // ✓ Good: index.html filters these
   console.warn('vite hmr')
   
   // ✗ Bad: commit with these
   console.log('debug here!')
   ```

4. **Verify no secrets committed**
   ```bash
   # These should be in .env (gitignored), NOT in code
   - SUPABASE_URL
   - SUPABASE_KEY
   - RAZORPAY_KEY
   - MAPBOX_TOKEN
   ```

5. **Test on your branch locally**
   ```bash
   npm run build
   npm run preview
   # Verify no TypeScript or build errors
   ```

### Opening a Pull Request

1. Push your branch:
   ```bash
   git push origin feature/issue-#42-dark-mode-toggle
   ```

2. Go to GitHub and click "New Pull Request"
   - **Base**: `enginow-in/go-eazy:main`
   - **Compare**: `YOUR_USERNAME/go-eazy:feature/issue-#42-dark-mode-toggle`

3. Use this template:

```markdown
## Summary
[One sentence explaining what this PR does and why it matters]

## Changes
- ✅ Added dark mode toggle to settings
- ✅ Updated Tailwind config with darkMode: 'class'
- ✅ Tested brand colors in dark theme

## Testing
- [x] Tested on mobile (375px) — responsive grid preserved
- [x] Tested on desktop (1440px) — no layout shift
- [x] Ran `npm run lint` — no errors
- [x] No console warnings
- [x] No secrets in code

## Security Checklist (if applicable)
- [x] RLS policies tested (if database-related)
- [x] HMAC signatures verified (if payment-related)
- [x] Authentication flow tested (if auth-related)
- [x] No hardcoded secrets

## Related Issues
Fixes #42
Closes #123 (if any other issues)

## Screenshots (optional)
[Paste mobile/desktop screenshots if UI changed]
```

---

## Security Best Practices for Contributors

GoEazy handles sensitive data (user profiles, payment info, property locations). Review our [SECURITY.md](./SECURITY.md) before contributing to:

- **Auth flows**: RoleSelectionModal, ProtectedRoute, useAuth hook
- **Payment flows**: Razorpay webhook verification, Edge Functions
- **Database**: Any Supabase RLS policy changes
- **User data**: Property details, contact info, saved listings

### Checklist:

- [ ] Read SECURITY.md (Critical Security Surfaces section)
- [ ] Test RLS policies in Supabase console (if database change)
- [ ] Verify HMAC signature validation (if payment change)
- [ ] No hardcoded API keys or secrets
- [ ] Check for XSS vulnerabilities in form inputs
- [ ] Ensure console.log statements don't expose sensitive data

---

## Code Style & Conventions

### React Components

```jsx
// ✓ Good: Functional component with hooks
export const PropertyCard = ({ property, onFavorite }) => {
  const [liked, setLiked] = useState(false)

  return (
    <div className="p-4 rounded-xl border">
      {/* Content */}
    </div>
  )
}

// ✗ Avoid: Class components (unless absolutely necessary)
class PropertyCard extends React.Component { }
```

### Styling

```jsx
// ✓ Use Tailwind utilities first
<div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow" />

// ✓ For complex logic, use @apply in index.css
.card-hover {
  @apply p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow;
}

// ✗ Avoid inline styles
<div style={{ padding: '16px', borderRadius: '8px' }} />
```

### Redux State

```javascript
// ✓ Good: Clear slice structure
const propertySlice = createSlice({
  name: 'property',
  initialState: { listings: [], filters: {} },
  reducers: {
    setListings: (state, action) => {
      state.listings = action.payload
    },
  },
})

// ✗ Avoid: Nested deeply; use normalized state
// state.ui.search.results.properties[0].owner.profile.role
```

---

## Testing

While GoEazy doesn't have automated tests yet, manual testing is required:

### Manual Test Checklist

- [ ] Feature works on mobile (375px)
- [ ] Feature works on tablet (768px)
- [ ] Feature works on desktop (1440px)
- [ ] No console errors/warnings
- [ ] Form validation works
- [ ] API calls succeed (check Network tab)
- [ ] Loading states render correctly

### Common Test Paths

1. **Auth flow**: Sign up → Role selection → Dashboard
2. **Property search**: Filter by city → Sort by price → View detail
3. **Payment**: Landlord posts property → Pays ₹199 via Razorpay → Property goes live
4. **Role switching**: Sign in as tenant → Switch role in settings → See landlord dashboard

---

## Common Issues & Solutions

### Issue: ESLint errors prevent commit

```bash
# Run linter with --fix to auto-correct
npm run lint -- --fix

# If still failing, review the specific rule in eslint.config.js
# (Check security and jsx-a11y rules for new warnings)
```

### Issue: Vite build fails with "Cannot access X before initialization"

This is a known issue with Mapbox GL (circular dependencies). Solution:
- Don't import Mapbox in component files
- Load Mapbox via CDN in `index.html` (already done)
- Use `window.mapboxgl` instead

### Issue: TypeScript errors in production build

```bash
# TypeScript is configured in tsconfig.json
# For now, ignore in .eslintignore if not critical
# But report it so we can add type safety later
```

---

## Contributor Recognition

Once your PR is merged:
- You'll be added to the Contributors list on GitHub
- Credited in release notes: `v3.2.1 — Fixes X (thanks @your-username!)`

---

## Questions?

- Check [SECURITY.md](./SECURITY.md) for vulnerability reporting
- Open an issue with your question
- Join the Enginow community on Discord/Slack

Thank you for making GoEazy better! 🚀
