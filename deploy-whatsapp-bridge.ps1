$ErrorActionPreference = "Stop"

Set-Location "D:\falisha"
$env:RAILWAY_TOKEN = ""

# whatsapp-bridge is the only service in this workspace that should still use manual
# railway up. Frontend/backend/parser are GitHub-linked and should deploy from git push.
railway up "D:\falisha\whatsapp-bridge" --path-as-root --detach --ci