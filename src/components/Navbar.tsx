import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, PenLine, Store, Compass, LayoutDashboard, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '@/lib/auth';

const NAV_LINKS = [
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/write', label: 'Write', icon: PenLine },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-cream-300 bg-cream-100/90 backdrop-blur-md shadow-sm'
          : 'border-b border-transparent bg-cream-100/60 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-navy-50 text-navy-600'
                    : 'text-navy-400 hover:bg-navy-50 hover:text-navy-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/discover"
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-600"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="btn-outline px-4 py-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden lg:inline">Dashboard</span>
              </Link>
              <Link
                to="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-full text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-600"
                aria-label="Account settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <Link
                to={`/authors/${user.id}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-500 text-sm font-semibold text-cream-100 transition-transform hover:scale-105"
                aria-label="Your profile"
              >
                {(profile?.display_name || user.email || '?').charAt(0).toUpperCase()}
              </Link>
              <button
                onClick={() => signOut().then(() => navigate('/'))}
                className="btn-ghost px-2"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary">
                Join Kathazo
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-navy-500 transition-colors hover:bg-navy-50 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden border-t border-cream-300 bg-cream-50 transition-all duration-300 md:hidden ${
          open ? 'max-h-[28rem]' : 'max-h-0 border-t-0'
        }`}
      >
        <div className="space-y-1 px-4 py-4">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                isActive(to) ? 'bg-navy-50 text-navy-600' : 'text-navy-400 hover:bg-navy-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="my-2 h-px bg-cream-300" />
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-navy-400 hover:bg-navy-50">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/settings" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-navy-400 hover:bg-navy-50">
                <Settings className="h-4 w-4" />
                Account settings
              </Link>
              <Link to={`/authors/${user.id}`} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-navy-400 hover:bg-navy-50">
                <UserIcon className="h-4 w-4" />
                Your profile
              </Link>
              <button
                onClick={() => signOut().then(() => navigate('/'))}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-navy-400 hover:bg-navy-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" className="btn-outline w-full">
                Log in
              </Link>
              <Link to="/signup" className="btn-primary w-full">
                Join Kathazo
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
