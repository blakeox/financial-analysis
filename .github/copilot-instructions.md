# Copilot Instructions for `financial-analysis`

## Project Overview

This repository is for financial analysis tooling built with a modern TypeScript stack. The project uses Astro for the frontend, Cloudflare Workers for APIs, and follows strict coding standards for deterministic financial calculations.

## Key Conventions

- **TypeScript first:** All logic must be in TypeScript with strict types enabled
- **Astro + Tailwind:** Use Astro for pages/layout, Tailwind for styling
- **Cloudflare stack:** Workers for APIs, R2 for storage, D1 for data, KV for sessions
- **Deterministic math:** Financial calculations must be pure, testable functions
- **MCP server:** Only for field extraction and natural-language editing

## Guidance for AI Agents

- Follow the detailed guidelines in `AGENT.md` for all coding practices
- Before implementing features, confirm the intended architecture matches the project structure
- For financial calculations, ensure they are pure functions with comprehensive unit tests
- Use the specified project structure: `/apps/web`, `/workers/api`, `/packages/analysis`, etc.
- Reference `CONTRIBUTING.md` for development setup and contribution processes

## Project Structure

```
financial-analysis/
├── apps/web/          # Astro frontend
├── workers/api/       # Cloudflare Workers (API + MCP)
├── packages/analysis/ # Deterministic engines + tests
├── packages/tools/    # Tool modules (lease, amortization, future)
├── packages/ui/       # Shared UI components (Tailwind+HeadlessUI)
├── docs/              # API documentation
└── .github/           # GitHub Actions and templates
```

## Next Steps

- As the project grows, update this file to reflect new patterns and workflows
- Reference key files and directories as they are added
- Ensure alignment with `AGENT.md` and `CONTRIBUTING.md`
