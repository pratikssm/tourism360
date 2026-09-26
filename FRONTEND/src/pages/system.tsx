import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-7xl font-extrabold bg-gradient-to-r from-teal-500 to-indigo-600 bg-clip-text text-transparent">404</p>
      <h1 className="mt-3 text-2xl font-extrabold">Lost in transit?</h1>
      <p className="text-sm text-slate-500 mt-2">This route doesn&apos;t exist — let&apos;s get you back on the journey.</p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to="/" className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold">Go home</Link>
        <Link to="/explore" className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-sm font-bold">Explore</Link>
      </div>
    </div>
  );
}

export function Unauthorized() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-7xl">🔒</p>
      <h1 className="mt-3 text-2xl font-extrabold">Unauthorized (403)</h1>
      <p className="text-sm text-slate-500 mt-2">Your role doesn&apos;t have access here, or you need to login.</p>
      <div className="mt-5 flex justify-center gap-2">
        <Link to="/login" className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold">Login</Link>
        <Link to="/" className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-sm font-bold">Home</Link>
      </div>
    </div>
  );
}

export function ServerError() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-7xl">🛠️</p>
      <h1 className="mt-3 text-2xl font-extrabold">Server error (500)</h1>
      <p className="text-sm text-slate-500 mt-2">Our engines hit turbulence. Please retry in a moment.</p>
      <div className="mt-5 flex justify-center gap-2">
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold">Retry</button>
        <Link to="/" className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-sm font-bold">Home</Link>
      </div>
    </div>
  );
}
