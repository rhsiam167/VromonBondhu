import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scrolls back to the top whenever the page (route) changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
