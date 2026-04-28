import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://ktnlazcmojcrzxspggyf.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_NT8jHzUdqXM8lgL2Pfn2UQ_1W0IzCWH"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY );
