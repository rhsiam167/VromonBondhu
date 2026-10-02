import { useNavigate } from 'react-router-dom';
import { useTripPlan } from '../context/TripPlanContext';
import { useAuth } from '../context/AuthContext';
import { useSavedTrips } from '../context/SavedTripsContext';
import { generateTrip } from '../services/tripGenerator';

/**
 * Shows the result of generateTrip(): the Trip Overview when it worked, or the
 * Infeasible Budget page when the trip can't fit the budget.
 *  showResult(result) – for a result you already have (Generating page)
 *  replan(inputs)     – run generateTrip again and show the new result
 *
 * If the planning request itself failed (status "error"), replan() sends you to
 * the Generating page, which tries again and shows the error with "Try Again".
 */
export default function usePlanRunner() {
  const navigate = useNavigate();
  const { setGeneratedTrip, setInfeasibleResult } = useTripPlan();
  const { isLoggedIn } = useAuth();
  const { recordPlannedTrip } = useSavedTrips();

  function showResult(result) {
    if (result.status === 'infeasible') {
      setInfeasibleResult(result);
      navigate('/plan/infeasible', { replace: true });
      return;
    }
    // (The old infeasible result is left as is: clearing it here would make the
    // Infeasible page redirect to Review before this navigation happens.)
    setGeneratedTrip(result.trip);
    // Logged in → the trip appears under "Recently Planned" in My Trips.
    // (If recording fails, the trip is still shown; the user can press Save Trip.)
    if (isLoggedIn) recordPlannedTrip(result.trip).catch(() => {});
    navigate(`/trip/${result.trip.id}`, { replace: true });
  }

  async function replan(inputs) {
    const result = await generateTrip(inputs);
    if (result.status === 'error') navigate('/plan/generating');
    else showResult(result);
    return result;
  }

  return { showResult, replan };
}
