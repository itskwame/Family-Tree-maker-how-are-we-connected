param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference='Stop'
$source=Join-Path $env:LOCALAPPDATA 'FamilyConnect\Recovery\jmsntxwkaneluqgnzzim\capture-2026-11-17T02-10-14-640Z'
$source=(Resolve-Path -LiteralPath $source).Path
$dest=(Resolve-Path -LiteralPath $Destination).Path
if($source -eq $dest){throw 'Destination must be the independent copy'}
$files=@(Get-ChildItem -LiteralPath $source -File -Recurse)
$copies=@(Get-ChildItem -LiteralPath $dest -File -Recurse)
if($files.Count -ne $copies.Count){throw 'Copy file count mismatch'}
foreach($file in $files){
 $relative=$file.FullName.Substring($source.Length+1)
 $copy=Join-Path $dest $relative
 if(!(Test-Path -LiteralPath $copy -PathType Leaf)){throw 'Copy is incomplete'}
 if((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash){throw 'Copy checksum mismatch'}
}
Write-Output "PASS: $($files.Count) files match byte-for-byte. No credentials or file contents displayed."
