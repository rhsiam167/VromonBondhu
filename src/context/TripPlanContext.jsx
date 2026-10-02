import { createContext, useContext, useState } from 'react';

/**
 * TRIP PLAN CONTEXT
 * -----------------
 * Holds everything the user enters across the 6 planning steps, so that:
 *  - going Back/Next never loses data,
 *  - the Review step can show the real answers,
 *  - "Edit" links can jump back to any step.
 *
 * It also holds the most recently generated trip.
 * Everything lives in memory (lost on page refresh) — fine for this phase.
 */

/** Starting values for a brand-new plan. */
export const EMPTY_PLAN = {
  // Step 1 – Trip Details
  from: '',
  destination: '',
  days: 4,
  nights: 3,
  travelers: 2,
  startDate: '',
  // Step 2 – Budget
  budget: 15000,
  budgetMode: 'strict',
  budgetCovers: ['transportation', 'accommodation', 'food', 'activities'],
  // Step 3 – Interests (ranked: first = most important)
  interests: [],
  // Step 4 – Preferences
  travelStyle: 'balanced',
  transport: [],
  food: [],
  accommodation: 'mid-range',
  crowd: 'balanced',
  notes: '',
};

const TripPlanContext = createContext(null);

export function TripPlanProvider({ children }) {
  const [plan, setPlan] = useState(EMPTY_PLAN);
  const [generatedTrip, setGeneratedTrip] = useState(null);
  // The last generator result that could not fit the budget (shown on the Infeasible Budget page).
  const [infeasibleResult, setInfeasibleResult] = useState(null);

  /** Change some fields, e.g. updatePlan({ budget: 20000 }) */
  function updatePlan(changes) {
    setPlan((previous) => ({ ...previous, ...changes }));
  }

  /** Start over with a blank plan (used by "Plan a New Trip"). */
  function resetPlan(changes = {}) {
    setPlan({ ...EMPTY_PLAN, ...changes });
    setGeneratedTrip(null);
    setInfeasibleResult(null);
  }

  return (
    <TripPlanContext.Provider
      value={{ plan, updatePlan, resetPlan, generatedTrip, setGeneratedTrip, infeasibleResult, setInfeasibleResult }}
    >
      {children}
    </TripPlanContext.Provider>
  );
}

/** Use inside any component: const { plan, updatePlan } = useTripPlan(); */
export function useTripPlan() {
  return useContext(TripPlanContext);
}
