import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import supabase from './supabase';

/* ---------- Theme ---------- */
const ThemeCtx = createContext({ dark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('t360-theme') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('t360-theme', dark ? 'dark' : 'light'); } catch { /* noop */ }
  }, [dark]);
  return <ThemeCtx.Provider value={{ dark, toggle: () => setDark(!dark) }}>{children}</ThemeCtx.Provider>;
}

/* ---------- i18n (EN/HI) ---------- */
const dict: Record<string, Record<string, string>> = {
  en: {
    tagline: 'Discover. Plan. Travel. Experience.',
    search: 'Search destinations, hotels, food, events...',
    explore: 'Explore', destinations: 'Destinations', hotels: 'Hotels',
    restaurants: 'Restaurants', attractions: 'Attractions', activities: 'Activities',
    experiences: 'Experiences', shopping: 'Shopping', cinema: 'Cinema',
    events: 'Events', transport: 'Transport', maps: 'Maps & Nearby',
    planner: 'AI Trip Planner', recommend: 'AI Recommendations', safety: 'Safety',
    about: 'About', contact: 'Contact', help: 'Help / FAQ',
    login: 'Login', register: 'Register', dashboard: 'Dashboard', logout: 'Logout',
    book: 'Book', save: 'Save', saved: 'Saved', reviews: 'Reviews',
    writeReview: 'Write a review',
    indicative: 'Indicative info only — verify with provider. No live prices/ratings/availability.',
    liveWx: 'Live weather by Open-Meteo', viewAll: 'View all',
  },
  hi: {
    tagline: 'खोजें। योजना बनाएं। यात्रा करें। अनुभव करें।',
    search: 'गंतव्य, होटल, भोजन, इवेंट खोजें...',
    explore: 'एक्सप्लोर', destinations: 'गंतव्य', hotels: 'होटल',
    restaurants: 'रेस्टोरेंट', attractions: 'आकर्षण', activities: 'गतिविधियाँ',
    experiences: 'अनुभव', shopping: 'शॉपिंग', cinema: 'सिनेमा',
    events: 'इवेंट', transport: 'परिवहन', maps: 'मानचित्र',
    planner: 'AI यात्रा प्लानर', recommend: 'AI सिफारिशें', safety: 'सुरक्षा',
    about: 'हमारे बारे में', contact: 'संपर्क', help: 'सहायता / FAQ',
    login: 'लॉगिन', register: 'रजिस्टर', dashboard: 'डैशबोर्ड', logout: 'लॉगआउट',
    book: 'बुक करें', save: 'सेव करें', saved: 'सेव हो गया', reviews: 'समीक्षाएँ',
    writeReview: 'समीक्षा लिखें',
    indicative: 'केवल सांकेतिक जानकारी — प्रोवाइडर से पुष्टि करें।',
    liveWx: 'Open-Meteo से लाइव मौसम', viewAll: 'सभी देखें',
  },
};

const I18nCtx = createContext({ lang: 'en', setLang: (_l: string) => { void _l; }, t: (k: string) => k });
export const useI18n = () => useContext(I18nCtx);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('t360-lang') || 'en'; } catch { return 'en'; }
  });
  useEffect(() => { try { localStorage.setItem('t360-lang', lang); } catch { /* noop */ } }, [lang]);
  const t = (k: string) => dict[lang]?.[k] || dict.en[k] || k;
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

/* ---------- Toast ---------- */
const ToastCtx = createContext({ push: (_m: string, _k?: string) => { void _m; void _k; } });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: string }[]>([]);
  const push = (msg: string, kind = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((p) => [...p, { id, msg, kind }]);
    setTimeout(() => setItems((p) => p.filter((i) => i.id !== id)), 3200);
  };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-24 md:bottom-8 right-4 z-[100] flex flex-col gap-2 max-w-[320px]">
        {items.map((i) => (
          <div
            key={i.id}
            className={`px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white animate-slide-up ${i.kind === 'err' ? 'bg-rose-600' : i.kind === 'info' ? 'bg-sky-600' : 'bg-emerald-600'}`}
          >
            {i.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Auth (JWT-ready RBAC; local session + profiles API) ---------- */
export const ROLES = ['TOURIST', 'BUSINESS_OWNER', 'TOUR_GUIDE', 'TRAVEL_AGENT', 'ADMIN', 'SUPER_ADMIN'] as const;
export type Role = (typeof ROLES)[number];
export const SIGNUP_ROLES = ['TOURIST', 'BUSINESS_OWNER', 'TOUR_GUIDE', 'TRAVEL_AGENT'] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  token: string;
}

function toAppUser(session: Session | null): User | null {
  const authUser: SupabaseUser | undefined = session?.user;
  if (!session || !authUser) return null;
  const metadata = authUser.user_metadata || {};
  const serverRole = authUser.app_metadata?.role;
  const userRole = metadata.role;
  const role = (serverRole === 'ADMIN' || serverRole === 'SUPER_ADMIN')
    ? serverRole as Role
    : SIGNUP_ROLES.includes(userRole) ? userRole as SignupRole : 'TOURIST';
  return {
    id: authUser.id,
    email: authUser.email || '',
    name: String(metadata.name || metadata.full_name || authUser.email?.split('@')[0] || 'Traveller'),
    role,
    token: session.access_token,
  };
}

const AuthCtx = createContext<{
  user: User | null;
  ready: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  register: (email: string, password: string, name: string, role: SignupRole) => Promise<boolean>;
  logout: () => Promise<void>;
}>({ user: null, ready: false, login: async () => {}, register: async () => false, logout: async () => {} });

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    localStorage.removeItem('t360-user');
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(toAppUser(data.session));
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAppUser(session));
      setReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const requireSupabase = () => {
    if (!supabase) throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    return supabase;
  };

  const login = async (email: string, password: string, expectedRole: Role) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (toAppUser(data.session)?.role !== expectedRole) {
      await client.auth.signOut();
      throw new Error(`This account does not have the ${expectedRole.replace('_', ' ')} role.`);
    }
  };

  const register = async (email: string, password: string, name: string, role: SignupRole) => {
    const client = requireSupabase();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) throw error;
    if (data.session) setUser(toAppUser(data.session));
    return Boolean(data.session);
  };

  const logout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, ready, login, register, logout }}>{children}</AuthCtx.Provider>;
}
