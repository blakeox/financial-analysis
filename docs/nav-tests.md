# Nav Bar Test Coverage

This document summarizes the end-to-end coverage for the ModernNavBar in `apps/web` and how to run the tests.

## What we cover

- Visibility and persistence: stays visible after hydration and over time.
- Scroll behavior: `is-scrolled` class toggles without losing links.
- Responsive behavior: desktop links preserved across resize; mobile menu toggle and close-on-click.
- Keyboard navigation: tab traversal reaches brand, desktop links, theme toggle, and search button.
- Theme persistence: toggling theme updates `html.dark` and persists across reload via `localStorage`.
- Search overlay: opens via button and Cmd/Ctrl+K, traps initial focus on the input, closes via Esc/close.
- Diagnostics/stability: mutation observers, late stylesheet injection tolerance, DOM/class churn limits, SSR vs hydration snapshot stability, long-run stability.
- Duplication detection: only one visible nav present.
- Accessibility: Axe checks for `wcag2a` and `wcag2aa` across key routes.

## Key test files

- `tests/nav.spec.ts` – basic persistence
- `tests/nav-scroll.spec.ts` – scroll elevation
- `tests/nav-resize.spec.ts` – responsive persistence
- `tests/nav.mobile.spec.ts` – mobile ARIA/focus behavior
- `tests/nav.keyboard.spec.ts` – keyboard traversal
- `tests/nav.theme.spec.ts` – theme persistence
- `tests/nav.overlay.spec.ts` – search overlay behavior
- `tests/nav-*.spec.ts` – stability, SSR/hydration, churn, duplication, etc.

## Stable selectors

The nav exposes `data-testid` attributes to keep selectors stable:

- `data-testid="nav-root"`
- `data-testid="nav-desktop"`
- `data-testid="nav-desktop-link"`
- `data-testid="nav-mobile-toggle"`
- `data-testid="nav-mobile-panel"`
- `data-testid="nav-theme-toggle"`
- `data-testid="nav-search-toggle"`
- `data-testid="nav-search-overlay"`
- `data-testid="nav-search-close"`

## How to run

All tests:

```sh
pnpm --filter @financial-analysis/web test:e2e
```

Filter to nav tests:

```sh
pnpm --filter @financial-analysis/web test:e2e -- -g "Navbar"
```

## Notes

- The Astro standalone `build` occasionally errors in CI with a renderer resolution message. This does not affect the Playwright preview-based runs. Track and fix separately in the web build pipeline.
