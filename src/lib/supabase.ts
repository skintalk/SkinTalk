import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@skintalk.com';

let supabaseClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
    if (!supabaseClient && typeof window !== 'undefined') {
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    
    if (!supabaseClient) {
        throw new Error('Supabase client not initialized');
    }
    
    return supabaseClient;
};

export const getAdminClient = (): SupabaseClient | null => {
    if (!adminClient && typeof window !== 'undefined' && serviceRoleKey) {
        adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
    }
    return adminClient;
};

export const isAdminEmail = (email: string | undefined): boolean => {
    return email?.toLowerCase() === adminEmail.toLowerCase();
};

export const getAdminEmail = (): string => adminEmail;