// Create missing tables via Supabase SQL (using service role or direct SQL)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwtpkpgtpwyuatgfnjiq.supabase.co';
const supabaseAnonKey = 'sb_publishable_MdDMDFlnlna4iAgIGE4Yig_G7MxDGEm';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SQL = `
-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  lost_report_id TEXT NOT NULL,
  found_report_id TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  visual_score REAL NOT NULL,
  text_score REAL NOT NULL,
  location_score REAL NOT NULL,
  time_score REAL NOT NULL,
  explanation TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'challenge_issued', 'verified', 'rejected', 'reunited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to matches" ON public.matches;
CREATE POLICY "Public read access to matches" ON public.matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow match insert" ON public.matches;
CREATE POLICY "Allow match insert" ON public.matches FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow match update" ON public.matches;
CREATE POLICY "Allow match update" ON public.matches FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow match delete" ON public.matches;
CREATE POLICY "Allow match delete" ON public.matches FOR DELETE USING (true);

-- Create messages table  
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  sender_name TEXT,
  text TEXT NOT NULL,
  is_location_share INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access to messages" ON public.messages;
CREATE POLICY "Public read access to messages" ON public.messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow message insert" ON public.messages;
CREATE POLICY "Allow message insert" ON public.messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow message delete" ON public.messages;
CREATE POLICY "Allow message delete" ON public.messages FOR DELETE USING (true);
`;

async function main() {
  console.log('=== IMPORTANT ===');
  console.log('The matches and messages tables do NOT exist in your Supabase database.');
  console.log('');
  console.log('You must create them by running SQL in the Supabase Dashboard.');
  console.log('');
  console.log('Steps:');
  console.log('1. Go to: https://supabase.com/dashboard');
  console.log('2. Select your project (uwtpkpgtpwyuatgfnjiq)');
  console.log('3. Click "SQL Editor" in the left sidebar');
  console.log('4. Click "New Query"');
  console.log('5. Paste the following SQL and click "Run":');
  console.log('');
  console.log('================================================');
  console.log(SQL);
  console.log('================================================');
  console.log('');
  console.log('After running, come back here and re-run this script to verify.');
}

main();
