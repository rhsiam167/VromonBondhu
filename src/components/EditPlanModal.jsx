import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import Icon from './Icons';
import TripDetailsForm from './planForms/TripDetailsForm';
import BudgetForm from './planForms/BudgetForm';
import InterestsForm from './planForms/InterestsForm';
import PreferencesForm from './planForms/PreferencesForm';
import { useTripPlan } from '../context/TripPlanContext';
import {
  validateBudget,
  validateInterests,
  validatePreferences,
  validateTripDetails,
} from '../services/planValidation';

/**
 * EDIT PLAN MODAL — "Edit Your Trip" pop-up, shared by the Review and
 * Infeasible Budget pages. It edits a DRAFT copy of the plan; nothing in the
 * planning context changes until the save button is pressed.
 *
 * Props:
 *  initialTab – 'details' | 'budget' | 'interests' | 'preferences'
 *  focusField – 'notes' to open Preferences scrolled to Additional Requirements
 *  saveLabel  – text on the primary button (default "Save Changes")
 *  busyLabel  – text on it while saving (default "Saving…")
 *  onSave(draft) – called with the validated draft; may return a Promise
 *  onClose()  – called on Cancel, Escape, the × button, or a click outside
 */
const TABS = [
  { id: 'details', label: 'Trip Details', validate: validateTripDetails },
  { id: 'budget', label: 'Budget', validate: validateBudget },
  { id: 'interests', label: 'Interests', validate: validateInterests },
  { id: 'preferences', label: 'Preferences', validate: validatePreferences },
];

export default function EditPlanModal({
  initialTab = 'details',
  focusField,
  saveLabel = 'Save Changes',
  busyLabel = 'Saving…',
  onSave,
  onClose,
}) {
  const { plan } = useTripPlan();
  const [draft, setDraft] = useState(() => ({ ...plan }));
  const [tab, setTab] = useState(initialTab);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);

  // Lock the page behind the pop-up and move focus into it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (focusField !== 'notes') panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [focusField]);

  function change(changes) {
    setDraft((d) => ({ ...d, ...changes }));
    setErrors((e) => ({ ...e, [tab]: {} }));
  }

  async function handleSave() {
    // Validate every tab exactly like the step pages do.
    let changes = {};
    const found = {};
    for (const t of TABS) {
      const result = t.validate(draft);
      found[t.id] = result.errors;
      changes = { ...changes, ...result.changes };
    }
    setErrors(found);
    const firstInvalid = TABS.find((t) => Object.keys(found[t.id]).length > 0);
    if (firstInvalid) {
      setTab(firstInvalid.id);
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...draft, ...changes });
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape' && !saving) {
      e.stopPropagation();
      onClose();
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose(); // click outside
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-plan-title"
        tabIndex={-1}
        className="flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl outline-none sm:max-w-3xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5 sm:px-8 sm:pt-7">
          <h2 id="edit-plan-title" className="text-2xl font-bold">Edit Your Trip</h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" className="rounded-full p-2 text-body hover:bg-gray-100">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs — scroll sideways on narrow screens */}
        <div role="tablist" aria-label="Sections to edit" className="flex shrink-0 gap-2 overflow-x-auto whitespace-nowrap border-b border-gray-100 px-5 pb-4 pt-1 sm:px-8">
          {TABS.map((t) => {
            const hasError = errors[t.id] && Object.keys(errors[t.id]).length > 0;
            return (
              <Button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                size="sm"
                variant={tab === t.id ? 'primary' : 'outline'}
                onClick={() => setTab(t.id)}
                className={`shrink-0 !px-5 !py-2 ${hasError ? '!border-red-300 !text-red-600' : ''}`}
              >
                {t.label}
              </Button>
            );
          })}
        </div>

        {/* Body */}
        <div role="tabpanel" className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {tab === 'details' && <TripDetailsForm values={draft} onChange={change} errors={errors.details} framed={false} />}
          {tab === 'budget' && <BudgetForm values={draft} onChange={change} errors={errors.budget} framed={false} />}
          {tab === 'interests' && <InterestsForm values={draft} onChange={change} errors={errors.interests} framed={false} />}
          {tab === 'preferences' && (
            <PreferencesForm values={draft} onChange={change} framed={false} focusNotes={focusField === 'notes'} />
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 px-5 py-4 sm:px-8">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? busyLabel : saveLabel}</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
