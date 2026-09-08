import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwtpkpgtpwyuatgfnjiq.supabase.co';
const supabaseAnonKey = 'sb_publishable_MdDMDFlnlna4iAgIGE4Yig_G7MxDGEm';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUser() {
  console.log('Checking auth users...');
  
  // Try to query the users table
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users found:', users?.length);
    if (users && users.length > 0) {
      console.log('Sample user data:', JSON.stringify(users[0], null, 2));
    }
  }
}

checkUser();
