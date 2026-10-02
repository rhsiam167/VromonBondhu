import { useLocation, useNavigate } from 'react-router-dom';
import { useTripPlan } from '../context/TripPlanContext';
import { useSavedTrips } from '../context/SavedTripsContext';

/**
 * After a successful log in / sign up, decide where to go next.
 * If the user pressed "Save Trip" while logged out, that trip is saved to the
 * backend now and they land on My Trips. Otherwise they go to Home.
 */
export default function useFinishAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { generatedTrip } = useTripPlan();
  const { saveTrip } = useSavedTrips();

  const wantsToSave = location.state?.saveTrip === true && generatedTrip;

  async function finishAuth() {
    if (!wantsToSave) {
      navigate(location.state?.from || '/home');
      return;
    }
    try {
      await saveTrip(generatedTrip);
      navigate('/my-trips');
    } catch {
      // Saving failed (e.g. the server is down) — go back to the trip so they can try again.
      navigate(`/trip/${generatedTrip.id}`);
    }
  }

  return { finishAuth, wantsToSave };
}
