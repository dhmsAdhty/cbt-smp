import { createClient } from "@supabase/supabase-js"

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

//koneksi seluruh apk
export const supabase = createClient(supabaseUrl, supabaseKey)