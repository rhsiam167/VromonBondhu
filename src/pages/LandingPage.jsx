import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Button from '../components/Button';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import TripImage from '../components/TripImage';
import Icon from '../components/Icons';
import destinations, { getFeaturedDestinations, getStartingCities } from '../data/destinations';
import { INTERESTS, PLANNING_STEPS } from '../data/planningOptions';
import { useTripPlan } from '../context/TripPlanContext';
import { estimateStayAndFood } from '../services/budgetEstimate';
import { formatTaka, plural } from '../utils/format';

const HOW_IT_WORKS = [
  { title: 'Tell Us Your Trip', text: 'Enter your destination, dates, and budget.' },
  { title: 'Rank Your Interests', text: 'Choose what matters most — beach, food, adventure, and more.' },
  { title: 'We Build Your Plan', text: 'Our AI matches places and routes to your priorities.' },
  { title: 'Review & Save', text: 'Get a day-by-day itinerary you can save and revisit.' },
];

const FEATURES = [
  { title: 'Budget-Aware', text: 'Plans that respect strict or flexible budgets.' },
  { title: 'Route-Optimized', text: 'Smart travel paths that save you time.' },
  { title: 'Built Around Your Priorities', text: 'Ranked interests shape every recommendation.' },
];

const FAQS = [
  {
    q: 'How does VromonBondhu personalize my trip?',
    a: 'You rank your interests and set your budget, pace, food and stay preferences. Every place in your plan is scored against those priorities — your top interest carries the most weight.',
  },
  {
    q: 'Can I set a strict budget?',
    a: 'Yes. Choose “Strict Budget” and the planner will switch to cheaper stays or transport to keep the estimate within your limit. “Flexible” allows going slightly over when it’s worth it.',
  },
  {
    q: 'Which destinations are supported?',
    a: `Right now: ${destinations.map((d) => d.name).join(', ')}. More are on the way.`,
  },
  {
    q: 'Can I save and revisit my itinerary?',
    a: 'Yes — create a free account, press “Save Trip”, and it will appear under My Trips.',
  },
  { q: 'Is this free to use?', a: 'Yes, planning trips with VromonBondhu is free.' },
];


export default function LandingPage() {
  const navigate = useNavigate();
  const { resetPlan } = useTripPlan();
  const [search, setSearch] = useState({ from: '', destination: '', days: 4, budget: '' });
  const [showAll, setShowAll] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const shownDestinations = showAll ? destinations : getFeaturedDestinations();

  function startPlanning(changes) {
    resetPlan(changes);
    navigate('/plan/details');
  }

  function handleSearch(event) {
    event.preventDefault();
    const days = Number(search.days) || 4;
    startPlanning({
      from: search.from,
      destination: search.destination,
      days,
      nights: Math.max(0, days - 1),
      ...(Number(search.budget) > 0 ? { budget: Number(search.budget) } : {}),
    });
  }

  return (
    <PageLayout showNavLinks>
      <div id="top" className="mx-auto max-w-7xl px-4 sm:px-8">
        {/* ---------- Hero ---------- */}
        <section className="relative mt-2 overflow-hidden rounded-3xl">
          {/* slight blur hides the low resolution of the current hero photo */}
          <TripImage group="site" imageKey="landingHero" alt="Bangladesh coastline" className="absolute inset-0 h-full w-full scale-105 blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="relative px-6 pb-8 pt-14 sm:px-10 sm:pt-16">
            <h1 className="max-w-md text-5xl font-bold leading-[1.05] text-white sm:text-6xl">Plan Less, Travel Better.</h1>
            <p className="mt-5 max-w-lg text-base text-white/90 sm:text-lg">
              A personalized planning engine that turns your budget, dates, and interests into a complete,
              ready-to-follow itinerary — automatically.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-16 grid gap-2 rounded-2xl bg-white p-3 shadow-lg sm:mt-24 md:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto]"
            >
              <SearchField label="From" htmlFor="hero-from">
                <input id="hero-from" list="starting-city-list" placeholder="Dhaka" value={search.from} onChange={(e) => setSearch({ ...search, from: e.target.value })} className="w-full bg-transparent text-sm outline-none placeholder:text-ink/60" />
              </SearchField>
              <SearchField label="Destination" htmlFor="hero-destination">
                <input id="hero-destination" list="destination-list" placeholder="Where to?" value={search.destination} onChange={(e) => setSearch({ ...search, destination: e.target.value })} className="w-full bg-transparent text-sm outline-none placeholder:text-ink/60" />
              </SearchField>
              <SearchField label="Duration" htmlFor="hero-days">
                <select id="hero-days" value={search.days} onChange={(e) => setSearch({ ...search, days: e.target.value })} className="w-full bg-transparent text-sm outline-none">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{plural(n, 'Day')}</option>
                  ))}
                </select>
              </SearchField>
              <SearchField label="Budget (৳)" htmlFor="hero-budget">
                <input id="hero-budget" type="number" min="0" placeholder="15,000" value={search.budget} onChange={(e) => setSearch({ ...search, budget: e.target.value })} className="w-full bg-transparent text-sm outline-none placeholder:text-ink/60" />
              </SearchField>
              <Button type="submit" className="rounded-xl px-8">Plan My Trip</Button>
            </form>
            <datalist id="destination-list">
              {destinations.map((d) => <option key={d.id} value={d.name} />)}
            </datalist>
            <datalist id="starting-city-list">
              {getStartingCities().map((d) => <option key={d.id} value={d.name} />)}
            </datalist>
          </div>
        </section>

        {/* ---------- Stats (real numbers from the app's data) ---------- */}
        <section className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard value={destinations.length} label="Destinations Covered" />
          <StatCard value={INTERESTS.length} label="Interests to Rank" highlight />
          <StatCard value={PLANNING_STEPS.length} label="Simple Planning Steps" />
          <StatCard value="100%" label="Personalized Plans" />
        </section>

        {/* ---------- How it works ---------- */}
        <section id="how-it-works" className="scroll-mt-24 pt-16">
          <h2 className="text-3xl font-medium">How it works</h2>
          <p className="mt-2 text-body">From your preferences to a full itinerary, in four simple steps.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <Card key={step.title} padding="px-5 py-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime font-heading font-semibold">{i + 1}</span>
                <h3 className="mt-5 text-lg font-medium">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{step.text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------- Popular destinations ---------- */}
        <section id="destinations" className="scroll-mt-24 pt-20">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold">{showAll ? 'All Destinations' : 'Popular Destinations'}</h2>
            <Button size="sm" onClick={() => setShowAll((v) => !v)}>{showAll ? 'Show Popular' : 'View All'}</Button>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {shownDestinations.map((d) => (
              <DestinationCard key={d.id} destination={d} onSelect={() => startPlanning({ destination: d.name, days: d.typicalDays, nights: Math.max(0, d.typicalDays - 1) })} />
            ))}
          </div>
        </section>

        {/* ---------- Key features ---------- */}
        <section id="features"className="grid scroll-mt-24 items-center gap-10 pt-24 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold">Key Features</h2>
            <p className="mt-4 max-w-md leading-relaxed text-body">
              Every recommendation is shaped by what matters most to you — ranked interests, budget limits, and
              travel pace all factored in before a single stop is planned.
            </p>
          </div>
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <Card key={f.title} padding="px-5 py-4" className="flex items-start gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime">
                  <Icon name="check" className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-lg font-medium">{f.title}</h3>
                  <p className="text-sm text-body">{f.text}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="mx-auto max-w-2xl scroll-mt-24 pb-20 pt-24">
          <h2 className="text-center text-3xl font-semibold">Frequently Asked Questions</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <Card key={item.q} padding="p-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left font-heading text-[17px] font-medium"
                  >
                    {i + 1}. {item.q}
                    <Icon name={open ? 'minus' : 'plus'} className="h-5 w-5 shrink-0" />
                  </button>
                  {open && <p className="px-4 pb-4 text-sm leading-relaxed text-body">{item.a}</p>}
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

/** One labelled box inside the hero search bar. */
function SearchField({ label, htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="block rounded-xl bg-field px-3 py-2">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink/70">{label}</span>
      {children}
    </label>
  );
}

/** Destination photo card with category, typical length and starting price. */
function DestinationCard({ destination, onSelect }) {
  // Per person, stay + food + local travel only (no starting city is known here).
  const stayAndFood = estimateStayAndFood(destination);
  const category = destination.categories[0];
  return (
    <Card as="button" type="button" padding="p-0" onClick={onSelect} className="group overflow-hidden text-left">
      <TripImage group="destinations" imageKey={destination.imageKey} alt={destination.name} className="h-44 w-full transition duration-300 group-hover:scale-[1.03]" />
      <div className="px-3 py-3">
        <h3 className="text-[17px] font-medium">{destination.name}</h3>
        <p className="mt-0.5 text-xs text-body">
          <span className="capitalize">{category}</span> · {plural(destination.typicalDays, 'Day')} · Stay &amp; food from {formatTaka(stayAndFood)}
        </p>
      </div>
    </Card>
  );
}
