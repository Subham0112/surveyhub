import type { ReactNode } from 'react';
import { usePageReveal } from '../hooks/usePageReveal';

export function AuthLayout({ children }: { children: ReactNode }) {
  const ref = usePageReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="flex w-full justify-center px-5 py-8 sm:px-8 sm:py-10"
    >
      <div
        data-reveal
        className="w-full max-w-xl border border-line bg-surface p-6 shadow-[6px_6px_0_0_var(--color-surface-strong)] sm:p-8"
      >
        {children}
      </div>
    </div>
  );
}
