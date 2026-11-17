import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';
import { Button, Notice } from '../components/ui';
import { useAuth } from '../context/auth';
import { ApiError } from '../lib/api';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const target =
      user.role === 'ADMIN' ? '/admin' : from && from.startsWith('/') ? from : '/';
    navigate(target, { replace: true });
  }, [user, from, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <h1 className="text-3xl">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Use your account to answer surveys or manage them.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
       {error ? <Notice tone="error" onClose={() => setError('')}>{error}</Notice> : null}

        <div>
          <label htmlFor="email" className="mono-label mb-2 block">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field"
            placeholder="you@example.com"
          />
        </div>

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          placeholder="Your password"
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-ink-soft">
        No account yet?{' '}
        <Link to="/register" className="font-medium text-accent underline underline-offset-4">
          Create one
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
