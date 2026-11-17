import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';
import { Button, Notice } from '../components/ui';
import { useAuth } from '../context/auth';
import { ApiError } from '../lib/api';

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    navigate(user.role === 'ADMIN' ? '/admin' : '/', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the account. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <h1 className="text-3xl">Create account</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Sign up to answer surveys and keep your history.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="name" className="mono-label mb-2 block">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field"
              placeholder="Your name"
            />
          </div>

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
              placeholder="you@email.com"
            />
          </div>
        </div>

        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          minLength={8}
        />

        <PasswordField
          id="confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat the password"
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-5 text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-accent underline underline-offset-4">
          Sign in
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
