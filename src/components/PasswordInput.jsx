import { useState } from 'react';
import Icon from './Icons';

/**
 * PASSWORD INPUT — a password box with an eye button to show or hide what
 * you typed. Takes the same props as a normal <input> (id, value, onChange,
 * placeholder, autoComplete, className, ...).
 */
export default function PasswordInput({ className = 'field', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-body transition hover:bg-white/70 hover:text-ink"
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} className="h-5 w-5" />
      </button>
    </div>
  );
}
