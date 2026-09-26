import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { JSX } from 'react';
import { ThemeProvider, I18nProvider, AuthProvider, ToastProvider, useAuth } from './lib/app-context';
import { Navbar, Footer, ChatbotWidget } from './components/ui';
import { HomePage, ExplorePage, DestinationsPage, CityPage, MapsPage } from './pages/discovery';
import {
  HotelsPage, RestaurantsPage, AttractionsPage, ActivitiesPage, ExperiencesPage,
  ShoppingPage, CinemaPage, EventsPage, TransportPage,
} from './pages/listings';
import { PlannerPage, RecommendationsPage, ChatbotPage } from './pages/ai';
import { SafetyPage, AboutPage, ContactPage, FaqPage } from './pages/info';
import { LoginPage, RegisterPage } from './pages/auth';
import { DashboardPage } from './pages/dash';
import { NotFound, Unauthorized, ServerError } from './pages/system';

function Protected({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-[70vh] grid place-items-center text-sm text-slate-500">Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function Shell() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />
      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:slug" element={<CityPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/restaurants" element={<RestaurantsPage />} />
          <Route path="/attractions" element={<AttractionsPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/experiences" element={<ExperiencesPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
          <Route path="/cinema" element={<CinemaPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/transport" element={<TransportPage />} />
          <Route path="/maps" element={<MapsPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<FaqPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/server-error" element={<ServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter><Shell /></BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
