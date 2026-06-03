import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set in .env */
export const isSupabaseConfigured = Boolean(url && key);

/** Supabase client, or null when not configured (the app falls back to local data). */
export const supabase = url && key ? createClient(url, key) : null;
