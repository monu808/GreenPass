# Contributing to GreenPass 🌿

First off, **thank you** for considering contributing to GreenPass! Every contribution, no matter how small, helps us build a more sustainable tourism ecosystem for India's fragile Himalayan regions.

This document provides guidelines and instructions for contributing to the project.  Please take a moment to review this before submitting your contribution.

---

## 📜 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Coding Standards](#-coding-standards)
- [Commit Message Guidelines](#-commit-message-guidelines)
- [Pull Request Process](#-pull-request-process)
- [Reporting Bugs](#-reporting-bugs)
- [Suggesting Features](#-suggesting-features)
- [Community](#-community)

---

## 📖 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background, identity, or experience level. 

### Expected Behavior

- **Be respectful** and considerate in all interactions
- **Be collaborative** and open to feedback
- **Be constructive** when providing criticism
- **Focus on what's best** for the community and project

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or inflammatory language
- Trolling or deliberate disruption
- Publishing private information without consent

**Violations** may result in removal from the project.  Report issues to the maintainers. 

---

## 🤝 How Can I Contribute? 

There are many ways to contribute to GreenPass:

### 1. **Code Contributions**
- Fix bugs or implement new features
- Improve performance or refactor code
- Write tests to increase coverage

### 2. **Documentation**
- Improve README, setup guides, or API docs
- Create tutorials or how-to guides
- Translate documentation into regional languages

### 3. **Design & UX**
- Suggest UI/UX improvements
- Create mockups or wireframes
- Improve accessibility

### 4. **Testing**
- Report bugs with detailed reproduction steps
- Test new features and provide feedback
- Write automated tests (unit, integration, e2e)

### 5. **Community Support**
- Answer questions in Discussions or Issues
- Help onboard new contributors
- Share the project on social media

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18.x or higher
- **npm** 9.x or **yarn** 1.22.x
- **Git** installed
- A **GitHub account**
- A **Supabase account** (free tier is sufficient)

### Fork & Clone

1. **Fork the repository** to your GitHub account

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/GreenPass.git
   cd GreenPass
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/monu808/GreenPass.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.example .env. local
   ```
   
   Add your Supabase credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Verify the setup** by opening [http://localhost:3000](http://localhost:3000)

---

## 🔄 Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work: 

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or for bug fixes
git checkout -b fix/bug-description
```

**Branch Naming Conventions:**
- `feature/` - New features (e.g., `feature/payment-integration`)
- `fix/` - Bug fixes (e.g., `fix/registration-form-validation`)
- `docs/` - Documentation updates (e.g., `docs/api-documentation`)
- `refactor/` - Code refactoring (e.g., `refactor/auth-context`)
- `test/` - Adding tests (e.g., `test/dashboard-unit-tests`)

### 2. Make Your Changes

- Write clean, readable code following our [Coding Standards](#-coding-standards)
- Test your changes thoroughly
- Add comments for complex logic
- Update documentation if needed

### 3. Test Locally

```bash
# Run linting
npm run lint

# Build the project
npm run build

# Test the production build
npm start
```

### 4. Commit Your Changes

Follow our [Commit Message Guidelines](#-commit-message-guidelines):

```bash
git add .
git commit -m "feat: add payment gateway integration"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Open a Pull Request

- Go to the [original repository](https://github.com/monu808/GreenPass)
- Click **"New Pull Request"**
- Select your branch and provide a clear description

---

## 💻 Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- Define types in `src/types/`
- Avoid `any` type; use `unknown` or proper types
- Use interfaces for object shapes, types for unions/intersections

**Example:**
```typescript
// ✅ Good
interface Tourist {
  id: string;
  name: string;
  email: string;
  destination: Destination;
}

// ❌ Bad
const tourist: any = { ...  };
```

### React Components

- Use **functional components** with hooks
- Keep components small and focused (Single Responsibility Principle)
- Extract reusable logic into custom hooks
- Use `"use client"` directive only when necessary

**Example:**
```typescript
// ✅ Good
export function TouristCard({ tourist }: { tourist:  Tourist }) {
  return (
    <div className="card">
      <h3>{tourist.name}</h3>
      <p>{tourist.email}</p>
    </div>
  );
}

// ❌ Bad - too many responsibilities
export function Dashboard() {
  // 200 lines of mixed logic
}
```

### Styling (Tailwind CSS)

- Use **Tailwind utility classes**
- For reusable styles, use `@apply` in CSS modules or create components
- Follow mobile-first responsive design
- Use semantic color names

**Example:**
```tsx
// ✅ Good
<button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
  Register
</button>

// ❌ Bad - inline styles
<button style={{ padding: '8px 16px', background: '#059669' }}>
  Register
</button>
```

### File Naming

- **Components**: PascalCase (`TouristCard.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Pages**: lowercase with hyphens (`/destinations/[slug]`)
- **Types**: PascalCase in `types/` folder (`Tourist.ts`)

### Code Formatting

We use **ESLint** for linting.  Before committing:

```bash
npm run lint
```

**Key Rules:**
- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Max line length: 100 characters

---

## 📝 Commit Message Guidelines

We follow the **Conventional Commits** specification: 

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config)
- `perf`: Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(registration): add group booking support"

# Bug fix
git commit -m "fix(dashboard): correct capacity calculation for Spiti Valley"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Multiple lines
git commit -m "feat(alerts): implement weather advisory system

- Integrate IMD weather API
- Add real-time notifications
- Create alert management UI

Closes #42"
```

---

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows our coding standards
- [ ] All tests pass (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow guidelines
- [ ] Branch is up-to-date with `main`

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (please describe)

## Related Issues
Closes #(issue number)

## Testing
How did you test these changes? 

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows coding standards
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
```

### Review Process

1. Maintainers will review your PR within **3-5 business days**
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be credited in release notes!  🎉

---

## 🐛 Reporting Bugs

### Before Reporting

- **Search existing issues** to avoid duplicates
- **Test with the latest version** of the code
- **Collect relevant information** (browser, OS, error messages)

### Bug Report Template

Use GitHub Issues and include:

```markdown
**Describe the Bug**
A clear description of what the bug is. 

**To Reproduce**
Steps to reproduce: 
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen? 

**Actual Behavior**
What actually happens?

**Screenshots**
If applicable, add screenshots. 

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e. g., Chrome 120]
- Node version: [e.g., 18.17.0]

**Additional Context**
Any other relevant information. 
```

---

## 💡 Suggesting Features

We love new ideas! Before suggesting a feature: 

- **Check existing issues** to see if it's already proposed
- **Consider the scope** - does it align with project goals?
- **Think about implementation** - is it feasible? 

### Feature Request Template

```markdown
**Is your feature related to a problem?**
Describe the problem (e.g., "I'm frustrated when...")

**Proposed Solution**
Describe your ideal solution. 

**Alternatives Considered**
What other approaches did you think about?

**Benefits**
How does this improve GreenPass?

**Additional Context**
Mockups, examples, or references.
```

---

## 🌐 Community

### Get Help

- **GitHub Discussions**:  Ask questions and share ideas
- **Issues**: Report bugs or request features

### Stay Updated

- **Watch the repository** for notifications
- **Star the repo** to show support ⭐

### Recognition

All contributors are acknowledged in: 
- Release notes
- GitHub Contributors page
- Special mentions for significant contributions

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## 🙏 Thank You! 

Your contributions make GreenPass better for everyone.  Together, we're building a sustainable future for tourism in India's beautiful Himalayan regions. 🏔️

**Questions?** Open a [Discussion](https://github.com/monu808/GreenPass/discussions) or reach out to the maintainers. 

---

<div align="center">

**Happy Contributing! 🎉**

Made with ❤️ by the GreenPass community

[⬆ Back to Top](#contributing-to-greenpass-)

</div>
