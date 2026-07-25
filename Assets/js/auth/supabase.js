/* ==========================================================
   AMAZONIA FORCE
   CLIENTE SUPABASE
   Requer que o CDN do supabase-js já tenha sido carregado
   antes deste arquivo: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
========================================================== */

// IMPORTANTE: a URL deve ser a URL BASE do projeto, sem "/rest/v1/".
// O supabase-js monta os endpoints (auth, rest, storage...) sozinho a partir dela.
const SUPABASE_URL = "https://ubsfohhwialtjgvdyojh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVic2ZvaGh3aWFsdGpndmR5b2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NDc2MTMsImV4cCI6MjEwMDQyMzYxM30.KCdSoRR7pvYmff_mSjWlp8lqtn9x4f1BM7-j9Ha63RI";

if (!window.supabase) {
    console.error("Supabase SDK não carregado. Verifique se o script do CDN vem antes de supabase.js.");
}

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

window.supabaseClient = supabaseClient;