import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, CalendarCheck, Star, Route, Plus, Trash2, Building2, Users, BarChart3 } from 'lucide-react';
import api from '../lib/api';
import { useAuth, useToast } from '../lib/app-context';
import { Modal, EmptyState, Stars } from '../components/ui';

type Rec = Record<string, unknown>;

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'trips', label: 'My Trips', icon: Route },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'manage', label: 'Manage', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
];

export function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [tab, setTab] = useState('overview');
  const [trips, setTrips] = useState<Rec[]>([]);
  const [favs, setFavs] = useState<Rec[]>([]);
  const [bookings, setBookings] = useState<Rec[]>([]);
  const [reviews, setReviews] = useState<Rec[]>([]);
  const [users, setUsers] = useState<Rec[]>([]);
  const [contacts, setContacts] = useState<Rec[]>([]);
  const [allBookings, setAllBookings] = useState<Rec[]>([]);
  const [listings, setListings] = useState<Rec[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: 'hotel', title: '', city: '', description: '', price_indicative: '', image_url: '' });

  const refresh = async () => {
    if (!user) return;
    try {
      const [t, f, b, r] = await Promise.all([
        api.trips(user.email),
        api.favorites(user.email),
        api.bookings(user.role === 'TOURIST' ? user.email : undefined),
        api.reviews({ user_email: user.email }),
      ]);
      setTrips(t); setFavs(f); setBookings(b); setReviews(r);
      if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        const [u, c, ab] = await Promise.all([api.profiles(), api.contacts(), api.bookings()]);
        setUsers(u); setContacts(c); setAllBookings(ab);
      }
      if (['BUSINESS_OWNER', 'TOUR_GUIDE', 'TRAVEL_AGENT', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        setListings(await api.listings());
      }
    } catch { /* noop */ }
  };

  useEffect(() => { refresh(); }, [user]);
  if (!user) return null;

  const isBiz = ['BUSINESS_OWNER', 'TOUR_GUIDE', 'TRAVEL_AGENT', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
  const visibleTabs = TABS.filter((x) => (x.id === 'manage' ? isBiz : x.id === 'users' ? isAdmin : true));

  const addListing = async () => {
    if (!form.title || !form.city) { push('Title & city required', 'err'); return; }
    try {
      await api.saveListing({
        ...form,
        destination_slug: form.city.toLowerCase(),
        tags: ['partner'],
        image_url: form.image_url || 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80&auto=format&fit=crop',
      });
      setShowAdd(false);
      setForm({ category: 'hotel', title: '', city: '', description: '', price_indicative: '', image_url: '' });
      push('Listing published!');
      refresh();
    } catch { push('Could not publish', 'err'); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
        <p className="text-xs font-bold tracking-widest text-white/60">{user.role.replace('_', ' ')}</p>
        <h1 className="text-2xl font-extrabold mt-1">Namaste, {user.name} 👋</h1>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[[trips.length, 'Trips'], [favs.length, 'Favorites'], [bookings.length, 'Bookings'], [reviews.length, 'Reviews']].map(([n, l]) => (
            <div key={l as string} className="rounded-2xl bg-white/10 p-3.5">
              <p className="text-2xl font-extrabold">{n as number}</p>
              <p className="text-xs text-white/70">{l as string}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {visibleTabs.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap ${tab === x.id ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-white/10'}`}>
            <x.icon className="w-4 h-4" />{x.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/planner" className="rounded-3xl p-5 bg-gradient-to-br from-indigo-600 to-violet-700 text-white"><p className="text-2xl">🤖</p><p className="font-extrabold mt-1">Plan a new trip</p><p className="text-xs text-white/75">AI itineraries in seconds</p></Link>
            <Link to="/explore" className="rounded-3xl p-5 bg-gradient-to-br from-teal-600 to-emerald-700 text-white"><p className="text-2xl">🧭</p><p className="font-extrabold mt-1">Explore</p><p className="text-xs text-white/75">Search the ecosystem</p></Link>
            <Link to="/recommendations" className="rounded-3xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white"><p className="text-2xl">✨</p><p className="font-extrabold mt-1">Recommendations</p><p className="text-xs text-white/75">Matched to your vibe</p></Link>
            {isBiz && (
              <div className="rounded-3xl border border-slate-200 dark:border-white/10 p-5 md:col-span-3">
                <p className="font-extrabold">Partner quick actions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button onClick={() => setShowAdd(true)} className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold">+ Add listing</button>
                  <button onClick={() => setTab('manage')} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-bold">Manage inventory</button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'trips' && (trips.length === 0 ? <EmptyState msg="No trips yet — plan one with AI!" /> : (
          <div className="grid gap-3">
            {trips.map((x) => (
              <div key={String(x.id)} className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{String(x.title)}</p>
                  <p className="text-xs text-slate-500">{String(x.destination)} • {String(x.days)} days • {String(x.budget)}</p>
                </div>
                <button onClick={async () => { await api.deleteTrip(Number(x.id)); push('Trip deleted'); refresh(); }} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ))}

        {tab === 'favorites' && (favs.length === 0 ? <EmptyState msg="No favorites yet — tap ♡ on anything!" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favs.map((f) => (
              <div key={String(f.id)} className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex gap-3 p-2.5">
                <img src={String(f.image_url)} className="w-20 h-20 rounded-xl object-cover" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm line-clamp-1">{String(f.title)}</p>
                  <p className="text-xs text-slate-500">{String(f.item_type)} • {String(f.city)}</p>
                  <button onClick={async () => { await api.removeFavorite({ id: f.id }); push('Removed'); refresh(); }} className="mt-1 text-xs font-bold text-rose-500">Remove</button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {tab === 'bookings' && (bookings.length === 0 ? <EmptyState msg="No bookings yet" /> : (
          <div className="grid gap-3">
            {bookings.map((b) => (
              <div key={String(b.id)} className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[180px]">
                  <p className="font-bold text-sm">{String(b.item_title)}</p>
                  <p className="text-xs text-slate-500">{String(b.item_type)} • {String(b.date_text)} • {String(b.guests)} guests • {String(b.user_email)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : b.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{String(b.status)}</span>
                {isBiz && (
                  <select value={String(b.status)} onChange={async (e) => { await api.updateBooking({ id: b.id, status: e.target.value }); push('Status updated'); refresh(); }} className="text-xs border rounded-lg px-2 py-1.5 bg-transparent">
                    {['REQUESTED', 'CONFIRMED', 'CANCELLED'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                )}
                <button onClick={async () => { await api.deleteBooking(Number(b.id)); push('Booking removed'); refresh(); }} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        ))}

        {tab === 'reviews' && (reviews.length === 0 ? <EmptyState msg="No reviews yet" /> : (
          <div className="grid gap-3">
            {reviews.map((r) => (
              <div key={String(r.id)} className="rounded-2xl border border-slate-200 dark:border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{String(r.item_title)}</p>
                  <Stars n={Number(r.rating)} />
                </div>
                <p className="text-sm text-slate-500 mt-1">{String(r.comment)}</p>
                <button onClick={async () => { await api.deleteReview(Number(r.id)); push('Review deleted'); refresh(); }} className="mt-2 text-xs font-bold text-rose-500">Delete</button>
              </div>
            ))}
          </div>
        ))}

        {tab === 'manage' && isBiz && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold">Inventory ({listings.length})</h2>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"><Plus className="w-4 h-4" />Add listing</button>
            </div>
            <div className="grid gap-2.5">
              {listings.slice(0, 30).map((l) => (
                <div key={String(l.id)} className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 flex items-center gap-3">
                  <img src={String(l.image_url)} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm line-clamp-1">{String(l.title)}</p>
                    <p className="text-xs text-slate-500">{String(l.category)} • {String(l.city)}</p>
                  </div>
                  <button onClick={async () => { await api.deleteListing(Number(l.id)); push('Listing deleted'); refresh(); }} className="p-2 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && isAdmin && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h2 className="font-extrabold mb-2">Users ({users.length})</h2>
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={String(u.id)} className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 text-sm">
                    <p className="font-bold">{String(u.name)}</p>
                    <p className="text-xs text-slate-500">{String(u.email)} • {String(u.role)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-extrabold mb-2">Inbox ({contacts.length})</h2>
              <div className="space-y-2">
                {contacts.length === 0 && <EmptyState msg="No messages" />}
                {contacts.map((c) => (
                  <div key={String(c.id)} className="rounded-2xl border border-slate-200 dark:border-white/10 p-3 text-sm">
                    <p className="font-bold">{String(c.name)} <span className="font-normal text-slate-400">• {String(c.email)}</span></p>
                    <p className="text-slate-500 mt-0.5">{String(c.message)}</p>
                  </div>
                ))}
              </div>
              <h2 className="font-extrabold mt-4 mb-2">All bookings ({allBookings.length})</h2>
              <p className="text-xs text-slate-500">Manage statuses in the Bookings tab.</p>
            </div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add listing">
        <div className="space-y-3">
          <label className="block text-sm font-bold">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm [&>option]:text-slate-900">{['hotel', 'restaurant', 'attraction', 'activity', 'experience', 'shopping', 'cinema'].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="block text-sm font-bold">Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
          <label className="block text-sm font-bold">City<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
          <label className="block text-sm font-bold">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
          <label className="block text-sm font-bold">Indicative price (text)<input value={form.price_indicative} onChange={(e) => setForm({ ...form, price_indicative: e.target.value })} placeholder="e.g. ₹2,500 / night (indicative)" className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
          <label className="block text-sm font-bold">Image URL (optional)<input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="mt-1 w-full px-3 py-2.5 rounded-xl border bg-transparent text-sm" /></label>
          <button onClick={addListing} className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold text-sm">Publish listing</button>
        </div>
      </Modal>
    </div>
  );
}
