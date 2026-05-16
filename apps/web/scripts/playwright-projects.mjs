export const PLAYWRIGHT_PROJECT_DEVICE_MAP = Object.freeze({
  chromium: 'Desktop Chrome',
  firefox: 'Desktop Firefox',
  webkit: 'Desktop Safari',
  'mobile-safari': 'iPhone 13',
});

export const PLAYWRIGHT_MATRIX_PROJECTS = Object.freeze(Object.keys(PLAYWRIGHT_PROJECT_DEVICE_MAP));
