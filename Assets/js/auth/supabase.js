const SUPABASE_URL = "https://ubsfohhwialtjgvdyojh.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVic2ZvaGh3aWFsdGpndmR5b2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDc2MTMsImV4cCI6MjEwMDQyMzYxM30.KCdSoRR7pvYmff_mSjWlp8lqtn9x4f1BM7-j9Ha63RI";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

window.supabaseClient = supabaseClient;