# Contributing to GoEazy

Thank you for helping improve GoEazy, the housing and local-services platform for Uttarakhand. Contributions are welcome from developers, designers, testers, and technical writers.

## Before you start

1. Search existing [issues](https://github.com/Devx2107/go-eazy/issues) and pull requests before opening a new one.
2. For security vulnerabilities, do not open a public issue. Follow [SECURITY.md](SECURITY.md).
3. For substantial changes, open an issue first so the scope and approach can be agreed before implementation.

## Local setup

Requirements:

- Node.js 20 or newer
- npm
- A Supabase project for database and Edge Function work

```bash
git clone https://github.com/Devx2107/go-eazy.git
cd go-eazy
npm install
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
npm run dev
```

Set the Vite variables in `.env.local` before using authenticated, map, or payment flows:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MAPBOX_TOKEN=your_mapbox_public_token
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_REDIRECT_URL=http://localhost:5173
```

Never put Supabase service-role keys, Razorpay secrets, webhook secrets, or other private credentials in a `VITE_` variable or committed file. Those belong in Supabase Edge Function secrets.

## Branches and commits

Start from the latest `main` branch and use a focused branch:

```bash
git switch main
git pull origin main
git switch -c fix/short-description
```

Use a clear, imperative commit subject. Conventional prefixes are encouraged:

- `fix:` for a bug or security correction
- `feat:` for a user-facing feature
- `docs:` for documentation
- `test:` for tests
- `refactor:` for behavior-preserving code changes

Keep one issue or cohesive change per branch and pull request. Avoid mixing formatting churn or unrelated refactors into a feature or fix.

## Project conventions

- React components use JSX and live under `src/components` or `src/pages`.
- Shared state belongs in Redux slices under `src/store`; server access belongs in hooks or Supabase Edge Functions.
- Treat the browser as untrusted. Sensitive data, payment verification, authorization, and service-role operations must be enforced server-side with RLS, RPCs, or Edge Functions.
- Add database changes as a new ordered migration under `supabase/migrations`; do not rewrite an already-applied migration.
- Keep user-facing text accessible and responsive on mobile. Reuse existing UI components and styling conventions where possible.
- Avoid logging tokens, payment payloads, contact details, or other sensitive data.

## Supabase changes

For a migration:

```bash
supabase db push
```

For an Edge Function:

```bash
supabase functions deploy <function-name>
supabase secrets set KEY_NAME=value
```

Document any new secret, migration prerequisite, RLS policy, or deployment step in the pull request. Test both the authorized and unauthorized paths for security-sensitive changes.

## Validation before opening a PR

Run the checks relevant to your change:

```bash
npm run lint
npm run build
```

For database work, also review the migration SQL and test it against a development Supabase project. For UI work, test loading, empty, error, authenticated, and mobile states where applicable.

## Pull requests

Push your branch and open a pull request against `main`:

```bash
git push -u origin fix/short-description
```

Use the repository pull-request template when available. A good PR should include:

- A concise summary of the problem and solution.
- The issue number, using `Fixes #123` or `Closes #123` when appropriate.
- The files or systems changed.
- Validation commands and their results.
- Screenshots or a short recording for visual changes.
- Migration, secret, deployment, or rollback notes when relevant.

Keep the PR reviewable, respond to feedback, and update the branch if `main` changes. Do not force-push after review unless the team has agreed to it.

## Reporting issues

Use the issue templates to report a reproducible bug or propose a focused feature. Include the affected route/file, reproduction steps, expected and actual behavior, environment details, and screenshots or logs with secrets removed.

By contributing, you agree to follow the project [Code of Conduct](CODE_OF_CONDUCT.md).
