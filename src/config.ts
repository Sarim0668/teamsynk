// src/config.ts
// ─── This fixes the "Cannot find name 'process'" error ────────────────────

declare const process: {
  env: {
    REACT_APP_DEEPSEEK_API_KEY?: string;
    REACT_APP_SUPABASE_URL?: string;
    REACT_APP_SUPABASE_ANON_KEY?: string;
  };
};

export const config = {
  deepseekApiKey: process.env.REACT_APP_DEEPSEEK_API_KEY || '',
  supabaseUrl: process.env.REACT_APP_SUPABASE_URL || '',
  supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || '',
}