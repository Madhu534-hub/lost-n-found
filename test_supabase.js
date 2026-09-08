import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://uwtpkpgtpwyuatgfnjiq.supabase.co', 'sb_publishable_MdDMDFlnlna4iAgIGE4Yig_G7MxDGEm');

async function test() {
  const { data, error } = await supabase.from('messages').select('*').limit(1);
  console.log('Select error:', error);
  console.log('Data:', data);

  const { data: cols, error: colError } = await supabase.rpc('get_messages_columns'); // might not exist
  
  // Try inserting
  const { error: insertError } = await supabase.from('messages').insert([{
    id: 'test-123',
    match_id: 'match-123',
    sender_id: 'user-123',
    sender_name: 'Test',
    text: 'Hello',
    is_location_share: 0
  }]);
  console.log('Insert error with expected columns:', insertError);

  // Try inserting with receiver_id
  const { error: insertError2 } = await supabase.from('messages').insert([{
    id: 'test-456',
    match_id: 'match-123',
    sender_id: 'user-123',
    receiver_id: 'user-456',
    sender_name: 'Test',
    text: 'Hello',
    is_location_share: 0
  }]);
  console.log('Insert error with receiver_id:', insertError2);
}

test();
