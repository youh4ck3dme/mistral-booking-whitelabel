# Generates apps/web/.env.production.local (gitignored via .env*.local) with fresh
# production secrets. Supabase/Mistral/Resend values are copied from .env.local only
# if they are real (not placeholders); otherwise left EMPTY for you to fill in.
# Values are never printed.
$ErrorActionPreference = 'Stop'
$web = Split-Path -Parent $PSScriptRoot
$out = Join-Path $web '.env.production.local'
if (Test-Path $out) { throw ".env.production.local already exists - delete it first if you want to regenerate." }

function New-Secret { -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }) }

# read .env.local for reusable values
$local = @{}
Get-Content (Join-Path $web '.env.local') | ForEach-Object {
  if ($_ -match '^\s*([A-Z0-9_]+)=(.*)$') { $local[$Matches[1]] = $Matches[2] }
}
function Real($k) {
  $v = $local[$k]
  if (-not $v -or $v -match 'placeholder|example\.com') { return '' }
  return $v
}

$cron = New-Secret
$lines = @(
  '# PRODUCTION env - generated, gitignored. Fill empty values, then run scripts/push-vercel-env.ps1',
  "NEXT_PUBLIC_SUPABASE_URL=$(Real 'NEXT_PUBLIC_SUPABASE_URL')",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY=$(Real 'NEXT_PUBLIC_SUPABASE_ANON_KEY')",
  "SUPABASE_SERVICE_ROLE_KEY=$(Real 'SUPABASE_SERVICE_ROLE_KEY')",
  '# empty = falls back to VERCEL_PROJECT_PRODUCTION_URL; set to https://your-domain if you have one',
  'NEXT_PUBLIC_APP_URL=',
  'NEXT_PUBLIC_ENVIRONMENT=production',
  'NOTIFICATION_BATCH_SIZE=20',
  "NOTIFICATION_CRON_SECRET=$cron",
  "CRON_SECRET=$cron",
  "NOTIFICATION_FROM_EMAIL=$(Real 'NOTIFICATION_FROM_EMAIL')",
  "NOTIFICATION_REPLY_TO_EMAIL=$(Real 'NOTIFICATION_REPLY_TO_EMAIL')",
  "RESEND_API_KEY=$(Real 'RESEND_API_KEY')",
  "MISTRAL_API_KEY=$(Real 'MISTRAL_API_KEY')",
  'RATE_LIMIT_CHAT_MAX=20',
  'RATE_LIMIT_CHAT_WINDOW_MS=60000',
  'RATE_LIMIT_NOTIFICATIONS_MAX=30',
  'RATE_LIMIT_NOTIFICATIONS_WINDOW_MS=60000',
  'RATE_LIMIT_AUTH_MAX=10',
  'RATE_LIMIT_AUTH_WINDOW_MS=60000'
)
Set-Content -Path $out -Value $lines -Encoding utf8
Write-Host "Wrote $out"
Write-Host "Empty keys to fill:"
$lines | Where-Object { $_ -match '^[A-Z0-9_]+=$' } | ForEach-Object { Write-Host "  $($_.TrimEnd('='))" }
