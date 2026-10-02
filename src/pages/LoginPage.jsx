import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import AuthCard from '../components/AuthCard';
import FormField from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import useFinishAuth from '../hooks/useFinishAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const { finishAuth, wantsToSave } = useFinishAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [forgotMessage, setForgotMessage] = useState('');
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Please enter a valid email address.';
    if (!form.password) found.password = 'Please enter your password.';
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: form.email, password: form.password });
      await finishAuth();
    } catch (error) {
      // e.g. "Incorrect email or password." or "Too many failed login attempts…"
      setServerError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <AuthCard
        title="Welcome Back"
        subtitle="Log in to access your saved trips and continue planning."
        notice={wantsToSave ? 'Log in to save your trip.' : null}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <FormField label="Email Address" htmlFor="email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className="field py-3" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }} />
          </FormField>
          <FormField label="Password" htmlFor="password" error={errors.password}>
            <PasswordInput id="password" autoComplete="current-password" placeholder="Enter your password" className="field py-3" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: undefined }); }} />
          </FormField>
          <div className="-mt-2 text-right">
            <Button variant="text" size="sm" onClick={() => setForgotMessage('Password reset isn’t available yet.')}>
              Forgot Password?
            </Button>
            {forgotMessage && <p className="mt-1 text-xs text-body">{forgotMessage}</p>}
          </div>
          {serverError && <p className="text-center text-sm font-medium text-red-600" role="alert">{serverError}</p>}
          <Button type="submit" fullWidth className="rounded-xl py-3" disabled={submitting}>
            {submitting ? 'Logging In…' : 'Log In'}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-body">
          Don&apos;t have an account?{' '}
          <Link to="/register" state={wantsToSave ? { saveTrip: true } : undefined} className="font-medium text-olive hover:underline">Sign Up</Link>
        </p>
      </AuthCard>
    </PageLayout>
  );
}
