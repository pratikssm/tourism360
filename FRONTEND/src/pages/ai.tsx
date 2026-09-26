import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Save, Download, MapPin } from 'lucide-react';
import api from '../lib/api';
import { buildItinerary, recommend, type PlanInput, type DayPlan } from '../lib/ai';
import { useAuth, useToast, useI18n } from '../lib/app-context';
import { ListingCard, DestinationCard, DetailDrawer, ChatPanel } from '../components/ui';

type Rec = Record<string, unknown>;
const INTERESTS = ['heritage', 'beaches', 'food', 'adventure', 'nature', 'shopping', 'spiritual', 'nightlife', 'family'];

/* ---------- AI TRIP PLANNER ---------- */
export function PlannerPage() {
  const params = new URLSearchParams(window.location.search);
  const { user } = useAuth();
  const { push } = useToast();
  const [input, setInput] = useState<PlanInput>({
    destination: params.get('dest') || 'Jaipur',
    days: 3,
    budget: 'Comfort',
    interests: ['heritage', 'food'],
    pace: 'Balanced',
  });
  const [days, setDays] = useState<DayPlan[]>([]);
  const [listings, setListings] = useState<Rec[]>([]);
  const [title, setTitle] = useState('My India adventure');

  useEffect(() => {
    (async () => { try { setListings(await api.listings()); } catch { /* noop */ } })();
  }, []);

  const generate = () => {
    setDays(buildItinerary(input, listings));
    push('Itinerary generated ✨');
  };

  const save = async () => {
    if (!user) { push('Login to save trips', 'info'); return; }
    if (!days.length) { push('Generate an itinerary first', 'err'); return; }
    try {
      await api.saveTrip({ user_email: user.email, title, destination: input.destination, days: input.days, budget: input.budget, itinerary: { input, days } });
      push('Trip saved to dashboard!');
    } catch { push('Could not save trip', 'err'); }
  };

  const download = () => {
    const txt = `TOURISM360 ITINERARY\n${title} — ${input.destination} (${input.days} days, ${input.budget})\n\n` +
      days.map((d) => `DAY ${d.day}: ${d.title}\n  Morning: ${d.morning}\n  Afternoon: ${d.afternoon}\n  Evening: ${d.evening}\n  Tip: ${d.tip}\n`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = 'tourism360-itinerary.txt';
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 text-white shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">🤖 AI Trip Planner</h1>
        <p className="text-sm text-white/80 mt-1">Rule-based engine today, LLM-ready tomorrow — day-wise plans in one click.</p>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="text-xs font-bold">DESTINATION<input value={input.destination} onChange={(e) => setInput({ ...input, destination: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none" /></label>
          <label className="text-xs font-bold">TRIP TITLE<input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none" /></label>
          <label className="text-xs font-bold">DAYS (1–10)<input type="number" min={1} max={10} value={input.days} onChange={(e) => setInput({ ...input, days: Math.min(10, Math.max(1, Number(e.target.value))) })} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none" /></label>
          <label className="text-xs font-bold">BUDGET<select value={input.budget} onChange={(e) => setInput({ ...input, budget: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none [&>option]:text-slate-900">{['Budget', 'Comfort', 'Luxury'].map((b) => <option key={b}>{b}</option>)}</select></label>
          <label className="text-xs font-bold">PACE<select value={input.pace} onChange={(e) => setInput({ ...input, pace: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm outline-none [&>option]:text-slate-900">{['Relaxed', 'Balanced', 'Packed'].map((b) => <option key={b}>{b}</option>)}</select></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i}
              onClick={() => setInput({ ...input, interests: input.interests.includes(i) ? input.interests.filter((x) => x !== i) : [...input.interests, i] })}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${input.interests.includes(i) ? 'bg-amber-400 text-slate-900' : 'bg-white/10 border border-white/15'}`}
            >
              {i}
            </button>
          ))}
        </div>
        <button onClick={generate} className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm">
          <Sparkles className="w-4 h-4" />Generate itinerary
        </button>
      </div>

      {days.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <h2 className="font-extrabold text-lg">{title} — {input.destination}</h2>
            <div className="flex-1" />
            <button onClick={save} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-bold"><Save className="w-4 h-4" />Save</button>
            <button onClick={download} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-sm font-bold"><Download className="w-4 h-4" />Export</button>
          </div>
          <div className="grid gap-4">
            {days.map((d) => (
              <div key={d.day} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-600 text-white grid place-items-center font-extrabold">{d.day}</span>
                  <h3 className="font-extrabold">{d.title}</h3>
                </div>
                <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-500/10 p-3.5"><p className="text-xs font-bold text-amber-600">☀️ MORNING</p><p className="mt-1 text-slate-700 dark:text-slate-200">{d.morning}</p></div>
                  <div className="rounded-2xl bg-sky-50 dark:bg-sky-500/10 p-3.5"><p className="text-xs font-bold text-sky-600">🌤️ AFTERNOON</p><p className="mt-1 text-slate-700 dark:text-slate-200">{d.afternoon}</p></div>
                  <div className="rounded-2xl bg-violet-50 dark:bg-violet-500/10 p-3.5"><p className="text-xs font-bold text-violet-600">🌙 EVENING</p><p className="mt-1 text-slate-700 dark:text-slate-200">{d.evening}</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-500">💡 {d.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- AI RECOMMENDATIONS ---------- */
export function RecommendationsPage() {
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('Comfort');
  const [sel, setSel] = useState<string[]>(['heritage', 'food']);
  const [listings, setListings] = useState<Rec[]>([]);
  const [dests, setDests] = useState<Rec[]>([]);
  const [out, setOut] = useState<{ picks: Rec[]; destinations: Rec[] } | null>(null);
  const [drawer, setDrawer] = useState<Rec | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [l, d] = await Promise.all([api.listings(), api.destinations()]);
        setListings(l); setDests(d);
      } catch { /* noop */ }
    })();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">✨ AI Recommendations</h1>
      <p className="text-sm text-slate-500 mt-1">Tell us your vibe — get matched places &amp; destinations</p>
      <div className="mt-4 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 grid sm:grid-cols-3 gap-3">
        <label className="text-xs font-bold text-slate-500">CITY (optional)<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Goa" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm text-slate-900 dark:text-white" /></label>
        <label className="text-xs font-bold text-slate-500">BUDGET<select value={budget} onChange={(e) => setBudget(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm text-slate-900 dark:text-white [&>option]:text-slate-900">{['Budget', 'Comfort', 'Luxury'].map((b) => <option key={b}>{b}</option>)}</select></label>
        <div className="flex items-end">
          <button onClick={() => setOut(recommend({ interests: sel, city, budget }, listings, dests))} className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold">Get recommendations</button>
        </div>
        <div className="sm:col-span-3 flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button key={i} onClick={() => setSel(sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i])} className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${sel.includes(i) ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-white/10'}`}>{i}</button>
          ))}
        </div>
      </div>
      {out && (
        <div className="mt-6 space-y-6">
          <section>
            <h2 className="font-extrabold mb-3">Matched for you</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {out.picks.map((l) => <div key={String(l.id)} onClick={() => setDrawer(l)} className="cursor-pointer"><ListingCard l={l} /></div>)}
            </div>
          </section>
          <section>
            <h2 className="font-extrabold mb-3">Destinations to consider</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {out.destinations.map((d) => <DestinationCard key={String(d.id)} d={d} />)}
            </div>
          </section>
        </div>
      )}
      {drawer && <DetailDrawer item={drawer} type={String(drawer.category)} onClose={() => setDrawer(null)} />}
    </div>
  );
}

/* ---------- AI CHATBOT PAGE ---------- */
export function ChatbotPage() {
  const { t } = useI18n();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">AI Chatbot</h1>
      <p className="text-sm text-slate-500 mt-1">{t('tagline')} Ask about destinations, plans, bookings &amp; safety.</p>
      <div className="mt-4"><ChatPanel full /></div>
      <div className="mt-4 grid sm:grid-cols-3 gap-2 text-xs">
        <Link to="/planner" className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 font-bold hover:border-teal-500 flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-600" />Plan a trip</Link>
        <Link to="/safety" className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 font-bold hover:border-teal-500">🛡️ Safety &amp; SOS</Link>
        <Link to="/help" className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 font-bold hover:border-teal-500">❓ Help &amp; FAQ</Link>
      </div>
    </div>
  );
}
