# Run manually in your own Windows PowerShell terminal. No network activity.
# The password is entered masked and protected with Windows user-scoped DPAPI.
[CmdletBinding()]
param([switch]$SelfTest)
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'Windows DPAPI is required.' }
$projectRef = 'jmsntxwkaneluqgnzzim'

function Protect-RecoveryDirectory([string]$Path) {
    $acl = New-Object System.Security.AccessControl.DirectorySecurity
    $sid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User
    $acl.SetOwner($sid)
    $acl.SetAccessRuleProtection($true, $false)
    $inherit = [System.Security.AccessControl.InheritanceFlags]'ContainerInherit,ObjectInherit'
    $propagate = [System.Security.AccessControl.PropagationFlags]::None
    foreach ($identity in @($sid, (New-Object System.Security.Principal.SecurityIdentifier('S-1-5-18')))) {
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($identity, 'FullControl', $inherit, $propagate, 'Allow')
        $acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $Path -AclObject $acl
    $verified = Get-Acl -LiteralPath $Path
    if (-not $verified.AreAccessRulesProtected) { throw 'Directory still inherits permissions.' }
    foreach ($rule in $verified.Access) {
        $ruleSid = $rule.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value
        if ($ruleSid -notin @($sid.Value, 'S-1-5-18')) { throw 'Unexpected directory permission. Nothing will be saved.' }
    }
}

if ($SelfTest) {
    $checkDir = Join-Path ([System.IO.Path]::GetTempPath()) ('fc-recovery-security-test-' + [guid]::NewGuid().ToString('N'))
    [void][System.IO.Directory]::CreateDirectory($checkDir)
    Protect-RecoveryDirectory $checkDir
    $testSecret = ConvertTo-SecureString ('Synthetic-only-' + [guid]::NewGuid()) -AsPlainText -Force
    $cipher = ConvertFrom-SecureString $testSecret
    $restored = ConvertTo-SecureString $cipher
    if ($restored.Length -ne $testSecret.Length) { throw 'DPAPI round-trip failed.' }
    $testSecret.Dispose(); $restored.Dispose()
    # Empty, known test directory only; no recursive deletion or credential file.
    [System.IO.Directory]::Delete($checkDir)
    Write-Output 'PASS: user/SYSTEM-only ACL and Windows user-scoped DPAPI round-trip. No password requested or stored.'
    exit
}

$root = [System.IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA "FamilyConnect\Recovery\$projectRef"))
if ($root.StartsWith([System.IO.Path]::GetFullPath((Get-Location).Path), [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Run from the project workspace; the recovery vault must be outside it.'
}
if ($env:OneDrive -and $root.StartsWith([System.IO.Path]::GetFullPath($env:OneDrive), [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Recovery vault must be outside OneDrive.'
}
if (Test-Path -LiteralPath $root) {
    if ((Get-Item -LiteralPath $root).Attributes -band [System.IO.FileAttributes]::ReparsePoint) { throw 'Recovery vault cannot be a junction or symlink.' }
}
[void][System.IO.Directory]::CreateDirectory($root)
Protect-RecoveryDirectory $root
$credentialPath = Join-Path $root 'database-password.dpapi'
$connectionPath = Join-Path $root 'connection.json'
if ((Test-Path -LiteralPath $credentialPath) -or (Test-Path -LiteralPath $connectionPath)) {
    throw 'A recovery credential/configuration already exists. It was not overwritten.'
}
Write-Host "Source project: $projectRef"
Write-Host 'Use the existing database password from your password manager. Do not reset it.'
Write-Host 'For IPv4, copy only the Session pooler hostname from Supabase Connect (port 5432).'
$dbHost = (Read-Host 'Database hostname only (do not paste a connection URL)').Trim().ToLowerInvariant()
if ($dbHost -eq "db.$projectRef.supabase.co") { $dbUser = 'postgres' }
elseif ($dbHost -match '^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$') { $dbUser = "postgres.$projectRef" }
else { throw 'Unexpected hostname. Copy the direct or Session pooler hostname from the source project Connect panel.' }
$secret = Read-Host 'Existing database password (masked, never echoed)' -AsSecureString
try {
    if ($secret.Length -eq 0) { throw 'No password entered; nothing saved.' }
    $encrypted = ConvertFrom-SecureString $secret
    [System.IO.File]::WriteAllText($credentialPath, $encrypted)
    [ordered]@{project=$projectRef;host=$dbHost;port=5432;database='postgres';user=$dbUser;sslmode='verify-full';passwordFile='database-password.dpapi'} |
        ConvertTo-Json | Set-Content -LiteralPath $connectionPath -Encoding UTF8
} finally {
    $secret.Dispose()
    $encrypted = $null
}
Write-Host 'Saved encrypted credential and connection metadata with current-user/SYSTEM-only access.'
Write-Host 'No network connection was made and no hosted service changed.'
Write-Host 'Tell Codex: Recovery credential saved. Do not paste its contents or your password.'
