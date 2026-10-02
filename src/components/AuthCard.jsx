import { useState } from 'react';
import Card from './Card';
import Button from './Button';

/**
 * AUTH CARD — shared frame for the Log In and Create Account screens:
 * title, subtitle, the form, the "or continue with" divider and Google button.
 */
export default function AuthCard({ title, subtitle, notice, children }) {
  const [googleMessage, setGoogleMessage] = useState('');

  return (
    <div className="px-4 py-8 sm:py-10">
      <Card padding="px-6 py-10 sm:px-10" className="mx-auto max-w-[460px]">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-body sm:text-[15px]">{subtitle}</p>
        </div>

        {notice && <p className="mt-5 rounded-xl bg-lime-soft px-4 py-3 text-center text-sm text-ink">{notice}</p>}

        <div className="mt-7">{children}</div>

        <div className="my-5 flex items-center gap-4 text-xs font-semibold text-body">
          <span className="h-px flex-1 bg-line" />
          or continue with
          <span className="h-px flex-1 bg-line" />
        </div>
        <Button
          variant="outline"
          fullWidth
          className="rounded-xl border-0 bg-field hover:bg-[#e2e7fb]"
          onClick={() => setGoogleMessage('Google sign-in will be available once the backend is connected.')}
        >
          Continue with Google
        </Button>
        {googleMessage && <p className="mt-2 text-center text-xs text-body">{googleMessage}</p>}
      </Card>
    </div>
  );
}
