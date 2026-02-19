$ErrorActionPreference = "Stop"

# Admin je HUB-only. Toto sú zakázané veci v apps/admin.
$globs = @(
  "apps/admin/app/**/factory/**",
  "apps/admin/app/**/builder/**",
  "apps/admin/app/api/publish/**",
  "apps/admin/app/**/editions/**",
  "apps/admin/app/api/**/editions/**"
)

$hits = @()
foreach ($g in $globs) {
  $m = git ls-files $g 2>$null
  if ($m) { $hits += $m }
}

if ($hits.Count -gt 0) {
  Write-Host "❌ Guardrail failed: admin contains forbidden files/routes:" -ForegroundColor Red
  $hits | Sort-Object -Unique | ForEach-Object { Write-Host " - $_" }
  exit 1
}

Write-Host "✅ Guardrail OK: admin stays hub-only." -ForegroundColor Green
