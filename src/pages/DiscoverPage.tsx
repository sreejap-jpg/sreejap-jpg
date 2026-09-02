import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase, type Book, type Profile } from '@/lib/supabase';
import { BookCard } from '@/components/BookCard';
import { EmptyState, LoadingState } from '@/components/Shared';
import { GENRES } from '@/lib/utils';

type FeaturedBook = Book & { profiles?: Profile };
type SortKey = 'newest' | 'trending' | 'title';

export function DiscoverPage() {
  const [books, setBooks] = useState<FeaturedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      let q = supabase
        .from('books')
        .select('*')
        .eq('status', 'published');

      q = q.order('created_at', { ascending: false });

      const { data, error } = await q;
      if (error || !data) {
        setBooks([]);
        setLoading(false);
        return;
      }

      const rawBooks = data as Book[];
      const authorIds = [...new Set(rawBooks.map((book) => book.user_id).filter(Boolean))];
      const { data: profiles } = authorIds.length
        ? await supabase.from('profiles').select('*').in('id', authorIds)
        : { data: [] as Profile[] };
      const profileById = new Map((profiles as Profile[] || []).map((profile) => [profile.id, profile]));
      setBooks(rawBooks.map((book) => ({ ...book, profiles: profileById.get(book.user_id) })));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = books;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.profiles?.display_name || '').toLowerCase().includes(q) ||
          b.genre.toLowerCase().includes(q)
      );
    }
    if (genre) result = result.filter((b) => b.genre === genre);
    if (sort === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'trending') {
      result = [...result].sort((a, b) => (b.is_for_sale ? 1 : 0) - (a.is_for_sale ? 1 : 0));
    }
    return result;
  }, [books, query, genre, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Discover</p>
        <h1 className="mt-3 section-heading">Find your next read</h1>
        <p className="mt-4 text-lg text-ink-400">
          Browse books by genre, author, or title. Every book here was written by a member of the Kathazo community.
        </p>
      </div>

      {/* Search + filters */}
      <div className="mx-auto mt-10 max-w-3xl">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or genre…"
              className="input-field pl-11"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-300 hover:bg-cream-200 hover:text-ink-400"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`btn-outline px-4 py-3 ${showFilters ? 'border-navy-500 bg-navy-500 text-cream-100' : ''}`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 animate-fade-in rounded-2xl border border-cream-300 bg-cream-50 p-5">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Genre</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => setGenre('')}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      !genre ? 'bg-navy-500 text-cream-100' : 'bg-cream-200 text-navy-500 hover:bg-cream-300'
                    }`}
                  >
                    All
                  </button>
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        genre === g ? 'bg-navy-500 text-cream-100' : 'bg-cream-200 text-navy-500 hover:bg-cream-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Sort by</label>
                <div className="mt-2 flex gap-2">
                  {([
                    ['newest', 'Newest'],
                    ['trending', 'Trending'],
                    ['title', 'A–Z'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSort(key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        sort === key ? 'bg-gold-400 text-navy-700' : 'bg-cream-200 text-navy-500 hover:bg-cream-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mt-10">
        {loading ? (
          <LoadingState label="Loading the library…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No books found"
            description="Try adjusting your search or filters. If the library is empty, be the first to publish a book."
          />
        ) : (
          <>
            <p className="mb-6 text-sm text-ink-400">
              Showing <strong className="text-navy-500">{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'book' : 'books'}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
