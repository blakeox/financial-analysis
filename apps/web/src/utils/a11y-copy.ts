/**
 * Accessible secondary copy class names for HTML strings in client scripts.
 * Prefer these over raw Tailwind slate utilities (enforced by check-a11y-contrast.mjs).
 */
export const A11Y_COPY_MUTED = 'fa-copy-muted';
export const A11Y_COPY_CAPTION = 'fa-help-copy';
export const A11Y_COPY_HELPER = 'fa-meta-copy';

/** @deprecated Use A11Y_COPY_* constants or fa-* CSS classes */
export const A11Y_MUTED_TAILWIND = 'text-slate-600 dark:text-slate-400';
