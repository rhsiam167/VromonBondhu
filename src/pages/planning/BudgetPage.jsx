import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanningLayout from '../../components/PlanningLayout';
import BudgetForm from '../../components/planForms/BudgetForm';
import { useTripPlan } from '../../context/TripPlanContext';
import { validateBudget } from '../../services/planValidation';

/** STEP 2 — total budget, strict/flexible, and what it covers. */
export default function BudgetPage() {
  const navigate = useNavigate();
  const { plan, updatePlan } = useTripPlan();
  const [errors, setErrors] = useState({});

  function handleContinue() {
    const { errors: found } = validateBudget(plan);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    navigate('/plan/interests');
  }

  return (
    <PlanningLayout
      step={2}
      title="What's Your Budget?"
      subtitle="This helps us recommend places, stays, and activities that actually fit."
      backTo="/plan/details"
      continueLabel="Continue to Interests"
      onContinue={handleContinue}
    >
      <BudgetForm
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
