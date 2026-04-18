import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://dxolagznmmvtbhtouuns.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4b2xhZ3pubW12dGJodG91dW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4ODAwMTgsImV4cCI6MjA5MTQ1NjAxOH0.kaJjqXNhIZoNxBmn-2YF_1p3ok_aRge8x1m-ErNKOPQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)