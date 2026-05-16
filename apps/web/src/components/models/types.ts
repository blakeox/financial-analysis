export interface ModelCardProps {
  className?: string;
}

export type ModelCardAccent = 'emerald' | 'teal' | 'violet';

const MODEL_CARD_SHELL_CLASSES: Record<ModelCardAccent, string> = {
  emerald:
    'border-emerald-200 from-emerald-50 hover:border-emerald-400 dark:border-emerald-800 dark:from-emerald-950/50 dark:hover:border-emerald-600',
  teal: 'border-teal-200 from-teal-50 hover:border-teal-400 dark:border-teal-800 dark:from-teal-950/50 dark:hover:border-teal-600',
  violet:
    'border-violet-200 from-violet-50 hover:border-violet-400 dark:border-violet-800 dark:from-violet-950/50 dark:hover:border-violet-600',
};

export const getModelCardShellClass = (accent: ModelCardAccent) =>
  [
    'h-full rounded-2xl border bg-linear-to-br to-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:to-slate-950',
    MODEL_CARD_SHELL_CLASSES[accent],
  ].join(' ');
