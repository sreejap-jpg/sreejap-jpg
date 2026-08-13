import { useState } from 'react';
import { Star, Send, Check, FileText } from 'lucide-react';

export function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setRating(0);
    setCategory('general');
    setMessage('');
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 text-gold-600">
          <FileText className="h-6 w-6" />
        </span>
        <p className="eyebrow mt-4">Feedback survey</p>
        <h1 className="mt-3 section-heading">Help us improve Kathazo</h1>
        <p className="mt-4 text-lg text-ink-400">
          Your feedback shapes the platform. Tell us what is working, what is not, and what you wish existed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 card space-y-6 p-8">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            How would you rate your experience?
          </label>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    (hover || rating) >= n
                      ? 'fill-gold-400 text-gold-400'
                      : 'fill-cream-300 text-cream-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field mt-1.5"
          >
            <option value="general">General feedback</option>
            <option value="bug">Report a bug</option>
            <option value="feature">Feature request</option>
            <option value="reading">Reading experience</option>
            <option value="writing">Writing & publishing</option>
            <option value="marketplace">Marketplace</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Your feedback</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="input-field mt-1.5 resize-none"
            placeholder="Tell us what you think…"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          {sent ? (
            <>
              <Check className="h-4 w-4" /> Thank you for your feedback
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Submit feedback
            </>
          )}
        </button>
      </form>
    </div>
  );
}
