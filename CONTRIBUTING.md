# Contributing to financial-analysis

Thank you for your interest in contributing to the `financial-analysis` project! This document outlines the guidelines and processes for contributing to this repository.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for Workers deployment)
- Git

### Local Development

1. Clone the repository:

   ```bash
   git clone https://github.com/blakeox/financial-analysis.git
   cd financial-analysis
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up Cloudflare Workers:

   ```bash
   npx wrangler auth login
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or request features
- Provide detailed descriptions, steps to reproduce, and expected behavior
- Include screenshots or code snippets when relevant

### Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following the coding standards below
4. Write or update tests as needed
5. Ensure all tests pass: `npm test`
6. Commit your changes: `git commit -m "Add: brief description of changes"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Coding Standards

### General Principles

- **TypeScript first:** All logic must be in TypeScript with strict types enabled
- **Astro + Tailwind:** Use Astro for pages/layout, Tailwind for styling
- **Cloudflare stack:** Use Workers for APIs, R2 for file storage, D1 for relational data, KV for sessions, Queues for long tasks
- **Deterministic math:** Financial calculations must be pure, testable TypeScript functions

### Code Quality

- Use functional modules with clear exports
- Prefer async/await over callbacks
- Apply ESLint + Prettier defaults
- Write minimal but useful docstrings and inline comments
- Use Zod or similar for API input validation

## Project Structure

```text
financial-analysis/
├── apps/web/          # Astro frontend
├── workers/api/       # Cloudflare Workers (API + MCP)
├── packages/analysis/ # Deterministic engines + tests
├── packages/tools/    # Tool modules (lease, amortization, future)
├── packages/ui/       # Shared UI components (Tailwind+HeadlessUI)
├── docs/              # API documentation
└── .github/           # GitHub Actions and templates
```

## UI Guidelines

- Build UI as islands in Astro with React/TSX
- Use Tailwind classes for layout/spacing/typography
- Use accessible primitives (Radix, HeadlessUI) + lucide-react for icons
- Ensure dark mode works (class strategy)
- Keep components composable: Button, Card, Input, Modal, Drawer, Toaster

## Security & Privacy

- Only accept .pdf and .docx uploads
- Store documents in R2 privately with signed URLs
- Never log raw lease text or user inputs
- Manage secrets with Cloudflare wrangler secret
- Implement per-IP/session rate limiting

## Testing

- Engines: 100% covered with unit tests (edge cases: escalations, free rent overlaps, extra payments)
- End-to-end happy path tests with Playwright
- Run tests locally: `npm test`
- GitHub Actions: lint, typecheck, unit tests, preview deploy

## Pull Request Process

1. Ensure your PR includes:
   - Clear title and description
   - Reference to any related issues
   - Tests for new functionality
   - Updated documentation if needed

2. PRs require:
   - Passing CI checks
   - At least one review
   - No merge conflicts

3. New financial tools must be added as ToolModules under `/packages/tools/<slug>`
4. Engines must be deterministic, pure functions
5. All new APIs documented in `/docs`

## Non-Goals

- Do not mix database logic inside analysis engines
- Do not add dependencies requiring Node APIs (Workers must run in CF runtime)
- Do not hardcode secrets or API keys

## Getting Help

- Check existing issues and documentation first
- Join discussions in GitHub Discussions
- Contact maintainers for questions

Thank you for contributing to financial-analysis! 🎉
