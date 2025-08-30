// Database setup test
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
  console.log('🔍 Checking database tables...\n');
  
  const tables = ['destinations', 'tourists', 'bookings', 'alerts', 'weather_data'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log(`❌ Table "${table}" does not exist`);
        } else if (error.message.includes('infinite recursion detected in policy')) {
          console.log(`🟡 Table "${table}" exists but has policy issues`);
        } else {
          console.log(`❌ Table "${table}" error: ${error.message}`);
        }
      } else {
        console.log(`✅ Table "${table}" exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Table "${table}" error: ${err.message}`);
    }
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Run the schema from supabase/schema.sql');
  console.log('4. Make sure Row Level Security policies are correctly configured');
}

checkTables();
