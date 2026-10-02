import Card from '../Card';
import FormField from '../FormField';
import ToggleChip from '../ToggleChip';
import Icon from '../Icons';
import AutocompleteInput from '../AutocompleteInput';
import destinations, { getFeaturedDestinations, getStartingCities } from '../../data/destinations';

/**
 * TRIP DETAILS FORM — step 1 fields. Used by the Trip Details step AND the
 * "Trip Details" tab of the Edit pop-up.
 *
 * Props:
 *  values   – the plan (or the pop-up's draft copy of it)
 *  onChange – called with the changed fields, e.g. onChange({ travelers: 3 })
 *  errors   – { from, destination, duration } from services/planValidation.js
 *  framed   – true to wrap the fields in a Card (step page), false inside the pop-up
 */
const STARTING_CITY_NAMES = getStartingCities().map((d) => d.name);
const DESTINATION_NAMES = destinations.map((d) => d.name);

export default function TripDetailsForm({ values, onChange, errors = {}, framed = true }) {
  const Wrapper = framed ? Card : 'div';

  function setDays(value) {
    const days = Math.max(1, Math.min(14, Number(value) || 1));
    // Keep nights in step with days (usually one fewer).
    onChange({ days, nights: Math.max(0, days - 1) });
  }

  function setTravelers(count) {
    onChange({ travelers: Math.max(1, Math.min(20, count)) });
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Wrapper className="space-y-6">
        <FormField label="Starting Location" htmlFor="from" error={errors.from}>
          <AutocompleteInput
            id="from"
            placeholder="e.g. Dhaka"
            value={values.from}
            onChange={(text) => onChange({ from: text })}
            options={STARTING_CITY_NAMES}
            invalid={!!errors.from}
          />
        </FormField>

        <FormField label="Destination" htmlFor="destination" hint="Not sure yet? Browse popular destinations below." error={errors.destination}>
          <AutocompleteInput
            id="destination"
            placeholder="e.g. Cox's Bazar"
            value={values.destination}
            onChange={(text) => onChange({ destination: text })}
            options={DESTINATION_NAMES}
            invalid={!!errors.destination}
          />
        </FormField>

        <FormField label="Trip Duration" error={errors.duration}>
          <div className="grid grid-cols-2 gap-4">
            <NumberWithSuffix id="days" label="Days" min={1} max={14} value={values.days} onChange={setDays} />
            <NumberWithSuffix
              id="nights"
              label="Nights"
              min={0}
              max={14}
              value={values.nights}
              onChange={(v) => onChange({ nights: Math.max(0, Math.min(14, Number(v) || 0)) })}
            />
          </div>
        </FormField>

        <FormField label="Number of Travelers">
          <div className="flex items-center justify-between rounded-xl bg-field p-1.5">
            <StepperButton label="Fewer travelers" icon="minus" onClick={() => setTravelers(values.travelers - 1)} disabled={values.travelers <= 1} />
            <span className="font-heading text-xl font-semibold" aria-live="polite">{values.travelers}</span>
            <StepperButton label="More travelers" icon="plus" onClick={() => setTravelers(values.travelers + 1)} disabled={values.travelers >= 20} />
          </div>
        </FormField>

        <FormField label="Travel Dates (optional)" htmlFor="startDate">
          <input id="startDate" type="date" min={today} className="field" value={values.startDate} onChange={(e) => onChange({ startDate: e.target.value })} />
        </FormField>
      </Wrapper>

      <div className={`flex flex-wrap items-center gap-2 ${framed ? 'mt-5 justify-center' : 'mt-6'}`}>
        <span className="mr-1 text-sm font-semibold">Or pick a popular destination:</span>
        {getFeaturedDestinations().map((d) => (
          <ToggleChip key={d.id} showCheck={false} selected={values.destination === d.name} onClick={() => onChange({ destination: d.name })}>
            {d.name}
          </ToggleChip>
        ))}
      </div>
    </>
  );
}

/** Number input with a small unit label on the right ("Days", "Nights"). */
function NumberWithSuffix({ id, label, value, onChange, min, max }) {
  return (
    <div className="relative">
      <input id={id} type="number" min={min} max={max} aria-label={label} className="field pr-16" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-body">{label}</span>
    </div>
  );
}

/** The white − / + square buttons of the travelers counter. */
function StepperButton({ label, icon, onClick, disabled }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm transition hover:bg-gray-50 disabled:opacity-40"
    >
      <Icon name={icon} className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}
