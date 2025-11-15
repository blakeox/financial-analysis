# Chat Response Quality Tests

## Overview

This test suite ensures that the chat assistant provides helpful, specific responses instead of generic, unhelpful ones across all pages of the website.

## Problem Being Solved

Previously, the chat would sometimes give generic responses like:
- "Hi — I can help you find the right financial calculator"
- "What calculators are available?"
- "I have access to 26 financial analysis tools. Ask me to analyze specific scenarios or say 'help' for examples"
- "I can help update the models model. Try: 'Set interest to 4.5%'"

These responses don't actually help users - they just repeat back generic prompts or ask questions instead of providing answers.

## Test Files

### 1. `chat-response-quality.spec.ts`
Comprehensive test suite with:
- **Home Page Tests**: Verify no generic responses on home page
- **Calculator Pages Tests**: Test all major calculator pages for context-specific examples
- **Journey Pages Tests**: Verify journey-specific context is shown
- **Journey Step Pages Tests**: Test field updates on financial snapshot pages
- **Models Page Tests**: Verify helpful responses when asked about models
- **Edge Cases**: Test vague questions, field updates, unavailable tools
- **Response Quality Checks**: Ensure responses are actionable and informative

### 2. `chat-response-quality-all-pages.spec.ts`
Dynamic test suite that:
- Iterates through all major pages (`TEST_PAGES` list)
- Tests each page for:
  - Non-generic system messages
  - Helpful responses to common questions
  - Context-appropriate examples
- Includes special tests for:
  - Journey step pages with field updates
  - Calculator pages with field updates
  - Contextual appropriateness checks

### 3. `helpers/chat-test-helpers.ts`
Reusable helper utilities:
- `isGenericResponse()`: Detects generic response patterns
- `sendChatMessage()`: Sends message and gets response
- `openChatPanel()`: Opens chat panel
- `getSystemMessage()`: Gets system message text
- `isHelpfulResponse()`: Validates response quality
- `verifyFieldUpdate()`: Checks if field was updated
- `TEST_PAGES`: List of all pages to test

## Generic Response Patterns Detected

The tests check for these forbidden patterns:
- "Hi — I can help you find the right financial calculator"
- "What calculators are available?"
- "Show me business tools"
- "I have access to X financial analysis tools. Ask me to analyze..."
- "What models do you have?"
- "I can help update the models model. Try:..."
- "Hi — select a model or ask about available tools"
- "Ask me to analyze specific scenarios or say 'help' for examples"

## What Gets Tested

### System Messages
- ✅ Should not contain generic response patterns
- ✅ Should show context-appropriate examples
- ✅ Should be relevant to the current page

### Chat Responses
- ✅ Should not be generic/unhelpful
- ✅ Should provide specific information or guidance
- ✅ Should not just repeat the user's question
- ✅ Should be actionable or informative

### Field Updates
- ✅ Should work on journey step pages (financial-snapshot)
- ✅ Should work on calculator pages
- ✅ Should acknowledge updates with helpful responses
- ✅ Should not give generic "try this" responses

### Context Appropriateness
- ✅ Amortization page should show mortgage examples
- ✅ Financial snapshot should show income examples, not mortgage
- ✅ Each page should show relevant examples for that page type

## Running the Tests

```bash
# Run all chat response quality tests
pnpm test chat-response-quality

# Run specific test file
pnpm test chat-response-quality.spec.ts

# Run with UI
pnpm test chat-response-quality --ui
```

## Test Coverage

### Pages Tested
- ✅ Home page (`/`)
- ✅ Models page (`/models`)
- ✅ All major calculator pages (10+ calculators)
- ✅ All journey pages (5+ journeys)
- ✅ All journey step pages (financial-snapshot, goal-planning, etc.)

### Test Scenarios
- ✅ System message quality
- ✅ Response to "What can you help me with?"
- ✅ Response to "What tools are available?"
- ✅ Field update functionality
- ✅ Context-appropriate examples
- ✅ Vague question handling
- ✅ Unavailable tool requests

## Expected Results

All tests should pass, meaning:
1. ✅ No generic responses are detected
2. ✅ All responses are helpful and specific
3. ✅ Field updates work correctly
4. ✅ Context is appropriate for each page type

## Maintenance

When adding new pages:
1. Add the page to `TEST_PAGES` in `helpers/chat-test-helpers.ts`
2. The dynamic test suite will automatically test it
3. Add specific tests in `chat-response-quality.spec.ts` if needed

When adding new generic response patterns:
1. Add the pattern to `GENERIC_RESPONSE_PATTERNS` in `helpers/chat-test-helpers.ts`
2. All tests will automatically check for it

## Related Documentation

- `docs/CHAT_RESPONSE_IMPROVEMENTS.md` - Details on how generic responses were fixed
- `docs/JOURNEY_STEP_FIELD_UPDATE_FIX.md` - Details on field update fixes

