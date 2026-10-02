import PageLayout from './PageLayout';
import StepIndicator from './StepIndicator';
import Button from './Button';

/**
 * PLANNING LAYOUT — the shared frame for steps 1–5 of the planning flow:
 * step tracker, title, subtitle, the step's content, and Back / Continue.
 *
 * Props:
 *  step          – current step number (1–6)
 *  title, subtitle
 *  backTo        – page to go to when "Back" is pressed
 *  continueLabel – text on the main button, e.g. "Continue to Budget"
 *  onContinue    – called when the main button is pressed
 *  width         – max width class for the content column
 */
export default function PlanningLayout({
  step,
  title,
  subtitle,
  backTo,
  continueLabel,
  onContinue,
  width = 'max-w-2xl',
  children,
}) {
  return (
    <PageLayout>
      <div className="px-4 pb-16 pt-10 sm:pt-16">
        <StepIndicator currentStep={step} />

        <div className={`mx-auto mt-10 ${width}`}>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
            {subtitle && <p className="mx-auto mt-3 max-w-xl text-base text-body sm:text-lg">{subtitle}</p>}
          </div>

          {children}

          <div className="mt-8 flex items-center justify-between gap-4">
            <Button variant="outline" to={backTo}>
              Back
            </Button>
            <Button onClick={onContinue}>{continueLabel}</Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
