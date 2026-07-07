# Contributing to Go-Eazy

First off, thank you for considering contributing to **Go-Eazy**! It's people like you that make this project great. We welcome contributions from everyone, whether it's bug reports, feature requests, or code contributions.

The following is a set of guidelines for contributing to Go-Eazy. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🚀 Getting Started

1. **Fork the Repository**: Start by forking the repository to your own GitHub account.
2. **Clone the Repo**: Clone your forked repository to your local machine.
   ```bash
   git clone https://github.com/your-username/go-eazy.git
   cd go-eazy
   ```
3. **Add Upstream**: Add the original repository as an upstream remote to keep your fork synced.
   ```bash
   git remote add upstream https://github.com/original-owner/go-eazy.git
   ```

## 🛠 Development Workflow

1. **Create a Branch**: Always create a new branch for your work. Use descriptive names like `feature/login-page` or `bugfix/header-alignment`.
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make Changes**: Write your code, following the project's coding standards. Ensure that your changes do not break existing functionality.
3. **Test Your Code**: If applicable, run tests to verify your changes. Add new tests for new features.
4. **Commit Changes**: Write clear, concise commit messages.
   ```bash
   git commit -m "feat: add user authentication layout"
   ```

## 🔄 Pull Request Process

1. **Sync with Upstream**: Before pushing, ensure your branch is up-to-date with the main repository.
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
3. **Open a PR**: Go to the original repository on GitHub and open a Pull Request. Provide a clear description of the problem you are solving and the changes you have made.
4. **Review**: The maintainers will review your PR, request changes if necessary, and finally merge it.

## 📝 Code Style & Standards

- **Consistency**: Keep the code consistent with the surrounding files.
- **Linting**: Ensure there are no ESLint or Prettier warnings before submitting your code.
- **Documentation**: Update the README or other relevant documentation if you change functionality.

We appreciate your time and effort. Happy coding! 🎉
