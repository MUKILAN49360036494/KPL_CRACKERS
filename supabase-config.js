const SUPABASE_URL = "https://cnmuwmevjleowohoedyr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_s5aTwBHfVXN3OpbUvCKNFQ_gRXWYC59";

if (!window.supabase) {
  throw new Error("Supabase client failed to load.");
}

window.KPLSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
