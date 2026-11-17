import { Link } from 'react-router-dom';
import { buttonClasses, cn } from '../lib/styles';
import { usePageReveal } from '../hooks/usePageReveal';

export function NotFoundPage() {
  const ref = usePageReveal<HTMLDivElement>();

  return (
    <div ref={ref} className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
      <div data-reveal className="max-w-lg">
        <p className="mono-label">404 / Not found</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">This page is not on the map.</h1>
        <p className="mt-4 text-[15px] text-ink-soft">
          The link may be out of date, or the survey may have been removed.
        </p>
        <Link to="/" className={cn(buttonClasses('primary'), 'mt-7')}>
          Go to surveys
        </Link>
      </div>
    </div>
  );
}
