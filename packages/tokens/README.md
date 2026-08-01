# `@financial-analysis/tokens`

Single source of truth for Fanalyx CSS custom properties (`--fa-*`, palettes, Tailwind `@theme` bridge).

## Usage

Import once from the app spine:

```css
@import '@financial-analysis/tokens/tokens.css';
```

Do not duplicate token definitions in `apps/web` or `packages/ui`. Edit this package, then update contrast pairs / docs per `docs/DESIGN_SYSTEM.md`.

## Package contract

| Field | Value |
|-------|--------|
| Export | `./tokens.css` |
| `sideEffects` | `["**/*.css"]` — bundlers must not tree-shake the stylesheet |
| `files` | `tokens.css`, `README.md` |

## Token change checklist

1. Edit `packages/tokens/tokens.css`
2. Update `REQUIRED_CONTRAST_PAIRS` in `packages/ui/src/lib/a11y-contrast.ts` if text colors change
3. Update chart fallbacks in `packages/ui/src/lib/chartColors.ts` if `--fa-chart-*` hexes change
4. Run `pnpm run test:layout` in `apps/web` and `pnpm run verify` at repo root
5. Note semantic changes in `docs/DESIGN_SYSTEM.md` when adding new `--fa-*` families
