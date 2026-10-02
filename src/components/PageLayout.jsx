import GuestHeader from './GuestHeader';
import AuthHeader from './AuthHeader';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';

/**
 * PAGE LAYOUT — header + page content + footer.
 *
 * Picks the right header automatically:
 *  - logged out → <GuestHeader />
 *  - logged in  → <AuthHeader />
 *
 * Props:
 *  showNavLinks – passed to GuestHeader (landing page only)
 *  background   – page background class (Home uses a light tint)
 */
export default function PageLayout({ children, showNavLinks = false, background = 'bg-white' }) {
  const { isLoggedIn } = useAuth();

  return (
    <div className={`flex min-h-screen flex-col ${background}`}>
      {isLoggedIn ? <AuthHeader /> : <GuestHeader showNavLinks={showNavLinks} />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
