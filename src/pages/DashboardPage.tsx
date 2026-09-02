import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  DollarSign,
  PenLine,
  ArrowRight,
  TrendingUp,
  BookMarked,
  ShoppingBag,
  Bookmark,
  Library,
} from 'lucide-react';
import { supabase, type Book, type MarketplaceListing, type Purchase, type ReadingProgress, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingState, EmptyState } from '@/components/Shared';
import { BookCover } from '@/components/BookCard';
import { formatPrice } from '@/lib/utils';

type MyBook = Book & { chapter_count?: number };
type MyListing = MarketplaceListing & { books?: Book };
type PurchaseWithBook = Purchase & { books?: Book };
type ProgressWithBook = ReadingProgress & { books?: Book & { profiles?: Profile } };

export function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<MyBook[]>([]);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [purchases, setPurchases] = useState<PurchaseWithBook[]>([]);
  const [progress, setProgress] = useState<ProgressWithBook[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // books written
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const bookList = (bookData as Book[]) || [];

      const booksWithCounts: MyBook[] = await Promise.all(
        bookList.map(async (b) => {
          const { count } = await supabase
            .from('chapters')
            .select('id', { count: 'exact', head: true })
            .eq('book_id', b.id);
          return { ...b, chapter_count: count || 0 };
        })
      );
      setBooks(booksWithCounts);

      // marketplace listings
      const { data: listingData } = await supabase
        .from('marketplace_listings')
        .select('*, books(*)')
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setListings((listingData as MyListing[]) || []);

      // purchases
      const { data: purchaseData } = await supabase
        .from('purchases')
        .select('*, books(*)')
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      setPurchases((purchaseData as PurchaseWithBook[]) || []);

      // reading progress
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('*, books(*)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setProgress((progressData as ProgressWithBook[]) || []);

      // followers
      const { count } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', user.id);
      setFollowerCount(count || 0);

      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) return <LoadingState />;

  if (!user) {
    navigate('/login');
    return null;
  }

  const publishedCount = books.filter((b) => b.status === 'published').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 section-heading">
            Welcome, {profile?.display_name || user.email?.split('@')[0]}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/settings" className="btn-outline">Account settings</Link>
          <Link to="/write" className="btn-gold">
            <PenLine className="h-4 w-4" />
            Write
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: 'Books written', value: books.length },
          { icon: BookMarked, label: 'Published', value: publishedCount },
          { icon: Users, label: 'Followers', value: followerCount },
          { icon: ShoppingBag, label: 'Books purchased', value: purchases.length },
        ].map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
                <stat.icon className="h-5 w-5" />
              </span>
              <span className="font-serif text-3xl font-bold text-navy-500">{stat.value}</span>
            </div>
            <p className="mt-3 text-sm text-ink-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Currently reading */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-navy-500">Currently reading</h2>
            <Link to="/discover" className="link-quiet text-sm">Find more</Link>
          </div>
          <div className="mt-4 space-y-3">
            {progress.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="No books in progress"
                description="Start reading a book and it will show up here."
                action={<Link to="/discover" className="btn-primary">Browse the library</Link>}
              />
            ) : (
              progress.map((item) => {
                const book = item.books;
                if (!book) return null;
                return (
                  <Link
                    key={item.id}
                    to={`/read/${book.id}`}
                    className="card group flex items-center gap-4 p-4 hover:-translate-y-0.5 hover:shadow-book-hover"
                  >
                    <div className="aspect-[3/4] w-12 flex-shrink-0 overflow-hidden rounded-lg shadow-book">
                      <BookCover book={book} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-sm font-semibold text-navy-600 group-hover:text-navy-700">
                        {book.title}
                      </h3>
                      <p className="text-xs text-ink-400">
                        Chapter {item.chapter_index + 1}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-cream-300">
                        <div
                          className="h-full rounded-full bg-gold-400 transition-all"
                          style={{ width: `${Math.min(100, item.progress_pct)}%` }}
                        />
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Books purchased */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-navy-500">Books purchased</h2>
            <Link to="/marketplace" className="link-quiet text-sm">Browse store</Link>
          </div>
          <div className="mt-4 space-y-3">
            {purchases.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No purchases yet"
                description="Books you buy in the marketplace will appear here."
                action={<Link to="/marketplace" className="btn-gold">Visit the store</Link>}
              />
            ) : (
              purchases.map((purchase) => {
                const book = purchase.books;
                if (!book) return null;
                return (
                  <Link
                    key={purchase.id}
                    to={`/read/${book.id}`}
                    className="card group flex items-center gap-4 p-4 hover:-translate-y-0.5 hover:shadow-book-hover"
                  >
                    <div className="aspect-[3/4] w-12 flex-shrink-0 overflow-hidden rounded-lg shadow-book">
                      <BookCover book={book} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-serif text-sm font-semibold text-navy-600 group-hover:text-navy-700">
                        {book.title}
                      </h3>
                      <p className="text-xs text-ink-400">
                        {formatPrice(purchase.price_cents, purchase.currency)} · purchased
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Books written */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-navy-500">Your books</h2>
            <Link to="/write" className="link-quiet text-sm">Manage</Link>
          </div>
          <div className="mt-4 space-y-3">
            {books.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No books yet"
                description="Create your first book to start writing."
                action={<Link to="/write" className="btn-primary">Start writing</Link>}
              />
            ) : (
              books.map((book) => (
                <Link
                  key={book.id}
                  to="/write"
                  className="card group flex items-center gap-4 p-4 hover:-translate-y-0.5 hover:shadow-book-hover"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    book.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-cream-300 text-ink-400'
                  }`}>
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <h3 className="font-serif text-sm font-semibold text-navy-600 group-hover:text-navy-700">
                      {book.title}
                    </h3>
                    <p className="text-xs text-ink-400">
                      {book.chapter_count} chapters · {book.status}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Marketplace listings */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-navy-500">Your listings</h2>
            <Link to="/marketplace" className="link-quiet text-sm">View store</Link>
          </div>
          <div className="mt-4 space-y-3">
            {listings.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title="No listings yet"
                description="List your books for sale in the marketplace."
                action={<Link to="/marketplace" className="btn-gold">List a book</Link>}
              />
            ) : (
              listings.map((listing) => (
                <div key={listing.id} className="card flex items-center gap-4 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <h3 className="font-serif text-sm font-semibold text-navy-600">
                      {listing.books?.title || 'Unknown book'}
                    </h3>
                    <p className="text-xs text-ink-400">
                      {formatPrice(listing.price_cents, listing.currency)} · {listing.stock} in stock
                    </p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-medium uppercase text-green-700">
                    {listing.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
