import { useNavigate } from 'react-router-dom';
import PlanningLayout from '../../components/PlanningLayout';
import PreferencesForm from '../../components/planForms/PreferencesForm';
import { useTripPlan } from '../../context/TripPlanContext';

/** STEP 4 — pace, transport, food, stay and crowd preferences. */
export default function PreferencesPage() {
  const navigate = useNavigate();
  const { plan, updatePlan } = useTripPlan();

  return (
    <PlanningLayout
      step={4}
      title="How Do You Like to Travel?"
      subtitle="A few more details help us fine-tune the pace, food, and stays in your plan."
      backTo="/plan/interests"
      continueLabel="Continue to Review"
      onContinue={() => navigate('/plan/review')}
      width="max-w-3xl"
    >
      <PreferencesForm values={plan} onChange={updatePlan} />
    </PlanningLayout>
  );
}
