import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type {
  Session,
  User as SupabaseUser,
} from '@supabase/supabase-js';

import supabase from './supabase';

/* =========================================================
   THEME
========================================================= */

const ThemeCtx = createContext({
  dark: false,
  toggle: () => {},
});

export const useTheme = () =>
  useContext(ThemeCtx);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dark, setDark] = useState(() => {
    try {
      return (
        localStorage.getItem('t360-theme') ===
        'dark'
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      dark
    );

    try {
      localStorage.setItem(
        't360-theme',
        dark ? 'dark' : 'light'
      );
    } catch {
      /* noop */
    }
  }, [dark]);

  return (
    <ThemeCtx.Provider
      value={{
        dark,
        toggle: () => setDark(!dark),
      }}
    >
      {children}
    </ThemeCtx.Provider>
  );
}

/* =========================================================
   I18N
========================================================= */

const dict: Record<
  string,
  Record<string, string>
> = {
  en: {
    tagline:
      'Discover. Plan. Travel. Experience.',
    search:
      'Search destinations, hotels, food, events...',
    explore: 'Explore',
    destinations: 'Destinations',
    hotels: 'Hotels',
    restaurants: 'Restaurants',
    attractions: 'Attractions',
    activities: 'Activities',
    experiences: 'Experiences',
    shopping: 'Shopping',
    cinema: 'Cinema',
    events: 'Events',
    transport: 'Transport',
    maps: 'Maps & Nearby',
    planner: 'AI Trip Planner',
    recommend: 'AI Recommendations',
    safety: 'Safety',
    about: 'About',
    contact: 'Contact',
    help: 'Help / FAQ',
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    logout: 'Logout',
    book: 'Book',
    save: 'Save',
    saved: 'Saved',
    reviews: 'Reviews',
    writeReview: 'Write a review',
    indicative:
      'Indicative info only — verify with provider. No live prices/ratings/availability.',
    liveWx: 'Live weather by Open-Meteo',
    viewAll: 'View all',
  },

  hi: {
    tagline:
      'खोजें। योजना बनाएं। यात्रा करें। अनुभव करें।',
    search:
      'गंतव्य, होटल, भोजन, इवेंट खोजें...',
    explore: 'एक्सप्लोर',
    destinations: 'गंतव्य',
    hotels: 'होटल',
    restaurants: 'रेस्टोरेंट',
    attractions: 'आकर्षण',
    activities: 'गतिविधियाँ',
    experiences: 'अनुभव',
    shopping: 'शॉपिंग',
    cinema: 'सिनेमा',
    events: 'इवेंट',
    transport: 'परिवहन',
    maps: 'मानचित्र',
    planner: 'AI यात्रा प्लानर',
    recommend: 'AI सिफारिशें',
    safety: 'सुरक्षा',
    about: 'हमारे बारे में',
    contact: 'संपर्क',
    help: 'सहायता / FAQ',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    dashboard: 'डैशबोर्ड',
    logout: 'लॉगआउट',
    book: 'बुक करें',
    save: 'सेव करें',
    saved: 'सेव हो गया',
    reviews: 'समीक्षाएँ',
    writeReview: 'समीक्षा लिखें',
    indicative:
      'केवल सांकेतिक जानकारी — प्रोवाइडर से पुष्टि करें।',
    liveWx: 'Open-Meteo से लाइव मौसम',
    viewAll: 'सभी देखें',
  },
};

const I18nCtx = createContext({
  lang: 'en',
  setLang: (_l: string) => {
    void _l;
  },
  t: (k: string) => k,
});

export const useI18n = () =>
  useContext(I18nCtx);

export function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState(() => {
    try {
      return (
        localStorage.getItem('t360-lang') ||
        'en'
      );
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        't360-lang',
        lang
      );
    } catch {
      /* noop */
    }
  }, [lang]);

  const t = (k: string) =>
    dict[lang]?.[k] ||
    dict.en[k] ||
    k;

  return (
    <I18nCtx.Provider
      value={{
        lang,
        setLang,
        t,
      }}
    >
      {children}
    </I18nCtx.Provider>
  );
}

/* =========================================================
   TOAST
========================================================= */

const ToastCtx = createContext({
  push: (
    _m: string,
    _k?: string
  ) => {
    void _m;
    void _k;
  },
});

export const useToast = () =>
  useContext(ToastCtx);

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<
    {
      id: number;
      msg: string;
      kind: string;
    }[]
  >([]);

  const push = (
    msg: string,
    kind = 'ok'
  ) => {
    const id =
      Date.now() + Math.random();

    setItems((p) => [
      ...p,
      {
        id,
        msg,
        kind,
      },
    ]);

    setTimeout(() => {
      setItems((p) =>
        p.filter(
          (i) => i.id !== id
        )
      );
    }, 3200);
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}

      <div className="fixed bottom-24 md:bottom-8 right-4 z-[100] flex flex-col gap-2 max-w-[320px]">
        {items.map((i) => (
          <div
            key={i.id}
            className={`px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white animate-slide-up ${
              i.kind === 'err'
                ? 'bg-rose-600'
                : i.kind === 'info'
                  ? 'bg-sky-600'
                  : 'bg-emerald-600'
            }`}
          >
            {i.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* =========================================================
   AUTH
========================================================= */

export const ROLES = [
  'TOURIST',
  'BUSINESS_OWNER',
  'TOUR_GUIDE',
  'TRAVEL_AGENT',
  'ADMIN',
  'SUPER_ADMIN',
] as const;

export type Role =
  (typeof ROLES)[number];

export const SIGNUP_ROLES = [
  'TOURIST',
  'BUSINESS_OWNER',
  'TOUR_GUIDE',
  'TRAVEL_AGENT',
] as const;

export type SignupRole =
  (typeof SIGNUP_ROLES)[number];

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  token: string;
}

/* =========================================================
   SUPABASE USER → APP USER
========================================================= */

function toAppUser(
  session: Session | null
): User | null {
  const authUser:
    | SupabaseUser
    | undefined =
    session?.user;

  if (!session || !authUser) {
    return null;
  }

  const metadata =
    authUser.user_metadata || {};

  const serverRole =
    authUser.app_metadata?.role;

  const userRole =
    metadata.role;

  const role =
    serverRole === 'ADMIN' ||
    serverRole === 'SUPER_ADMIN'
      ? (serverRole as Role)
      : SIGNUP_ROLES.includes(
            userRole
          )
        ? (userRole as SignupRole)
        : 'TOURIST';

  return {
    id: authUser.id,

    email:
      authUser.email || '',

    name: String(
      metadata.name ||
        metadata.full_name ||
        authUser.email?.split('@')[0] ||
        'Traveller'
    ),

    role,

    token:
      session.access_token,
  };
}

/* =========================================================
   AUTH CONTEXT
========================================================= */

const AuthCtx = createContext<{
  user: User | null;
  ready: boolean;

  login: (
    email: string,
    password: string,
    role: Role
  ) => Promise<void>;

  register: (
    email: string,
    password: string,
    name: string,
    role: SignupRole
  ) => Promise<boolean>;

  signInWithGoogle: () => Promise<void>;

  logout: () => Promise<void>;
}>({
  user: null,
  ready: false,

  login: async () => {},

  register: async () => false,

  signInWithGoogle: async () => {},

  logout: async () => {},
});

export const useAuth = () =>
  useContext(AuthCtx);

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [ready, setReady] =
    useState(!supabase);

  useEffect(() => {
    try {
      localStorage.removeItem(
        't360-user'
      );
    } catch {
      /* noop */
    }

    if (!supabase) {
      return;
    }

    let active = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;

        setUser(
          toAppUser(data.session)
        );

        setReady(true);
      });

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setUser(
            toAppUser(session)
          );

          setReady(true);
        }
      );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  /* -------------------------------------------------------
     REQUIRE SUPABASE
  ------------------------------------------------------- */

  const requireSupabase = () => {
    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      );
    }

    return supabase;
  };

  /* -------------------------------------------------------
     LOGIN
  ------------------------------------------------------- */

  const login = async (
    email: string,
    password: string,
    expectedRole: Role
  ) => {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } =
      await client.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) {
      throw error;
    }

    const appUser =
      toAppUser(data.session);

    if (!appUser) {
      throw new Error(
        'Login session could not be created.'
      );
    }

    /*
     * Keep role validation.
     * Frontend does not assign admin roles.
     */
    if (
      appUser.role !==
      expectedRole
    ) {
      await client.auth.signOut();

      throw new Error(
        `This account does not have the ${expectedRole.replace(
          '_',
          ' '
        )} role.`
      );
    }

    setUser(appUser);
  };

  /* -------------------------------------------------------
     REGISTER
  ------------------------------------------------------- */

  const register = async (
    email: string,
    password: string,
    name: string,
    role: SignupRole
  ) => {
    const client =
      requireSupabase();

    const {
      data,
      error,
    } =
      await client.auth.signUp({
        email,
        password,

        options: {
          data: {
            name,
            role,
          },
        },
      });

    if (error) {
      throw error;
    }

    /*
     * IMPORTANT:
     * Registration should NOT directly open dashboard.
     *
     * Even when Supabase returns a session,
     * sign out immediately so user must login
     * from /login.
     */
    if (data.session) {
      await client.auth.signOut();

      setUser(null);
    }

    return false;
  };

  /* -------------------------------------------------------
     GOOGLE SIGN-IN
  ------------------------------------------------------- */

  const signInWithGoogle =
    async () => {
      const client =
        requireSupabase();

      const redirectTo =
        `${window.location.origin}/dashboard`;

      const {
        error,
      } =
        await client.auth.signInWithOAuth(
          {
            provider: 'google',

            options: {
              redirectTo,
            },
          }
        );

      if (error) {
        throw error;
      }
    };

  /* -------------------------------------------------------
     LOGOUT
  ------------------------------------------------------- */

  const logout = async () => {
    if (!supabase) {
      return;
    }

    const {
      error,
    } =
      await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
  };

  return (
    <AuthCtx.Provider
      value={{
        user,
        ready,
        login,
        register,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

/* =========================================================
   PREVIEW DATA
========================================================= */

export const PREVIEW_DATA = {
  destinations: [
    {
      id: 'goa',
      slug: 'goa',
      name: 'Goa',
      state: 'Goa',
      country: 'India',
      image_url:
        'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1000&q=80&auto=format&fit=crop',
      tags: [
        'Beaches',
        'Culture',
      ],
    },

    {
      id: 'jaipur',
      slug: 'jaipur',
      name: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      image_url:
        'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?w=1000&q=80&auto=format&fit=crop',
      tags: [
        'Heritage',
        'Architecture',
      ],
    },

    {
      id: 'kerala',
      slug: 'kerala',
      name: 'Kerala',
      state: 'Kerala',
      country: 'India',
      image_url:
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1000&q=80&auto=format&fit=crop',
      tags: [
        'Backwaters',
        'Nature',
      ],
    },

    {
      id: 'varanasi',
      slug: 'varanasi',
      name: 'Varanasi',
      state: 'Uttar Pradesh',
      country: 'India',
      image_url:
        'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1000&q=80&auto=format&fit=crop',
      tags: [
        'Heritage',
        'Spiritual',
      ],
    },
  ],

  listings: [
    {
      id: 'goa-stay',
      category: 'hotel',
      title: 'Beachside stays in Goa',
      city: 'Goa',
      destination_slug: 'goa',
      description:
        'Relaxed stays close to the coast and local cafes.',
      image_url:
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&q=80&auto=format&fit=crop',
      price_indicative:
        'Explore stays',
      rating_indicative: '4.8',
    },

    {
      id: 'jaipur-stay',
      category: 'hotel',
      title: 'Heritage stay in Jaipur',
      city: 'Jaipur',
      destination_slug: 'jaipur',
      description:
        'A restored haveli close to the old city.',
      image_url:
        'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1000&q=80&auto=format&fit=crop',
      price_indicative:
        'Explore stays',
      rating_indicative: '4.7',
    },

    {
      id: 'varanasi-food',
      category: 'restaurant',
      title: 'Taste of old Varanasi',
      city: 'Varanasi',
      destination_slug:
        'varanasi',
      description:
        'Discover local flavours near the riverfront.',
      image_url:
        'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1000&q=80&auto=format&fit=crop',
      price_indicative:
        'Explore food',
      rating_indicative: '4.6',
    },

    {
      id: 'jaipur-sight',
      category: 'attraction',
      title: 'Amber Fort',
      city: 'Jaipur',
      destination_slug: 'jaipur',
      description:
        'Explore the hilltop fort and its historic courtyards.',
      image_url:
        'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1000&q=80&auto=format&fit=crop',
      price_indicative:
        'Check visitor details',
    },

    {
      id: 'goa-activity',
      category: 'activity',
      title: 'Coastal boat trip',
      city: 'Goa',
      destination_slug: 'goa',
      description:
        'See the coastline from the water.',
      image_url:
        'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1000&q=80&auto=format&fit=crop',
      price_indicative:
        'Explore activities',
    },

    {
      id: 'kerala-experience',
      category: 'experience',
      title: 'Kerala backwater cruise',
      city: 'Alappuzha',
      destination_slug: 'kerala',
      description:
        'A slow journey through palm-lined canals.',
      image_url:
        'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1000&q=80&auto=format&fit=crop',
      price_indicative:
        'Explore experiences',
      rating_indicative: '4.9',
    },

    {
      id: 'jaipur-shopping',
      category: 'shopping',
      title: 'Jaipur craft markets',
      city: 'Jaipur',
      destination_slug: 'jaipur',
      description:
        'Browse textiles, jewellery and local crafts.',
      image_url:
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&q=80&auto=format&fit=crop',
      price_indicative:
        'Browse shops',
    },

    {
      id: 'city-cinema',
      category: 'cinema',
      title: 'City cinema listings',
      city: 'New Delhi',
      destination_slug: 'delhi',
      description:
        'Browse a sample cinema catalogue.',
      image_url:
        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&q=80&auto=format&fit=crop',
      price_indicative:
        'Confirm showtimes',
    },
  ],

  events: [
    {
      id: 'goa-festival',
      category: 'festival',
      title: 'Goa cultural season',
      date_text: 'Seasonal',
      venue: 'Panaji',
      city: 'Goa',
      image_url:
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1000&q=80&auto=format&fit=crop',
      description:
        'A preview of local cultural events.',
    },

    {
      id: 'jaipur-festival',
      category: 'arts',
      title: 'Jaipur arts & culture',
      date_text: 'Seasonal',
      venue: 'Pink City',
      city: 'Jaipur',
      image_url:
        'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1000&q=80&auto=format&fit=crop',
      description:
        'A preview of arts and cultural events.',
    },

    {
      id: 'kerala-festival',
      category: 'culture',
      title: 'Kerala local celebrations',
      date_text: 'Seasonal',
      venue: 'Alappuzha',
      city: 'Kerala',
      image_url:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1000&q=80&auto=format&fit=crop',
      description:
        'A preview of seasonal celebrations.',
    },
  ],
};