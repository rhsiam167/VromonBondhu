import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Icon from '../../components/Icons';
import { useTripPlan } from '../../context/TripPlanContext';
import { PLANNING_FAILED_MESSAGE, generateTrip } from '../../services/tripGenerator';
import usePlanRunner from '../../hooks/usePlanRunner';

const STAGES = [
  'Analyzing your preferences',
  'Matching places to your interests',
  'Optimizing your route',
  'Checking your budget',
  'Finalizing your itinerary',
];
const STAGE_DURATION_MS = 800;

/**
 * STEP 6 — loading screen. Calls generateTrip() (the backend planner), then
 * opens the Trip Overview — or the Infeasible Budget page when the trip
 * can't fit the budget.
 *
 * If the request fails:
 *  - network/server problem → "Something went wrong…" with a Try Again button
 *    that sends the same request again
 *  - invalid inputs (HTTP 422) → the backend's reason, and a way back to Review
 */
export default function GeneratingPage() {
  const { plan } = useTripPlan();
  const { showResult } = usePlanRunner();
  const [stage, setStage] = useState(0);
  const [failure, setFailure] = useState(null); // { type: 'network' | 'validation', message }
  const [attempt, setAttempt] = useState(0); // bumping this re-runs the request

  useEffect(() => {
    if (!plan.destination) return undefined;
    let cancelled = false;
    setStage(0);
    setFailure(null);

    // Advance the checklist animation.
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length)), STAGE_DURATION_MS);
    const minimumWait = new Promise((resolve) => setTimeout(resolve, STAGE_DURATION_MS * STAGES.length));

    Promise.all([generateTrip(plan), minimumWait])
      .then(([result]) => {
        if (cancelled) return;
        if (result.status === 'error') setFailure({ type: result.errorType, message: result.message });
        else showResult(result);
      })
      .catch(() => {
        if (!cancelled) setFailure({ type: 'network', message: PLANNING_FAILED_MESSAGE });
      });

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // Run when the page opens, and again on "Try Again".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // Nothing to generate (e.g. page opened directly) → start of the flow.
  if (!plan.destination) return <Navigate to="/plan/details" replace />;

  const progress = Math.round((stage / STAGES.length) * 100);

  return (
    <PageLayout>
      <div className="px-4 py-16 sm:py-24">
        <Card padding="px-6 py-12 sm:px-14" className="mx-auto max-w-xl text-center">
          {failure?.type === 'network' && (
            <>
              <p className="text-lg font-medium text-ink">{PLANNING_FAILED_MESSAGE}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" to="/plan/review">Back to Review</Button>
                <Button onClick={() => setAttempt((n) => n + 1)}>Try Again</Button>
              </div>
            </>
          )}

          {failure?.type === 'validation' && (
            <>
              <h1 className="text-2xl font-bold">We couldn’t plan this trip</h1>
              <p className="mt-3 text-body">{failure.message}</p>
              <Button to="/plan/review" className="mt-6">Back to Review</Button>
            </>
          )}

          {!failure && (
            <>
              <Spinner className="mx-auto h-12 w-12" />
              <h1 className="mt-8 text-3xl font-bold sm:text-4xl">Building Your Perfect Trip</h1>
              <p className="mx-auto mt-3 max-w-sm text-body">
                This usually takes a few seconds. We&apos;re matching places to what matters most to you.
              </p>

              <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-[#e3e8f7]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-lime transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>

              <ul className="mx-auto mt-8 w-fit space-y-4 text-left">
                {STAGES.map((label, i) => {
                  const done = i < stage;
                  const current = i === stage;
                  return (
                    <li key={label} className="flex items-center gap-3">
                      {done && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime">
                          <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                      {current && <Spinner className="h-6 w-6" />}
                      {!done && !current && <span className="h-6 w-6 rounded-full bg-[#e3e8f7]" />}
                      <span className={current ? 'font-semibold' : done ? 'text-ink' : 'text-body'}>{label}</span>
                    </li>
                  );
                })}
              </ul>

              <p className="mt-8 text-sm italic text-body">Please don&apos;t close this page.</p>
            </>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}

function Spinner({ className }) {
  return (
    <span className={`block animate-spin rounded-full border-4 border-gray-100 border-t-lime border-l-lime ${className}`} aria-hidden="true" />
  );
}
