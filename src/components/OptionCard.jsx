/**
 * OPTION CARD — a selectable card for "pick one" choices
 * (Strict/Flexible budget, travel style, accommodation, crowd).
 * Selected = soft lime background with a lime border.
 */
export default function OptionCard({ selected, onClick, title, description, centered = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border-2 px-4 py-4 transition ${centered ? 'text-center' : 'text-left'} ${
        selected ? 'border-lime bg-lime-soft' : 'border-gray-100 bg-white hover:border-gray-200'
      } ${className}`}
    >
      <span className={`block font-heading text-lg font-semibold sm:text-xl ${selected ? 'text-ink' : 'text-ink/70'}`}>
        {title}
      </span>
      {description && <span className="mt-1 block text-[13px] text-body">{description}</span>}
    </button>
  );
}
