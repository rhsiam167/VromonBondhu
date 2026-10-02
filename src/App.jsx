import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TripPlanProvider } from './context/TripPlanContext';
import { SavedTripsProvider } from './context/SavedTripsContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TripDetailsPage from './pages/planning/TripDetailsPage';
import BudgetPage from './pages/planning/BudgetPage';
import InterestsPage from './pages/planning/InterestsPage';
import PreferencesPage from './pages/planning/PreferencesPage';
import ReviewPage from './pages/planning/ReviewPage';
import GeneratingPage from './pages/planning/GeneratingPage';
import InfeasibleBudgetPage from './pages/planning/InfeasibleBudgetPage';
import TripOverviewPage from './pages/TripOverviewPage';
import ItineraryPage from './pages/ItineraryPage';
import HomePage from './pages/HomePage';
import MyTripsPage from './pages/MyTripsPage';

/**
 * APP — wraps everything in the shared state (contexts) and lists every
 * page (route) in the app.
 */
export default function App() {
  return (
    <AuthProvider>
      <TripPlanProvider>
        <SavedTripsProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* 6-step planning flow */}
              <Route path="/plan" element={<Navigate to="/plan/details" replace />} />
              <Route path="/plan/details" element={<TripDetailsPage />} />
              <Route path="/plan/budget" element={<BudgetPage />} />
              <Route path="/plan/interests" element={<InterestsPage />} />
              <Route path="/plan/preferences" element={<PreferencesPage />} />
              <Route path="/plan/review" element={<ReviewPage />} />
              <Route path="/plan/generating" element={<GeneratingPage />} />
              <Route path="/plan/infeasible" element={<InfeasibleBudgetPage />} />

              {/* Generated trip */}
              <Route path="/trip/:tripId" element={<TripOverviewPage />} />
              <Route path="/trip/:tripId/itinerary" element={<ItineraryPage />} />

              {/* Logged-in pages */}
              <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/my-trips" element={<ProtectedRoute><MyTripsPage /></ProtectedRoute>} />

              {/* Anything else → landing page */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SavedTripsProvider>
      </TripPlanProvider>
    </AuthProvider>
  );
}
