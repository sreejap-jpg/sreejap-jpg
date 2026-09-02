import { Link } from 'react-router-dom';
import type { Book, Profile } from '@/lib/supabase';

type BookCardProps = {
  book: Book & { profiles?: Profile };
};

export function BookCover({ book, className = '' }: { book: Book; className?: string }) {
  if (book.cover_url) {
    return (
      <img
        src={book.cover_url}
        alt={book.title}
        className={`h-full w-full object-cover ${className}`}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-[#14335A] p-4 text-center ${className}`}
    >
      <span className="font-serif text-base font-bold leading-tight text-[#D4A037] line-clamp-4">
        {book.title}
      </span>
      {book.genre && (
        <span className="mt-2 text-[10px] uppercase tracking-widest text-cream-200/80">
          {book.genre}
        </span>
      )}
    </div>
  );
}

export function BookCard({ book }: BookCardProps) {
  const authorName = book.profiles?.display_name || 'Unknown author';

  return (
    <Link
      to={`/read/${book.id}`}
      className="group flex flex-col animate-fade-up"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-book transition-all duration-300 group-hover:shadow-book-hover group-hover:-translate-y-1">
        <BookCover book={book} className="transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="font-serif text-sm font-semibold leading-snug text-navy-600 line-clamp-2 transition-colors group-hover:text-navy-700">
          {book.title}
        </h3>
        <p className="mt-1 text-xs text-ink-400">
          by{' '}
          {book.user_id ? (
            <Link
              to={`/authors/${book.user_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-navy-400 transition-colors hover:text-navy-600 hover:underline"
            >
              {authorName}
            </Link>
          ) : (
            authorName
          )}
        </p>
        {book.genre && (
          <span className="mt-2 inline-block rounded-full bg-cream-200 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold-600">
            {book.genre}
          </span>
        )}
      </div>
    </Link>
  );
}
