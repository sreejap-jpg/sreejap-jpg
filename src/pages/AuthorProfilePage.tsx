import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Globe, Users, BookOpen, UserPlus, UserCheck, Twitter, Instagram, BookMarked } from 'lucide-react';
import { supabase, type Profile, type Book } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { BookCard } from '@/components/BookCard';
import { LoadingState, EmptyState } from '@/components/Shared';

type AuthorBook = Book & { profiles?: Profile };

export function AuthorProfilePage() {
  const { authorId } = useParams<{ authorId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authorId) return;
    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authorId)
        .maybeSingle();
      setProfile(prof as Profile | null);

      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', authorId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setBooks((bookData as AuthorBook[]) || []);

      const { count } = await supabase
        .from('follows')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', authorId);
      setFollowerCount(count || 0);

      if (user && user.id !== authorId) {
        const { data: follow } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('author_id', authorId)
          .maybeSingle();
        setIsFollowing(!!follow);
      }

      setLoading(false);
    })();
  }, [authorId, user]);

  async function toggleFollow() {
    if (!user || !authorId || user.id === authorId) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('author_id', authorId);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, author_id: authorId });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
  }

  if (loading) return <LoadingState label="Loading author profile…" />;

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState title="Author not found" description="This profile may not exist or has been removed." />
      </div>
    );
  }

  const isOwnProfile = user?.id === authorId;
  const displayName = profile.display_name || 'Anonymous writer';

  return (
    <div>
      {/* Banner */}
      <div className="h-40 bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 sm:h-52">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath fill="%23D4A037" d="M0 0h40v40H0z"/%3E%3C/svg%3E")',
        }} />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="-mt-20 flex flex-col items-center text-center sm:-mt-24 sm:flex-row sm:items-end sm:text-left">
          <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-4 border-cream-100 bg-gold-400 font-serif text-5xl font-bold text-navy-700 shadow-book sm:h-36 sm:w-36">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="mt-4 flex-1 sm:mt-0 sm:ml-6 sm:pb-2">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="font-serif text-3xl font-bold text-navy-500">{displayName}</h1>
                <p className="mt-1 text-sm uppercase tracking-wider text-gold-500">{profile.role}</p>
              </div>
              {!isOwnProfile && user && (
                <button
                  onClick={toggleFollow}
                  className={isFollowing ? 'btn-outline' : 'btn-gold'}
                >
                  {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {isOwnProfile && (
                <Link to="/write" className="btn-outline">
                  <BookOpen className="h-4 w-4" />
                  Edit your work
                </Link>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-ink-400 sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gold-500" />
                <strong className="font-semibold text-navy-500">{followerCount}</strong> followers
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-gold-500" />
                <strong className="font-semibold text-navy-500">{books.length}</strong> books
              </span>
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gold-500" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-navy-400 hover:text-navy-600"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
            </div>

            {/* Social links */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {profile.twitter && (
                <a
                  href={profile.twitter.startsWith('http') ? profile.twitter : `https://twitter.com/${profile.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-200 text-navy-500 transition-colors hover:bg-navy-500 hover:text-cream-100"
                  title="Twitter / X"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {profile.instagram && (
                <a
                  href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-200 text-navy-500 transition-colors hover:bg-navy-500 hover:text-cream-100"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {profile.goodreads && (
                <a
                  href={profile.goodreads.startsWith('http') ? profile.goodreads : `https://goodreads.com/${profile.goodreads}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-200 text-navy-500 transition-colors hover:bg-navy-500 hover:text-cream-100"
                  title="Goodreads"
                >
                  <BookMarked className="h-4 w-4" />
                </a>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-200 text-navy-500 transition-colors hover:bg-navy-500 hover:text-cream-100"
                  title="Website"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-10 rounded-2xl border border-cream-300 bg-cream-50 p-6">
            <h2 className="font-serif text-lg font-semibold text-navy-500">About</h2>
            <p className="mt-3 whitespace-pre-wrap font-serif text-base leading-relaxed text-ink-500">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Books */}
        <div className="mt-10 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-navy-500">Published works</h2>
            <Link to="/discover" className="link-quiet text-sm">Browse all books</Link>
          </div>

          {books.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No published books yet"
                description={isOwnProfile ? "Your published books will appear here." : "This author hasn't published any books yet."}
              />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
