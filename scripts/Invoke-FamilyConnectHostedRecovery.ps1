[CmdletBinding()]
param([ValidateSet('preflight','backup','verify')][string]$Stage='preflight')
$ErrorActionPreference='Stop'
$vault=Join-Path $env:LOCALAPPDATA 'FamilyConnect\Recovery\jmsntxwkaneluqgnzzim'
$acl=Get-Acl -LiteralPath $vault
$sid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
if(-not $acl.AreAccessRulesProtected){throw 'Recovery vault inherits permissions; stopping.'}
foreach($rule in $acl.Access){if($rule.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value -notin @($sid,'S-1-5-18')){throw 'Unexpected recovery vault access; stopping.'}}
$config=Get-Content -LiteralPath (Join-Path $vault 'connection.json') -Raw | ConvertFrom-Json
$secure=Get-Content -LiteralPath (Join-Path $vault 'database-password.dpapi') -Raw | ConvertTo-SecureString
$ptr=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
 $payload=@{vault=$vault;connection=$config;password=[System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr);stage=$Stage}|ConvertTo-Json -Compress
 $info=New-Object System.Diagnostics.ProcessStartInfo
 $info.FileName=(Get-Command node).Source
 $info.Arguments='scripts/hosted-recovery-runner.mjs'
 $info.UseShellExecute=$false
 $info.RedirectStandardInput=$true
 $process=[System.Diagnostics.Process]::Start($info)
 $process.StandardInput.Write([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload)));$process.StandardInput.Close()
 $payload=$null
 $process.WaitForExit()
 if($process.ExitCode -ne 0){throw 'Hosted recovery stopped. See sanitized runner status; private diagnostics remain in the vault.'}
} finally {
 [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
 $secure.Dispose()
 $payload=$null
}
