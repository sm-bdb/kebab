// Configuration for Supabase
const CONFIG = {
    // Supabase project URL - replace with your actual project URL
    SUPABASE_URL: 'https://bgvoejtbdhjspduhfgkx.supabase.co',

    // Public API key for reviews (read/write access to reviews and review_details only)
    PUBLIC_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndm9lanRiZGhqc3BkdWhmZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4OTM1NDEsImV4cCI6MjA3MjQ2OTU0MX0.OwttFTF-NjpleR4x3hM4AOgxRoQ471Hz2K-RB-CD2BI'
};

// Initialize Supabase client
const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.PUBLIC_API_KEY);
