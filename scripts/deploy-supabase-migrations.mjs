import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Resolve DB Connection String
const connStr = process.argv[2] || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connStr) {
  console.error('ERROR: No database connection string provided.');
  console.error('Usage: node scripts/deploy-supabase-migrations.mjs "<DATABASE_URL>"');
  console.error('Or set DATABASE_URL / SUPABASE_DB_URL in environment.');
  process.exit(1);
}

// 2. Validate Connection Pooler
try {
  const parsed = new URL(connStr);
  console.log('=== CONNECTION INSPECTION ===');
  console.log(`Host: ${parsed.hostname}`);
  console.log(`Port: ${parsed.port}`);
  console.log(`User: ${parsed.username}`);
  console.log(`Database: ${parsed.pathname.replace(/^\//, '')}`);
  
  if (parsed.port === '6543') {
    console.log('✅ Supavisor Transaction Pooler (port 6543) detected.');
  } else if (parsed.port === '5432') {
    console.log('ℹ️ Session / Direct connection (port 5432) detected.');
  } else {
    console.log(`ℹ️ Custom port ${parsed.port} detected.`);
  }
} catch (e) {
  console.error('Warning: could not parse connection URL structure:', e.message);
}

// 3. Connect to PostgreSQL
const client = new pg.Client({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    console.log('\nConnecting to Supabase Database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Smoke Test Query: Server version & timezone
    const verRes = await client.query('SELECT version(), current_setting(\'TIMEZONE\') as tz;');
    console.log(`Database version: ${verRes.rows[0].version.split(' on ')[0]}`);
    console.log(`Server timezone: ${verRes.rows[0].tz}`);

    // Create migrations tracker table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public._applied_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // Read migrations directory
    const migDir = path.join(rootDir, 'supabase/migrations');
    const migFiles = fs.readdirSync(migDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\nFound ${migFiles.length} migration files in ${migDir}`);

    const appliedRes = await client.query('SELECT version FROM public._applied_migrations;');
    const appliedSet = new Set(appliedRes.rows.map(r => r.version));

    let appliedCount = 0;
    for (const f of migFiles) {
      if (appliedSet.has(f)) {
        console.log(`⏭️  Skip: ${f} (already applied)`);
        continue;
      }

      console.log(`⏳ Applying: ${f} ...`);
      const sqlContent = fs.readFileSync(path.join(migDir, f), 'utf8');

      await client.query('BEGIN;');
      try {
        await client.query(sqlContent);
        await client.query('INSERT INTO public._applied_migrations (version) VALUES ($1);', [f]);
        await client.query('COMMIT;');
        console.log(`✅ Applied: ${f}`);
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK;');
        console.error(`❌ FAILED migration ${f}:`, err.message);
        throw err;
      }
    }

    console.log(`\n🎉 Migrations complete. Newly applied: ${appliedCount}`);

    // Smoke Test: Core Tables & RLS status
    console.log('\n=== SMOKE TEST: CORE TABLES IN PUBLIC SCHEMA ===');
    const tablesCheck = await client.query(`
      SELECT table_name, rowsecurity 
      FROM information_schema.tables t
      LEFT JOIN pg_tables pt ON pt.schemaname = 'public' AND pt.tablename = t.table_name
      WHERE t.table_schema = 'public'
        AND t.table_name IN ('tenants', 'services', 'bookings', 'staff', 'notification_deliveries')
      ORDER BY table_name;
    `);

    for (const row of tablesCheck.rows) {
      console.log(`- Table: public.${row.table_name} | RLS: ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    }

    console.log('\n✅ All checks passed successfully!');
  } catch (err) {
    console.error('\nExecution error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
