# Contributing to LEI Indias

Thank you for your interest in contributing to LEI Indias! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment** (see README.md)
4. **Create a branch** for your changes

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run linter
pnpm lint

# Build the application
pnpm build

# Test manually
pnpm dev
```

### 4. Commit Your Changes

Write clear, descriptive commit messages:

```bash
git commit -m "Add feature: description of what you added"
git commit -m "Fix bug: description of what you fixed"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper types or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions and complex types

### React/Next.js

- Use functional components with hooks
- Use TypeScript for component props
- Follow Next.js 14 App Router conventions
- Use server components when possible

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Constants: `UPPER_SNAKE_CASE.ts`

### Code Organization

- Keep components small and focused
- Extract reusable logic into hooks
- Use proper folder structure
- Group related files together

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] All tests pass (if applicable)
- [ ] Linter passes without errors
- [ ] Documentation is updated
- [ ] No console.log statements (use proper logging)
- [ ] No sensitive data is committed

### Pull Request Template

Fill out the PR template completely:
- Description of changes
- Type of change
- Testing performed
- Checklist items

### Review Process

- All PRs require at least one approval
- Address review comments promptly
- Keep discussions constructive
- Be open to feedback

## Reporting Issues

### Bug Reports

Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Screenshots if applicable

### Feature Requests

Use the feature request template and include:
- Clear description of the feature
- Use case and problem statement
- Proposed solution
- Alternatives considered

## Development Setup

See [README.md](../README.md) for detailed setup instructions.

### Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
psql -U user -d leiindias -f prisma/schema.sql

# Run development server
pnpm dev
```

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Review the documentation

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain a positive environment

Thank you for contributing! 🎉
