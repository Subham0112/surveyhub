import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { buttonClasses, cn } from '../lib/styles';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'published' | 'draft' | 'completed' | 'accent';
}) {
  const tones = {
    neutral: 'border-line-strong bg-surface text-ink-soft',
    published: 'border-forest/30 bg-forest-soft text-forest',
    draft: 'border-line-strong bg-surface-strong text-muted',
    completed: 'border-forest/30 bg-forest-soft text-forest',
    accent: 'border-accent/30 bg-accent-soft text-accent-deep',
  } as const;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16">
      <span className="h-3 w-3 animate-pulse rounded-full bg-accent" />
      <span className="mono-label">{label}</span>
    </div>
  );
}

export function Notice({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'error' | 'success';
}) {
  const tones = {
    neutral: 'border-line-strong bg-surface text-ink-soft',
    error: 'border-accent/40 bg-accent-soft text-accent-deep',
    success: 'border-forest/30 bg-forest-soft text-forest',
  } as const;

  return (
    <div className={cn('rounded-[2px] border px-4 py-3 text-sm', tones[tone])} role={tone === 'error' ? 'alert' : undefined}>
      {children}
    </div>
  );
}
