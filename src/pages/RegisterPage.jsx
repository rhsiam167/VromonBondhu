import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import AuthCard from '../components/AuthCard';
import FormField from '../components/FormField';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import useFinishAuth from '../hooks/useFinishAuth';

const EMPTY_FORM = { name: '', email: '', password: '', confirm: '', agreed: false };

export default function RegisterPage() {
  const { register } = useAuth();
  const { finishAuth, wantsToSave } = useFinishAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Update a field and clear its error message straight away (e.g. ticking the terms box).
  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!form.name.trim()) found.name = 'Please enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Please enter a valid email address.';
    if (form.password.length < 8) found.password = 'Must be at least 8 characters.';
    if (form.confirm !== form.password) found.confirm = 'Passwords do not match.';
    if (!form.agreed) found.agreed = 'Please accept the terms to continue.';
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      await finishAuth();
    } catch (error) {
      // e.g. "An account with this email already exists. Please log in instead."
      setServerError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <PageLayout>
      <AuthCard
        title="Create Your Account"
        subtitle="Start planning trips that are actually built around you."
        notice={wantsToSave ? 'Create an account to save your trip.' : null}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Full Name" htmlFor="name" error={errors.name}>
            <input id="name" autoComplete="name" placeholder="Enter your full name" className="field" value={form.name} onChange={set('name')} />
          </FormField>
          <FormField label="Email Address" htmlFor="email" error={errors.email}>
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" className="field" value={form.email} onChange={set('email')} />
          </FormField>
          <FormField label="Password" htmlFor="password" hint="Must be at least 8 characters." error={errors.password}>
            <PasswordInput id="password" autoComplete="new-password" placeholder="Create a password" className="field" value={form.password} onChange={set('password')} />
          </FormField>
          <FormField label="Confirm Password" htmlFor="confirm" error={errors.confirm}>
            <PasswordInput id="confirm" autoComplete="new-password" placeholder="Re-enter your password" className="field" value={form.confirm} onChange={set('confirm')} />
          </FormField>
          <FormField error={errors.agreed}>
            <label className="flex items-center gap-2.5 text-sm text-body">
              <input type="checkbox" checked={form.agreed} onChange={set('agreed')} className="h-5 w-5 rounded accent-lime" />
              I agree to the Terms of Service and Privacy Policy
            </label>
          </FormField>
          {serverError && <p className="text-center text-sm font-medium text-red-600" role="alert">{serverError}</p>}
          <Button type="submit" size="lg" fullWidth className="rounded-xl font-medium" disabled={submitting}>
            {submitting ? 'Creating Account…' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-body">
          Already have an account?{' '}
          <Link to="/login" state={wantsToSave ? { saveTrip: true } : undefined} className="font-semibold text-olive hover:underline">Log In</Link>
        </p>
      </AuthCard>
    </PageLayout>
  );
}
