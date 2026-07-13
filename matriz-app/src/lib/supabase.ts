import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  // Ajuda a diagnosticar quando o .env nao foi preenchido.
  console.error("Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no .env");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});
