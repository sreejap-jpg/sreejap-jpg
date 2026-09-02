export const GENRES = [
  'Fiction',
  'Literary Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Historical Fiction',
  'Horror',
  'Young Adult',
  'Children',
  'Poetry',
  'Memoir',
  'Biography',
  'Self-Help',
  'Essays',
  'Non-Fiction',
] as const;

export type Genre = (typeof GENRES)[number];

export function formatPrice(cents: number, currency = 'USD') {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
  const symbol = symbols[currency] ?? '$';
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

export function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function readingTime(text: string) {
  const words = wordCount(text);
  return Math.max(1, Math.ceil(words / 220));
}
