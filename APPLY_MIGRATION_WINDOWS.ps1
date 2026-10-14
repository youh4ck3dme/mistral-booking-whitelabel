#requisite PowerShell script to apply migration to Supabase booking-praha
# This script must be run on a machine with psql installed

param(
    [string]$SupabaseToken = "YOUR_SUPABASE_ACCESS_TOKEN",
    [string]$ProjectRef = "YOUR_PROJECT_REF",
    [string]$MigrationFile = "supabase/migrations/20261014150000_autoops_tables.sql"
)

Write-Host "=== Supabase Migration Applicator ===" -ForegroundColor Cyan
Write-Host "Project: booking-praha-2026 ($ProjectRef)" -ForegroundColor Cyan
Write-Host ""

# Check if psql is installed
try {
    $psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
    if (-not $psqlPath) {
        Write-Host "❌ psql is not installed!" -ForegroundColor Red
        Write-Host "Please install PostgreSQL client from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ psql is not installed!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Get service role key from Supabase
Write-Host "Fetching service role key..." -ForegroundColor Green
Write-Host "Note: Set SupabaseToken and ProjectRef parameters or pass as arguments" -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $SupabaseToken"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/api-keys" -Headers $headers
    $serviceRoleKey = ($response | Where-Object { $_.name -eq "service_role" }).api_key
    
    if (-not $serviceRoleKey) {
        Write-Host "❌ Could not find service_role key" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Service role key found" -ForegroundColor Green
    
    # For Supabase, use the direct connection to the database
    # The connection string format is: postgresql://postgres.[service_key]:[password]@db.[ref].supabase.co:5432/postgres
    # But we don't have the password. Instead, use the pooler with JWT token
    
    # Actually, for JWT tokens, we need to use the connection pooler
    $poolerHost = "aws-1-eu-north-1.pooler.supabase.com"
    $connectionString = "postgresql://postgres:$serviceRoleKey@$poolerHost:5432/postgres?sslmode=require"
    
    Write-Host "Connection string: $connectionString" -ForegroundColor DarkGray
    Write-Host ""
    
    # Test connection
    Write-Host "Testing database connection..." -ForegroundColor Green
    $testResult = & psql $connectionString -c "SELECT 1 AS test" 2>&1
    
    if ($testResult -match "test") {
        Write-Host "✅ Connection successful!" -ForegroundColor Green
        
        # Apply migration
        Write-Host "Applying migration: $MigrationFile" -ForegroundColor Green
        $migrationContent = Get-Content $MigrationFile -Raw
        
        # Execute migration
        $result = & psql $connectionString -f $MigrationFile 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
            
            # Verify tables
            Write-Host "" -ForegroundColor Default
            Write-Host "Verifying tables..." -ForegroundColor Green
            & psql $connectionString -c "
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('autoops_events', 'autoops_runs', 'booking_waitlist');
            " 2>&1
            
        } else {
            Write-Host "❌ Migration failed!" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            exit 1
        }
        
    } else {
        Write-Host "❌ Connection failed!" -ForegroundColor Red
        Write-Host $testResult -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host "" -ForegroundColor Default
Write-Host "=== Migration Complete ===" -ForegroundColor Cyan
