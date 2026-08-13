import { Link } from 'react-router-dom';
import { BookOpen, Mail, FileText, Heart } from 'lucide-react';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-cream-300 bg-cream-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-400">
              A literary community where readers, writers, authors, booksellers, and publishers
              come together to read, write, publish, discover, and sell books.
            </p>
            <p className="mt-4 font-serif text-sm italic text-gold-500">Books | Authors | Community</p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-navy-500">Explore</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/discover" className="text-ink-400 transition-colors hover:text-navy-600">Discover books</Link></li>
              <li><Link to="/marketplace" className="text-ink-400 transition-colors hover:text-navy-600">Marketplace</Link></li>
              <li><Link to="/write" className="text-ink-400 transition-colors hover:text-navy-600">Write & publish</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-navy-500">Community</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/about" className="flex items-center gap-2 text-ink-400 transition-colors hover:text-navy-600"><BookOpen className="h-3.5 w-3.5" /> About</Link></li>
              <li><Link to="/contact" className="flex items-center gap-2 text-ink-400 transition-colors hover:text-navy-600"><Mail className="h-3.5 w-3.5" /> Contact</Link></li>
              <li><Link to="/feedback" className="flex items-center gap-2 text-ink-400 transition-colors hover:text-navy-600"><FileText className="h-3.5 w-3.5" /> Feedback survey</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-navy-500">Account</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link to="/signup" className="text-ink-400 transition-colors hover:text-navy-600">Create account</Link></li>
              <li><Link to="/login" className="text-ink-400 transition-colors hover:text-navy-600">Sign in</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-cream-300 pt-6 sm:flex-row">
          <p className="text-xs text-ink-300">© {new Date().getFullYear()} Kathazo. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-xs text-ink-300">
            Made with <Heart className="h-3.5 w-3.5 fill-gold-400 text-gold-400" /> for readers & writers
          </p>
        </div>
      </div>
    </footer>
  );
}
