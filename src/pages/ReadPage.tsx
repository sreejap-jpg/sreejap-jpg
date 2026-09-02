import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  List,
  Type,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { supabase, type Book, type Chapter, type Profile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingState, EmptyState } from '@/components/Shared';
import { readingTime, wordCount } from '@/lib/utils';

type FullBook = Book & { profiles?: Profile };

export function ReadPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [book, setBook] = useState<FullBook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [theme, setTheme] = useState<'cream' | 'sepia' | 'dark'>('cream');
  const [pdfZoom, setPdfZoom] = useState(1);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      const { data: bookData } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .maybeSingle();
      setBook(bookData as FullBook | null);

      if (bookData?.pdf_url) {
        setLoading(false);
        return;
      }

      const { data: chapterData } = await supabase
        .from('chapters')
        .select('*')
        .eq('book_id', bookId)
        .eq('status', 'published')
        .order('chapter_order', { ascending: true });
      const chs = (chapterData as Chapter[]) || [];
      setChapters(chs);

      // restore reading progress for logged-in users
      if (user) {
        const { data: prog } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('book_id', bookId)
          .maybeSingle();
        if (prog && typeof (prog as { chapter_index?: number }).chapter_index === 'number') {
          setCurrentIdx(Math.min(chs.length - 1, (prog as { chapter_index: number }).chapter_index));
        }
      }

      setLoading(false);
    })();
  }, [bookId, user]);

  const current = chapters[currentIdx];

  // save reading progress when chapter changes
  useEffect(() => {
    if (!user || !bookId || chapters.length === 0 || !current) return;
    const progressPct = Math.round(((currentIdx + 1) / chapters.length) * 100);
    supabase
      .from('reading_progress')
      .upsert({
        user_id: user.id,
        book_id: bookId,
        chapter_id: current.id,
        chapter_index: currentIdx,
        progress_pct: progressPct,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,book_id' })
      .then(() => {});
  }, [user, bookId, currentIdx, current, chapters.length]);

  const themeClasses = {
    cream: 'bg-cream-100 text-ink-700',
    sepia: 'bg-[#F4ECD8] text-[#5B4636]',
    dark: 'bg-navy-800 text-cream-100',
  };

  const fontSizeClass = {
    sm: 'text-base leading-7',
    base: 'text-lg leading-8',
    lg: 'text-xl leading-9',
    xl: 'text-2xl leading-10',
  };

  if (loading) return <LoadingState label="Opening the book…" />;

  if (!book) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState title="Book not found" description="This book may have been removed or is not yet published." />
      </div>
    );
  }

  if (book.pdf_url) {
    return (
      <div className="min-h-screen bg-navy-900 text-cream-100">
        <div className="sticky top-0 z-40 border-b border-navy-700 bg-navy-900/95 shadow-lg backdrop-blur-md">
          <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <button onClick={() => navigate('/discover')} className="flex items-center gap-2 text-sm font-medium text-cream-200 transition-colors hover:text-gold-400">
              <ArrowLeft className="h-4 w-4" />
              Back to Discover
            </button>
            <h1 className="hidden max-w-md truncate font-serif text-lg font-semibold text-cream-100 sm:block">{book.title}</h1>
            <div className="flex items-center gap-1 rounded-xl border border-navy-700 bg-navy-800 p-1">
              <span className="px-2 text-xs font-medium text-cream-200/70">PDF</span>
              <button onClick={() => setPdfZoom((zoom) => Math.max(0.75, zoom - 0.1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-cream-200 transition-colors hover:bg-navy-700 hover:text-gold-400" title="Zoom out">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-12 text-center text-xs text-gold-400">{Math.round(pdfZoom * 100)}%</span>
              <button onClick={() => setPdfZoom((zoom) => Math.min(2, zoom + 0.1))} className="flex h-8 w-8 items-center justify-center rounded-lg text-cream-200 transition-colors hover:bg-navy-700 hover:text-gold-400" title="Zoom in">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-6xl overflow-auto px-4 py-6 sm:px-6">
          <div className="mx-auto min-h-[calc(100vh-7rem)] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl" style={{ height: `${Math.max(720, 900 * pdfZoom)}px` }}>
            <iframe src={book.pdf_url} title={`${book.title} PDF`} className="h-full w-full border-0" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses[theme]}`}>
      {/* Reader top bar */}
      <div className={`sticky top-0 z-40 border-b backdrop-blur-md ${
        theme === 'dark' ? 'border-navy-700 bg-navy-800/90' : 'border-cream-300 bg-cream-100/90'
      }`}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button
            onClick={() => navigate('/discover')}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
              theme === 'dark' ? 'text-cream-200 hover:text-cream-100' : 'text-navy-500 hover:text-navy-700'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Library
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => (s === 'sm' ? 'base' : s === 'base' ? 'lg' : s === 'lg' ? 'xl' : 'sm'))}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                theme === 'dark' ? 'text-cream-200 hover:bg-navy-700' : 'text-navy-500 hover:bg-cream-200'
              }`}
              title="Text size"
            >
              <Type className="h-4 w-4" />
            </button>
            <button
              onClick={() => setTheme((t) => (t === 'cream' ? 'sepia' : t === 'sepia' ? 'dark' : 'cream'))}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                theme === 'dark' ? 'text-cream-200 hover:bg-navy-700' : 'text-navy-500 hover:bg-cream-200'
              }`}
              title="Theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setShowToc(true)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                theme === 'dark' ? 'text-cream-200 hover:bg-navy-700' : 'text-navy-500 hover:bg-cream-200'
              }`}
              title="Contents"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Reading area */}
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8">
        {chapters.length === 0 ? (
          <EmptyState
            title="No chapters yet"
            description="This book hasn't published any chapters. Check back soon."
          />
        ) : (
          <article className="animate-fade-in">
            <p className={`text-xs uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gold-400' : 'text-gold-500'}`}>
              Chapter {currentIdx + 1} of {chapters.length}
            </p>
            <h1 className={`mt-3 font-serif text-3xl font-bold sm:text-4xl ${
              theme === 'dark' ? 'text-cream-100' : 'text-navy-500'
            }`}>
              {current?.title}
            </h1>
            <div className={`mt-2 flex items-center gap-3 text-sm ${
              theme === 'dark' ? 'text-cream-200/60' : 'text-ink-400'
            }`}>
              <span>{wordCount(current?.body || '')} words</span>
              <span>·</span>
              <span>{readingTime(current?.body || '')} min read</span>
            </div>

            <div className={`mt-10 whitespace-pre-wrap font-serif ${fontSizeClass[fontSize]}`}>
              {current?.body || 'This chapter has no content yet.'}
            </div>

            {/* Chapter nav */}
            <div className="mt-16 flex items-center justify-between border-t pt-8" style={{
              borderColor: theme === 'dark' ? '#1A2B47' : '#E8D6A3'
            }}>
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className={`btn-outline px-5 py-2.5 text-sm ${
                  theme === 'dark' ? 'border-navy-600 text-cream-200 hover:bg-navy-700 hover:text-cream-100' : ''
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className={`text-sm ${theme === 'dark' ? 'text-cream-200/60' : 'text-ink-400'}`}>
                {currentIdx + 1} / {chapters.length}
              </span>
              <button
                disabled={currentIdx === chapters.length - 1}
                onClick={() => setCurrentIdx((i) => Math.min(chapters.length - 1, i + 1))}
                className={`btn-outline px-5 py-2.5 text-sm ${
                  theme === 'dark' ? 'border-navy-600 text-cream-200 hover:bg-navy-700 hover:text-cream-100' : ''
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </article>
        )}
      </div>

      {/* TOC drawer */}
      {showToc && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={() => setShowToc(false)} />
          <div className="relative ml-auto h-full w-full max-w-sm overflow-y-auto bg-cream-50 p-6 shadow-2xl animate-slide-in">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-navy-500">Contents</h3>
              <button
                onClick={() => setShowToc(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-navy-400 hover:bg-cream-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-ink-400">{book.title}</p>
            <div className="mt-6 space-y-1">
              {chapters.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    setCurrentIdx(i);
                    setShowToc(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                    i === currentIdx ? 'bg-navy-50 text-navy-600' : 'text-ink-500 hover:bg-cream-200'
                  }`}
                >
                  <span className="font-serif text-xs font-bold text-gold-500">{i + 1}</span>
                  <span className="flex-1 truncate">{ch.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
