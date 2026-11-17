export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-ink bg-ink text-paper hover:border-accent hover:bg-accent disabled:hover:border-ink disabled:hover:bg-ink',
  secondary:
    'border-line-strong bg-surface text-ink hover:border-ink hover:bg-surface-strong',
  ghost: 'border-transparent bg-transparent text-ink-soft hover:border-line hover:bg-surface',
  danger:
    'border-accent bg-transparent text-accent hover:bg-accent-soft hover:text-accent-deep',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-xs',
  md: 'min-h-10 px-4 py-2 text-sm',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border font-medium tracking-[0.01em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
  );
}
