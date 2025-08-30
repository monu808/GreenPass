// Test connection after schema fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAfterFix() {
  console.log('🔄 Testing connection after schema fix...\n');
  
  // Test each table
  const tables = ['destinations', 'tourists', 'alerts', 'weather_data'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Working! (${data?.length || 0} sample records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('\n📊 Getting data counts...');
  
  try {
    const { data: destinations } = await supabase.from('destinations').select('*');
    const { data: alerts } = await supabase.from('alerts').select('*');
    
    console.log(`Destinations: ${destinations?.length || 0}`);
    console.log(`Alerts: ${alerts?.length || 0}`);
    
    if ((destinations?.length || 0) > 0) {
      console.log('\n🎉 SUCCESS! Database is working properly');
      console.log('You can now use your application normally.');
    } else {
      console.log('\n🟡 Database is connected but needs data');
      console.log('Please run the fixed-schema.sql file in your Supabase dashboard');
    }
    
  } catch (err) {
    console.log(`Error getting counts: ${err.message}`);
  }
}

testAfterFix();
