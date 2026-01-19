import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xefiwydezpodjnhipxlw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlZml3eWRlenBvZGpuaGlweGx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTM0NzMsImV4cCI6MjA4NDMyOTQ3M30.eiQi_PAaEYN7nJEMbBgo9WnMKa4vW6qPzxh-pZnoPuI';

export const supabase = createClient(supabaseUrl, supabaseKey);