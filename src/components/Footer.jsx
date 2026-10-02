/** Simple footer strip shown at the bottom of every page. */
export default function Footer() {
  return (
    <footer className="mt-auto bg-page">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-ink/80 sm:flex-row sm:px-8">
        <p>© {new Date().getFullYear()} VromonBondhu. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-ink">Privacy Policy</a>
          <a href="#" className="hover:text-ink">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
