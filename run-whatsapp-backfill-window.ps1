param(
  [string]$AccountId = 'whatsapp1',
  [Parameter(Mandatory = $true)]
  [string]$After,
  [Parameter(Mandatory = $true)]
  [string]$Before,
  [int]$LimitPerChat = 300,
  [int]$MaxChats = 200,
  [int]$MaxDeliveries = 25,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$projectId = 'eba3c27d-3b58-4a9a-b5cc-b378445e50f9'
$environmentId = '3206e0fe-7bc8-4bfc-9f63-a58e3da676f4'
$serviceId = '841b0453-60a5-4ab2-a283-627855ebfa4e'

$railwayArgs = @(
  'ssh',
  '-p', $projectId,
  '-e', $environmentId,
  '-s', $serviceId,
  'node',
  '/app/dist/scripts/backfillPdfHistory.js',
  '--account', $AccountId,
  '--after', $After,
  '--before', $Before,
  '--limit-per-chat', $LimitPerChat,
  '--max-chats', $MaxChats,
  '--max-deliveries', $MaxDeliveries
)

if ($DryRun) {
  $railwayArgs += '--dry-run'
}

Write-Host "Running WhatsApp backfill window: $After -> $Before" -ForegroundColor Cyan
Write-Host "Account=$AccountId LimitPerChat=$LimitPerChat MaxChats=$MaxChats MaxDeliveries=$MaxDeliveries DryRun=$($DryRun.IsPresent)" -ForegroundColor Cyan

& railway @railwayArgs
exit $LASTEXITCODE