import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, CalendarDays, ArrowRight, CloudSun, Navigation } from 'lucide-react';
import api, { isUsingLocalDatabaseFallback } from '../lib/api';
import { PREVIEW_DATA } from '../lib/preview-data';
import { useI18n } from '../lib/app-context';
import {
  SearchBar, DestinationCard, ListingCard, SkeletonGrid, EmptyState, ErrorState,
  SectionHead, CategoryStrip, WeatherWidget, DetailDrawer,
} from '../components/ui';
import { geocodeCity } from '../lib/weather';

type Rec = Record<string, unknown>;

/* ================= HOME ================= */
export function HomePage() {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [dests, setDests] = useState<Rec[]>([]);
  const [listings, setListings] = useState<Rec[]>([]);
  const [events, setEvents] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [sel, setSel] = useState<Rec | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [d, l, e] = await Promise.all([api.destinations(), api.listings(), api.events()]);
        setDests(d); setListings(l); setEvents(e);
        setPreviewMode(isUsingLocalDatabaseFallback());
      } catch (e: unknown) {
        if (import.meta.env.DEV) {
          setDests(PREVIEW_DATA.destinations);
          setListings(PREVIEW_DATA.listings);
          setEvents(PREVIEW_DATA.events);
          setPreviewMode(true);
        } else {
          setErr(e instanceof Error ? e.message : 'Failed to load');
        }
      }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-700 to-indigo-800" />
        <img src="https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1600&q=80&auto=format&fit=crop" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center text-white">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-bold tracking-wide">✨ AI-POWERED SMART TOURISM</span>
          <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            TOURISM360<br />
            <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">{t('tagline')}</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/80 max-w-2xl mx-auto">Destinations, stays, food, experiences, events &amp; transport — planned by AI, powered for every traveller.</p>
          <div className="mt-6 max-w-2xl mx-auto">
            <SearchBar value={q} onChange={setQ} onSubmit={() => { window.location.href = `/explore?q=${encodeURIComponent(q)}`; }} />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-semibold">
            {['Goa beaches', 'Jaipur palaces', 'Kerala houseboat', 'Varanasi ghats', 'Ladakh adventure'].map((s) => (
              <Link key={s} to={`/explore?q=${encodeURIComponent(s)}`} className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur transition">{s}</Link>
            ))}
          </div>
        </div>
        <div className="relative bg-white dark:bg-slate-950 rounded-t-[2rem] -mt-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6"><CategoryStrip /></div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        {previewMode && <p className="text-xs text-amber-700 dark:text-amber-300">Live Supabase data is loaded directly because local API functions are not running.</p>}
        {loading ? <SkeletonGrid /> : err ? <ErrorState msg={err} retry={() => window.location.reload()} /> : (
          <>
            <section>
              <SectionHead title="Trending destinations" sub="Handpicked places across India" link="/destinations" linkLabel={t('viewAll')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{dests.slice(0, 8).map((d) => <DestinationCard key={String(d.id)} d={d} />)}</div>
            </section>
            <section>
              <SectionHead title="Top stays & experiences" sub="Indicative info — verify with provider" link="/experiences" linkLabel={t('viewAll')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {listings.slice(0, 8).map((l) => <div key={String(l.id)} onClick={() => setSel(l)} className="cursor-pointer"><ListingCard l={l} /></div>)}
              </div>
            </section>
            <section className="grid md:grid-cols-2 gap-4">
              <Link to="/planner" className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-xl overflow-hidden relative group">
                <span className="text-4xl">🤖</span>
                <h3 className="mt-2 text-xl sm:text-2xl font-extrabold">AI Trip Planner</h3>
                <p className="text-sm text-white/80 mt-1">Day-wise itineraries in seconds — destination, budget &amp; interests.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all">Plan my trip <ArrowRight className="w-4 h-4" /></span>
              </Link>
              <Link to="/maps" className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-xl relative group">
                <span className="text-4xl">🗺️</span>
                <h3 className="mt-2 text-xl sm:text-2xl font-extrabold">Maps &amp; Nearby</h3>
                <p className="text-sm text-white/80 mt-1">Live weather + nearby-style discovery for any city.</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold group-hover:gap-2 transition-all">Open maps <ArrowRight className="w-4 h-4" /></span>
              </Link>
            </section>
            <section>
              <SectionHead title="Upcoming events" link="/events" linkLabel={t('viewAll')} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.slice(0, 6).map((e) => (
                  <div key={String(e.id)} className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                    <img
                      src={String(e.image_url)} alt="" className="h-36 w-full object-cover" loading="lazy"
                      onError={(ev) => { (ev.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80&auto=format&fit=crop'; }}
                    />
                    <div className="p-4">
                      <h3 className="font-bold text-sm">{String(e.title)}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><CalendarDays className="w-3 h-3" />{String(e.date_text)} • {String(e.venue)}, {String(e.city)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      {sel && <DetailDrawer item={sel} type={String(sel.category)} onClose={() => setSel(null)} />}
    </div>
  );
}

/* ================= EXPLORE (universal search) ================= */
export function ExplorePage() {
  const params = new URLSearchParams(window.location.search);
  const [q, setQ] = useState(params.get('q') || '');
  const [cat, setCat] = useState('all');
  const [dests, setDests] = useState<Rec[]>([]);
  const [listings, setListings] = useState<Rec[]>([]);
  const [events, setEvents] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Rec | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [d, l, e] = await Promise.all([api.destinations(), api.listings(), api.events()]);
        setDests(d); setListings(l); setEvents(e);
      } catch { /* noop */ } finally { setLoading(false); }
    })();
  }, []);

  const s = q.toLowerCase();
  const match = (t: string) => !s || t.toLowerCase().includes(s);
  const fd = dests.filter((d) => (cat === 'all' || cat === 'destinations') && match(`${d.name} ${d.state} ${d.description} ${((d.tags as string[]) || []).join(' ')}`));
  const fl = listings.filter((l) => (cat === 'all' || l.category === cat) && match(`${l.title} ${l.city} ${l.description}`));
  const fe = events.filter((e) => (cat === 'all' || cat === 'events') && match(`${e.title} ${e.city} ${e.description}`));
  const tabs = ['all', 'destinations', 'hotel', 'restaurant', 'attraction', 'activity', 'experience', 'shopping', 'cinema', 'events'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">Explore everything</h1>
      <p className="text-sm text-slate-500 mt-1">Universal search across destinations, stays, food, sights, events &amp; more — try voice 🎙️</p>
      <div className="mt-4 max-w-2xl"><SearchBar value={q} onChange={setQ} /></div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tb) => (
          <button key={tb} onClick={() => setCat(tb)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap ${cat === tb ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>{tb}</button>
        ))}
      </div>
      {loading ? <div className="mt-6"><SkeletonGrid /></div> : (
        <div className="mt-6 space-y-8">
          {fd.length > 0 && (
            <section>
              <h2 className="font-extrabold mb-3">Destinations ({fd.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{fd.map((d) => <DestinationCard key={String(d.id)} d={d} />)}</div>
            </section>
          )}
          {fl.length > 0 && (
            <section>
              <h2 className="font-extrabold mb-3">Listings ({fl.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {fl.map((l) => <div key={String(l.id)} onClick={() => setSel(l)} className="cursor-pointer"><ListingCard l={l} /></div>)}
              </div>
            </section>
          )}
          {fe.length > 0 && (
            <section>
              <h2 className="font-extrabold mb-3">Events ({fe.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fe.map((e) => (
                  <div key={String(e.id)} className="rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                    <img src={String(e.image_url)} className="h-36 w-full object-cover" loading="lazy" alt="" />
                    <div className="p-4">
                      <h3 className="font-bold text-sm">{String(e.title)}</h3>
                      <p className="text-xs text-slate-500 mt-1">{String(e.date_text)} • {String(e.city)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {fd.length + fl.length + fe.length === 0 && <EmptyState msg={`No results for "${q}" — try another search`} />}
        </div>
      )}
      {sel && <DetailDrawer item={sel} type={String(sel.category)} onClose={() => setSel(null)} />}
    </div>
  );
}

/* ================= DESTINATIONS ================= */
export function DestinationsPage() {
  const [dests, setDests] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [tag, setTag] = useState('all');

  useEffect(() => {
    (async () => {
      try { setDests(await api.destinations()); } catch { /* noop */ } finally { setLoading(false); }
    })();
  }, []);

  const tags = useMemo(() => ['all', ...Array.from(new Set(dests.flatMap((d) => ((d.tags as string[]) || []))))], [dests]);
  const list = tag === 'all' ? dests : dests.filter((d) => ((d.tags as string[]) || []).includes(tag));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">Destinations</h1>
      <p className="text-sm text-slate-500 mt-1">Dynamic city pages with live weather, stays, food, sights &amp; events</p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {tags.map((tg: string) => (
          <button key={tg} onClick={() => setTag(tg)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap ${tag === tg ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-white/10'}`}>{tg}</button>
        ))}
      </div>
      <div className="mt-6">
        {loading ? <SkeletonGrid /> : list.length === 0 ? <EmptyState msg="No destinations found" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{list.map((d) => <DestinationCard key={String(d.id)} d={d} />)}</div>
        )}
      </div>
    </div>
  );
}

/* ================= DYNAMIC CITY PAGE ================= */
export function CityPage() {
  const { slug } = useParams();
  const [d, setD] = useState<Rec | null>(null);
  const [listings, setListings] = useState<Rec[]>([]);
  const [events, setEvents] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Rec | null>(null);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const dest = await api.destinationBySlug(slug || '');
        setD(dest);
        if (dest) {
          const [l, e] = await Promise.all([api.listings({ destination_slug: dest.slug }), api.events({ city: dest.name })]);
          setListings(l); setEvents(e);
        }
      } catch { /* noop */ } finally { setLoading(false); }
    })();
  }, [slug]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><SkeletonGrid n={4} /></div>;
  if (!d) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-extrabold">City not found</h1>
        <Link to="/destinations" className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm">Back to destinations</Link>
      </div>
    );
  }

  const cats = ['all', ...Array.from(new Set(listings.map((l) => String(l.category))))];
  const fl = tab === 'all' ? listings : listings.filter((l) => String(l.category) === tab);
  const dtags = (d.tags as string[]) || [];

  return (
    <div>
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src={String(d.image_url)} alt={String(d.name)} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 max-w-7xl mx-auto px-4 sm:px-6 pb-5 text-white w-full left-0 right-0">
          <p className="text-xs font-bold tracking-widest text-white/70 flex items-center gap-1"><MapPin className="w-3 h-3" />{String(d.state)}, {String(d.country)}</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold">{String(d.name)}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dtags.map((tg: string) => <span key={tg} className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur">{tg}</span>)}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">{String(d.description)}</p>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-3.5"><p className="text-xs text-slate-400 font-bold">BEST SEASON</p><p className="font-bold mt-1">{String(d.best_season || 'Oct – Mar')}</p></div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-3.5"><p className="text-xs text-slate-400 font-bold">LISTINGS</p><p className="font-bold mt-1">{listings.length} places</p></div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-3.5"><p className="text-xs text-slate-400 font-bold">EVENTS</p><p className="font-bold mt-1">{events.length} upcoming</p></div>
          </div>
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {cats.map((c: string) => (
                <button key={c} onClick={() => setTab(c)} className={`px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap ${tab === c ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-white/10'}`}>{c}</button>
              ))}
            </div>
            {fl.length === 0 ? <EmptyState msg="No listings for this city yet" /> : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fl.map((l) => <div key={String(l.id)} onClick={() => setSel(l)} className="cursor-pointer"><ListingCard l={l} /></div>)}
              </div>
            )}
          </div>
          {events.length > 0 && (
            <div>
              <h2 className="font-extrabold text-lg mb-3 flex items-center gap-2"><CalendarDays className="w-5 h-5 text-teal-600" />Events in {String(d.name)}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {events.map((e) => (
                  <div key={String(e.id)} className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    <img src={String(e.image_url)} className="h-32 w-full object-cover" alt="" loading="lazy" />
                    <div className="p-3">
                      <h3 className="font-bold text-sm">{String(e.title)}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{String(e.date_text)} • {String(e.venue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <WeatherWidget city={String(d.name)} lat={d.lat as number | undefined} lon={d.lng as number | undefined} />
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
            <h3 className="font-extrabold text-sm flex items-center gap-2"><Navigation className="w-4 h-4 text-teal-600" />Plan this city with AI</h3>
            <p className="text-xs text-slate-500 mt-1">Generate a day-wise itinerary for {String(d.name)}.</p>
            <Link to={`/planner?dest=${encodeURIComponent(String(d.name))}`} className="mt-3 block text-center py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold">Open AI Planner</Link>
            <Link to={`/maps?city=${encodeURIComponent(String(d.name))}`} className="mt-2 flex items-center justify-center gap-1 text-center py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold"><CloudSun className="w-4 h-4" />Nearby &amp; weather</Link>
          </div>
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 text-xs text-amber-800 dark:text-amber-300">⚠️ Listings show indicative info only. Live prices, ratings &amp; availability are never fabricated — confirm with providers.</div>
        </div>
      </div>
      {sel && <DetailDrawer item={sel} type={String(sel.category)} onClose={() => setSel(null)} />}
    </div>
  );
}

/* ================= MAPS / NEARBY ================= */
export function MapsPage() {
  const params = new URLSearchParams(window.location.search);
  const [city, setCity] = useState(params.get('city') || 'Jaipur');
  const [coords, setCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [listings, setListings] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<Rec | null>(null);

  const go = async (c: string) => {
    setLoading(true);
    const g = await geocodeCity(c);
    setCoords(g);
    try {
      const all: Rec[] = await api.listings();
      setListings(all.filter((l) => String(l.city || '').toLowerCase().includes(c.toLowerCase().split(',')[0])));
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { go(city); }, []);

  const mapSrc = coords ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - 0.12}%2C${coords.lat - 0.08}%2C${coords.lon + 0.12}%2C${coords.lat + 0.08}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}` : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">Maps &amp; Nearby</h1>
      <p className="text-sm text-slate-500 mt-1">Live map + live weather (Open-Meteo) + nearby-style listings</p>
      <form onSubmit={(e) => { e.preventDefault(); go(city); }} className="mt-4 flex gap-2 max-w-xl">
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter city — e.g. Goa, Jaipur, Kochi" className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm outline-none focus:border-teal-500" />
        <button className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold">Locate</button>
      </form>
      {loading ? <div className="mt-6"><SkeletonGrid n={3} /></div> : (
        <div className="mt-6 grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 min-h-[380px] bg-slate-100 dark:bg-white/5">
            {mapSrc ? <iframe title="map" src={mapSrc} className="w-full h-[380px] lg:h-[520px] border-0" /> : <EmptyState msg="Search a city to load the map" />}
          </div>
          <div className="lg:col-span-2 space-y-4">
            {coords && <WeatherWidget city={city} lat={coords.lat} lon={coords.lon} />}
            {coords && <p className="text-xs text-slate-500">📍 {coords.label} • {coords.lat.toFixed(3)}, {coords.lon.toFixed(3)}</p>}
            <h2 className="font-extrabold">Nearby-style picks ({listings.length})</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {listings.length === 0 && <EmptyState msg="No listings tagged to this city yet" />}
              {listings.map((l) => <div key={String(l.id)} onClick={() => setSel(l)} className="cursor-pointer"><ListingCard l={l} /></div>)}
            </div>
          </div>
        </div>
      )}
      {sel && <DetailDrawer item={sel} type={String(sel.category)} onClose={() => setSel(null)} />}
    </div>
  );
}
