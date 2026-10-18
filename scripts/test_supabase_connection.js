const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found in project root.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length) {
      env[key.trim()] = vals.join('=').trim();
    }
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--------------------------------------------------');
console.log('📡 Navodaya Prep Tracker: Supabase Connection Test');
console.log('--------------------------------------------------');

if (!url || !anonKey || url.includes('placeholder') || anonKey.includes('placeholder')) {
  console.log('⚠️ Status: Currently running in LOCAL PERSISTENT DATABASE mode.');
  console.log('ℹ️ To connect your live Supabase project:');
  console.log('   1. Create a free project at https://supabase.com');
  console.log('   2. Run the migration in: supabase/migrations/20261018000000_navodaya_schema.sql');
  console.log('   3. Replace placeholder keys in .env.local with your Project URL & Service Key.');
  console.log('--------------------------------------------------');
  process.exit(0);
}

async function testConnection() {
  console.log(`🔗 Connecting to: ${url}`);
  try {
    const supabase = createClient(url, serviceKey || anonKey);
    const { data, error } = await supabase.from('subjects').select('count', { count: 'exact' });

    if (error) {
      console.error(`❌ Connection error: ${error.message}`);
      if (error.message.includes('relation "public.subjects" does not exist')) {
        console.log('👉 Hint: You need to run the schema migration in Supabase SQL Editor:');
        console.log('   File: supabase/migrations/20261018000000_navodaya_schema.sql');
      }
      process.exit(1);
    }

    console.log('✅ Supabase connected successfully!');
    console.log(`📊 Found ${data ? data.length : 0} subject categories.`);
    console.log('🎉 Your cloud database is active and ready.');
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

testConnection();
