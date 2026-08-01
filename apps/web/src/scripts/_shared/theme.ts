/**
 * Shared light/dark theme helpers (#376).
 * Layout FOUC boot, ModernNavBar toggle, and DesignSystemShowcase must stay in sync.
 */

export const THEME_STORAGE_KEY = 'theme';

export type ThemePreference = 'light' | 'dark';

export function readStoredTheme(): ThemePreference | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'light' || value === 'dark') return value;
  } catch {
    // ignore
  }
  return null;
}

export function prefersDarkScheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Apply `.dark` from an explicit preference or system preference. */
export function applyTheme(preference: ThemePreference | 'auto' | null): boolean {
  const dark =
    preference === 'dark' ||
    ((preference === 'auto' || preference === null) && prefersDarkScheme());
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}

export function setTheme(preference: ThemePreference): boolean {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // ignore
  }
  return applyTheme(preference);
}

/** Toggle light ↔ dark and persist. Returns whether dark is now active. */
export function toggleTheme(): boolean {
  const next: ThemePreference = document.documentElement.classList.contains('dark')
    ? 'light'
    : 'dark';
  return setTheme(next);
}

/** Initial FOUC-safe boot: stored preference, else system. */
export function bootThemeFromStorage(): boolean {
  return applyTheme(readStoredTheme());
}

/**
 * Inline script body for Layout `<script is:inline>` (must not import modules).
 * Keep behavior identical to `bootThemeFromStorage`.
 */
export const THEME_BOOT_INLINE = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=typeof localStorage!=='undefined'?localStorage.getItem(k):null;if(s==='dark'||s==='light'){document.documentElement.classList.toggle('dark',s==='dark');}else if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}catch(e){}})();`;
