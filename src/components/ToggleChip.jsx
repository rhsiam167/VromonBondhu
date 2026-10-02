import Icon from './Icons';

/**
 * TOGGLE CHIP — a pill that can be switched on/off
 * (budget covers, transport, food preferences).
 * Selected = lime with a check mark. Unselected = light lavender.
 */
export default function ToggleChip({ selected, onClick, children, showCheck = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
        selected ? 'bg-lime text-ink' : 'bg-field text-ink/80 hover:bg-[#e2e7fb]'
      }`}
    >
      {selected && showCheck && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.5} />}
      {children}
    </button>
  );
}
