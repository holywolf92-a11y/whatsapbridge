$ErrorActionPreference = 'Stop'

$projectId = 'eba3c27d-3b58-4a9a-b5cc-b378445e50f9'
$environmentId = '3206e0fe-7bc8-4bfc-9f63-a58e3da676f4'
$serviceId = '841b0453-60a5-4ab2-a283-627855ebfa4e'
$localFile = 'D:\falisha\_tmp_oneoff_whatsapp_backfill.ts'
$remoteBase64 = '/tmp/oneoffBackfill.b64'
$remoteFile = '/app/oneoffBackfill.ts'

if (-not (Test-Path $localFile)) {
  throw "Local file not found: $localFile"
}

function Invoke-Railway {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$RailwayArgs
  )

  & railway @RailwayArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Railway command failed with exit code $LASTEXITCODE: railway $($RailwayArgs -join ' ')"
  }
}

$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($localFile))
$chunks = [regex]::Matches($base64, '.{1,2000}') | ForEach-Object { $_.Value }

Invoke-Railway @(
  'ssh', '-p', $projectId, '-e', $environmentId, '-s', $serviceId,
  'node', '-e', "require('fs').writeFileSync('$remoteBase64', '')"
)

foreach ($chunk in $chunks) {
  Invoke-Railway @(
    'ssh', '-p', $projectId, '-e', $environmentId, '-s', $serviceId,
    'node', '-e', "require('fs').appendFileSync('$remoteBase64', '$chunk')"
  )
}

Invoke-Railway @(
  'ssh', '-p', $projectId, '-e', $environmentId, '-s', $serviceId,
  'node', '-e', "const fs = require('fs'); fs.writeFileSync('$remoteFile', Buffer.from(fs.readFileSync('$remoteBase64', 'utf8'), 'base64'));"
)

Invoke-Railway @('ssh', '-p', $projectId, '-e', $environmentId, '-s', $serviceId, 'wc', '-c', $remoteFile)