import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanningLayout from '../../components/PlanningLayout';
import TripDetailsForm from '../../components/planForms/TripDetailsForm';
import { useTripPlan } from '../../context/TripPlanContext';
import { validateTripDetails } from '../../services/planValidation';

/** STEP 1 — where from, where to, how long, how many people. */
export default function TripDetailsPage() {
  const navigate = useNavigate();
  const { plan, updatePlan } = useTripPlan();
  const [errors, setErrors] = useState({});

  function handleContinue() {
    const { errors: found, changes } = validateTripDetails(plan);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    updatePlan(changes); // store the exact spelling from the data file
    navigate('/plan/budget');
  }

  return (
    <PlanningLayout
      step={1}
      title="Where Are You Headed?"
      subtitle="Start with the basics — where you're leaving from, where you're going, and for how long."
      backTo="/"
      continueLabel="Continue to Budget"
      onContinue={handleContinue}
    >
      <TripDetailsForm values={plan} onChange={updatePlan} errors={errors} />
    </PlanningLayout>
  );
}
