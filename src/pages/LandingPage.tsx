import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  PenLine,
  Store,
  Users,
  Compass,
  ArrowRight,
  Quote,
  Sparkles,
  Library,
  Feather,
  ShoppingBag,
} from 'lucide-react';
import { supabase, type Book, type Profile } from '@/lib/supabase';
import { BookCard } from '@/components/BookCard';
import { LoadingState } from '@/components/Shared';

type FeaturedBook = Book & { profiles?: Profile };

export function LandingPage() {
  const [featured, setFeatured] = useState<FeaturedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ books: 0, authors: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(8);
      setFeatured((data as FeaturedBook[]) || []);
      const { count: bookCount } = await supabase
        .from('books')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published');
      const { count: authorCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      setStats({ books: bookCount || 0, authors: authorCount || 0 });
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-100 to-cream-200/40" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%2314335A" fill-rule="evenodd"%3E%3Cpath d="M30 30c0-5.523-4.477-10-10-10S10 24.477 10 30s4.477 10 10 10 10-4.477 10-10zm10 0c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10-10-4.477-10-10z"/%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow animate-fade-in">A literary community</p>
            <h1 className="mt-4 animate-fade-up font-serif text-5xl font-bold leading-tight text-navy-500 sm:text-6xl lg:text-7xl">
              Where stories find their readers
            </h1>
            <p className="mt-3 animate-fade-up font-serif text-2xl italic text-gold-500" style={{ animationDelay: '0.1s' }}>
              Books | Authors | Community
            </p>
            <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg leading-relaxed text-ink-500" style={{ animationDelay: '0.15s' }}>
              Kathazo brings readers, writers, authors, booksellers, and publishers together in one
              elegant place — to read, write, publish, discover, and sell the books that matter.
            </p>
            <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '0.2s' }}>
              <Link to="/signup" className="btn-primary px-8 py-3.5 text-base">
                Join Kathazo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/discover" className="btn-outline px-8 py-3.5 text-base">
                <Compass className="h-4 w-4" />
                Explore books
              </Link>
            </div>

            <div className="mt-12 flex animate-fade-up items-center justify-center gap-8 text-sm text-ink-400" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center gap-2">
                <Library className="h-4 w-4 text-gold-500" />
                <span><strong className="font-semibold text-navy-500">{stats.books}</strong> books</span>
              </div>
              <div className="h-4 w-px bg-cream-400" />
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gold-500" />
                <span><strong className="font-semibold text-navy-500">{stats.authors}</strong> members</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-navy-500 py-20 text-cream-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Quote className="mx-auto h-10 w-10 text-gold-400" />
            <p className="mt-6 font-serif text-2xl font-medium leading-relaxed text-cream-100 sm:text-3xl">
              We believe every story deserves a home and every reader deserves a community.
              Kathazo is that home — a boutique bookstore meets modern app, where the written word
              is celebrated and the people behind it are known.
            </p>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-gold-400">Our mission</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Everything in one place</p>
            <h2 className="mt-3 section-heading">A platform for the whole literary world</h2>
            <p className="mt-4 text-lg text-ink-400">
              From the first draft to the final sale, Kathazo supports every step of a book's journey.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Compass,
                title: 'Discover',
                desc: 'Browse and search books by genre, author, or trending. Find your next favorite read.',
                to: '/discover',
                cta: 'Browse books',
              },
              {
                icon: BookOpen,
                title: 'Read',
                desc: 'A clean, distraction-free reading view designed for long sessions with good books.',
                to: '/discover',
                cta: 'Start reading',
              },
              {
                icon: PenLine,
                title: 'Write & Publish',
                desc: 'Draft chapter by chapter, save your progress, and publish when you are ready.',
                to: '/write',
                cta: 'Open the editor',
              },
              {
                icon: Users,
                title: 'Author profiles',
                desc: 'Every author gets a page — bio, published works, and followers who care.',
                to: '/discover',
                cta: 'Meet authors',
              },
              {
                icon: Store,
                title: 'Marketplace',
                desc: 'List books for sale, set your price, and reach readers directly.',
                to: '/marketplace',
                cta: 'Visit the store',
              },
              {
                icon: Sparkles,
                title: 'Community',
                desc: 'Follow authors, build a readership, and join a community that loves books.',
                to: '/signup',
                cta: 'Join the community',
              },
            ].map((f, i) => (
              <div
                key={f.title}
                className="card group p-6 animate-fade-up hover:-translate-y-1 hover:shadow-book-hover"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-500 transition-colors group-hover:bg-gold-400 group-hover:text-navy-700">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-navy-500">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{f.desc}</p>
                <Link
                  to={f.to}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold-600 transition-colors hover:text-gold-500"
                >
                  {f.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured books */}
      <section className="bg-cream-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Fresh on the shelves</p>
              <h2 className="mt-3 section-heading">Recently published</h2>
            </div>
            <Link to="/discover" className="hidden btn-ghost sm:inline-flex">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <LoadingState label="Curating the shelves…" />
          ) : featured.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-cream-400 bg-cream-100 px-6 py-16 text-center">
              <Feather className="mx-auto h-10 w-10 text-gold-400" />
              <h3 className="mt-4 font-serif text-lg font-semibold text-navy-500">No books published yet</h3>
              <p className="mt-2 text-sm text-ink-400">Be the first to share your story with the Kathazo community.</p>
              <Link to="/write" className="btn-gold mt-6">
                <PenLine className="h-4 w-4" />
                Write the first book
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-500 to-navy-700 px-8 py-16 text-center shadow-book-hover sm:px-16">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gold-400/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-8 h-56 w-56 rounded-full bg-gold-400/10 blur-2xl" />
            <div className="relative">
              <ShoppingBag className="mx-auto h-10 w-10 text-gold-400" />
              <h2 className="mt-6 font-serif text-3xl font-bold text-cream-100 sm:text-4xl">
                Ready to join the story?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-cream-200/80">
                Whether you are here to read, to write, or to sell — there is a place for you at Kathazo.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/signup" className="btn-gold px-8 py-3.5 text-base">
                  Create your account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/discover" className="btn-outline border-cream-200/30 px-8 py-3.5 text-base text-cream-100 hover:bg-cream-100/10 hover:text-cream-100">
                  Browse the library
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
