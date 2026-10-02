import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanningLayout from '../../components/PlanningLayout';
import InterestsForm from '../../components/planForms/InterestsForm';
import { useTripPlan } from '../../context/TripPlanContext';
import { validateInterests } from '../../services/planValidation';

/** STEP 3 — pick interests, then drag them into order of importance. */
export default function InterestsPage() {
  const navigate = useNavigate();
  const { plan, updatePlan } = useTripPlan();
  const [errors, setErrors] = useState({});

  function handleContinue() {
    const { errors: found } = validateInterests(plan);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    navigate('/plan/preferences');
  }

  return (
    <PlanningLayout
      step={3}
      title="What Do You Care About Most?"
      subtitle="Select what interests you, then rank them — your top pick shapes your plan the most."
      backTo="/plan/budget"
      continueLabel="Continue to Preferences"
      onContinue={handleContinue}
      width="max-w-3xl"
    >
      <InterestsForm
        values={plan}
        onChange={(changes) => {
          setErrors({});
          updatePlan(changes);
        }}
        errors={errors}
      />
    </PlanningLayout>
  );
}
