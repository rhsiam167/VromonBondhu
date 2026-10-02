import PageLayout from './PageLayout';
import Button from './Button';

/** Shown when a trip link points to a trip that isn't in memory (e.g. after a page refresh). */
export default function TripNotFound() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Trip not found</h1>
        <p className="mt-3 text-body">
          Trips are only kept while this tab is open. Plan a new one to see it here.
        </p>
        <Button to="/plan/details" className="mt-6">Plan a Trip</Button>
      </div>
    </PageLayout>
  );
}
