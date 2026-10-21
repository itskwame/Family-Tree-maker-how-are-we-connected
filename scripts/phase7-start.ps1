$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot
$runtime = (Get-Command node).Source
if ([int]((& $runtime --version).TrimStart('v').Split('.')[0]) -lt 22) {
    $candidate = 'C:\Program Files\nodejs\node.exe'
    if (Test-Path -LiteralPath $candidate) { $runtime = $candidate }
}
if ([int]((& $runtime --version).TrimStart('v').Split('.')[0]) -lt 22) { throw 'Use Node 22 or 24 for the patched image worker.' }
if (Test-Path -LiteralPath 'local/phase6/supabase/.temp/project-ref') { throw 'Refusing a linked Supabase workspace.' }
New-Item -ItemType Directory -Force -Path 'output/phase7/private' | Out-Null
foreach ($port in @(5176,5177)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { Write-Output "Port $port is already listening; preserving the existing service."; continue }
    $arguments = if ($port -eq 5176) { @('node_modules/vite/bin/vite.js','--config','vite.phase6.config.mjs','--mode','phase6') } else { @('scripts/phase7-media-server.mjs') }
    Start-Process -FilePath $runtime -ArgumentList $arguments -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput "output/phase7/private/service-$port.log" -RedirectStandardError "output/phase7/private/service-$port-errors.log"
}
Write-Output 'Local demo: http://127.0.0.1:5176/phase6.html'
Write-Output 'Fictional sign-in details: output/phase7/private/demo.json. Do not publish this file.'
