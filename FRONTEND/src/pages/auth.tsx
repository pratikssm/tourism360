import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SIGNUP_ROLES, useAuth, useToast, type SignupRole } from '../lib/app-context';
import { Logo } from '../components/ui';
import { isSupabaseConfigured } from '../lib/supabase';

const ROLE_HINT: Record<SignupRole, string> = {
  TOURIST: '🧳 Discover, plan, book & review',
  BUSINESS_OWNER: '🏨 List properties & manage bookings',
  TOUR_GUIDE: '🧭 Offer tours & experiences',
  TRAVEL_AGENT: '✈️ Build packages & client trips',
};

function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
        <Logo />
        <h1 className="mt-4 text-2xl font-extrabold">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{sub}</p>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email.trim(), password);
      push('Login successful');
      nav('/dashboard');
    } catch (error) {
      push(error instanceof Error ? error.message : 'Login failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Welcome back" sub="Sign in to your Tourism360 account.">
      <form onSubmit={go} className="space-y-3">
        {!isSupabaseConfigured && <p className="text-sm text-rose-600">Authentication is unavailable until Supabase environment variables are configured.</p>}
        <label className="block text-sm font-bold">Email<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" /></label>
        <label className="block text-sm font-bold">Password<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" /></label>
        <button disabled={busy || !isSupabaseConfigured} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm">{busy ? 'Signing in…' : 'Login'}</button>
        <p className="text-xs text-center text-slate-500">New here? <Link to="/register" className="font-bold text-teal-600">Create account</Link></p>
      </form>
    </Shell>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const { push } = useToast();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'TOURIST' as SignupRole });
  const [busy, setBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const signedIn = await register(f.email.trim(), f.password, f.name.trim(), f.role);
      if (signedIn) {
        push(`Account created — welcome, ${f.name}!`);
        nav('/dashboard');
      } else {
        push('Account created. Check your email to confirm, then log in.', 'info');
        nav('/login');
      }
    } catch (error) {
      push(error instanceof Error ? error.message : 'Registration failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell title="Join Tourism360" sub="Create your account and choose your travel role.">
      <form onSubmit={go} className="space-y-3">
        {!isSupabaseConfigured && <p className="text-sm text-rose-600">Registration is unavailable until Supabase environment variables are configured.</p>}
        <label className="block text-sm font-bold">Full name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" /></label>
        <label className="block text-sm font-bold">Email<input type="email" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" /></label>
        <label className="block text-sm font-bold">Password<input type="password" autoComplete="new-password" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm" /></label>
        <div>
          <p className="text-sm font-bold mb-2">Choose your role</p>
          <div className="grid grid-cols-2 gap-2">
            {SIGNUP_ROLES.map((r) => (
              <button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={`px-2 py-2.5 rounded-xl text-[11px] font-extrabold border transition ${f.role === r ? 'bg-teal-600 text-white border-teal-600' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}>{r.replace('_', ' ')}</button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{ROLE_HINT[f.role]}</p>
        </div>
        <button disabled={busy || !isSupabaseConfigured} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm">{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="text-xs text-center text-slate-500">Have an account? <Link to="/login" className="font-bold text-teal-600">Login</Link></p>
      </form>
    </Shell>
  );
}
