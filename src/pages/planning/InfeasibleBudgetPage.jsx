import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import PageLayout from '../../components/PageLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatCard from '../../components/StatCard';
import EditPlanModal from '../../components/EditPlanModal';
import { useTripPlan } from '../../context/TripPlanContext';
import usePlanRunner from '../../hooks/usePlanRunner';
import { formatTaka } from '../../utils/format';

/**
 * INFEASIBLE BUDGET — shown instead of the Trip Overview when generateTrip()
 * returns status "infeasible". Every number comes from its budgetReport.
 * Each "What You Can Do" button opens the Edit pop-up; "Save & Re-plan"
 * re-runs the planner straight away without going back through the steps.
 */
const BREAKDOWN_ROWS = [
  { key: 'transportation', label: 'Transportation' },
  { key: 'accommodation', label: 'Accommodation' },
  { key: 'food', label: 'Food' },
  { key: 'activities', label: 'Activities' },
  { key: 'localTransport', label: 'Local Transport' },
  { key: 'miscellaneous', label: 'Miscellaneous' },
];

export default function InfeasibleBudgetPage() {
  const { infeasibleResult, updatePlan } = useTripPlan();
  const { replan } = usePlanRunner();
  const [editTab, setEditTab] = useState(null);
  if (!infeasibleResult) return <Navigate to="/plan/review" replace />;

  const { budget, mode, allowedMaximum, minimumCost, shortfall, overLimit, breakdown } = infeasibleResult.budgetReport;
  const flexible = mode === 'flexible';

  const options = [
    { text: `Raise your budget to at least ${formatTaka(minimumCost)}.`, button: 'Edit Budget', tab: 'budget' },
    { text: 'Switch to a flexible budget.', button: 'Change Budget Mode', tab: 'budget' },
    { text: 'Shorten the trip or reduce the number of travelers.', button: 'Edit Trip Details', tab: 'details' },
    { text: 'Try a different destination.', button: 'Change Destination', tab: 'details' },
  ];

  async function saveAndReplan(draft) {
    updatePlan(draft);
    await replan(draft); // shows the Overview, or this page again with new numbers
    setEditTab(null);
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:pt-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">We Couldn&apos;t Fit This Trip Within Your Budget</h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-body sm:text-lg">
            {flexible
              ? `Your flexible budget of ${formatTaka(budget)} allows up to ${formatTaka(allowedMaximum)}, but the lowest-cost plan we could build for this trip is ${formatTaka(minimumCost)}.`
              : `Your strict budget is ${formatTaka(budget)}, but the lowest-cost plan we could build for this trip is ${formatTaka(minimumCost)}.`}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <StatCard value={formatTaka(budget)} label="Your Budget" />
          <StatCard value={formatTaka(minimumCost)} label="Lowest Possible Cost" />
          {flexible ? (
            <StatCard value={formatTaka(overLimit)} label="Over the Limit by" highlight />
          ) : (
            <StatCard value={formatTaka(shortfall)} label="Shortfall" highlight />
          )}
        </div>

        <Card className="mt-6">
          <h2 className="text-xl font-medium">Lowest-Cost Plan Breakdown</h2>
          <dl className="mt-4 divide-y divide-gray-100">
            {BREAKDOWN_ROWS.map((row) => (
              <div key={row.key} className="flex items-center justify-between py-3">
                <dt className="text-body">{row.label}</dt>
                <dd className="font-medium">{formatTaka(breakdown[row.key])}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="mt-6">
          <h2 className="text-xl font-medium">What You Can Do</h2>
          <ul className="mt-4 divide-y divide-gray-100">
            {options.map((option) => (
              <li key={option.button} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-body">{option.text}</span>
                <Button variant="outline" size="sm" onClick={() => setEditTab(option.tab)} className="shrink-0 self-start sm:self-auto">
                  {option.button}
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="mt-8 flex justify-center">
          <Button to="/plan/review">Back to Review</Button>
        </div>
      </div>

      {editTab && (
        <EditPlanModal
          initialTab={editTab}
          saveLabel="Save & Re-plan"
          busyLabel="Re-planning…"
          onSave={saveAndReplan}
          onClose={() => setEditTab(null)}
        />
      )}
    </PageLayout>
  );
}
