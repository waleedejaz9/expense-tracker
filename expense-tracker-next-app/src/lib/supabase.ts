import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://gwhgtpftatbeizlhcfzy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3aGd0cGZ0YXRiZWl6bGhjZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwOTIyODQsImV4cCI6MjA1NTY2ODI4NH0.P0bMEVO_S840OUEYG5C3HITwXicCnWPZvSNpanuTU_o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
