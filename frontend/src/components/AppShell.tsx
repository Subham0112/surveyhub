import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { buttonClasses, cn } from '../lib/styles';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'whitespace-nowrap border-b-2 pb-0.5 text-sm transition-colors',
    isActive
      ? 'border-accent text-ink'
      : 'border-transparent text-ink-soft hover:text-ink',
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!profileOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setProfileOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileOpen]);

  async function handleSignOut() {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          <Link
            to={user?.role === 'ADMIN' ? '/admin' : '/'}
            className="flex items-center gap-3"
            aria-label="Survey Hub home"
          >
            <span className="grid h-8 w-8 place-items-center border border-ink bg-ink font-mono text-[11px] tracking-[0.08em] text-paper">
              SH
            </span>
            <span className="hidden font-serif text-lg tracking-[-0.01em] sm:inline">
              Survey Hub
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-5">
            {user ? (
              <>
                {user.role === 'ADMIN' ? (
                  <NavLink to="/admin" className={navLinkClass}>
                    Admin
                  </NavLink>
                ) : (
                  <>
                    <NavLink to="/" end className={navLinkClass}>
                      Surveys
                    </NavLink>
                    <NavLink to="/history" className={navLinkClass}>
                      History
                    </NavLink>
                  </>
                )}
                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    aria-label={`Account menu for ${user.name}`}
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    aria-controls={profileOpen ? 'profile-menu' : undefined}
                    className="grid h-9 w-9 place-items-center rounded-full border border-line-strong bg-surface text-ink-soft transition-colors hover:border-ink hover:text-ink"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="8" r="3.25" />
                      <path
                        d="M5.5 19c.8-3 3.3-4.5 6.5-4.5s5.7 1.5 6.5 4.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>

                  {profileOpen ? (
                    <div
                      id="profile-menu"
                      role="menu"
                      aria-label="Account menu"
                      className="absolute right-0 top-full z-40 mt-2 w-60 border border-line bg-surface"
                    >
                      <div className="border-b border-line px-4 py-3">
                        <p className="mono-label">Account</p>
                        <p className="mt-2 truncate text-sm font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleSignOut}
                          className={cn(buttonClasses('ghost', 'sm'), 'w-full justify-start')}
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Sign in
                </NavLink>
                <Link to="/register" className={buttonClasses('primary', 'sm')}>
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="mono-label">Survey Hub</p>
         
        </div>
      </footer>
    </div>
  );
}
