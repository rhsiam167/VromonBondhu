import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Button from './Button';
import Icon from './Icons';
import { useAuth } from '../context/AuthContext';
import { useTripPlan } from '../context/TripPlanContext';
import { useSavedTrips } from '../context/SavedTripsContext';

/**
 * AUTH HEADER — the floating rounded "pill" nav bar for logged-in users.
 * Logo, Home / My Trips links, "Plan a New Trip" and the user's avatar
 * (click the avatar to log out).
 */
const LINKS = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/my-trips', label: 'My Trips', icon: 'luggage' },
];

export default function AuthHeader() {
  const { user, logout } = useAuth();
  const { resetPlan } = useTripPlan();
  const { clearTrips } = useSavedTrips();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function planNewTrip() {
    resetPlan();
    navigate('/plan/details');
  }

  function handleLogout() {
    logout();
    clearTrips();
    resetPlan();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-30 px-4 pt-5 sm:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-[0_8px_24px_rgb(17_24_39/0.08)] sm:px-6">
        <Logo to="/home" className="h-9 sm:h-10" />

        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Main">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition sm:px-5 ${
                  isActive ? 'bg-lime text-ink' : 'text-body hover:text-ink'
                }`
              }
            >
              <Icon name={link.icon} className="h-4 w-4" />
              <span className="hidden sm:inline">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={planNewTrip} className="hidden md:inline-flex">
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.2} />
            Plan a New Trip
          </Button>

          <div className="relative border-l border-gray-200 pl-3">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">
                <Icon name="user" className="h-4 w-4" />
              </span>
              <span className="hidden max-w-32 truncate text-sm font-semibold sm:inline">{user?.name}</span>
            </button>

            {menuOpen && (
              <div role="menu" className="absolute right-0 mt-3 w-44 rounded-2xl border border-gray-100 bg-white p-2 shadow-card">
                <button
                  type="button"
                  role="menuitem"
                  onClick={planNewTrip}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-gray-50 md:hidden"
                >
                  <Icon name="plus" className="h-4 w-4" /> Plan a New Trip
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <Icon name="logout" className="h-4 w-4" /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
