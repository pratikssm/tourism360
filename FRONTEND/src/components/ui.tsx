import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass, Moon, Sun, Search, Mic, Menu, X, MapPin, Star, Heart, Globe,
  Bot, Send, CloudSun, ChevronRight, Hotel, UtensilsCrossed, Landmark,
  Sparkles, Ticket, Bus, ShoppingBag, Clapperboard, CalendarDays,
  ShieldCheck, Phone, Loader2,
} from 'lucide-react';
import { useTheme, useI18n, useAuth, useToast } from '../lib/app-context';
import { fetchWeather, geocodeCity, type Wx } from '../lib/weather';
import { chatReply } from '../lib/ai';
import api from '../lib/api';

/* ---------- Logo ---------- */
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 via-cyan-600 to-indigo-700 grid place-items-center shadow-lg shadow-teal-500/30">
        <Compass className="w-5 h-5 text-white" />
      </span>
      <span className="leading-none">
        <span className="block font-extrabold tracking-tight text-lg bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">TOURISM360</span>
        <span className="hidden sm:block text-[10px] tracking-[0.18em] text-slate-500 dark:text-slate-400 font-semibold">DISCOVER • PLAN • TRAVEL</span>
      </span>
    </Link>
  );
}

/* ---------- Navbar ---------- */
const NAV = [
  { to: '/explore', k: 'explore' },
  { to: '/destinations', k: 'destinations' },
  { to: '/hotels', k: 'hotels' },
  { to: '/experiences', k: 'experiences' },
  { to: '/events', k: 'events' },
  { to: '/transport', k: 'transport' },
  { to: '/planner', k: 'planner' },
  { to: '/maps', k: 'maps' },
];

export function Navbar() {
  const { dark, toggle } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();

  /* ---------- Logged-in user display ---------- */
  const displayName = user?.name?.trim() || 'Traveller';

  const roleLabels: Record<string, string> = {
    TOURIST: 'Tourist',
    BUSINESS_OWNER: 'Business',
    TOUR_GUIDE: 'Tour Guide',
    TRAVEL_AGENT: 'Travel Agent',
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
  };

  const displayRole =
    roleLabels[user?.role || 'TOURIST'] || 'Tourist';

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'T';

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
      nav('/');
    } catch {
      push('Could not sign out', 'err');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 dark:border-white/10 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center gap-2">

        {/* Logo */}
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden 2xl:flex items-center gap-1 ml-4 text-sm font-medium">

          {/* Home */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
              }`
            }
          >
            Home
          </NavLink>

          {/* Existing navigation */}
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`
              }
            >
              {t(n.k)}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Language */}
        <button
          onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
          title="Language / भाषा"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'हिंदी' : 'EN'}
        </button>

        {/* Theme */}
        <button
          onClick={toggle}
          className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
          title="Theme"
        >
          {dark ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* ---------- Desktop Account ---------- */}
        {user ? (
          <div className="hidden 2xl:flex items-center gap-2">

            {/* User profile / dashboard button */}
            <button
              onClick={() => nav('/dashboard')}
              className="group flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-teal-300 dark:hover:border-teal-500/40 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition"
              title="Open Dashboard"
            >
              {/* Avatar */}
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 text-white grid place-items-center text-xs font-extrabold shadow-sm">
                {initials}
              </span>

              {/* Name + Role */}
              <span className="text-left leading-tight max-w-[130px]">
                <span className="block text-sm font-bold text-slate-800 dark:text-white truncate">
                  {displayName}
                </span>

                <span className="block text-[10px] font-semibold text-teal-600 dark:text-teal-300 truncate">
                  {displayRole}
                </span>
              </span>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              {t('logout')}
            </button>
          </div>
        ) : (
          <div className="hidden 2xl:flex items-center gap-2">
            <button
              onClick={() => nav('/login')}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-500/10"
            >
              {t('login')}
            </button>

            <button
              onClick={() => nav('/register')}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700"
            >
              {t('register')}
            </button>
          </div>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="2xl:hidden p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Menu"
        >
          {open ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* ---------- Mobile Menu ---------- */}
      {open && (
        <div className="2xl:hidden border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 px-4 py-3 grid grid-cols-2 gap-1 max-h-[75vh] overflow-y-auto">

          {/* Mobile logged-in user card */}
          {user && (
            <button
              onClick={() => {
                nav('/dashboard');
                setOpen(false);
              }}
              className="col-span-2 mb-2 p-3 rounded-2xl bg-gradient-to-r from-teal-50 to-indigo-50 dark:from-teal-500/10 dark:to-indigo-500/10 border border-teal-100 dark:border-white/10 flex items-center gap-3 text-left"
            >
              {/* Avatar */}
              <span className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 text-white grid place-items-center text-sm font-extrabold shrink-0">
                {initials}
              </span>

              {/* Name + role */}
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold text-sm truncate">
                  {displayName}
                </span>

                <span className="block text-xs font-semibold text-teal-600 dark:text-teal-300 mt-0.5">
                  {displayRole}
                </span>

                <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Open Dashboard
                </span>
              </span>

              <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
            </button>
          )}

          {/* Home */}
          <NavLink
            to="/"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive
                  ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
              }`
            }
          >
            Home
          </NavLink>

          {/* Main navigation */}
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                }`
              }
            >
              {t(n.k)}
            </NavLink>
          ))}

          {/* Additional pages */}
          {[
            { to: '/restaurants', k: 'restaurants' },
            { to: '/attractions', k: 'attractions' },
            { to: '/activities', k: 'activities' },
            { to: '/shopping', k: 'shopping' },
            { to: '/cinema', k: 'cinema' },
            { to: '/recommendations', k: 'recommend' },
            { to: '/chatbot', k: 'help' },
            { to: '/safety', k: 'safety' },
            { to: '/about', k: 'about' },
            { to: '/contact', k: 'contact' },
          ].map((n) => (
            <NavLink
              key={n.to + n.k}
              to={n.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                }`
              }
            >
              {t(n.k)}
            </NavLink>
          ))}

          {/* Mobile account actions */}
          <div className="col-span-2 flex gap-2 pt-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    nav('/dashboard');
                    setOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700"
                >
                  Dashboard
                </button>

                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    nav('/login');
                    setOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-white/20"
                >
                  {t('login')}
                </button>

                <button
                  onClick={() => {
                    nav('/register');
                    setOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 text-white"
                >
                  {t('register')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
/* ---------- Footer ---------- */
export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-medium">{t('tagline')}</p>
          <p className="mt-2 text-xs text-slate-400">AI-Powered Smart Tourism &amp; Local Experience Platform</p>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-3">Discover</h4>
          <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/destinations" className="hover:text-teal-600">{t('destinations')}</Link>
            <Link to="/hotels" className="hover:text-teal-600">{t('hotels')}</Link>
            <Link to="/experiences" className="hover:text-teal-600">{t('experiences')}</Link>
            <Link to="/events" className="hover:text-teal-600">{t('events')}</Link>
            <Link to="/maps" className="hover:text-teal-600">{t('maps')}</Link>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-3">AI &amp; Travel</h4>
          <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/planner" className="hover:text-teal-600">{t('planner')}</Link>
            <Link to="/recommendations" className="hover:text-teal-600">{t('recommend')}</Link>
            <Link to="/chatbot" className="hover:text-teal-600">AI Chatbot</Link>
            <Link to="/transport" className="hover:text-teal-600">{t('transport')}</Link>
            <Link to="/safety" className="hover:text-teal-600">{t('safety')}</Link>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-3">Company</h4>
          <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/about" className="hover:text-teal-600">{t('about')}</Link>
            <Link to="/contact" className="hover:text-teal-600">{t('contact')}</Link>
            <Link to="/help" className="hover:text-teal-600">{t('help')}</Link>
            <Link to="/dashboard" className="hover:text-teal-600">{t('dashboard')}</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-[11px] text-slate-500 dark:text-slate-500 flex flex-col sm:flex-row gap-1 sm:items-center justify-between">
          <span>© 2026 Tourism360 • {t('indicative')}</span>
          <span>{t('liveWx')} • Payments: coming soon (placeholder)</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Search with voice ---------- */
export function SearchBar({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit?: () => void }) {
  const { t } = useI18n();
  const [listening, setListening] = useState(false);
  const voice = () => {
    const SR = (window as unknown as Record<string, new () => { lang: string; onresult: (e: { results: { transcript: string }[][] }) => void; onerror: () => void; onend: () => void; start: () => void }>).webkitSpeechRecognition || (window as unknown as Record<string, new () => { lang: string; onresult: (e: { results: { transcript: string }[][] }) => void; onerror: () => void; onend: () => void; start: () => void }>).SpeechRecognition;
    if (!SR) { alert('Voice search not supported in this browser'); return; }
    const r = new SR();
    r.lang = 'en-IN';
    setListening(true);
    r.onresult = (e) => { onChange(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }} className="flex items-center gap-1 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-900/5">
      <Search className="w-5 h-5 ml-2 text-slate-400 shrink-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t('search')} className="flex-1 min-w-0 bg-transparent text-slate-900 dark:text-white outline-none px-2 py-2.5 text-sm sm:text-base placeholder:text-slate-400" />
      <button type="button" onClick={voice} className={`p-2.5 rounded-xl transition ${listening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500'}`} title="Voice search">
        <Mic className="w-4 h-4" />
      </button>
      <button type="submit" className="px-4 sm:px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shrink-0">{t('explore')}</button>
    </form>
  );
}

/* ---------- Cards ---------- */
export function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(n) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      ))}
    </span>
  );
}

export function FavButton({ type, id, title, city, image }: { type: string; id: string | number; title: string; city: string; image: string }) {
  const { user } = useAuth();
  const { push } = useToast();
  const [saved, setSaved] = useState(false);
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) { push('Please login to save favorites', 'info'); return; }
        try {
          if (saved) {
            await api.removeFavorite({ user_email: user.email, item_type: type, item_id: String(id) });
            setSaved(false);
            push('Removed from favorites');
          } else {
            await api.addFavorite({ user_email: user.email, item_type: type, item_id: String(id), title, city, image_url: image });
            setSaved(true);
            push('Saved to favorites');
          }
        } catch { push('Could not update favorites', 'err'); }
      }}
      className={`p-2 rounded-full backdrop-blur bg-white/80 dark:bg-black/50 shadow ${saved ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
      title="Save"
    >
      <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500' : ''}`} />
    </button>
  );
}

export function ListingCard({ l }: { l: Record<string, unknown> }) {
  const img = String(l.image_url || '');
  const tags = l.tags as string[] | undefined;
  void tags;
  return (
    <motion.div whileHover={{ y: -4 }} className="group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-xl transition-shadow h-full">
      <div className="relative h-44 overflow-hidden">
        <img
          src={img} alt={String(l.title)} loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80&auto=format&fit=crop'; }}
        />
        <span className="absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-black/55 text-white backdrop-blur">{String(l.category)}</span>
        <span className="absolute top-2 right-2">
          <FavButton type={String(l.category)} id={String(l.id)} title={String(l.title)} city={String(l.city)} image={img} />
        </span>
      </div>
      <div className="p-3.5">
        <h3 className="font-bold text-sm leading-snug line-clamp-1">{String(l.title)}</h3>
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{String(l.city)}</p>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{String(l.description)}</p>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-xs font-bold text-teal-700 dark:text-teal-300">{l.price_indicative ? String(l.price_indicative) : 'See details'}</span>
          {l.rating_indicative ? <span className="text-[11px] text-slate-400">★ {String(l.rating_indicative)} (indicative)</span> : null}
        </div>
      </div>
    </motion.div>
  );
}

export function DestinationCard({ d }: { d: Record<string, unknown> }) {
  const tags = (d.tags as string[]) || [];
  return (
    <Link to={`/destinations/${String(d.slug)}`}>
      <motion.div whileHover={{ y: -4 }} className="group relative rounded-2xl overflow-hidden h-64 shadow-sm hover:shadow-xl transition-shadow">
        <img
          src={String(d.image_url)} alt={String(d.name)} loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80&auto=format&fit=crop'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 right-3">
          <FavButton type="destination" id={String(d.slug)} title={String(d.name)} city={String(d.state)} image={String(d.image_url)} />
        </div>
        <div className="absolute bottom-0 p-4 text-white">
          <h3 className="font-extrabold text-lg leading-tight">{String(d.name)}</h3>
          <p className="text-xs text-white/80 flex items-center gap-1"><MapPin className="w-3 h-3" />{String(d.state)}, {String(d.country)}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tg: string) => (
              <span key={tg} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur">{tg}</span>
            ))}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ---------- States ---------- */
export function SkeletonGrid({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
          <div className="h-44 skeleton" />
          <div className="p-4 space-y-2">
            <div className="h-4 skeleton rounded w-3/4" />
            <div className="h-3 skeleton rounded w-1/2" />
            <div className="h-3 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-16 text-center">
      <Compass className="w-10 h-10 mx-auto text-slate-300" />
      <p className="mt-3 text-slate-500 font-medium">{msg}</p>
    </div>
  );
}

export function ErrorState({ msg, retry }: { msg?: string; retry: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-rose-500 font-semibold">{msg || 'Something went wrong'}</p>
      <button onClick={retry} className="mt-3 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold">Retry</button>
    </div>
  );
}

export function SectionHead({ title, sub, link, linkLabel }: { title: string; sub?: string; link?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
      </div>
      {link && (
        <Link to={link} className="flex items-center gap-1 text-sm font-bold text-teal-700 dark:text-teal-300 hover:underline shrink-0">
          {linkLabel || 'View all'}<ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

/* ---------- Weather widget (Open-Meteo live) ---------- */
export function WeatherWidget({ city, lat, lon }: { city: string; lat?: number; lon?: number }) {
  const { t } = useI18n();
  const [wx, setWx] = useState<Wx | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      let la = lat;
      let lo = lon;
      if ((la == null || lo == null) && city) {
        const g = await geocodeCity(city);
        if (g) { la = g.lat; lo = g.lon; }
      }
      if (la != null && lo != null) {
        const w = await fetchWeather(la, lo);
        if (on) setWx(w);
      }
      if (on) setLoading(false);
    })();
    return () => { on = false; };
  }, [city, lat, lon]);
  if (loading) {
    return (
      <div className="rounded-2xl p-4 bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center gap-2 text-sm text-sky-700 dark:text-sky-300">
        <Loader2 className="w-4 h-4 animate-spin" />Loading live weather…
      </div>
    );
  }
  if (!wx) return null;
  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
      <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
        <CloudSun className="w-4 h-4" />{t('liveWx')} • {city}
      </div>
      <div className="mt-2 flex items-end gap-3">
        <span className="text-4xl font-extrabold">{wx.temp}°</span>
        <div className="pb-1">
          <p className="font-bold text-sm">{wx.label}</p>
          <p className="text-xs text-white/75">H {wx.hi}° • L {wx.lo}° • Feels {wx.feels}°</p>
        </div>
        <div className="flex-1" />
        <div className="text-right text-xs text-white/80 pb-1">
          <p>💧 {wx.humidity}%</p>
          <p>💨 {wx.wind} km/h</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Detail drawer with booking + reviews ---------- */
export function DetailDrawer({ item, type, onClose }: { item: Record<string, unknown>; type: string; onClose: () => void }) {
  const { user } = useAuth();
  const { push } = useToast();
  const { t } = useI18n();
  const [tab, setTab] = useState('info');
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(2);
  if (!item) return null;
  const title = String(item.title || item.name || '');
  const loadReviews = async () => {
    try { setReviews(await api.reviews({ item_type: type, item_title: title })); } catch { /* noop */ }
  };
  useEffect(() => { loadReviews(); }, [title]);
  const book = async () => {
    if (!user) { push('Please login to book', 'info'); return; }
    try {
      await api.saveBooking({ user_email: user.email, item_type: type, item_title: title, date_text: date || 'Flexible', guests, status: 'REQUESTED' });
      push('Booking request saved! Check dashboard.');
      onClose();
    } catch { push('Booking failed', 'err'); }
  };
  const sendReview = async () => {
    if (!user) { push('Please login to review', 'info'); return; }
    if (!comment.trim()) { push('Please write a comment', 'err'); return; }
    try {
      await api.saveReview({ user_email: user.email, item_type: type, item_title: title, rating, comment });
      setComment('');
      push('Review posted — thank you!');
      loadReviews();
    } catch { push('Could not post review', 'err'); }
  };
  const tags = (item.tags as string[]) || [];
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} transition={{ type: 'spring', damping: 30 }} className="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-white dark:bg-slate-950 shadow-2xl overflow-y-auto">
        <div className="relative h-56">
          <img
            src={String(item.image_url)} className="w-full h-full object-cover" alt=""
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80&auto=format&fit=crop'; }}
          />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white"><X className="w-5 h-5" /></button>
          <span className="absolute bottom-3 left-4 px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-black/55 text-white">{type}</span>
        </div>
        <div className="p-5">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />{String(item.city || item.state || '')} {item.address ? `• ${String(item.address)}` : ''}
          </p>
          <div className="mt-3 flex gap-2">
            {['info', 'book', 'reviews'].map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${tab === tb ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}
              >
                {tb === 'book' ? t('book') : tb === 'reviews' ? `${t('reviews')} (${reviews.length})` : 'Info'}
              </button>
            ))}
          </div>
          {tab === 'info' && (
            <div className="mt-4 space-y-3">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{String(item.description || '')}</p>
              {item.price_indicative ? <p className="text-sm font-bold text-teal-700 dark:text-teal-300">💰 {String(item.price_indicative)}</p> : null}
              {item.rating_indicative ? (
                <div className="flex items-center gap-2">
                  <Stars n={Number(item.rating_indicative)} />
                  <span className="text-xs text-slate-400">{String(item.rating_indicative)} (indicative)</span>
                </div>
              ) : null}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((x: string) => (
                    <span key={x} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300">{x}</span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-2.5">⚠️ {t('indicative')}</p>
            </div>
          )}
          {tab === 'book' && (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold">
                Date
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" />
              </label>
              <label className="block text-sm font-semibold">
                Guests
                <input type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" />
              </label>
              <button onClick={book} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm">{t('book')} — request only, no payment</button>
              <p className="text-[11px] text-slate-400">No payment gateway yet — this creates a booking request for the provider.</p>
            </div>
          )}
          {tab === 'reviews' && (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 space-y-2">
                <p className="text-sm font-bold">{t('writeReview')}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} onClick={() => setRating(i)}>
                      <Star className={`w-5 h-5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" rows={2} />
                <button onClick={sendReview} className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold">Post review</button>
              </div>
              {reviews.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No reviews yet — be the first!</p>}
              {reviews.map((r) => (
                <div key={String(r.id)} className="rounded-2xl bg-slate-50 dark:bg-white/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{String(r.user_email)}</span>
                    <Stars n={Number(r.rating)} />
                  </div>
                  <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">{String(r.comment)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Chatbot ---------- */
export function ChatPanel({ full }: { full?: boolean }) {
  const { lang } = useI18n();
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: lang === 'hi' ? 'नमस्ते! मैं Tourism360 AI हूँ। यात्रा से जुड़ा कुछ भी पूछें।' : 'Hi! I am Tourism360 AI. Ask me anything about travel.' },
  ]);
  const [inp, setInp] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo(0, 99999); }, [msgs]);
  const send = () => {
    if (!inp.trim()) return;
    const m = inp;
    setMsgs((p) => [...p, { me: true, text: m }]);
    setInp('');
    setTimeout(() => setMsgs((p) => [...p, { me: false, text: chatReply(m, lang) }]), 500);
  };
  return (
    <div className={`flex flex-col bg-white dark:bg-slate-900 ${full ? 'rounded-3xl border border-slate-200 dark:border-white/10 h-[70vh]' : 'h-[420px]'}`}>
      {!full && (
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2 font-bold text-sm">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 grid place-items-center">
            <Bot className="w-4 h-4 text-white" />
          </span>
          Tourism360 AI
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">ONLINE</span>
        </div>
      )}
      <div ref={ref} className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.me ? 'ml-auto bg-teal-600 text-white rounded-br-md' : 'bg-slate-100 dark:bg-white/10 rounded-bl-md'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100 dark:border-white/10 flex gap-2">
        <input
          value={inp} onChange={(e) => setInp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder={lang === 'hi' ? 'अपना सवाल लिखें...' : 'Ask about trips, hotels, safety...'}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm outline-none focus:border-teal-500"
        />
        <button onClick={send} className="p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[85] w-[330px] max-w-[calc(100vw-2rem)] rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
          <ChatPanel />
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 z-[86] w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white shadow-xl shadow-teal-500/30 grid place-items-center hover:scale-105 transition"
        aria-label="AI Chat"
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </>
  );
}

/* ---------- Category strip ---------- */
export const CATS = [
  { to: '/hotels', icon: Hotel, label: 'Hotels', c: 'from-rose-500 to-orange-500' },
  { to: '/restaurants', icon: UtensilsCrossed, label: 'Food', c: 'from-amber-500 to-yellow-500' },
  { to: '/attractions', icon: Landmark, label: 'Sights', c: 'from-violet-500 to-purple-600' },
  { to: '/activities', icon: Ticket, label: 'Activities', c: 'from-sky-500 to-blue-600' },
  { to: '/experiences', icon: Sparkles, label: 'Experiences', c: 'from-teal-500 to-emerald-600' },
  { to: '/shopping', icon: ShoppingBag, label: 'Shopping', c: 'from-pink-500 to-rose-600' },
  { to: '/cinema', icon: Clapperboard, label: 'Cinema', c: 'from-slate-600 to-slate-900' },
  { to: '/events', icon: CalendarDays, label: 'Events', c: 'from-indigo-500 to-violet-600' },
  { to: '/transport', icon: Bus, label: 'Transport', c: 'from-cyan-500 to-teal-600' },
  { to: '/safety', icon: ShieldCheck, label: 'Safety', c: 'from-emerald-500 to-green-600' },
];

export function CategoryStrip() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
      {CATS.map((c) => (
        <Link key={c.to} to={c.to} className="flex flex-col items-center gap-1.5 shrink-0 group">
          <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.c} grid place-items-center shadow-lg group-hover:scale-105 transition`}>
            <c.icon className="w-6 h-6 text-white" />
          </span>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{c.label}</span>
        </Link>
      ))}
    </div>
  );
}

export function SosCard() {
  return (
    <a href="tel:112" className="flex items-center gap-3 rounded-2xl p-4 bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-lg shadow-rose-500/30">
      <span className="w-11 h-11 rounded-full bg-white/20 grid place-items-center animate-pulse">
        <Phone className="w-5 h-5" />
      </span>
      <span>
        <span className="block font-extrabold">SOS — Emergency 112</span>
        <span className="text-xs text-white/80">Tap to call all-in-one emergency helpline (India)</span>
      </span>
    </a>
  );
}
