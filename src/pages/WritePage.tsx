import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Save,
  Trash2,
  BookPlus,
  ChevronDown,
  ChevronRight,
  PenLine,
  Eye,
  EyeOff,
  Check,
  Loader2,
} from 'lucide-react';
import { supabase, type Book, type Chapter } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { LoadingState, EmptyState } from '@/components/Shared';
import { GENRES, wordCount } from '@/lib/utils';

export function WritePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Record<string, Chapter[]>>({});
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // editor state
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterBody, setChapterBody] = useState('');
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [bookGenre, setBookGenre] = useState('');
  const [showNewBook, setShowNewBook] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const bookList = (data as Book[]) || [];
      setBooks(bookList);
      if (bookList.length > 0) {
        setSelectedBookId(bookList[0].id);
        setExpanded(new Set([bookList[0].id]));
      }
      // load chapters for each book
      const chMap: Record<string, Chapter[]> = {};
      await Promise.all(
        bookList.map(async (b) => {
          const { data: chs } = await supabase
            .from('chapters')
            .select('*')
            .eq('book_id', b.id)
            .order('chapter_order', { ascending: true });
          chMap[b.id] = (chs as Chapter[]) || [];
        })
      );
      setChapters(chMap);
      setLoading(false);
    })();
  }, [user]);

  // load a chapter into editor
  function editChapter(ch: Chapter) {
    setActiveChapterId(ch.id);
    setChapterTitle(ch.title);
    setChapterBody(ch.body);
  }

  function newChapter() {
    setActiveChapterId(null);
    setChapterTitle('');
    setChapterBody('');
  }

  async function saveChapter() {
    if (!user || !selectedBookId || !chapterTitle.trim()) return;
    setSaving(true);
    setSaved(false);
    const bookChapters = chapters[selectedBookId] || [];
    if (activeChapterId) {
      await supabase
        .from('chapters')
        .update({ title: chapterTitle, body: chapterBody })
        .eq('id', activeChapterId);
      setChapters((prev) => ({
        ...prev,
        [selectedBookId]: prev[selectedBookId].map((c) =>
          c.id === activeChapterId ? { ...c, title: chapterTitle, body: chapterBody } : c
        ),
      }));
    } else {
      const { data } = await supabase
        .from('chapters')
        .insert({
          book_id: selectedBookId,
          title: chapterTitle,
          body: chapterBody,
          chapter_order: bookChapters.length,
          status: 'draft',
        })
        .select('*')
        .maybeSingle();
      if (data) {
        setChapters((prev) => ({
          ...prev,
          [selectedBookId]: [...(prev[selectedBookId] || []), data as Chapter],
        }));
        setActiveChapterId((data as Chapter).id);
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function toggleChapterStatus(ch: Chapter) {
    if (!selectedBookId) return;
    const newStatus = ch.status === 'published' ? 'draft' : 'published';
    await supabase.from('chapters').update({ status: newStatus }).eq('id', ch.id);
    setChapters((prev) => ({
      ...prev,
      [selectedBookId]: (prev[selectedBookId] || []).map((c: Chapter) =>
        c.id === ch.id ? { ...c, status: newStatus } : c
      ),
    }));
  }

  async function deleteChapter(ch: Chapter) {
    if (!selectedBookId) return;
    await supabase.from('chapters').delete().eq('id', ch.id);
    setChapters((prev) => ({
      ...prev,
      [selectedBookId]: prev[selectedBookId].filter((c) => c.id !== ch.id),
    }));
    if (activeChapterId === ch.id) newChapter();
  }

  async function createBook() {
    if (!user || !bookTitle.trim()) return;
    const { data } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: bookTitle,
        description: bookDescription,
        genre: bookGenre,
        status: 'draft',
      })
      .select('*')
      .maybeSingle();
    if (data) {
      const newBook = data as Book;
      setBooks((prev) => [newBook, ...prev]);
      setChapters((prev) => ({ ...prev, [newBook.id]: [] }));
      setSelectedBookId(newBook.id);
      setExpanded((prev) => new Set(prev).add(newBook.id));
      setShowNewBook(false);
      setBookTitle('');
      setBookDescription('');
      setBookGenre('');
    }
  }

  async function toggleBookStatus(book: Book) {
    const newStatus = book.status === 'published' ? 'draft' : 'published';
    await supabase.from('books').update({ status: newStatus }).eq('id', book.id);
    setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, status: newStatus } : b)));
  }

  async function deleteBook(book: Book) {
    await supabase.from('books').delete().eq('id', book.id);
    setBooks((prev) => prev.filter((b) => b.id !== book.id));
    if (selectedBookId === book.id) {
      setSelectedBookId(books.length > 1 ? books.find((b) => b.id !== book.id)?.id || null : null);
      newChapter();
    }
  }

  if (authLoading) return <LoadingState />;
  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          title="Sign in to start writing"
          description="You need an account to draft and publish your work on Kathazo."
          action={
            <button onClick={() => navigate('/login')} className="btn-primary">
              Sign in
            </button>
          }
        />
      </div>
    );
  }

  const selectedBook = books.find((b) => b.id === selectedBookId);
  const selectedChapters = selectedBookId ? chapters[selectedBookId] || [] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Write & Publish</p>
        <h1 className="mt-3 section-heading">Your writing desk</h1>
        <p className="mt-4 text-lg text-ink-400">
          Draft chapter by chapter. Save as you go. Publish when your story is ready for the world.
        </p>
      </div>

      {loading ? (
        <LoadingState label="Loading your desk…" />
      ) : books.length === 0 && !showNewBook ? (
        <div className="mx-auto mt-10 max-w-xl">
          <EmptyState
            icon={BookPlus}
            title="No books yet"
            description="Create your first book to start writing chapters."
            action={
              <button onClick={() => setShowNewBook(true)} className="btn-gold">
                <Plus className="h-4 w-4" />
                Create your first book
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-12 grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* Sidebar: books & chapters */}
          <div className="space-y-4">
            <button onClick={() => setShowNewBook((v) => !v)} className="btn-gold w-full">
              <Plus className="h-4 w-4" />
              New book
            </button>

            {showNewBook && (
              <div className="card animate-fade-in space-y-3 p-5">
                <h3 className="font-serif text-base font-semibold text-navy-500">New book details</h3>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Book title"
                  className="input-field"
                />
                <textarea
                  value={bookDescription}
                  onChange={(e) => setBookDescription(e.target.value)}
                  placeholder="Short description…"
                  rows={3}
                  className="input-field resize-none"
                />
                <select
                  value={bookGenre}
                  onChange={(e) => setBookGenre(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select genre…</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button onClick={createBook} className="btn-primary flex-1">Create</button>
                  <button onClick={() => setShowNewBook(false)} className="btn-ghost">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {books.map((book) => {
                const isExpanded = expanded.has(book.id);
                const bookChs = chapters[book.id] || [];
                return (
                  <div key={book.id} className="card overflow-hidden">
                    <div className="flex items-center">
                      <button
                        onClick={() =>
                          setExpanded((prev) => {
                            const next = new Set(prev);
                            if (next.has(book.id)) next.delete(book.id);
                            else next.add(book.id);
                            return next;
                          })
                        }
                        className="flex flex-1 items-center gap-2 px-4 py-3 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-ink-300" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-ink-300" />
                        )}
                        <span className="flex-1 truncate font-serif text-sm font-semibold text-navy-500">
                          {book.title}
                        </span>
                      </button>
                      <span
                        className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                          book.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-cream-300 text-ink-400'
                        }`}
                      >
                        {book.status}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-cream-300 px-2 py-2">
                        {selectedBookId !== book.id && (
                          <button
                            onClick={() => {
                              setSelectedBookId(book.id);
                              newChapter();
                            }}
                            className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-navy-400 hover:bg-navy-50"
                          >
                            Select this book →
                          </button>
                        )}
                        {bookChs.map((ch) => (
                          <div
                            key={ch.id}
                            className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                              activeChapterId === ch.id && selectedBookId === book.id
                                ? 'bg-navy-50 text-navy-600'
                                : 'text-ink-500 hover:bg-cream-200'
                            }`}
                          >
                            <button
                              onClick={() => {
                                setSelectedBookId(book.id);
                                editChapter(ch);
                              }}
                              className="flex-1 truncate text-left"
                            >
                              {ch.title}
                            </button>
                            <button
                              onClick={() => toggleChapterStatus(ch)}
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                              title={ch.status === 'published' ? 'Unpublish' : 'Publish chapter'}
                            >
                              {ch.status === 'published' ? (
                                <EyeOff className="h-3.5 w-3.5 text-ink-300" />
                              ) : (
                                <Eye className="h-3.5 w-3.5 text-gold-500" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteChapter(ch)}
                              className="opacity-0 transition-opacity group-hover:opacity-100"
                              title="Delete chapter"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setSelectedBookId(book.id);
                            newChapter();
                          }}
                          className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gold-600 hover:bg-cream-200"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          New chapter
                        </button>
                        <div className="mt-2 flex gap-2 border-t border-cream-300 pt-2">
                          <button
                            onClick={() => toggleBookStatus(book)}
                            className="flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-navy-500 hover:bg-navy-50"
                          >
                            {book.status === 'published' ? 'Unpublish book' : 'Publish book'}
                          </button>
                          <button
                            onClick={() => deleteBook(book)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Editor */}
          <div className="card p-6 sm:p-8">
            {selectedBook ? (
              <>
                <div className="mb-6 flex items-center justify-between border-b border-cream-300 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gold-500">
                      Writing in
                    </p>
                    <h2 className="font-serif text-lg font-semibold text-navy-500">{selectedBook.title}</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    activeChapterId ? 'bg-cream-200 text-ink-500' : 'bg-gold-100 text-gold-600'
                  }`}>
                    {activeChapterId ? 'Editing chapter' : 'New chapter'}
                  </span>
                </div>

                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Chapter title"
                  className="w-full border-0 border-b-2 border-cream-300 bg-transparent pb-2 font-serif text-2xl font-bold text-navy-500 placeholder:text-ink-200 focus:border-gold-400 focus:outline-none"
                />

                <textarea
                  value={chapterBody}
                  onChange={(e) => setChapterBody(e.target.value)}
                  placeholder="Begin writing your chapter…"
                  rows={16}
                  className="mt-6 w-full resize-none border-0 bg-transparent font-serif text-lg leading-8 text-ink-600 placeholder:text-ink-200 focus:outline-none"
                />

                <div className="mt-6 flex items-center justify-between border-t border-cream-300 pt-4">
                  <p className="text-sm text-ink-400">
                    {wordCount(chapterBody)} words
                  </p>
                  <div className="flex items-center gap-3">
                    {saved && (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <Check className="h-4 w-4" /> Saved
                      </span>
                    )}
                    <button
                      onClick={saveChapter}
                      disabled={!chapterTitle.trim() || saving}
                      className="btn-primary"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save chapter
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <PenLine className="h-12 w-12 text-gold-400" />
                <h3 className="mt-4 font-serif text-lg font-semibold text-navy-500">
                  Select a book to start writing
                </h3>
                <p className="mt-2 text-sm text-ink-400">
                  Choose a book from the sidebar or create a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
