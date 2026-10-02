/**
 * FORM FIELD — a label, the input itself (children), an optional hint and error.
 *
 * <FormField label="Email Address" htmlFor="email" error={errors.email}>
 *   <input id="email" className="field" ... />
 * </FormField>
 */
export default function FormField({ label, htmlFor, hint, error, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-ink/80">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-body">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
