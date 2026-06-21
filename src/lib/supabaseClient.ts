import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zmdkxsrskiljyexqjfro.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZGt4c3Jza2lsanlleHFqZnJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTk0ODksImV4cCI6MjA5NzM3NTQ4OX0.MMxPVr3xRPpocl_hGl_i9gGbgNk0uQ5hIxg-gWlGHZA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)