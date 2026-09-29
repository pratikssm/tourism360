import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ROLES,
  SIGNUP_ROLES,
  useAuth,
  useToast,
  type Role,
  type SignupRole,
} from '../lib/app-context';
import { Logo } from '../components/ui';
import { isSupabaseConfigured } from '../lib/supabase';
import supabase from '../lib/supabase';

const ROLE_HINT: Record<SignupRole, string> = {
  TOURIST: '🧳 Discover, plan, book & review',
  BUSINESS_OWNER: '🏨 List properties & manage bookings',
  TOUR_GUIDE: '🧭 Offer tours & experiences',
  TRAVEL_AGENT: '✈️ Build packages & client trips',
};

const PASSWORD_MIN_LENGTH = 8;

function validatePassword(password: string): string {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'Password must be at least 8 characters long.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number.';
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character.';
  }

  return '';
}

function validateName(name: string): string {
  const value = name.trim();

  if (!value) {
    return 'Please enter your full name.';
  }

  if (value.length < 2) {
    return 'Name must contain at least 2 characters.';
  }

  if (!/^[A-Za-zÀ-ÿ\s.'-]+$/.test(value)) {
    return 'Please enter a valid name.';
  }

  return '';
}

function validateEmail(email: string): string {
  const value = email.trim();

  if (!value) {
    return 'Please enter your email address.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
    return 'Please enter a valid email address.';
  }

  return '';
}

function Shell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl">
        <Logo />

        <h1 className="mt-4 text-2xl font-extrabold">
          {title}
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          {sub}
        </p>

        <div className="mt-5">
          {children}
        </div>
      </div>
    </div>
  );
}
function Divider() {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      <span className="text-xs font-semibold text-slate-400">
        OR
      </span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
    </div>
  );
}
function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.79-.07-1.55-.23-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.95 2.94v2.45h3.15c1.85-1.7 2.91-4.21 2.91-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 21.64c2.65 0 4.87-.88 6.49-2.39l-3.15-2.45c-.87.58-1.98.92-3.34.92-2.56 0-4.73-1.73-5.51-4.06H3.23v2.53A9.8 9.8 0 0 0 12 21.64Z"
      />
      <path
        fill="#FBBC05"
        d="M6.49 13.66A5.9 5.9 0 0 1 6.18 12c0-.58.1-1.14.31-1.66V7.81H3.23A9.82 9.82 0 0 0 2.18 12c0 1.58.38 3.07 1.05 4.19l3.26-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.28c1.44 0 2.74.5 3.76 1.48l2.82-2.82C16.87 3.35 14.65 2.36 12 2.36a9.8 9.8 0 0 0-8.77 5.45l3.26 2.53C7.27 8.01 9.44 6.28 12 6.28Z"
      />
    </svg>
  );
}
export function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { push } = useToast();

  const [email, setEmail] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('tourism360_remember_email') || '';
  });

  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('TOURIST');
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      localStorage.getItem('tourism360_remember_email')
    );
  });

  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);

    if (emailError) {
      push(emailError, 'err');
      return;
    }

    if (!password) {
      push('Please enter your password.', 'err');
      return;
    }

    /*
     * Remember only the email address.
     * Never store the user's password in localStorage.
     */
    if (rememberMe) {
      localStorage.setItem(
        'tourism360_remember_email',
        email.trim()
      );
    } else {
      localStorage.removeItem(
        'tourism360_remember_email'
      );
    }

    setBusy(true);

    try {
      await login(email.trim(), password, role);

      push('Login successful');
      nav('/dashboard');
    } catch (error) {
      push(
        error instanceof Error
          ? error.message
          : 'Login failed',
        'err'
      );
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      push(
        'Google Sign-In is unavailable until Supabase is configured.',
        'err'
      );
      return;
    }

    setGoogleBusy(true);

    try {
      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
          },
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      push(
        error instanceof Error
          ? error.message
          : 'Google Sign-In failed',
        'err'
      );

      setGoogleBusy(false);
    }
  };

  return (
    <Shell
      title="Welcome back"
      sub="Sign in to your Tourism360 account."
    >
      <form
        onSubmit={go}
        className="space-y-3"
      >
        {!isSupabaseConfigured && (
          <p className="text-sm text-rose-600">
            Authentication is unavailable until Supabase
            environment variables are configured.
          </p>
        )}

        <label className="block text-sm font-bold">
          Email

          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="you@example.com"
            className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm outline-none focus:border-teal-500"
          />
        </label>

        <label className="block text-sm font-bold">
          Password

          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="Enter your password"
            className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm outline-none focus:border-teal-500"
          />
        </label>

        <label className="block text-sm font-bold">
          Role

          <select
            value={role}
            onChange={(e) =>
              setRole(e.target.value as Role)
            }
            className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm [&>option]:text-slate-900"
          >
            {ROLES.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) =>
                setRememberMe(e.target.checked)
              }
              className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />

            <span>Remember me</span>
          </label>

          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={
            busy ||
            googleBusy ||
            !isSupabaseConfigured
          }
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm transition"
        >
          {busy
            ? 'Signing in…'
            : 'Login'}
        </button>
      </form>

      <Divider />

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={
          busy ||
          googleBusy ||
          !isSupabaseConfigured
        }
        className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 text-slate-800 dark:text-white font-bold text-sm flex items-center justify-center gap-3 transition"
      >
        <GoogleIcon />

        {googleBusy
          ? 'Connecting to Google…'
          : 'Continue with Google'}
      </button>

      <p className="mt-4 text-xs text-center text-slate-500">
        New here?{' '}
        <Link
          to="/register"
          className="font-bold text-teal-600"
        >
          Create account
        </Link>
      </p>
    </Shell>
  );
}
export function RegisterPage() {
  const nav = useNavigate();
  const { register } = useAuth();
  const { push } = useToast();

  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'TOURIST' as SignupRole,
  });

  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameError = validateName(f.name);

    if (nameError) {
      push(nameError, 'err');
      return;
    }

    const cleanName = f.name.trim();

    if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(cleanName)) {
      push(
        'Please enter a valid name using letters and spaces only.',
        'err'
      );
      return;
    }

    if (cleanName.length < 3 || cleanName.length > 50) {
      push(
        'Name must be between 3 and 50 characters.',
        'err'
      );
      return;
    }

    const emailError = validateEmail(f.email);

    if (emailError) {
      push(emailError, 'err');
      return;
    }

    const passwordError = validatePassword(f.password);

    if (passwordError) {
      push(passwordError, 'err');
      return;
    }

    if (f.password !== f.confirmPassword) {
      push(
        'Password and confirm password do not match.',
        'err'
      );
      return;
    }

    setBusy(true);

    try {
      const signedIn = await register(
        f.email.trim(),
        f.password,
        cleanName,
        f.role
      );

      if (signedIn) {
        push(
          `Account created — welcome, ${cleanName}!`
        );

        nav('/dashboard');
      } else {
        push(
          'Account created. Check your email to confirm, then log in.',
          'info'
        );

        nav('/login');
      }
    } catch (error) {
      push(
        error instanceof Error
          ? error.message
          : 'Registration failed',
        'err'
      );
    } finally {
      setBusy(false);
    }
  };

  const signUpWithGoogle = async () => {
    if (!supabase) {
      push(
        'Google Sign-In is unavailable until Supabase is configured.',
        'err'
      );
      return;
    }

    setGoogleBusy(true);

    try {
      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      push(
        error instanceof Error
          ? error.message
          : 'Google Sign-Up failed',
        'err'
      );

      setGoogleBusy(false);
    }
  };

  const invalidNames = [
  'abc',
  'abcd',
  'test',
  'pqr',
  'testing',
  'admin',
  'administrator',
  'user',
  'username',
  'name',
  'fullname',
  'unknown',
  'demo',
  'dummy',
];

const normalizedName = f.name.trim().toLowerCase();

const isInvalidName =
  invalidNames.includes(normalizedName);


  const nameValidationError =
  f.name.length > 0
    ? f.name.trim().length < 3
      ? 'Name must be at least 3 characters.'
      : f.name.trim().length > 50
        ? 'Name must not exceed 50 characters.'
        : isInvalidName
          ? 'Please enter a valid name.'
          : !/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(
              f.name.trim()
            )
            ? 'Please use letters and spaces only.'
            : ''
    : '';

  const passwordError =
    f.password.length > 0
      ? validatePassword(f.password)
      : '';

  const passwordsMatch =
    f.confirmPassword.length === 0 ||
    f.password === f.confirmPassword;

  return (
    <Shell
      title="Join Tourism360"
      sub="Create your account and choose your travel role."
    >
      <form
        onSubmit={go}
        className="space-y-3"
      >
        {!isSupabaseConfigured && (
          <p className="text-sm text-rose-600">
            Registration is unavailable until Supabase
            environment variables are configured.
          </p>
        )}

        <label className="block text-sm font-bold">
          Full name

          <input
            type="text"
            autoComplete="name"
            required
            minLength={3}
            maxLength={50}
            value={f.name}
            onChange={(e) => {
              const value = e.target.value.replace(
                /[^A-Za-z\s]/g,
                ''
              );

              setF({
                ...f,
                name: value,
              });
            }}
            placeholder="Enter your full name"
            className={`mt-1 w-full px-3.5 py-2.5 rounded-xl border bg-transparent text-sm outline-none ${
              nameValidationError
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-slate-200 dark:border-white/10 focus:border-teal-500'
            }`}
          />

          {nameValidationError && (
            <span className="block mt-1 text-[11px] text-rose-600">
              {nameValidationError}
            </span>
          )}
        </label>

        <label className="block text-sm font-bold">
          Email

          <input
            type="email"
            autoComplete="email"
            required
            value={f.email}
            onChange={(e) =>
              setF({
                ...f,
                email: e.target.value,
              })
            }
            placeholder="you@example.com"
            className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm outline-none focus:border-teal-500"
          />
        </label>

        <label className="block text-sm font-bold">
          Password

          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={f.password}
            onChange={(e) =>
              setF({
                ...f,
                password: e.target.value,
              })
            }
            placeholder="Create a strong password"
            className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm outline-none focus:border-teal-500"
          />

          {/* <span className="block mt-1 text-[11px] text-slate-500">
            Minimum 8 characters with uppercase,
            lowercase, number and special character.
          </span> */}

          {passwordError && (
            <span className="block mt-1 text-[11px] text-rose-600">
              {passwordError}
            </span>
          )}
        </label>

        <label className="block text-sm font-bold">
          Confirm password

          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={f.confirmPassword}
            onChange={(e) =>
              setF({
                ...f,
                confirmPassword: e.target.value,
              })
            }
            placeholder="Re-enter your password"
            className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm outline-none focus:border-teal-500"
          />

          {!passwordsMatch && (
            <span className="block mt-1 text-[11px] text-rose-600">
              Passwords do not match.
            </span>
          )}
        </label>

        <div>
          <p className="text-sm font-bold mb-2">
            Choose your role
          </p>

          <div className="grid grid-cols-2 gap-2">
            {SIGNUP_ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() =>
                  setF({
                    ...f,
                    role: r,
                  })
                }
                className={`px-2 py-2.5 rounded-xl text-[11px] font-extrabold border transition ${
                  f.role === r
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>

          <p className="mt-1.5 text-xs text-slate-500">
            {ROLE_HINT[f.role]}
          </p>
        </div>

        <button
          type="submit"
          disabled={
            busy ||
            googleBusy ||
            !isSupabaseConfigured ||
            Boolean(nameValidationError) ||
            Boolean(passwordError) ||
            !passwordsMatch
          }
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm transition"
        >
          {busy
            ? 'Creating account…'
            : 'Create account'}
        </button>
      </form>

      <Divider />

      <button
        type="button"
        onClick={signUpWithGoogle}
        disabled={
          busy ||
          googleBusy ||
          !isSupabaseConfigured
        }
        className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 text-slate-800 dark:text-white font-bold text-sm flex items-center justify-center gap-3 transition"
      >
        <GoogleIcon />

        {googleBusy
          ? 'Connecting to Google…'
          : 'Continue with Google'}
      </button>

      <p className="mt-4 text-xs text-center text-slate-500">
        Have an account?{' '}
        <Link
          to="/login"
          className="font-bold text-teal-600"
        >
          Login
        </Link>
      </p>
    </Shell>
  );
}

/* =========================================================
   FORGOT PASSWORD
========================================================= */

export function ForgotPasswordPage() {
  const nav = useNavigate();
  const { push } = useToast();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const sendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      push(emailError, 'err');
      return;
    }

    if (!supabase) {
      push('Password reset is unavailable until Supabase is configured.', 'err');
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setSent(true);
      push('Password reset link sent. Please check your email.');
    } catch (error) {
      push(
        error instanceof Error
          ? error.message
          : 'Unable to send password reset email.',
        'err'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      title="Forgot password?"
      sub="Enter your registered email and we will send you a password reset link."
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900 p-4">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
              Reset link sent successfully.
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Check your email inbox and open the password reset link.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-sm"
          >
            Send Again
          </button>

          <button
            type="button"
            onClick={() => nav('/login')}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <form onSubmit={sendResetLink} className="space-y-4">
          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm outline-none focus:border-teal-500"
            />
          </label>

          <button
            type="submit"
            disabled={busy || !isSupabaseConfigured}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm transition"
          >
            {busy ? 'Sending reset link…' : 'Send Reset Link'}
          </button>

          <button
            type="button"
            onClick={() => nav('/login')}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-sm"
          >
            Back to Login
          </button>
        </form>
      )}
    </Shell>
  );
}

/* =========================================================
   RESET PASSWORD
========================================================= */

export function ResetPasswordPage() {
  const nav = useNavigate();
  const { push } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    if (!supabase) {
      setChecking(false);
      setReady(false);
      return () => {
        active = false;
      };
    }

    const client = supabase;

    const checkRecoverySession = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();

        if (active) {
          setReady(Boolean(session));
          setChecking(false);
        }
      } catch {
        if (active) {
          setReady(false);
          setChecking(false);
        }
      }
    };

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        setReady(true);
        setChecking(false);
      }
    });

    checkRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const passwordError =
    password.length > 0 ? validatePassword(password) : '';

  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword;

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      push('Password reset is unavailable until Supabase is configured.', 'err');
      return;
    }

    const error = validatePassword(password);
    if (error) {
      push(error, 'err');
      return;
    }

    if (password !== confirmPassword) {
      push('Password and confirm password do not match.', 'err');
      return;
    }

    setBusy(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      push('Password updated successfully. Please login with your new password.');
      await supabase.auth.signOut();
      nav('/login', { replace: true });
    } catch (error) {
      push(
        error instanceof Error
          ? error.message
          : 'Unable to update password.',
        'err'
      );
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <Shell
        title="Checking reset link"
        sub="Please wait while we verify your password reset session."
      >
        <div className="text-center py-6">
          <p className="text-sm text-slate-500">Verifying reset link…</p>
        </div>
      </Shell>
    );
  }

  if (!ready) {
    return (
      <Shell
        title="Reset link expired"
        sub="This password reset link is invalid or has expired."
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Please request a new password reset link from the Forgot Password page.
          </p>

          <button
            type="button"
            onClick={() => nav('/forgot-password')}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm"
          >
            Request New Reset Link
          </button>

          <button
            type="button"
            onClick={() => nav('/login')}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-sm"
          >
            Back to Login
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title="Set new password"
      sub="Create a new secure password for your Tourism360 account."
    >
      <form onSubmit={updatePassword} className="space-y-4">
        <label className="block text-sm font-bold">
          New password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            className={`mt-1 w-full px-3.5 py-3 rounded-xl border bg-transparent text-sm outline-none ${
              passwordError
                ? 'border-rose-500'
                : 'border-slate-200 dark:border-white/10 focus:border-teal-500'
            }`}
          />
          {passwordError && (
            <span className="block mt-1 text-[11px] text-rose-600">
              {passwordError}
            </span>
          )}
        </label>

        <label className="block text-sm font-bold">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className={`mt-1 w-full px-3.5 py-3 rounded-xl border bg-transparent text-sm outline-none ${
              !passwordsMatch
                ? 'border-rose-500'
                : 'border-slate-200 dark:border-white/10 focus:border-teal-500'
            }`}
          />
          {!passwordsMatch && (
            <span className="block mt-1 text-[11px] text-rose-600">
              Passwords do not match.
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={
            busy ||
            !isSupabaseConfigured ||
            Boolean(passwordError) ||
            !passwordsMatch
          }
          className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-sm transition"
        >
          {busy ? 'Updating password…' : 'Set New Password'}
        </button>

        <button
          type="button"
          onClick={() => nav('/login')}
          className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 font-bold text-sm"
        >
          Back to Login
        </button>
      </form>
    </Shell>
  );
}

