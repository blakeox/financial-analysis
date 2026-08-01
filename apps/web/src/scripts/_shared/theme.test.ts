import { describe, expect, it } from 'vitest';
import {
  THEME_BOOT_INLINE,
  THEME_STORAGE_KEY,
  applyTheme,
  bootThemeFromStorage,
  readStoredTheme,
  setTheme,
  toggleTheme,
} from './theme';

describe('theme helpers', () => {
  it('exports a stable storage key and FOUC boot snippet', () => {
    expect(THEME_STORAGE_KEY).toBe('theme');
    expect(THEME_BOOT_INLINE).toContain(THEME_STORAGE_KEY);
    expect(THEME_BOOT_INLINE).toContain("classList.toggle('dark'");
  });

  it('persists and toggles dark class', () => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem(THEME_STORAGE_KEY);

    expect(setTheme('dark')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(readStoredTheme()).toBe('dark');

    expect(toggleTheme()).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(readStoredTheme()).toBe('light');

    expect(bootThemeFromStorage()).toBe(false);
    expect(applyTheme('dark')).toBe(true);
  });
});
