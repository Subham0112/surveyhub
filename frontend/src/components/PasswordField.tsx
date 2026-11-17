import { useState } from 'react';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  minLength?: number;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path
          d="M10.6 6.2A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16.4 16.4 0 0 1-2.2 3.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.4 7.8A16.6 16.6 0 0 0 2.5 12S6 18 12 18a9.7 9.7 0 0 0 3.8-.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  minLength,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const action = visible ? 'Hide' : 'Show';

  return (
    <div>
      <label htmlFor={id} className="mono-label mb-2 block">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field pr-11"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${action} ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[2px] text-muted transition-colors hover:text-ink"
        >
          <EyeIcon hidden={visible} />
        </button>
      </div>
    </div>
  );
}
