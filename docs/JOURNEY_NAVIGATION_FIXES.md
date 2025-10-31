# Journey Navigation Fixes

## Summary
Fixed navigation issues across all journey step pages to ensure proper next/previous button functionality.

## Problem
The home buying journey navigation was not working because step pages had incorrect `getStaticPaths` implementations that tried to pass both `scenario` and `stepId` params, but Astro was only passing `scenario`.

## Solution
Standardized all journey step pages to use the correct pattern:

1. **Fixed `getStaticPaths`**: Only generate paths for scenarios that actually have the step
2. **Use `currentStep.order`**: Use the dynamic `order` field instead of hardcoded step numbers
3. **Find next/previous by order**: Look up adjacent steps using `order` field arithmetic

## Files Fixed

### Home Buying Journey
- `apps/web/src/pages/journey/[scenario]/step/financial-snapshot.astro`
- `apps/web/src/pages/journey/[scenario]/step/debt-strategy.astro`
- `apps/web/src/pages/journey/[scenario]/step/emergency-fund.astro`
- `apps/web/src/pages/journey/[scenario]/step/retirement-start.astro`
- `apps/web/src/pages/journey/[scenario]/step/goal-planning.astro`

### Startup Planning Journey
- `apps/web/src/pages/journey/[scenario]/step/initial-capital-investment.astro`
- `apps/web/src/pages/journey/[scenario]/step/startup-budget.astro`
- `apps/web/src/pages/journey/[scenario]/step/funding-strategy.astro`
- `apps/web/src/pages/journey/[scenario]/step/growth-planning.astro`

## Testing
Created comprehensive navigation tests in `apps/web/tests/journey-navigation.spec.ts`:

- Tests navigation links for all journey step pages
- Verifies correct next/previous buttons on each step
- Tests complete navigation flow through journeys
- Tests back navigation functionality
- Covers all 6 journeys and all step combinations

## Affected Journeys

### Personal Finance Journeys
- **Young Professional** (5 steps)
- **Home Buying** (5 steps)
- **Family Planning** (3 steps)

### Business Finance Journeys
- **Startup Planning** (4 steps)
- **M&A Analysis** (3 steps - uses calculators)
- **Investment Analysis** (3 steps - uses calculators)

## Build Output
All journey pages build successfully:
- 60 total pages generated
- 14 dedicated step pages (financial-snapshot, debt-strategy, emergency-fund, retirement-start, goal-planning, initial-capital-investment, startup-budget, funding-strategy, growth-planning)
- Navigation links verified for all combinations

## Commits
1. `fix: correct financial-snapshot page static path generation`
2. `fix: correct debt-strategy page static path generation`
3. `fix: correct emergency-fund page static path generation`
4. `fix: correct retirement-start page static path generation`
5. `fix: correct goal-planning page static path generation`
6. `fix: standardize all startup journey page navigation`
7. `test: add comprehensive journey navigation tests`

## Status
✅ All journeys now have working navigation
✅ All step pages build correctly
✅ Navigation tests added for future regression prevention

