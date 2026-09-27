import { useEffect, useState } from 'react';
import {
  Bus,
  Train,
  Plane,
  Car,
  Bike,
  Ship,
  Info,
  ExternalLink,
} from 'lucide-react';

import api, { isUsingLocalDatabaseFallback } from '../lib/api';
import { PREVIEW_DATA } from '../lib/preview-data';
import { useI18n } from '../lib/app-context';
import {
  ListingCard,
  SkeletonGrid,
  EmptyState,
  DetailDrawer,
  SearchBar,
} from '../components/ui';

type Rec = Record<string, unknown>;

/* ============================================================
   GENERIC LISTING PAGE
============================================================ */

function ListingPage({
  category,
  title,
  sub,
  extra,
}: {
  category: string;
  title: string;
  sub: string;
  extra?: React.ReactNode;
}) {
  const [items, setItems] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [city, setCity] = useState('all');
  const [sel, setSel] = useState<Rec | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setItems(await api.listings({ category }));
        setPreviewMode(isUsingLocalDatabaseFallback());
      } catch {
        if (import.meta.env.DEV) {
          setItems(
            PREVIEW_DATA.listings.filter(
              (item) => item.category === category
            )
          );
          setPreviewMode(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [category]);

  const cities = [
    'all',
    ...Array.from(new Set(items.map((i) => String(i.city)))),
  ];

  const list = items.filter(
    (i) =>
      (city === 'all' || String(i.city) === city) &&
      (!q ||
        `${i.title} ${i.description}`
          .toLowerCase()
          .includes(q.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">
        {title}
      </h1>

      <p className="text-sm text-slate-500 mt-1">
        {sub}
      </p>

      {previewMode && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Live Supabase data is loaded directly because local API
          functions are not running.
        </p>
      )}

      {extra}

      <div className="mt-4 max-w-xl">
        <SearchBar value={q} onChange={setQ} />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {cities.map((c: string) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
              city === c
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <SkeletonGrid />
        ) : list.length === 0 ? (
          <EmptyState msg="No results — try another filter" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {list.map((l) => (
              <div
                key={String(l.id)}
                onClick={() => setSel(l)}
                className="cursor-pointer"
              >
                <ListingCard l={l} />
              </div>
            ))}
          </div>
        )}
      </div>

      {sel && (
        <DetailDrawer
          item={sel}
          type={String(sel.category)}
          onClose={() => setSel(null)}
        />
      )}
    </div>
  );
}

export const HotelsPage = () => (
  <ListingPage
    category="hotel"
    title="Hotels & Stays"
    sub="Curated stays — indicative tariffs only, confirm live availability with the property"
  />
);

export const RestaurantsPage = () => (
  <ListingPage
    category="restaurant"
    title="Restaurants & Cafes"
    sub="Local flavours, thalis, cafes & fine dining"
  />
);

export const AttractionsPage = () => (
  <ListingPage
    category="attraction"
    title="Attractions"
    sub="Monuments, forts, temples, viewpoints & landmarks"
  />
);

export const ActivitiesPage = () => (
  <ListingPage
    category="activity"
    title="Activities"
    sub="Adventure, cruises, safaris, treks & workshops"
  />
);

export const ExperiencesPage = () => (
  <ListingPage
    category="experience"
    title="Experiences"
    sub="Handpicked local experiences with guides & hosts"
  />
);

export const ShoppingPage = () => (
  <ListingPage
    category="shopping"
    title="Shopping"
    sub="Bazaars, handicrafts, malls & souvenirs"
  />
);

/* ============================================================
   CINEMA
============================================================ */

export function CinemaPage() {
  return (
    <ListingPage
      category="cinema"
      title="Cinema"
      sub="Now-showing line-up is indicative — confirm showtimes & seat availability at the theatre"
      extra={
        <div className="mt-3 flex items-start gap-2 rounded-2xl p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />

          Real-time information handling: showtimes, formats & seat
          maps load from theatre partners in production. This build
          shows the catalogue UI only — nothing is fabricated.
        </div>
      }
    />
  );
}

/* ============================================================
   EVENTS
============================================================ */

export function EventsPage() {
  const [items, setItems] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setItems(await api.events());
        setPreviewMode(isUsingLocalDatabaseFallback());
      } catch {
        if (import.meta.env.DEV) {
          setItems(PREVIEW_DATA.events);
          setPreviewMode(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const list = items.filter(
    (i) =>
      !q ||
      `${i.title} ${i.city}`
        .toLowerCase()
        .includes(q.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">
        Events
      </h1>

      <p className="text-sm text-slate-500 mt-1">
        Festivals, concerts, expos & cultural nights
      </p>

      {previewMode && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Live Supabase data is loaded directly because local API
          functions are not running.
        </p>
      )}

      <div className="mt-4 max-w-xl">
        <SearchBar value={q} onChange={setQ} />
      </div>

      <div className="mt-5">
        {loading ? (
          <SkeletonGrid n={6} />
        ) : list.length === 0 ? (
          <EmptyState msg="No events found" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((e) => (
              <div
                key={String(e.id)}
                className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:shadow-xl transition"
              >
                <img
                  src={String(e.image_url)}
                  className="h-44 w-full object-cover"
                  loading="lazy"
                  alt=""
                  onError={(ev) => {
                    (ev.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop';
                  }}
                />

                <div className="p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                    {String(e.category)}
                  </span>

                  <h3 className="font-bold mt-1">
                    {String(e.title)}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    📅 {String(e.date_text)} • 📍{' '}
                    {String(e.venue)}, {String(e.city)}
                  </p>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {String(e.description)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TRANSPORT
============================================================ */

const MODES = [
  {
    icon: Plane,
    name: 'Flights',
    desc: 'Open airline websites to check current fares, schedules and seats. Tourism360 does not fabricate live flight information.',
    tags: ['IndiGo', 'Air India', 'SpiceJet', 'Akasa'],
    url: 'https://www.goindigo.in/',
    provider: 'Open IndiGo',
  },
  {
    icon: Train,
    name: 'Trains',
    desc: 'Book and check train information through the official IRCTC website.',
    tags: ['Rajdhani', 'Vande Bharat', 'Shatabdi', 'Sleeper'],
    url: 'https://www.irctc.co.in/nget/train-search',
    provider: 'Open IRCTC',
  },
  {
    icon: Bus,
    name: 'Buses',
    desc: 'Search and compare available bus operators through an online bus booking platform.',
    tags: ['Volvo', 'Sleeper', 'Seater', 'City bus'],
    url: 'https://www.redbus.in/',
    provider: 'Open redBus',
  },
  {
    icon: Car,
    name: 'Cabs & Rentals',
    desc: 'Open the ride provider and check the current fare and availability there.',
    tags: ['Uber', 'Ola', 'Airport', 'Outstation'],
    url: 'https://m.uber.com/',
    provider: 'Open Uber',
  },
  {
    icon: Bike,
    name: 'Bike Taxi & Rentals',
    desc: 'Open the ride provider for current availability and pricing.',
    tags: ['Rapido', 'Daily rental', 'Moto-tour'],
    url: 'https://www.rapido.bike/',
    provider: 'Open Rapido',
  },
  {
    icon: Ship,
    name: 'Ferries & Cruises',
    desc: 'Use the travel provider portal to check current routes, schedules and availability.',
    tags: ['Ferry', 'Houseboat', 'Cruise'],
    url: 'https://www.irctctourism.com/',
    provider: 'Open IRCTC Tourism',
  },
];

const TRANSPORT_OPTIONS = [
  {
    icon: Plane,
    title: 'Flights',
    subtitle: 'Airline booking',
    tags: ['IndiGo', 'Air India', 'SpiceJet', 'Akasa'],
    button: 'Check flights',
    url: 'https://www.goindigo.in/',
    iconClass: 'bg-sky-100 text-sky-600',
  },
  {
    icon: Train,
    title: 'Trains',
    subtitle: 'Official IRCTC',
    tags: ['Rajdhani', 'Vande Bharat', 'Shatabdi', 'Sleeper'],
    button: 'Check trains',
    url: 'https://www.irctc.co.in/nget/train-search',
    iconClass: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Bus,
    title: 'Buses',
    subtitle: 'Bus booking',
    tags: ['Volvo', 'Sleeper', 'Seater'],
    button: 'Check buses',
    url: 'https://www.redbus.in/',
    iconClass: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Car,
    title: 'Cabs',
    subtitle: 'Ride providers',
    tags: ['Uber', 'Ola', 'Airport', 'Outstation'],
    button: 'Check cabs',
    url: 'https://m.uber.com/',
    iconClass: 'bg-violet-100 text-violet-600',
  },
  {
    icon: Bike,
    title: 'Bike Taxi',
    subtitle: 'City rides',
    tags: ['Rapido', 'Bike Taxi', 'Daily rental'],
    button: 'Check rides',
    url: 'https://www.rapido.bike/',
    iconClass: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Ship,
    title: 'Ferries & Cruises',
    subtitle: 'Tourism operators',
    tags: ['Ferry', 'Houseboat', 'Cruise'],
    button: 'Check cruises',
    url: 'https://www.irctctourism.com/',
    iconClass: 'bg-cyan-100 text-cyan-600',
  },
];

export function TransportPage() {
  const { t } = useI18n();

  const [from, setFrom] = useState('Delhi');
  const [to, setTo] = useState('Jaipur');
  const [date, setDate] = useState('');
  const [searched, setSearched] = useState(false);

  const openProvider = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCheckOptions = () => {
    if (!from.trim() || !to.trim()) return;

    setSearched(true);
  };

  const resultDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Date not selected';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      {/* PAGE HEADER */}
      <h1 className="text-2xl sm:text-3xl font-extrabold">
        Transport
      </h1>

      <p className="text-sm text-slate-500 mt-1">
        Plan how to move — we never fabricate fares, seats or live timings
      </p>

      {/* ========================================================
          TRANSPORT SEARCH
      ======================================================== */}

      <div className="mt-4 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl">

        <div className="grid sm:grid-cols-4 gap-3">

          {/* FROM */}
          <label className="text-xs font-bold">
            FROM

            <input
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setSearched(false);
              }}
              placeholder="e.g. Delhi"
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none placeholder:text-white/40 focus:border-teal-400"
            />
          </label>

          {/* TO */}
          <label className="text-xs font-bold">
            TO

            <input
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setSearched(false);
              }}
              placeholder="e.g. Jaipur"
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none placeholder:text-white/40 focus:border-teal-400"
            />
          </label>

          {/* DATE */}
          <label className="text-xs font-bold">
            DATE

            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setDate(e.target.value);
                setSearched(false);
              }}
              className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none focus:border-teal-400"
            />
          </label>

          {/* CHECK OPTIONS */}
          <button
            onClick={handleCheckOptions}
            disabled={!from.trim() || !to.trim()}
            className="self-end py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 text-sm font-extrabold transition"
          >
            Check options
          </button>

        </div>

        <p className="mt-3 text-[11px] text-white/60">
          Enter your route and date to explore available travel providers.
          Live prices and availability are checked on provider websites.
        </p>

        {/* ======================================================
            SEARCH RESULT
        ====================================================== */}

        {searched && (
          <div className="mt-5 rounded-2xl bg-white/10 border border-white/10 p-4">

            {/* RESULT HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div>
                <p className="text-[10px] text-white/50 font-bold uppercase tracking-[0.15em]">
                  Travel options
                </p>

                <h2 className="text-lg font-extrabold mt-1">
                  {from.trim()} → {to.trim()}
                </h2>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold">
                📅 {resultDate}
              </div>

            </div>

            {/* INFORMATION NOTICE */}
            <div className="mt-4 rounded-xl bg-amber-400/10 border border-amber-300/20 px-3 py-2.5">

              <p className="text-[11px] text-white/80 leading-relaxed">
                <strong>Live information:</strong> Tourism360 does not
                display fabricated fares, seat availability or timings.
                Select a provider below to check the latest information
                directly from the provider.
              </p>

            </div>

            {/* OPTIONS */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

              {TRANSPORT_OPTIONS.map((option) => {
                const Icon = option.icon;

                return (
                  <div
                    key={option.title}
                    className="rounded-2xl bg-white text-slate-900 p-4 shadow-sm"
                  >

                    <div className="flex items-center gap-3">

                      <span
                        className={`w-10 h-10 rounded-xl grid place-items-center ${option.iconClass}`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>

                      <div>
                        <p className="font-extrabold text-sm">
                          {option.title}
                        </p>

                        <p className="text-[10px] text-slate-500">
                          {option.subtitle}
                        </p>
                      </div>

                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">

                      {option.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full bg-slate-100 text-[10px] font-bold"
                        >
                          {tag}
                        </span>
                      ))}

                    </div>

                    <button
                      onClick={() => openProvider(option.url)}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold transition"
                    >
                      {option.button}

                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                  </div>
                );
              })}

            </div>

          </div>
        )}

        <p className="mt-3 text-[11px] text-white/60">
          Future-ready: IRCTC / airline / cab aggregator integrations
          plug in here. {t('indicative')}
        </p>

      </div>

      {/* ========================================================
          TRANSPORT MODE CARDS
      ======================================================== */}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {MODES.map((m) => (
          <div
            key={m.name}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 hover:shadow-lg transition"
          >

            <div className="flex items-start justify-between gap-3">

              <span className="w-11 h-11 rounded-2xl bg-teal-600/10 text-teal-600 grid place-items-center">
                <m.icon className="w-5 h-5" />
              </span>

              <button
                onClick={() => openProvider(m.url)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-[10px] font-bold hover:bg-teal-50 dark:hover:bg-teal-500/10"
              >
                Open

                <ExternalLink className="w-3 h-3" />
              </button>

            </div>

            <h3 className="mt-3 font-extrabold">
              {m.name}
            </h3>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {m.desc}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">

              {m.tags.map((x) => (
                <span
                  key={x}
                  className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10"
                >
                  {x}
                </span>
              ))}

            </div>

            <button
              onClick={() => openProvider(m.url)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-extrabold hover:bg-teal-700 transition"
            >
              {m.provider}

              <ExternalLink className="w-3.5 h-3.5" />
            </button>

          </div>
        ))}

      </div>

    </div>
  );
}