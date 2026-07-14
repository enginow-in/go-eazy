# Contributing to GoEazy

Thank you for your interest in contributing to GoEazy!

We welcome contributions from students, developers, designers, and technical writers. Please follow the steps below to contribute effectively.

---

# Prerequisites

Before contributing, make sure you have:

- Git
- Node.js (v20 or later recommended)
- npm
- A GitHub account
- A Supabase account (for backend features)

---

# Contribution Workflow

## 1. Fork the Repository

Click the **Fork** button on GitHub to create your own copy of the repository.

---

## 2. Clone Your Fork

```bash
git clone https://github.com/<your-github-username>/go-eazy.git
```

Navigate to the project directory:

```bash
cd go-eazy
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Configure Environment Variables

Create a `.env` file in the project root.

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

These values are available in:

**Supabase Dashboard → Settings → API**

---

## 5. Start the Development Server

```bash
npm run dev
```

---

## 6. Create a New Branch

Never work directly on the `main` branch.

Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

Examples:

```bash
git checkout -b docs/update-readme
```

```bash
git checkout -b fix/navbar-overflow
```

```bash
git checkout -b feature/login-validation
```

---

## 7. Make Your Changes

- Keep changes focused on one issue or feature.
- Follow the existing project structure.
- Test your changes locally before committing.

---

## 8. Commit Your Changes

Stage your changes:

```bash
git add .
```

Commit using a clear and descriptive message:

```bash
git commit -m "docs: improve README setup guide"
```

Examples:

```text
docs: improve installation guide

fix: resolve mobile navbar issue

feat: add password validation
```

---

## 9. Push Your Branch

```bash
git push origin <branch-name>
```

Example:

```bash
git push origin docs/update-readme
```

---

## 10. Open a Pull Request

1. Open your fork on GitHub.
2. Click **Compare & Pull Request**.
3. Provide a clear title and description.
4. Submit the Pull Request for review.

---

# Pull Request Guidelines

- Keep each Pull Request focused on a single change.
- Write meaningful commit messages.
- Ensure the project builds successfully.
- Update documentation if required.
- Be responsive to review feedback.

---

# Reporting Issues

When opening an issue, please include:

- A clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)

---

# Code of Conduct

Please be respectful and constructive in all discussions and code reviews.

---

Thank you for contributing to GoEazy! 🎉