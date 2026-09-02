import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Logo } from '@/components/Logo';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = isSignup
      ? await signUp(email, password, displayName || email.split('@')[0])
      : await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      const from = (location.state as { from?: string })?.from || '/dashboard';
      navigate(from);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-100 lg:flex-row">
      {/* Left panel — brand */}
      <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-80 w-80 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img
              src="/image.png"
              alt="Kathazo"
              className="h-12 w-12 object-contain"
            />
            <span className="font-serif text-2xl font-bold text-cream-100">Kathazo</span>
          </Link>
          <h2 className="mt-12 max-w-md font-serif text-4xl font-bold leading-tight text-cream-100">
            {isSignup
              ? 'Begin your story with us'
              : 'Welcome back to your library'}
          </h2>
          <p className="mt-4 max-w-md text-cream-200/80">
            {isSignup
              ? 'Join a community of readers, writers, authors, and booksellers — all in one literary home.'
              : 'Sign in to continue reading, writing, and connecting with the Kathazo community.'}
          </p>
          <p className="mt-8 font-serif text-lg italic text-gold-400">Books | Authors | Community</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo />
          </div>

          <h1 className="mt-8 font-serif text-3xl font-bold text-navy-500 lg:mt-0">
            {isSignup ? 'Create your account' : 'Sign in'}
          </h1>
          <p className="mt-2 text-sm text-ink-400">
            {isSignup ? 'It only takes a moment to join.' : 'Good to have you back.'}
          </p>

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isSignup && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Display name</label>
                <div className="relative mt-1.5">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Austen"
                    className="input-field pl-11"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Email</label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-11"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Password</label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="input-field pl-11"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-400">
            {isSignup ? (
              <>Already have an account? <Link to="/login" className="font-medium text-navy-500 hover:text-navy-700 hover:underline">Sign in</Link></>
            ) : (
              <>New to Kathazo? <Link to="/signup" className="font-medium text-navy-500 hover:text-navy-700 hover:underline">Create an account</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
