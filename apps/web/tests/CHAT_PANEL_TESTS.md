# Chat Panel Test Suite

## Overview

Comprehensive end-to-end tests for the ChatPanel component covering UI interactions, context detection, MCP integration, accessibility, and cross-page functionality.

## Test Organization

### 1. Basic UI and Interactions (`ChatPanel - Basic UI and Interactions`)

Tests fundamental UI behavior and user interactions with the chat panel.

#### Tests:

- **Button Visibility and Positioning**: Verifies the toggle button is visible with proper ARIA attributes, high z-index (>9999), and `pointer-events: auto`
- **Open/Close with Toggle**: Ensures panel opens and closes correctly with state management (visible class, aria-hidden, aria-expanded)
- **Close with Button**: Validates the close button functionality
- **Close with Escape Key**: Tests keyboard navigation and focus management
- **Close on Outside Click**: Verifies clicking outside the panel closes it
- **Prevent Close on Inside Click**: Ensures clicking inside the panel doesn't close it

**Key Assertions:**

- Z-index > 9999 for proper layering
- `pointer-events: auto` to ensure clickability
- Proper ARIA state management
- Focus returns to toggle button after Escape

### 2. Context Detection (`ChatPanel - Context Detection`)

Tests the chat panel's ability to detect and display the correct page context.

#### Tests:

- **Home Page Context**: Verifies context indicator is visible on `/` page
- **Analysis Page Context**: Verifies "lease" or "amortization" context on `/analysis` page
- **Lease Analysis Context**: Verifies "lease" context on `/lease-analysis` page
- **Enhanced Lease Context**: Verifies "lease" context on `/enhanced-lease` page
- **Amortization Context**: Verifies "amortization" context on `/amortization` page
- **EBITDA Context Detection**: Verifies "ebitda" context on `/ebitda-forecasting` page
- **Models Context Detection**: Verifies "models" context on `/models` page
- **Status Page Context**: Verifies context indicator is visible on `/status` page
- **Debug Page Context**: Verifies context indicator is visible on `/debug` page

**Key Assertions:**

- Context indicator displays appropriate text based on current page
- Context changes dynamically across page navigation
- All page types are covered (9 total pages tested)

### 3. MCP Tools Integration (`ChatPanel - MCP Tools Integration`)

Tests integration with the Model Context Protocol (MCP) tools API.

#### Tests:

- **Fetch and Display Tools**: Verifies MCP tools are fetched from `/api/v1/mcp/tools` and displayed in welcome message
- **Graceful Failure Handling**: Ensures panel still works when MCP API is unavailable (404 response)

**Key Assertions:**

- Welcome message contains tool listings when API is available
- Panel functionality unaffected by MCP fetch failures
- System message always displays regardless of API status

### 4. Input and Messaging (`ChatPanel - Input and Messaging`)

Tests chat input, message sending, and textarea behavior.

#### Tests:

- **Send Button Enable/Disable**: Verifies button state changes based on input content
- **Send on Enter**: Tests message sending with Enter key and input clearing
- **Newline with Shift+Enter**: Validates multi-line input support
- **Auto-focus on Open**: Ensures input is focused when panel opens (after 350ms animation)

**Key Assertions:**

- Send button disabled when input is empty
- Input clears after message is sent
- Shift+Enter creates newlines without sending
- Focus management works correctly

### 5. Accessibility (`ChatPanel - Accessibility`)

Tests ARIA attributes, roles, and keyboard navigation for accessibility compliance.

#### Tests:

- **ARIA Attributes**: Verifies proper `role="dialog"`, `aria-modal`, `aria-labelledby`, and `aria-controls`
- **Focus Management**: Tests focus moves to input on open and returns to toggle on Escape

**Key Assertions:**

- All required ARIA attributes are present and correct
- Keyboard navigation works as expected
- Focus trap behavior functions properly

### 6. Cross-page Functionality (`ChatPanel - Cross-page Functionality`)

Tests chat panel behavior across different pages in the application.

#### Tests:

- **Works on All Pages**: Verifies chat panel functions on `/`, `/analysis`, `/lease-analysis`, `/enhanced-lease`, `/amortization`, `/ebitda-forecasting`, `/models`, `/status`, `/debug`
- **State Persistence**: Tests panel maintains state during same-page interactions (e.g., filling form fields)

**Key Assertions:**

- Chat panel available and functional on all main routes
- Panel state independent of page content changes
- Context detection works across page navigation

### 7. Mobile Responsiveness (`ChatPanel - Mobile Responsiveness`)

Tests mobile-specific behavior with 375x667 viewport (iPhone SE size).

#### Tests:

- **Mobile Rendering**: Verifies panel takes full width on mobile (>95% of viewport)
- **Button Repositioning**: Tests toggle button moves up when panel opens on mobile

**Key Assertions:**

- Panel width matches viewport on mobile
- Toggle button repositions to avoid overlap with panel
- All interactions work correctly on touch devices

### 8. Navigation Compatibility (`ChatPanel - Does Not Block Navigation`)

Ensures chat panel doesn't interfere with site navigation.

#### Tests:

- **Navigation When Closed**: Verifies nav works normally when chat is closed
- **Navigation When Open**: Tests nav remains functional even when chat is open

**Key Assertions:**

- Mobile menu button clickable
- Desktop navigation links functional
- No z-index conflicts with navigation elements

## Running the Tests

```bash
# Run all chat panel tests
cd apps/web
pnpm test:e2e chat-panel.spec.ts

# Run in headed mode (visible browser)
npx playwright test chat-panel.spec.ts --headed

# Run specific test
npx playwright test chat-panel.spec.ts -g "opens and closes chat panel"

# Run with debugging
npx playwright test chat-panel.spec.ts --debug
```

## Test Configuration

Tests use the default Playwright configuration from `playwright.config.ts`:

- **Base URL**: http://localhost:8788 (dev server)
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile Tests**: Use 375x667 viewport (iPhone SE)
- **Timeout**: Default test timeout applies

## Important Notes

### Dev Server Required

All tests require the dev servers to be running:

```bash
pnpm -w dev
```

This starts:

- Web worker on http://localhost:8788
- API worker on http://localhost:8787

### Test Skipping

Tests automatically skip if the chat toggle button is not found (timeout: 2000ms). This allows tests to pass on pages where the chat panel is intentionally disabled.

### MCP API Dependency

Some tests interact with the MCP API endpoint (`/api/v1/mcp/tools`). Tests are designed to pass whether the API is available or not.

## Coverage Summary

| Category          | Tests  | Key Areas                              |
| ----------------- | ------ | -------------------------------------- |
| UI Interactions   | 6      | Toggle, close, keyboard, mouse         |
| Context Detection | 9      | Page-specific context (all page types) |
| MCP Integration   | 2      | API fetch, error handling              |
| Input/Messaging   | 4      | Send button, Enter, focus              |
| Accessibility     | 2      | ARIA, focus management                 |
| Cross-page        | 2      | Multi-route functionality              |
| Mobile            | 2      | Responsive behavior                    |
| Navigation        | 2      | No blocking conflicts                  |
| **Total**         | **29** |                                        |

## Known Issues

1. **API Worker Crashes**: The API worker may crash due to Cloudflare dev environment configuration. Tests are designed to handle this gracefully.

2. **Timing Sensitivity**: Focus-related tests use 350ms delay to account for CSS transitions. Adjust if animations change.

3. **Mobile Button Position**: The exact bottom position calculation may vary based on safe-area-inset values on different devices.

## Future Enhancements

- [ ] Test actual message sending and response display
- [ ] Test form field auto-filling from chat interactions
- [ ] Test MCP tool execution and result handling
- [ ] Test chat history persistence across page navigation
- [ ] Test error message display for failed chat requests
- [ ] Add visual regression tests for panel appearance
- [ ] Test with screen readers for deeper accessibility validation
