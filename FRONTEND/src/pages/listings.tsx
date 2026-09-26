import { useEffect, useState } from 'react';
import { Bus, Train, Plane, Car, Bike, Ship, Info } from 'lucide-react';
import api, { isUsingLocalDatabaseFallback } from '../lib/api';
import { PREVIEW_DATA } from '../lib/preview-data';
import { useI18n } from '../lib/app-context';
import { ListingCard, SkeletonGrid, EmptyState, DetailDrawer, SearchBar } from '../components/ui';

type Rec = Record<string, unknown>;

/* Generic listing page */
function ListingPage({ category, title, sub, extra }: { category: string; title: string; sub: string; extra?: React.ReactNode }) {
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
          setItems(PREVIEW_DATA.listings.filter((item) => item.category === category));
          setPreviewMode(true);
        }
      } finally { setLoading(false); }
    })();
  }, [category]);

  const cities = ['all', ...Array.from(new Set(items.map((i) => String(i.city))))];
  const list = items.filter((i) => (city === 'all' || String(i.city) === city) && (!q || `${i.title} ${i.description}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">{title}</h1>
      <p className="text-sm text-slate-500 mt-1">{sub}</p>
      {previewMode && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Live Supabase data is loaded directly because local API functions are not running.</p>}
      {extra}
      <div className="mt-4 max-w-xl"><SearchBar value={q} onChange={setQ} /></div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {cities.map((c: string) => (
          <button key={c} onClick={() => setCity(c)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${city === c ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-white/10'}`}>{c}</button>
        ))}
      </div>
      <div className="mt-5">
        {loading ? <SkeletonGrid /> : list.length === 0 ? <EmptyState msg="No results — try another filter" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {list.map((l) => <div key={String(l.id)} onClick={() => setSel(l)} className="cursor-pointer"><ListingCard l={l} /></div>)}
          </div>
        )}
      </div>
      {sel && <DetailDrawer item={sel} type={String(sel.category)} onClose={() => setSel(null)} />}
    </div>
  );
}

export const HotelsPage = () => <ListingPage category="hotel" title="Hotels & Stays" sub="Curated stays — indicative tariffs only, confirm live availability with the property" />;
export const RestaurantsPage = () => <ListingPage category="restaurant" title="Restaurants & Cafes" sub="Local flavours, thalis, cafes & fine dining" />;
export const AttractionsPage = () => <ListingPage category="attraction" title="Attractions" sub="Monuments, forts, temples, viewpoints & landmarks" />;
export const ActivitiesPage = () => <ListingPage category="activity" title="Activities" sub="Adventure, cruises, safaris, treks & workshops" />;
export const ExperiencesPage = () => <ListingPage category="experience" title="Experiences" sub="Handpicked local experiences with guides & hosts" />;
export const ShoppingPage = () => <ListingPage category="shopping" title="Shopping" sub="Bazaars, handicrafts, malls & souvenirs" />;

export function CinemaPage() {
  return (
    <ListingPage
      category="cinema"
      title="Cinema"
      sub="Now-showing line-up is indicative — confirm showtimes & seat availability at the theatre"
      extra={
        <div className="mt-3 flex items-start gap-2 rounded-2xl p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-xs text-indigo-800 dark:text-indigo-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          Real-time information handling: showtimes, formats &amp; seat maps load from theatre partners in production. This build shows the catalogue UI only — nothing is fabricated.
        </div>
      }
    />
  );
}

/* EVENTS */
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
      } finally { setLoading(false); }
    })();
  }, []);

  const list = items.filter((i) => !q || `${i.title} ${i.city}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">Events</h1>
      <p className="text-sm text-slate-500 mt-1">Festivals, concerts, expos &amp; cultural nights</p>
      {previewMode && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Live Supabase data is loaded directly because local API functions are not running.</p>}
      <div className="mt-4 max-w-xl"><SearchBar value={q} onChange={setQ} /></div>
      <div className="mt-5">
        {loading ? <SkeletonGrid n={6} /> : list.length === 0 ? <EmptyState msg="No events found" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((e) => (
              <div key={String(e.id)} className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:shadow-xl transition">
                <img
                  src={String(e.image_url)} className="h-44 w-full object-cover" loading="lazy" alt=""
                  onError={(ev) => { (ev.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop'; }}
                />
                <div className="p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">{String(e.category)}</span>
                  <h3 className="font-bold mt-1">{String(e.title)}</h3>
                  <p className="text-xs text-slate-500 mt-1">📅 {String(e.date_text)} • 📍 {String(e.venue)}, {String(e.city)}</p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{String(e.description)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* TRANSPORT — no fabricated fares/availability */
const MODES = [
  { icon: Plane, name: 'Flights', desc: 'Compare on airline & aggregator apps. Tourism360 never shows live fares — check the carrier for real-time price & seats.', tags: ['IndiGo', 'Air India', 'SpiceJet', 'Akasa'] },
  { icon: Train, name: 'Trains', desc: 'Book via IRCTC. Live PNR, running status & seat availability open in the official app (placeholder integration).', tags: ['Rajdhani', 'Vande Bharat', 'Shatabdi', 'Sleeper'] },
  { icon: Bus, name: 'Buses', desc: 'Intercity Volvo, sleeper & seater coaches. Timings vary by operator — verify before travel.', tags: ['Volvo', 'Sleeper', 'Seater', 'City bus'] },
  { icon: Car, name: 'Cabs & Rentals', desc: 'Uber / Ola / Rapido-style partners (future-ready). No fares shown — the meter runs in the provider app.', tags: ['Sedan', 'SUV', 'Airport', 'Outstation'] },
  { icon: Bike, name: 'Bike Taxi & Rentals', desc: 'Quick city hops & guided moto-tours. Helmets mandatory.', tags: ['Rapido-style', 'Daily rental', 'Moto-tour'] },
  { icon: Ship, name: 'Ferries & Cruises', desc: 'Goa, Kochi, Varanasi & Andaman routes. Schedules are seasonal — confirm with operator.', tags: ['Ferry', 'Houseboat', 'Cruise'] },
];

export function TransportPage() {
  const { t } = useI18n();
  const [from, setFrom] = useState('Delhi');
  const [to, setTo] = useState('Jaipur');
  const [date, setDate] = useState('');
  const [out, setOut] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">Transport</h1>
      <p className="text-sm text-slate-500 mt-1">Plan how to move — we never fabricate fares, seats or live timings</p>
      <div className="mt-4 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-xl">
        <div className="grid sm:grid-cols-4 gap-3">
          <label className="text-xs font-bold">FROM<input value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none" /></label>
          <label className="text-xs font-bold">TO<input value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none" /></label>
          <label className="text-xs font-bold">DATE<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none" /></label>
          <button onClick={() => setOut(`${from} → ${to}${date ? ' • ' + date : ''}: compare live options in provider apps — Tourism360 shows guidance only, no fabricated fares.`)} className="self-end py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-extrabold">Check options</button>
        </div>
        {out && <p className="mt-3 text-sm bg-white/10 rounded-xl p-3">🧭 {out}</p>}
        <p className="mt-3 text-[11px] text-white/60">Future-ready: IRCTC / airline / cab aggregator integrations plug in here. {t('indicative')}</p>
      </div>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODES.map((m) => (
          <div key={m.name} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 hover:shadow-lg transition">
            <span className="w-11 h-11 rounded-2xl bg-teal-600/10 text-teal-600 grid place-items-center"><m.icon className="w-5 h-5" /></span>
            <h3 className="mt-3 font-extrabold">{m.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{m.desc}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {m.tags.map((x) => <span key={x} className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10">{x}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
