# Playwright Quick Reference

## 🚀 Quick Start

```bash
# Navigate to the test directory
cd /Users/blakepowell/Documents/GitHub/financial-analysis/apps/web

# Run all tests
npx playwright test

# Run specific test file
npx playwright test lease-analysis-basic.spec.ts
```

## 📋 Most Used Commands

```bash
# Run tests in UI mode (recommended for development)
npx playwright test --ui

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Run specific test by pattern
npx playwright test lease-analysis

# Run specific test by name
npx playwright test -g "page loads"

# List all tests without running
npx playwright test --list

# Generate HTML report
npx playwright test --reporter=html
npx playwright show-report
```

## 🔍 Debugging

```bash
# Debug mode (interactive)
npx playwright test --debug

# Record trace for all tests
npx playwright test --trace on

# View trace file
npx playwright show-trace trace.zip

# Run with verbose output
DEBUG=pw:api npx playwright test
```

## 🌐 Browser Management

```bash
# Check installed browsers
npx playwright install --dry-run

# Install all browsers
npx playwright install

# Install specific browser
npx playwright install chromium

# Install with system dependencies
npx playwright install --with-deps

# Check Playwright version
npx playwright --version
```

## 🧪 Test Execution Options

```bash
# Run with specific timeout
npx playwright test --timeout=30000

# Run only failed tests
npx playwright test --last-failed

# Run with maximum failures
npx playwright test --max-failures=3

# Run tests in parallel
npx playwright test --workers=4

# Run tests in specific project
npx playwright test --project=chromium

# Update snapshots
npx playwright test --update-snapshots
```

## 📊 Reports

```bash
# List reporter (default)
npx playwright test --reporter=list

# Line reporter (one line per test)
npx playwright test --reporter=line

# Dot reporter (compact)
npx playwright test --reporter=dot

# JSON reporter
npx playwright test --reporter=json

# HTML reporter (best for CI)
npx playwright test --reporter=html
```

## 🔧 Configuration

```bash
# Use specific config file
npx playwright test --config=playwright.dev.config.ts

# Run with specific base URL
npx playwright test --base-url=http://localhost:3000

# Run tests from specific directory
npx playwright test tests/lease-analysis/
```

## 🎯 Lease Analysis Tests

```bash
# Run all lease analysis tests
npx playwright test lease-analysis

# Run specific test suites
npx playwright test lease-analysis-basic.spec.ts      # Core functionality
npx playwright test lease-analysis-upload.spec.ts     # File upload & AI
npx playwright test lease-analysis-templates.spec.ts  # Templates & history
npx playwright test lease-analysis-scenarios.spec.ts  # Advanced features
npx playwright test lease-analysis-validation.spec.ts # Form validation
npx playwright test lease-analysis-mobile.spec.ts     # Mobile & responsive
```

## 📱 Device Emulation

```bash
# Run tests with mobile emulation (configured in test file)
npx playwright test lease-analysis-mobile.spec.ts
```

## 💡 Tips

1. **Always run from `apps/web` directory**: `cd apps/web`
2. **Use UI mode for development**: `npx playwright test --ui`
3. **Use headed mode to see browser**: `npx playwright test --headed`
4. **Generate reports for analysis**: `npx playwright test --reporter=html`
5. **Use traces for debugging failures**: `npx playwright test --trace on`

## 🆘 Troubleshooting

```bash
# If tests can't find Playwright
cd /Users/blakepowell/Documents/GitHub/financial-analysis/apps/web

# If browsers are missing
npx playwright install --with-deps

# If port is in use
lsof -i :4321
kill -9 <PID>

# If build fails
pnpm build
pnpm typecheck
```

## 📚 Documentation

- Main Docs: <https://playwright.dev>
- API Docs: <https://playwright.dev/docs/api/class-playwright>
- Best Practices: <https://playwright.dev/docs/best-practices>

## ✅ Current Setup

- **Version**: Playwright 1.56.0 (Latest Stable)
- **Test Files**: 6 test suites with 45+ tests
- **Coverage**: Enhanced Lease Analysis Dashboard
- **Config**: `playwright.config.ts` in `apps/web/`
- **Tests**: `tests/` directory in `apps/web/`