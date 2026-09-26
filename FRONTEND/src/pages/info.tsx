import { useState } from 'react';
import { ShieldCheck, Phone, AlertTriangle, HeartPulse, ChevronDown, Send } from 'lucide-react';
import api from '../lib/api';
import { useToast, useI18n } from '../lib/app-context';
import { SosCard } from '../components/ui';

/* ---------- SAFETY ---------- */
export function SafetyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2"><ShieldCheck className="w-7 h-7 text-emerald-600" />Travel Safety</h1>
        <p className="text-sm text-slate-500 mt-1">Official helplines, advisories &amp; smart-travel checklist</p>
      </div>
      <SosCard />
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { n: 'Emergency', v: '112', d: 'Police • Fire • Medical (all-in-one)' },
          { n: 'Tourist Helpline', v: '1363', d: 'Incredible India, 12 languages' },
          { n: 'Women Helpline', v: '1091', d: '24×7 assistance' },
        ].map((h) => (
          <a key={h.n} href={`tel:${h.v}`} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 hover:border-teal-500 transition">
            <p className="text-xs font-bold text-slate-400">{h.n.toUpperCase()}</p>
            <p className="text-2xl font-extrabold text-teal-700 dark:text-teal-300 flex items-center gap-2"><Phone className="w-5 h-5" />{h.v}</p>
            <p className="text-xs text-slate-500 mt-1">{h.d}</p>
          </a>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 p-5">
          <h2 className="font-extrabold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" />Smart-travel checklist</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {['Share live location with family on day trips & treks', 'Keep digital + physical copies of ID and bookings', 'Drink bottled water; eat freshly-cooked local food', 'Pre-book airport transfers for late-night arrivals', 'Check Open-Meteo weather on the city page before heading out', 'Save 112 + your hotel + guide numbers offline'].map((x) => (
              <li key={x} className="flex gap-2"><span className="text-emerald-500 font-bold">✓</span>{x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 p-5">
          <h2 className="font-extrabold flex items-center gap-2"><HeartPulse className="w-5 h-5 text-rose-500" />Health &amp; advisories</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {['Carry basic medicines + ORS for long journeys', 'Travel insurance recommended for adventure activities', 'Monsoon (Jun–Sep): check road & ferry advisories', 'High altitude (Ladakh/Spiti): acclimatise 24–48 hrs', 'Respect local customs at religious sites', 'Report scams to 1363 tourist helpline'].map((x) => (
              <li key={x} className="flex gap-2"><span className="text-emerald-500 font-bold">✓</span>{x}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-2xl p-4 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-xs text-sky-800 dark:text-sky-300">
        Advisories are general guidance. Always follow local authorities &amp; live official announcements during your trip.
      </div>
    </div>
  );
}

/* ---------- ABOUT ---------- */
export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div className="rounded-3xl overflow-hidden relative">
        <img src="https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1400&q=80&auto=format&fit=crop" className="h-60 sm:h-72 w-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 p-6 text-white">
          <h1 className="text-3xl font-extrabold">TOURISM360</h1>
          <p className="text-sm text-white/80">Discover. Plan. Travel. Experience.</p>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { t: '360° ecosystem', d: 'Destinations, stays, food, sights, activities, shopping, cinema, events & transport in one premium platform.' },
          { t: 'AI-first planning', d: 'Trip planner, recommendations & chatbot help every traveller — rule-based today, LLM-ready architecture.' },
          { t: 'Honest data', d: 'Only Open-Meteo is live. Prices, ratings & availability are indicative or placeholders — never fabricated.' },
        ].map((c) => (
          <div key={c.t} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5">
            <h3 className="font-extrabold">{c.t}</h3>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{c.d}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 p-6">
        <h2 className="font-extrabold text-lg">For partners</h2>
        <div className="mt-3 grid sm:grid-cols-4 gap-3 text-sm">
          {[
            ['🏨 Business Owners', 'List hotels, restaurants & shops; manage bookings & reviews.'],
            ['🧭 Tour Guides', 'Offer experiences, treks & city walks.'],
            ['✈️ Travel Agents', 'Build packages & manage client trips.'],
            ['🛡️ Admins', 'Moderate content, users & platform health.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-slate-50 dark:bg-white/5 p-4">
              <p className="font-bold">{t}</p>
              <p className="text-xs text-slate-500 mt-1">{d}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl bg-slate-900 text-white p-6 text-sm">
        <h2 className="font-extrabold">Technology</h2>
        <p className="mt-2 text-white/75 leading-relaxed">
          React + Vite + Tailwind frontend • REST <code className="bg-white/10 px-1.5 py-0.5 rounded">/api/v1</code>-ready service layer • JWT/RBAC role architecture (Tourist, Owner, Guide, Agent, Admin, Super Admin) • MongoDB-ready document models • Open-Meteo live weather (no key) • Payments &amp; aggregator APIs as future-ready placeholders.
        </p>
      </div>
    </div>
  );
}

/* ---------- CONTACT ---------- */
export function ContactPage() {
  const { push } = useToast();
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name || !f.email || !f.message) { push('Please fill all fields', 'err'); return; }
    try {
      await api.contact(f);
      setF({ name: '', email: '', message: '' });
      push('Message sent — we reply within 24–48 hrs');
    } catch { push('Could not send message', 'err'); }
  };
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 grid md:grid-cols-2 gap-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Contact us</h1>
        <p className="text-sm text-slate-500 mt-1">Support, partnerships &amp; business onboarding</p>
        <div className="mt-4 space-y-3 text-sm">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4"><p className="font-bold">📧 Support</p><p className="text-slate-500">support@tourism360.in (placeholder)</p></div>
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4"><p className="font-bold">🤝 Partners</p><p className="text-slate-500">partners@tourism360.in (placeholder)</p></div>
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4"><p className="font-bold">📍 HQ</p><p className="text-slate-500">Jaipur • New Delhi • Bengaluru, India</p></div>
        </div>
      </div>
      <form onSubmit={send} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-3">
        <label className="block text-sm font-bold">Name<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" /></label>
        <label className="block text-sm font-bold">Email<input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" /></label>
        <label className="block text-sm font-bold">Message<textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={5} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" /></label>
        <button className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2"><Send className="w-4 h-4" />Send message</button>
      </form>
    </div>
  );
}

/* ---------- HELP / FAQ ---------- */
const FAQS: [string, string][] = [
  ['Are prices & availability live?', 'No. Only Open-Meteo weather is live. Prices, ratings, seats & timings are indicative or placeholders — always confirm with the provider.'],
  ['How do bookings work?', 'Tap Book on any listing. It saves a booking request (no payment) visible in your dashboard. Providers confirm directly in production.'],
  ['How does the AI Trip Planner work?', 'Pick destination, days, budget & interests. Our engine assembles a day-wise plan from curated listings. Save, export or edit it anytime.'],
  ['Can I list my business?', 'Yes! Register as Business Owner, Guide or Agent, then add listings from your dashboard. Admins moderate content.'],
  ['Is there a payment gateway?', 'Not yet — payments are a future-ready placeholder. No money is collected in this build.'],
  ['Which languages are supported?', 'English & Hindi across the UI, plus voice search in Explore.'],
  ['What roles exist?', 'Tourist, Business Owner, Tour Guide, Travel Agent, Admin & Super Admin — each with its own dashboard & permissions.'],
  ['How is my data used?', 'Favorites, trips, bookings & reviews are stored against your account to personalise travel. Contact support for deletion.'],
];

export function FaqPage() {
  const [open, setOpen] = useState(0);
  const { t } = useI18n();
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">{t('help')}</h1>
      <p className="text-sm text-slate-500 mt-1">Everything about travelling with Tourism360</p>
      <div className="mt-5 space-y-2.5">
        {FAQS.map(([q, a], i) => (
          <div key={q} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center gap-2 px-4 py-3.5 text-left font-bold text-sm">
              {q}<ChevronDown className={`w-4 h-4 ml-auto transition ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-4 pb-4 text-sm text-slate-500 leading-relaxed">{a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
