/**
 * CARD — rounded white box used for every card-based section.
 *
 * Props:
 *  padding   – Tailwind padding classes (default 'p-6'); pass 'p-0' for image cards
 *  highlight – true = lime background (used for the "featured" stat card)
 *  as        – which HTML tag to render (default 'div')
 */
export default function Card({ children, padding = 'p-6', highlight = false, as: Tag = 'div', className = '', ...rest }) {
  const look = highlight ? 'bg-lime border-lime' : 'bg-white border-gray-100';
  return (
    <Tag className={`rounded-2xl border shadow-card ${look} ${padding} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
