import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
    console.warn("[Creosmark] PUBLIC_SUPABASE_URL is not set – Supabase features will be unavailable.");
}

if (!supabasePublishableKey) {
    console.warn("[Creosmark] PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set – Supabase features will be unavailable.");
}

// When credentials are absent (e.g. local demo) create the client with placeholder
// values so the module can still be imported. Any actual DB call will fail
// gracefully at runtime rather than crashing the entire page.
export const supabase = createClient(
    supabaseUrl ?? "https://placeholder.supabase.co",
    supabasePublishableKey ?? "placeholder-key",
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    },
);