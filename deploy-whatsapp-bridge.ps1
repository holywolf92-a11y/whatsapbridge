$ErrorActionPreference = "Stop"

Set-Location "D:\falisha"
$env:RAILWAY_TOKEN = ""

railway up "D:\falisha\whatsapp-bridge" --path-as-root --detach --ci