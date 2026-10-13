# Pushes non-empty vars from apps/web/.env.production.local to Vercel (production env)
# via the Vercel CLI. Run from apps/web after `vercel link`.
# Usage: pwsh scripts/push-vercel-env.ps1 [-Environment production] [-DryRun]
param(
  [string]$Environment = 'production',
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$web = Split-Path -Parent $PSScriptRoot
$file = Join-Path $web '.env.production.local'
if (-not (Test-Path $file)) { throw "Missing $file - run scripts/make-production-env.ps1 first." }

Push-Location $web
try {
  Get-Content $file | ForEach-Object {
    if ($_ -notmatch '^\s*([A-Z0-9_]+)=(.*)$') { return }
    $name = $Matches[1]; $value = $Matches[2]
    if ([string]::IsNullOrWhiteSpace($value)) { Write-Host "SKIP (empty): $name"; return }
    if ($DryRun) { Write-Host "DRY-RUN would add: $name"; return }
    # --force overwrites existing; value piped via stdin so it never hits the process list
    $sensitive = $name -notmatch '^NEXT_PUBLIC_'
    $vercelParams = @('env', 'add', $name, $Environment, '--force')
    if ($sensitive) { $vercelParams += '--sensitive' }
    $value | vercel @vercelParams | Out-Null
    Write-Host "ADDED: $name ($Environment)"
  }
}
finally { Pop-Location }
