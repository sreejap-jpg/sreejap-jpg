import { useState } from 'react';
import { Mail, MapPin, MessageSquare, Send, Check } from 'lucide-react';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 section-heading">Get in touch</h1>
        <p className="mt-4 text-lg text-ink-400">
          Questions, partnership ideas, or just want to say hello? We would love to hear from you.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
              <Mail className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-serif text-base font-semibold text-navy-500">Email us</h3>
            <p className="mt-1 text-sm text-ink-400">hello@kathazo.com</p>
          </div>
          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
              <MapPin className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-serif text-base font-semibold text-navy-500">Location</h3>
            <p className="mt-1 text-sm text-ink-400">A literary corner of the internet</p>
          </div>
          <div className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
              <MessageSquare className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-serif text-base font-semibold text-navy-500">Feedback</h3>
            <p className="mt-1 text-sm text-ink-400">
              Share your thoughts in our{' '}
              <a href="/feedback" className="text-gold-600 hover:underline">feedback survey</a>.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Your name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field mt-1.5"
              placeholder="Jane Austen"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mt-1.5"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink-400">Message</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="input-field mt-1.5 resize-none"
              placeholder="How can we help?"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            {sent ? (
              <>
                <Check className="h-4 w-4" /> Message sent
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Send message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
