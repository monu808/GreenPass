// Simple test to check Supabase connection
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

console.log('Environment check:');
console.log('Loading from:', path.join(__dirname, '.env.local'));
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);

const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testConnection() {
  console.log('\n🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('destinations')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection error:', error.message);
      console.error('Full error:', error);
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('🟡 Database connected but tables missing');
        console.log('📝 Please run the schema from supabase/schema.sql in your Supabase dashboard');
      }
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('📊 Table exists and accessible');
    }
    
    // Test 2: Try to get data
    const { data: destinations, error: fetchError } = await supabase
      .from('destinations')
      .select('*')
      .limit(1);
      
    if (fetchError) {
      console.error('❌ Data fetch error:', fetchError.message);
    } else {
      console.log('✅ Data fetch successful');
      console.log('📊 Sample data:', destinations?.length > 0 ? 'Found data' : 'No data yet');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testConnection();
