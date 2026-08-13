import { type ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = BookOpen,
  title,
  description,
  action,
}: {
  icon?: typeof BookOpen;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-400 bg-cream-50 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-gold-500">
        <Icon className="h-7 w-7" />
      </span>
      <h3 className="mt-4 font-serif text-lg font-semibold text-navy-500">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-ink-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-cream-400 border-t-gold-400" />
      <p className="mt-4 text-sm text-ink-400">{label}</p>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-3 section-heading">{title}</h1>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-ink-400">{subtitle}</p>
      )}
      {children && <div className="mt-8">{children}</div>}
    </div>
  );
}
