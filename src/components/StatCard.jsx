import Card from './Card';

/**
 * STAT CARD — a big number with a small label underneath
 * (landing page stats, trip overview, home dashboard).
 */
export default function StatCard({ value, label, highlight = false, size = 'md' }) {
  const valueSize = size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl';
  const padding = size === 'lg' ? 'px-10 py-10' : 'px-5 py-5';
  return (
    <Card highlight={highlight} padding={padding}>
      <p className={`font-heading font-bold tracking-tight text-ink ${valueSize}`}>{value}</p>
      <p className={`mt-1.5 text-sm ${highlight ? 'font-semibold text-ink' : 'text-body'}`}>{label}</p>
    </Card>
  );
}
