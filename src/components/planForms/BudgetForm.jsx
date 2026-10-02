import Card from '../Card';
import OptionCard from '../OptionCard';
import ToggleChip from '../ToggleChip';
import { BUDGET_COVERS, BUDGET_LIMITS, BUDGET_MODES } from '../../data/planningOptions';
import { findDestinationByName } from '../../data/destinations';
import { estimateBudgetRange } from '../../services/budgetEstimate';
import { formatTaka, plural } from '../../utils/format';

/**
 * BUDGET FORM — step 2 fields. Used by the Budget step AND the "Budget" tab
 * of the Edit pop-up.
 *
 * Props: values, onChange(changes), errors { budget, covers }, framed (see TripDetailsForm)
 */
export default function BudgetForm({ values, onChange, errors = {}, framed = true }) {
  const Wrapper = framed ? Card : 'div';
  const destination = findDestinationByName(values.destination);
  const range = estimateBudgetRange(values);
  const sliderPercent = ((values.budget - BUDGET_LIMITS.min) / (BUDGET_LIMITS.max - BUDGET_LIMITS.min)) * 100;

  function toggleCover(id) {
    const covers = values.budgetCovers.includes(id)
      ? values.budgetCovers.filter((c) => c !== id)
      : [...values.budgetCovers, id];
    onChange({ budgetCovers: covers });
  }

  return (
    <>
      <Wrapper {...(framed ? { padding: 'px-6 py-8 sm:px-8' } : {})} className="space-y-8">
        <div>
          <label htmlFor="budget" className="mb-3 block text-sm font-medium">Total Trip Budget</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-lime">
            <span className="text-xl text-ink/70">৳</span>
            <input
              id="budget"
              type="number"
              min={BUDGET_LIMITS.min}
              max={BUDGET_LIMITS.max * 5}
              step={BUDGET_LIMITS.step}
              className="w-full bg-transparent font-heading text-xl outline-none"
              value={values.budget}
              onChange={(e) => onChange({ budget: Number(e.target.value) || 0 })}
            />
          </div>
          <input
            type="range"
            aria-label="Budget slider"
            min={BUDGET_LIMITS.min}
            max={BUDGET_LIMITS.max}
            step={BUDGET_LIMITS.step}
            value={Math.min(values.budget, BUDGET_LIMITS.max)}
            onChange={(e) => onChange({ budget: Number(e.target.value) })}
            className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full accent-lime"
            style={{ background: `linear-gradient(to right, var(--color-lime) ${sliderPercent}%, #e5e3e3 ${sliderPercent}%)` }}
          />
          <div className="mt-1 flex justify-between text-sm text-body">
            <span>{formatTaka(BUDGET_LIMITS.min)}</span>
            <span>{formatTaka(BUDGET_LIMITS.max)}</span>
          </div>
          {errors.budget && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.budget}</p>}
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Budget Mode</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {BUDGET_MODES.map((mode) => (
              <OptionCard key={mode.id} selected={values.budgetMode === mode.id} onClick={() => onChange({ budgetMode: mode.id })} title={mode.label} description={mode.description} className="py-5" />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium">This budget covers</p>
          <p className="mb-4 text-[13px] text-body">Select all that apply.</p>
          <div className="flex flex-wrap gap-3">
            {BUDGET_COVERS.map((cover) => (
              <ToggleChip key={cover.id} selected={values.budgetCovers.includes(cover.id)} onClick={() => toggleCover(cover.id)}>
                {cover.label}
              </ToggleChip>
            ))}
          </div>
          {errors.covers && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{errors.covers}</p>}
        </div>
      </Wrapper>

      {range && (
        <div className={`rounded-2xl bg-lime-soft px-5 py-4 ${framed ? 'mt-1' : 'mt-6'}`}>
          <p className="text-sm font-semibold">Estimated Range for Your Trip</p>
          <p className="mt-1 text-[13px] text-ink/70">
            Based on typical prices in {destination.name}, a comfortable budget for {plural(values.days, 'day')} is{' '}
            {formatTaka(range.low)} – {formatTaka(range.high)} for {plural(values.travelers, 'traveler')}.
          </p>
        </div>
      )}
    </>
  );
}
