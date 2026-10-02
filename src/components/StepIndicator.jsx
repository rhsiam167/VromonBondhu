import { Link } from 'react-router-dom';
import { PLANNING_STEPS } from '../data/planningOptions';
import Icon from './Icons';

/**
 * STEP INDICATOR — the 1-to-6 progress tracker on the planning screens.
 *
 * Props:
 *  currentStep – number from 1 to 6
 *
 * Finished steps show a check mark and can be clicked to go back.
 */
export default function StepIndicator({ currentStep }) {
  return (
    <nav aria-label="Planning progress" className="mx-auto w-full max-w-3xl px-2">
      <ol className="flex items-start">
        {PLANNING_STEPS.map((step, index) => {
          const done = step.number < currentStep;
          const active = step.number === currentStep;
          const isLast = index === PLANNING_STEPS.length - 1;

          const circle = (
            <span
              className={[
                'flex items-center justify-center rounded-full font-heading font-semibold transition',
                done ? 'h-9 w-9 bg-lime text-ink' : '',
                active ? 'h-10 w-10 bg-lime text-lg text-ink ring-4 ring-lime/30' : '',
                !done && !active ? 'h-9 w-9 border border-line bg-white text-sm text-body' : '',
              ].join(' ')}
            >
              {done ? <Icon name="check" className="h-4 w-4" strokeWidth={2.5} /> : step.number}
            </span>
          );

          return (
            <li key={step.number} className="relative flex flex-1 flex-col items-center">
              {/* connecting line to the next step */}
              {!isLast && (
                <span
                  className={`absolute left-1/2 top-[18px] h-0.5 w-full ${done ? 'bg-lime' : 'bg-line'}`}
                  aria-hidden="true"
                />
              )}
              <span className="relative z-10 flex h-10 items-center">
                {done ? (
                  <Link to={step.path} aria-label={`Go back to ${step.label}`}>
                    {circle}
                  </Link>
                ) : (
                  circle
                )}
              </span>
              <span
                className={`mt-2 text-center text-[11px] sm:text-xs ${active ? 'font-semibold text-ink' : 'text-body'}`}
                aria-current={active ? 'step' : undefined}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
