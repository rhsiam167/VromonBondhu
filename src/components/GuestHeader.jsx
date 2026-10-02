import { Link } from 'react-router-dom';
import Logo from './Logo';
import Button from './Button';

/**
 * GUEST HEADER — shown to visitors who are NOT logged in.
 * Logo on the left, Log In + Sign Up on the right. No avatar.
 *
 * Props:
 *  showNavLinks – true on the landing page to show the section links
 *                 (they scroll within the landing page).
 */
const SECTION_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Destinations', href: '#destinations' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
];

export default function GuestHeader({ showNavLinks = false }) {
  return (
    <header className="sticky top-0 z-30 bg-page/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Logo />

        {showNavLinks && (
          <nav className="hidden items-center gap-7 md:flex" aria-label="Page sections">
            {SECTION_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors hover:text-ink ${i === 0 ? 'font-semibold text-ink' : 'font-medium text-ink/70'}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3 sm:gap-5">
          <Link to="/login" className="text-sm font-semibold text-ink/80 hover:text-ink">
            Log In
          </Link>
          <Button to="/register" size="sm">
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}
