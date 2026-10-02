import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from '../Card';
import Icon from '../Icons';
import { INTERESTS, labelFor } from '../../data/planningOptions';
import { calculateWeight } from '../../utils/interestWeights';

/**
 * INTERESTS FORM — pick interests, then drag them into order of importance.
 * Used by the Interests step AND the "Interests" tab of the Edit pop-up.
 * `values.interests` is the ranked list: index 0 = rank 1 = most important.
 * Weight for each = (N - rank + 1) / N, recalculated on every change.
 *
 * Props: values, onChange(changes), errors { interests }, framed (see TripDetailsForm)
 */
export default function InterestsForm({ values, onChange, errors = {}, framed = true }) {
  const ranked = values.interests;
  const Wrapper = framed ? Card : 'section';
  const wrapperClass = framed ? 'rounded-3xl border-gray-200' : '';

  // Mouse/touch drag (after moving 5px, so clicks still work) + keyboard (Space, then arrow keys).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function toggleInterest(id) {
    onChange({ interests: ranked.includes(id) ? ranked.filter((i) => i !== id) : [...ranked, id] });
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    onChange({ interests: arrayMove(ranked, ranked.indexOf(active.id), ranked.indexOf(over.id)) });
  }

  return (
    <>
      <Wrapper className={wrapperClass}>
        <h2 className="mb-4 text-xl font-medium">Select Your Interests</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {INTERESTS.map((interest) => {
            const selected = ranked.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                aria-pressed={selected}
                className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 text-sm transition ${
                  selected ? 'border-lime bg-lime-soft font-semibold text-ink' : 'border-gray-100 text-body hover:border-gray-200'
                }`}
              >
                <Icon name={interest.icon} className="h-6 w-6" />
                {interest.label}
              </button>
            );
          })}
        </div>
        {errors.interests && <p className="mt-3 text-sm font-medium text-red-600" role="alert">{errors.interests}</p>}
      </Wrapper>

      <Wrapper className={`mt-6 ${wrapperClass}`}>
        <h2 className="text-xl font-medium">Rank Your Selected Interests</h2>
        <p className="mt-1 text-[13px] text-body">Drag to reorder — your top interest gets the most weight in your plan.</p>

        {ranked.length === 0 ? (
          <p className="mt-5 rounded-xl bg-field px-4 py-6 text-center text-sm text-body">
            Select interests above and they’ll appear here for ranking.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ranked} strategy={verticalListSortingStrategy}>
              <ul className="mt-5 space-y-2.5">
                {ranked.map((id, index) => (
                  <RankRow key={id} id={id} rank={index + 1} weight={calculateWeight(index + 1, ranked.length)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </Wrapper>
    </>
  );
}

/** One draggable row in the ranking list. */
function RankRow({ id, rank, weight }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-label={`${labelFor(INTERESTS, id)}, rank ${rank}. Press space to pick up, arrow keys to move.`}
      className={`flex cursor-grab touch-none items-center gap-4 rounded-xl border border-gray-200 bg-[#f7f8fc] px-4 py-3.5 active:cursor-grabbing ${
        isDragging ? 'relative z-10 shadow-lg ring-2 ring-lime' : ''
      }`}
    >
      <Icon name="grip" className="h-5 w-5 text-body" />
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime text-xs font-semibold">{rank}</span>
      <span className="flex-1 font-heading text-xl font-medium">{labelFor(INTERESTS, id)}</span>
      <span className="text-[13px] text-body">{Math.round(weight * 100)}% priority weight</span>
    </li>
  );
}
