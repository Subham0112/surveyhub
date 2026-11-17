import { useEffect, useState } from 'react';
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
  autoHideMs,
  onClose,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'error' | 'success';
  autoHideMs?: number;
  onClose?: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoHideMs || !onClose) return;

    const timer = window.setTimeout(() => {
      setVisible(false);
      onClose();
    }, autoHideMs);

    return () => window.clearTimeout(timer);
  }, [autoHideMs, onClose]);

  if (!visible) return null;

  const tones = {
    neutral: 'border-line-strong bg-surface text-ink-soft',
    error: 'border-accent/40 bg-accent-soft text-accent-deep',
    success: 'border-forest/30 bg-forest-soft text-forest',
  } as const;

  return (
    <div
      className={cn(
        'fixed left-1/2 top-4 z-[100] w-[min(92vw,32rem)] -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-lg shadow-black/10 backdrop-blur-sm',
        tones[tone],
      )}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 leading-relaxed">{children}</div>
        {onClose ? (
          <button
            type="button"
            aria-label="Close alert"
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="ml-2 mt-0.5 rounded-md p-1 text-current/70 transition hover:bg-black/5 hover:text-current focus:outline-none focus:ring-2 focus:ring-current/30"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}
