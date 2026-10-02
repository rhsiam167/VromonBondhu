import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlanningLayout from '../../components/PlanningLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import {
  ACCOMMODATION_TIERS,
  BUDGET_COVERS,
  BUDGET_MODES,
  CROWD_OPTIONS,
  FOOD_OPTIONS,
  INTERESTS,
  TRANSPORT_OPTIONS,
  TRAVEL_STYLES,
  labelFor,
} from '../../data/planningOptions';
import { findDestinationByName, findStartingCityByName } from '../../data/destinations';
import EditPlanModal from '../../components/EditPlanModal';
import { useTripPlan } from '../../context/TripPlanContext';
import { formatDuration, formatTaka } from '../../utils/format';

/** STEP 5 — show everything the user entered. "Edit" opens the Edit pop-up. */
export default function ReviewPage() {
  const navigate = useNavigate();
  const { plan, updatePlan } = useTripPlan();
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // { tab, focus } while the pop-up is open

  const list = (options, ids) => (ids.length ? ids.map((id) => labelFor(options, id)).join(', ') : 'No preference');

  function handleGenerate() {
    // Make sure the essentials are there before generating.
    if (!findStartingCityByName(plan.from) || !findDestinationByName(plan.destination)) {
      return setError('Please complete your trip details first.');
    }
    if (plan.interests.length === 0) return setError('Please select at least one interest first.');
    navigate('/plan/generating');
  }

  return (
    <PlanningLayout
      step={5}
      title="Review Your Trip"
      subtitle="Make sure everything looks right before we build your itinerary."
      backTo="/plan/preferences"
      continueLabel="Generate My Trip"
      onContinue={handleGenerate}
      width="max-w-3xl"
    >
      <div className="space-y-5">
        <ReviewCard title="Trip Details" onEdit={() => setEditing({ tab: 'details' })}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Item label="From" value={plan.from || '—'} />
            <Item label="To" value={plan.destination || '—'} />
            <Item label="Duration" value={formatDuration(plan.days, plan.nights)} />
            <Item label="Travelers" value={plan.travelers} />
            {plan.startDate && <Item label="Start Date" value={new Date(plan.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />}
          </div>
        </ReviewCard>

        <ReviewCard title="Budget" onEdit={() => setEditing({ tab: 'budget' })}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Item label="Total Budget" value={formatTaka(plan.budget)} />
            <Item label="Budget Mode" value={labelFor(BUDGET_MODES, plan.budgetMode).replace(' Budget', '')} />
            <Item label="Covers" value={list(BUDGET_COVERS, plan.budgetCovers)} />
          </div>
        </ReviewCard>

        <ReviewCard title="Interests" onEdit={() => setEditing({ tab: 'interests' })}>
          {plan.interests.length ? (
            <div className="flex flex-wrap gap-2.5">
              {plan.interests.map((id, i) => (
                <span key={id} className="rounded-full bg-field px-4 py-1.5 text-sm font-semibold">
                  {i + 1}. {labelFor(INTERESTS, id)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-body">No interests selected yet.</p>
          )}
        </ReviewCard>

        <ReviewCard title="Preferences" onEdit={() => setEditing({ tab: 'preferences' })}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Item label="Travel Style" value={labelFor(TRAVEL_STYLES, plan.travelStyle)} />
            <Item label="Transportation" value={list(TRANSPORT_OPTIONS, plan.transport)} />
            <Item label="Food" value={list(FOOD_OPTIONS, plan.food)} />
            <Item label="Accommodation" value={labelFor(ACCOMMODATION_TIERS, plan.accommodation)} />
            <Item label="Crowd Preference" value={labelFor(CROWD_OPTIONS, plan.crowd)} />
          </div>
        </ReviewCard>

        <ReviewCard title="Additional Requirements" onEdit={() => setEditing({ tab: 'preferences', focus: 'notes' })}>
          <p className="rounded-xl bg-field px-4 py-3.5 text-[15px]">{plan.notes || 'None'}</p>
        </ReviewCard>

        {error && <p className="text-center text-sm font-medium text-red-600" role="alert">{error}</p>}
      </div>

      {editing && (
        <EditPlanModal
          initialTab={editing.tab}
          focusField={editing.focus}
          onClose={() => setEditing(null)}
          onSave={(draft) => {
            updatePlan(draft);
            setError('');
            setEditing(null);
          }}
        />
      )}
    </PlanningLayout>
  );
}

function ReviewCard({ title, onEdit, children }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between border-b border-[#e3e8f4] pb-3">
        <h2 className="text-xl font-medium">{title}</h2>
        <Button variant="text" size="sm" onClick={onEdit}>Edit</Button>
      </div>
      {children}
    </Card>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink/70">{label}</p>
      <p className="mt-1 text-[15px] font-medium">{value}</p>
    </div>
  );
}
