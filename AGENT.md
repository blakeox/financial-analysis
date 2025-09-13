# AGENT.md

This file defines how AI coding assistants should contribute to this repository. Follow these practices to keep the codebase consistent, secure, and maintainable.

---

## General Principles

- **TypeScript first:** All logic (Workers, engines, UI islands) must be in TypeScript with strict types enabled.
- **Astro + Tailwind:** Use Astro for pages/layout, Tailwind for styling. No inline CSS except for one-off fixes.
- **Cloudflare stack:** Use Workers for APIs, R2 for file storage, D1 for relational data, KV for sessions, Queues for long tasks.
- **Deterministic math:** Financial calculations (lease analysis, amortization, etc.) must be pure, testable TypeScript functions. Do not use LLMs for math.
- **MCP server:** Only for field extraction and natural-language variable editing. Keep tools stateless and schema-driven.

---

## Coding Standards

- Use functional modules with clear exports.
- Prefer async/await over callbacks.
- Apply ESLint + Prettier defaults.
- Unit tests with Vitest for core logic.
- Use Zod or similar for API input validation.
- Write minimal but useful docstrings and inline comments.

---

## Project Structure

```text
/apps/web          # Astro frontend
/workers/api       # Cloudflare Workers (API + MCP)
/packages/analysis # Deterministic engines + tests
/packages/tools    # Tool modules (lease, amortization, future)
/packages/ui       # Shared UI components (Tailwind+HeadlessUI)
```

---

## UI Guidelines

- Build UI as islands in Astro with React/TSX.
- Tailwind classes for layout/spacing/typography.
- Use accessible primitives (Radix, HeadlessUI) + lucide-react for icons.
- Dark mode must work (class strategy).
- Keep components composable: Button, Card, Input, Modal, Drawer, Toaster.

---

## Security & Privacy

- Only accept .pdf and .docx uploads.
- Store documents in R2 privately with signed URLs.
- Never log raw lease text or user inputs.
- Manage secrets with Cloudflare wrangler secret.
- Implement per-IP/session rate limiting.

---

## Testing & CI

- Engines: 100% covered with unit tests (edge cases: escalations, free rent overlaps, extra payments).
- End-to-end happy path tests with Playwright.
- GitHub Actions: lint, typecheck, unit tests, preview deploy.

---

## Contribution Rules

- New financial tools must be added as ToolModules under `/packages/tools/<slug>`.
- Engines must be deterministic, pure functions.
- All new APIs documented in `/docs`.
- PRs require passing CI + at least one review.

---

## Non-Goals

- Do not mix in database logic inside analysis engines.
- Do not add dependencies requiring Node APIs (Workers must run in CF runtime).
- Do not hardcode secrets or API keys.

---

✅ If you follow this AGENT.md, AI agents will generate consistent, production-ready code across this repo.
