import { useEffect, useRef } from 'react';
import Card from '../Card';
import OptionCard from '../OptionCard';
import ToggleChip from '../ToggleChip';
import {
  ACCOMMODATION_TIERS,
  CROWD_OPTIONS,
  FOOD_OPTIONS,
  TRANSPORT_OPTIONS,
  TRAVEL_STYLES,
} from '../../data/planningOptions';

/**
 * PREFERENCES FORM — step 4 fields (pace, transport, food, stay, crowd, notes).
 * Used by the Preferences step AND the "Preferences" tab of the Edit pop-up.
 *
 * Props:
 *  values, onChange(changes), framed (see TripDetailsForm)
 *  focusNotes – true to scroll to and focus "Additional Requirements" on open
 */
export default function PreferencesForm({ values, onChange, framed = true, focusNotes = false }) {
  const Wrapper = framed ? Card : 'div';
  const notesRef = useRef(null);

  useEffect(() => {
    if (!focusNotes || !notesRef.current) return;
    notesRef.current.scrollIntoView({ block: 'center' });
    notesRef.current.focus({ preventScroll: true });
  }, [focusNotes]);

  /** Add or remove `id` from a multi-select list like values.transport. */
  function toggleIn(field, id) {
    const list = values[field];
    onChange({ [field]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
  }

  return (
    <>
      <Wrapper {...(framed ? { padding: 'px-6 py-8 sm:px-8' } : {})} className="space-y-9">
        <Section title="Travel Style">
          <div className="grid gap-4 sm:grid-cols-3">
            {TRAVEL_STYLES.map((style) => (
              <OptionCard key={style.id} selected={values.travelStyle === style.id} onClick={() => onChange({ travelStyle: style.id })} title={style.label} description={style.description} className="min-h-24" />
            ))}
          </div>
        </Section>

        <Section title="Transportation Preference" hint="Select all that apply.">
          <div className="flex flex-wrap gap-2.5">
            {TRANSPORT_OPTIONS.map((option) => (
              <ToggleChip key={option.id} selected={values.transport.includes(option.id)} onClick={() => toggleIn('transport', option.id)}>
                {option.label}
              </ToggleChip>
            ))}
          </div>
        </Section>

        <Section title="Food Preferences" hint="Select all that apply.">
          <div className="flex flex-wrap gap-2.5">
            {FOOD_OPTIONS.map((option) => (
              <ToggleChip key={option.id} selected={values.food.includes(option.id)} onClick={() => toggleIn('food', option.id)}>
                {option.label}
              </ToggleChip>
            ))}
          </div>
        </Section>

        <Section title="Accommodation Preference">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {ACCOMMODATION_TIERS.map((tier) => (
              <OptionCard key={tier.id} centered selected={values.accommodation === tier.id} onClick={() => onChange({ accommodation: tier.id })} title={tier.label} />
            ))}
          </div>
        </Section>

        <Section title="Crowd Preference">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {CROWD_OPTIONS.map((option) => (
              <OptionCard key={option.id} centered selected={values.crowd === option.id} onClick={() => onChange({ crowd: option.id })} title={option.label} className="flex min-h-20 items-center justify-center" />
            ))}
          </div>
        </Section>
      </Wrapper>

      <Wrapper {...(framed ? { padding: 'px-6 py-7' } : {})} className="mt-6">
        <label htmlFor="notes" className="mb-3 block font-heading text-xl font-semibold">Additional Requirements (Optional)</label>
        <textarea
          ref={notesRef}
          id="notes"
          rows={4}
          className="field resize-none border border-gray-200 py-3"
          placeholder="e.g. I want to spend more time at the beach and avoid very crowded places."
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </Wrapper>
    </>
  );
}

function Section({ title, hint, children }) {
  return (
    <section>
      <h2 className={`text-xl font-medium ${hint ? '' : 'mb-3'}`}>{title}</h2>
      {hint && <p className="mb-3 text-[13px] text-body">{hint}</p>}
      {children}
    </section>
  );
}
