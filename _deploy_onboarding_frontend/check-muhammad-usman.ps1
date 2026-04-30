# Check Muhammad Usman's documents in the database
# First, get the candidate ID from the Railway dashboard or API

$apiUrl = "http://localhost:3000"  # Or Railway backend URL

# Get candidates named Muhammad Usman
$response = curl -X GET "$apiUrl/api/candidates?search=Muhammad%20Usman" `
  -H "Authorization: Bearer $env:AUTH_TOKEN"

Write-Host "Candidates named Muhammad Usman:"
$response | ConvertFrom-Json | ForEach-Object { 
  Write-Host "ID: $_.id, Name: $_.name, Email: $_.email"
}

# Once you have the ID, check documents:
# curl -X GET "http://localhost:3000/api/candidates/{ID}/documents" -H "Authorization: Bearer $TOKEN"
