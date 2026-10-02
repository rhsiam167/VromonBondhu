import { useId, useState } from 'react';

/**
 * AUTOCOMPLETE INPUT — a text box with a dropdown of matching suggestions.
 * Type to filter, click a suggestion or use ↑ ↓ and Enter, Escape to close.
 *
 * Props:
 *  id, value, placeholder
 *  onChange(text) – called on typing and when a suggestion is picked
 *  options        – list of suggestion strings
 *  invalid        – true to mark the field as having an error
 */
export default function AutocompleteInput({ id, value, onChange, options, placeholder, invalid = false }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const typed = (value || '').trim().toLowerCase();
  const exact = options.some((o) => o.toLowerCase() === typed);
  const matches = exact || !typed ? options : options.filter((o) => o.toLowerCase().includes(typed));
  const showList = open && matches.length > 0;

  function pick(option) {
    onChange(option);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && showList && active >= 0) {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === 'Escape' && showList) {
      e.stopPropagation(); // close only the list, not a surrounding pop-up
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={invalid || undefined}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        className={`field ${invalid ? 'ring-2 ring-red-300' : ''}`}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-card"
        >
          {matches.map((option, i) => (
            <li
              key={option}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input doesn't lose focus first
              onMouseDown={(e) => {
                e.preventDefault();
                pick(option);
              }}
              className={`cursor-pointer px-4 py-2 text-[15px] ${i === active ? 'bg-lime-soft' : 'hover:bg-gray-50'}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
