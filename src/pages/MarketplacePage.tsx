import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Tag, Plus, Store, X, Check, Loader2, ShieldCheck, AlertCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { supabase, type Book, type Profile, type MarketplaceListing, type Purchase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { BookCover } from '@/components/BookCard';
import { LoadingState, EmptyState } from '@/components/Shared';
import { formatPrice, GENRES } from '@/lib/utils';
import { loadRazorpay, type RazorpayOrderResponse, type RazorpayVerifyResponse } from '@/lib/razorpay';

type Listing = MarketplaceListing & {
  books?: Book;
  profiles?: Profile;
};

type FullBook = Book & { profiles?: Profile };

type SortKey = 'newest' | 'price-low' | 'price-high';

// Convert a listing's price to INR paise for Razorpay.
// If the listing is already INR, use price_cents directly.
// Otherwise convert at a mock rate (1 USD = 83 INR).
function toInrPaise(listing: Listing): number {
  if (listing.currency === 'INR') return listing.price_cents;
  const usd = listing.price_cents / 100;
  return Math.round(usd * 83 * 100);
}

type CheckoutState = 'idle' | 'creating-order' | 'razorpay-open' | 'verifying' | 'success' | 'error';

export function MarketplacePage() {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBooks, setUserBooks] = useState<FullBook[]>([]);
  const [showSellForm, setShowSellForm] = useState(false);
  const [filterGenre, setFilterGenre] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  // sell form state
  const [sellBookId, setSellBookId] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellCondition, setSellCondition] = useState<'new' | 'like-new' | 'good' | 'acceptable'>('new');
  const [sellStock, setSellStock] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // checkout state
  const [checkoutListing, setCheckoutListing] = useState<Listing | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');
  const [checkoutError, setCheckoutError] = useState('');
  const [purchased, setPurchased] = useState<Set<string>>(new Set());

  async function loadListings() {
    const { data } = await supabase
      .from('marketplace_listings')
      .select('*, books(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    setListings((data as Listing[]) || []);
  }

  async function loadPurchased() {
    if (!user) return;
    const { data } = await supabase
      .from('purchases')
      .select('book_id')
      .eq('buyer_id', user.id)
      .eq('status', 'completed');
    if (data) setPurchased(new Set((data as Purchase[]).map((p) => p.book_id)));
  }

  useEffect(() => {
    (async () => {
      await loadListings();
      if (user) {
        const { data: books } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setUserBooks((books as FullBook[]) || []);
        await loadPurchased();
        const { data: acceptance } = await supabase
          .from('seller_terms_acceptances')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (acceptance) setHasAcceptedTerms(true);
      }
      setLoading(false);
    })();
  }, [user]);

  async function createListing() {
    if (!user || !sellBookId || !sellPrice) return;
    setSubmitting(true);
    if (!hasAcceptedTerms && termsAccepted) {
      const { error: accError } = await supabase
        .from('seller_terms_acceptances')
        .insert({ user_id: user.id });
      if (accError) {
        setSubmitting(false);
        return;
      }
      setHasAcceptedTerms(true);
    }
    const priceCents = Math.round(parseFloat(sellPrice) * 100);
    await supabase.from('marketplace_listings').insert({
      book_id: sellBookId,
      seller_id: user.id,
      price_cents: priceCents,
      currency: 'INR',
      condition: sellCondition,
      stock: parseInt(sellStock) || 1,
      status: 'active',
    });
    await supabase.from('books').update({ is_for_sale: true }).eq('id', sellBookId);
    await loadListings();
    setShowSellForm(false);
    setSellBookId('');
    setSellPrice('');
    setSellStock('1');
    setSubmitting(false);
  }

  function closeCheckout() {
    setCheckoutListing(null);
    setCheckoutState('idle');
    setCheckoutError('');
  }

  async function startRazorpayCheckout(listing: Listing) {
    if (!user) return;
    setCheckoutListing(listing);
    setCheckoutState('creating-order');
    setCheckoutError('');

    try {
      // 1. Load the Razorpay SDK
      await loadRazorpay();

      // 2. Create an order via our edge function
      const amountPaise = toInrPaise(listing);
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-checkout?action=create-order`;
      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: amountPaise,
          listing_id: listing.id,
          book_id: listing.book_id,
          buyer_id: user.id,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to create payment order.');
      }

      const order: RazorpayOrderResponse = await resp.json();

      if (!order.order_id || !order.key_id) {
        throw new Error('Invalid order response from server.');
      }

      // 3. Open the Razorpay checkout modal
      setCheckoutState('razorpay-open');

      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: 'INR',
        name: 'Kathazo',
        description: listing.books?.title || 'Book purchase',
        image: '/image.png',
        order_id: order.order_id,
        // Navy theme to match the site
        theme: {
          color: '#14335A',
        },
        prefill: {
          name: profile?.display_name || '',
          email: user.email || '',
        },
        notes: {
          listing_id: listing.id,
          book_id: listing.book_id,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await verifyAndRecord(response, listing, order.amount);
        },
        modal: {
          ondismiss: () => {
            // User closed the modal without paying
            if (checkoutState !== 'success') {
              setCheckoutState('error');
              setCheckoutError('Payment cancelled. You can try again whenever you are ready.');
            }
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: { error?: { description?: string } }) => {
        setCheckoutState('error');
        setCheckoutError(resp?.error?.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch (err) {
      setCheckoutState('error');
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  async function verifyAndRecord(
    response: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
    listing: Listing,
    amountPaise: number,
  ) {
    if (!user) return;
    setCheckoutState('verifying');

    try {
      // 1. Verify signature server-side
      const verifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-checkout?action=verify`;
      const verifyResp = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const verifyData: RazorpayVerifyResponse = await verifyResp.json();

      if (!verifyResp.ok || !verifyData.verified) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }

      // 2. Record the purchase in the database
      const { error: insertError } = await supabase.from('purchases').insert({
        buyer_id: user.id,
        listing_id: listing.id,
        book_id: listing.book_id,
        price_cents: amountPaise,
        currency: 'INR',
        status: 'completed',
      });

      if (insertError) throw new Error('Payment succeeded but we could not record your purchase. Contact support.');

      // 3. Decrement stock
      await supabase
        .from('marketplace_listings')
        .update({ stock: Math.max(0, listing.stock - 1) })
        .eq('id', listing.id);

      // 4. Refresh data
      await loadListings();
      await loadPurchased();

      setCheckoutState('success');
    } catch (err) {
      setCheckoutState('error');
      setCheckoutError(err instanceof Error ? err.message : 'Payment verification failed. Please contact support.');
    }
  }

  const filtered = useMemo(() => {
    let result = filterGenre
      ? listings.filter((l) => l.books?.genre === filterGenre)
      : listings;
    if (sort === 'price-low') {
      result = [...result].sort((a, b) => a.price_cents - b.price_cents);
    } else if (sort === 'price-high') {
      result = [...result].sort((a, b) => b.price_cents - a.price_cents);
    }
    return result;
  }, [listings, filterGenre, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Marketplace</p>
        <h1 className="mt-3 section-heading">The Kathazo bookstore</h1>
        <p className="mt-4 text-lg text-ink-400">
          Buy books directly from the authors and booksellers who love them. Every purchase supports an independent voice.
        </p>
      </div>

      {/* Filters + sort + sell */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterGenre('')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              !filterGenre ? 'bg-navy-500 text-cream-100' : 'bg-cream-200 text-navy-500 hover:bg-cream-300'
            }`}
          >
            All genres
          </button>
          {GENRES.slice(0, 8).map((g) => (
            <button
              key={g}
              onClick={() => setFilterGenre(g)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filterGenre === g ? 'bg-navy-500 text-cream-100' : 'bg-cream-200 text-navy-500 hover:bg-cream-300'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-ink-400">Sort:</span>
            {([
              ['newest', 'Newest'],
              ['price-low', 'Price: Low'],
              ['price-high', 'Price: High'],
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
          {user && userBooks.length > 0 && (
            <button onClick={() => setShowSellForm((v) => !v)} className="btn-gold whitespace-nowrap">
              <Plus className="h-4 w-4" />
              List a book
            </button>
          )}
        </div>
      </div>

      {/* Sell form */}
      {showSellForm && user && (
        <div className="mt-6 card animate-fade-in p-6">
          <h3 className="font-serif text-lg font-semibold text-navy-500">List a book for sale</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Book</label>
              <select
                value={sellBookId}
                onChange={(e) => setSellBookId(e.target.value)}
                className="input-field mt-1.5"
              >
                <option value="">Select a book…</option>
                {userBooks.map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Price (INR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="299.00"
                className="input-field mt-1.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Condition</label>
              <select
                value={sellCondition}
                onChange={(e) => setSellCondition(e.target.value as typeof sellCondition)}
                className="input-field mt-1.5"
              >
                <option value="new">New</option>
                <option value="like-new">Like new</option>
                <option value="good">Good</option>
                <option value="acceptable">Acceptable</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Stock</label>
              <input
                type="number"
                min="1"
                value={sellStock}
                onChange={(e) => setSellStock(e.target.value)}
                className="input-field mt-1.5"
              />
            </div>
          </div>
          {!hasAcceptedTerms && (
            <label className="mt-5 flex items-start gap-3 rounded-xl border border-cream-300 bg-cream-100 p-4">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-navy-500"
              />
              <span className="text-sm text-ink-600">
                I have read and agree to the{' '}
                <Link to="/seller-terms" target="_blank" className="font-medium text-navy-500 underline hover:text-navy-700 inline-flex items-center gap-0.5">
                  Seller Terms &amp; Conditions
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </span>
            </label>
          )}
          <div className="mt-5 flex gap-2">
            <button onClick={createListing} disabled={!sellBookId || !sellPrice || submitting || (!hasAcceptedTerms && !termsAccepted)} className="btn-primary">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {submitting ? 'Listing…' : 'List for sale'}
            </button>
            <button onClick={() => setShowSellForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Listings grid */}
      <div className="mt-10">
        {loading ? (
          <LoadingState label="Stocking the shelves…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No books for sale yet"
            description="Be the first to list a book in the Kathazo marketplace."
            action={
              user ? (
                userBooks.length > 0 ? (
                  <button onClick={() => setShowSellForm(true)} className="btn-gold">
                    <Plus className="h-4 w-4" />
                    List a book
                  </button>
                ) : (
                  <Link to="/write" className="btn-gold">Publish a book first</Link>
                )
              ) : (
                <Link to="/signup" className="btn-primary">Join to sell</Link>
              )
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => {
              const book = listing.books;
              if (!book) return null;
              const isOwned = purchased.has(book.id);
              return (
                <div key={listing.id} className="card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-book-hover">
                  <div className="flex gap-4 p-5">
                    <Link to={`/read/${book.id}`} className="aspect-[3/4] w-24 flex-shrink-0 overflow-hidden rounded-lg shadow-book">
                      <BookCover book={book} />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <Link to={`/read/${book.id}`}>
                        <h3 className="font-serif text-base font-semibold leading-snug text-navy-600 hover:text-navy-700">
                          {book.title}
                        </h3>
                      </Link>
                      {listing.profiles && (
                        <Link
                          to={`/authors/${listing.seller_id}`}
                          className="mt-1 text-xs text-ink-400 hover:text-navy-500"
                        >
                          by {listing.profiles.display_name || 'Unknown'}
                        </Link>
                      )}
                      {book.genre && (
                        <span className="mt-2 inline-block w-fit rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gold-600">
                          {book.genre}
                        </span>
                      )}
                      <div className="mt-auto pt-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-gold-500" />
                          <span className="font-serif text-lg font-bold text-navy-500">
                            {formatPrice(toInrPaise(listing), 'INR')}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-400">
                          Condition: {listing.condition} · {listing.stock} in stock
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-cream-300 px-5 py-3">
                    {isOwned ? (
                      <div className="flex w-full items-center justify-center gap-2 rounded-full bg-green-100 py-2.5 text-sm font-medium text-green-700">
                        <Check className="h-4 w-4" />
                        Purchased
                      </div>
                    ) : (
                      <button
                        onClick={() => (user ? startRazorpayCheckout(listing) : null)}
                        disabled={!user}
                        className="btn-primary w-full py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        title={!user ? 'Sign in to buy' : ''}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        Buy now
                      </button>
                    )}
                    {!user && (
                      <p className="mt-2 text-center text-[11px] text-ink-300">
                        <Link to="/login" className="text-navy-400 hover:underline">Sign in</Link> to purchase
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout status modal */}
      {checkoutListing && checkoutListing.books && checkoutState !== 'idle' && checkoutState !== 'razorpay-open' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={closeCheckout} />
          <div className="relative w-full max-w-md animate-fade-up rounded-2xl bg-cream-50 shadow-2xl">
            {/* Creating order */}
            {checkoutState === 'creating-order' && (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-10 w-10 animate-spin text-gold-400" />
                <p className="mt-4 text-sm text-ink-400">Preparing your checkout…</p>
              </div>
            )}

            {/* Verifying payment */}
            {checkoutState === 'verifying' && (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-10 w-10 animate-spin text-gold-400" />
                <p className="mt-4 text-sm text-ink-400">Verifying your payment…</p>
                <p className="mt-1 text-xs text-ink-300">Please do not close this window.</p>
              </div>
            )}

            {/* Success */}
            {checkoutState === 'success' && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-8 w-8" />
                </span>
                <h3 className="mt-5 font-serif text-xl font-bold text-navy-500">Purchase complete!</h3>
                <p className="mt-2 text-sm text-ink-400">
                  You now own <strong className="text-navy-500">{checkoutListing.books.title}</strong>. Find it in your dashboard under "Books purchased."
                </p>
                <div className="mt-6 flex gap-2">
                  <Link to="/dashboard" className="btn-primary">Go to dashboard</Link>
                  <button onClick={closeCheckout} className="btn-ghost">Keep browsing</button>
                </div>
              </div>
            )}

            {/* Error / cancelled */}
            {checkoutState === 'error' && (
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertCircle className="h-6 w-6" />
                  </span>
                  <button onClick={closeCheckout} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-cream-200">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-navy-500">Payment could not be completed</h3>
                <p className="mt-2 text-sm text-ink-400">{checkoutError}</p>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => startRazorpayCheckout(checkoutListing)}
                    className="btn-primary"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try again
                  </button>
                  <button onClick={closeCheckout} className="btn-ghost">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Razorpay-open overlay (shown while modal is on screen) */}
      {checkoutListing && checkoutState === 'razorpay-open' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/30 backdrop-blur-sm" />
          <div className="relative flex flex-col items-center rounded-2xl bg-cream-50 px-12 py-10 shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
            <p className="mt-3 text-sm text-ink-400">Opening secure checkout…</p>
            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secured by Razorpay
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
