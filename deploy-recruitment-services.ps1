param(
  [switch]$Frontend,
  [switch]$Backend,
  [switch]$Parser,
  [switch]$Bridge,
  [string]$Branch = 'main',
  [switch]$SkipPush,
  [switch]$SkipBridgeDeploy
)

$ErrorActionPreference = 'Stop'

$repos = @(
  @{
    Name = 'recruitment-portal-frontend'
    Path = 'D:\falisha\recruitment-portal-frontend'
    ExpectedRemote = 'https://github.com/holywolf92-a11y/recruitment-portal-frontend.git'
    Mode = 'github-linked'
  },
  @{
    Name = 'recruitment-portal-backend'
    Path = 'D:\falisha\recruitment-portal-backend'
    ExpectedRemote = 'https://github.com/holywolf92-a11y/recruitment-portal-backend.git'
    Mode = 'github-linked'
  },
  @{
    Name = 'recruitment-portal-python-parser'
    Path = 'D:\falisha\recruitment-portal-python-parser'
    ExpectedRemote = 'https://github.com/holywolf92-a11y/recruitment-portal-python-parser.git'
    Mode = 'github-linked'
  },
  @{
    Name = 'whatsapp-bridge'
    Path = 'D:\falisha\whatsapp-bridge'
    ExpectedRemote = 'https://github.com/holywolf92-a11y/whatsapbridge.git'
    Mode = 'manual-railway'
  }
)

if (-not ($Frontend -or $Backend -or $Parser -or $Bridge)) {
  $Frontend = $true
  $Backend = $true
  $Parser = $true
}

$selectedNames = @()
if ($Frontend) { $selectedNames += 'recruitment-portal-frontend' }
if ($Backend) { $selectedNames += 'recruitment-portal-backend' }
if ($Parser) { $selectedNames += 'recruitment-portal-python-parser' }
if ($Bridge) { $selectedNames += 'whatsapp-bridge' }

function Get-RemoteUrl {
  param([string]$RepoPath)

  Push-Location $RepoPath
  try {
    return (git remote get-url origin).Trim()
  } finally {
    Pop-Location
  }
}

function Push-GitLinkedRepo {
  param(
    [string]$RepoPath,
    [string]$RepoName,
    [string]$BranchName,
    [string]$ExpectedRemoteUrl,
    [switch]$DoSkipPush
  )

  $remoteUrl = Get-RemoteUrl -RepoPath $RepoPath
  if ($remoteUrl -ne $ExpectedRemoteUrl) {
    throw "Origin remote mismatch for $RepoName. Expected '$ExpectedRemoteUrl' but found '$remoteUrl'."
  }

  Push-Location $RepoPath
  try {
    Write-Host "=== $RepoName ===" -ForegroundColor Cyan
    git status --short

    if (-not $DoSkipPush) {
      Write-Host "Pushing $RepoName to origin/$BranchName ..." -ForegroundColor Yellow
      git push origin $BranchName
    }

    Write-Host "Railway deploy mode: GitHub-linked" -ForegroundColor Green
    Write-Host "Do not run 'railway up' for $RepoName; Railway will deploy from GitHub." -ForegroundColor Green
    Write-Host "" 
  } finally {
    Pop-Location
  }
}

function Deploy-Bridge {
  param(
    [string]$RepoPath,
    [string]$RepoName,
    [string]$ExpectedRemoteUrl,
    [switch]$DoSkipPush,
    [switch]$DoSkipBridgeDeploy
  )

  $remoteUrl = Get-RemoteUrl -RepoPath $RepoPath
  if ($remoteUrl -ne $ExpectedRemoteUrl) {
    throw "Origin remote mismatch for $RepoName. Expected '$ExpectedRemoteUrl' but found '$remoteUrl'."
  }

  Push-Location $RepoPath
  try {
    Write-Host "=== $RepoName ===" -ForegroundColor Cyan
    git status --short

    if (-not $DoSkipPush) {
      Write-Host "Pushing $RepoName to origin/$Branch ..." -ForegroundColor Yellow
      git push origin $Branch
    }

    if ($DoSkipBridgeDeploy) {
      Write-Host "Skipped Railway deploy for whatsapp-bridge." -ForegroundColor Yellow
      return
    }

    if (-not $env:RAILWAY_TOKEN) {
      throw 'RAILWAY_TOKEN is not set. Export the token before deploying whatsapp-bridge.'
    }

    Write-Host "Running manual Railway deploy for whatsapp-bridge ..." -ForegroundColor Yellow
    railway up 'D:\falisha\whatsapp-bridge' --path-as-root --detach --ci
  } finally {
    Pop-Location
  }
}

Write-Host 'Deployment policy:' -ForegroundColor Magenta
Write-Host '- Frontend, backend, and python parser are GitHub-linked Railway services.' -ForegroundColor Magenta
Write-Host '- Use git push only for those repos.' -ForegroundColor Magenta
Write-Host '- whatsapp-bridge remains the only manual railway up deployment.' -ForegroundColor Magenta
Write-Host ''

foreach ($repo in $repos) {
  if ($selectedNames -notcontains $repo.Name) {
    continue
  }

  if ($repo.Mode -eq 'github-linked') {
    Push-GitLinkedRepo -RepoPath $repo.Path -RepoName $repo.Name -BranchName $Branch -ExpectedRemoteUrl $repo.ExpectedRemote -DoSkipPush:$SkipPush
    continue
  }

  Deploy-Bridge -RepoPath $repo.Path -RepoName $repo.Name -ExpectedRemoteUrl $repo.ExpectedRemote -DoSkipPush:$SkipPush -DoSkipBridgeDeploy:$SkipBridgeDeploy
}