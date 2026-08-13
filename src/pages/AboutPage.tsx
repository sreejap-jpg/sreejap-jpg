import { BookOpen, Heart, Users, PenLine, Store, Sparkles } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="eyebrow">About</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-navy-500 sm:text-5xl">Our story</h1>
        <p className="mt-4 font-serif text-xl italic text-gold-500">Books | Authors | Community</p>
      </div>

      <div className="mt-10 space-y-6 font-serif text-lg leading-relaxed text-ink-600">
        <p>
          Kathazo was born from a simple belief: that every story deserves a home, and every reader
          deserves a community. In a world of algorithmic feeds and faceless marketplaces, we wanted
          to build something different — a place that feels like a boutique bookstore where the
          owner knows your taste, the authors are your neighbors, and the shelves are curated with care.
        </p>
        <p>
          The name Kathazo comes from the Greek word meaning "to cleanse or purify" — because we
          believe good writing does just that. It clears the noise. It sharpens the mind. It connects
          us to something truer than the scroll.
        </p>
        <p>
          Whether you are here to read your next favorite book, to write and publish your own, to
          follow the authors you love, or to sell books directly to readers who will cherish them —
          there is a place for you here.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {[
          { icon: BookOpen, title: 'Read', desc: 'Distraction-free reading for every book.' },
          { icon: PenLine, title: 'Write', desc: 'Draft, save, and publish chapter by chapter.' },
          { icon: Users, title: 'Connect', desc: 'Follow authors and build a readership.' },
          { icon: Store, title: 'Sell', desc: 'A marketplace built for independent voices.' },
        ].map((item) => (
          <div key={item.title} className="card p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
              <item.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-serif text-base font-semibold text-navy-500">{item.title}</h3>
            <p className="mt-1 text-sm text-ink-400">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-navy-500 p-8 text-center text-cream-100">
        <Sparkles className="mx-auto h-8 w-8 text-gold-400" />
        <p className="mt-4 font-serif text-2xl font-medium">
          "We are building the literary home we always wished existed."
        </p>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-sm text-cream-200/80">
          Made with <Heart className="h-4 w-4 fill-gold-400 text-gold-400" /> for readers & writers
        </p>
      </div>
    </div>
  );
}
