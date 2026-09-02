import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  role: 'reader' | 'writer' | 'author' | 'bookseller' | 'publisher';
  website: string;
  location: string;
  twitter: string;
  instagram: string;
  goodreads: string;
  created_at: string;
  updated_at: string;
};

export type Book = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cover_url: string;
  pdf_url: string | null;
  author_name: string | null;
  genre: string;
  status: 'draft' | 'published';
  is_for_sale: boolean;
  created_at: string;
  updated_at: string;
};

export type Chapter = {
  id: string;
  book_id: string;
  title: string;
  body: string;
  chapter_order: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
};

export type MarketplaceListing = {
  id: string;
  book_id: string;
  seller_id: string;
  price_cents: number;
  currency: string;
  condition: 'new' | 'like-new' | 'good' | 'acceptable';
  stock: number;
  status: 'active' | 'sold' | 'paused';
  created_at: string;
  updated_at: string;
};

export type Purchase = {
  id: string;
  buyer_id: string;
  listing_id: string | null;
  book_id: string;
  price_cents: number;
  currency: string;
  status: 'completed' | 'pending' | 'refunded';
  created_at: string;
};

export type ReadingProgress = {
  id: string;
  user_id: string;
  book_id: string;
  chapter_id: string | null;
  chapter_index: number;
  progress_pct: number;
  updated_at: string;
};

export type BookWithAuthor = Book & {
  profiles?: Profile;
  author_name?: string;
  follower_count?: number;
};

export type ListingWithBook = MarketplaceListing & {
  books?: Book;
  profiles?: Profile;
};
