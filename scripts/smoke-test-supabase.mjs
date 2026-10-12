import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import path from 'node:path';
import fs from 'node:fs';

// Helper to load env from file if not in process.env
function loadEnv() {
  const envPath = path.resolve('apps/web/.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        if (!process.env[k]) process.env[k] = v;
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

console.log('=== SUPABASE SMOKE TEST SUITE ===');

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

console.log(`Target Supabase URL: ${supabaseUrl}`);

async function runSmokeTest() {
  let passed = true;

  // 1. Supabase Service Role Client
  console.log('\n[1/3] Testing Supabase Client (Service Role)...');
  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: tenants, error: tenantErr } = await supabaseAdmin
      .from('tenants')
      .select('id, name, slug')
      .limit(5);

    if (tenantErr) {
      console.error('❌ Failed to query tenants:', tenantErr.message);
      passed = false;
    } else {
      console.log(`✅ Successfully queried public.tenants. Rows found: ${tenants?.length ?? 0}`);
    }

    const { data: users, error: userErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (userErr) {
      console.error('❌ Failed to query auth.users:', userErr.message);
      passed = false;
    } else {
      console.log(`✅ Successfully accessed Supabase Auth Admin API. Total registered users: ${users?.users?.length ?? 0}`);
    }
  } catch (err) {
    console.error('❌ Exception in Supabase Client test:', err.message);
    passed = false;
  }

  // 2. Supabase Anon Client (Verifying Public RLS)
  if (anonKey) {
    console.log('\n[2/3] Testing Supabase Client (Anon Role - RLS check)...');
    try {
      const supabaseAnon = createClient(supabaseUrl, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const { data: pubTenants, error: pubErr } = await supabaseAnon
        .from('tenants')
        .select('name, slug')
        .limit(1);

      if (pubErr) {
        console.error('❌ Anon query error:', pubErr.message);
      } else {
        console.log(`✅ Public read on tenants works (Anon rows: ${pubTenants?.length ?? 0})`);
      }
    } catch (err) {
      console.error('❌ Exception in Anon Client test:', err.message);
    }
  }

  // 3. PostgreSQL Direct Connection (if provided)
  if (dbUrl) {
    console.log('\n[3/3] Testing Direct PostgreSQL / Transaction Pooler connection...');
    try {
      const client = new pg.Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      });
      await client.connect();
      const res = await client.query('SELECT NOW() as current_time, current_database() as db;');
      console.log(`✅ Direct SQL Query passed. DB: ${res.rows[0].db}, Server Time: ${res.rows[0].current_time}`);
      await client.end();
    } catch (err) {
      console.error('❌ Direct DB connection failed:', err.message);
      passed = false;
    }
  } else {
    console.log('\n[3/3] Direct DB URL not provided. Skipping raw SQL test.');
  }

  console.log('\n==================================');
  if (passed) {
    console.log('🎉 SMOKE TEST COMPLETED SUCCESSFULLY!');
  } else {
    console.log('⚠️ SMOKE TEST FINISHED WITH ERRORS.');
    process.exit(1);
  }
}

runSmokeTest();
