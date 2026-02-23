# Serve frontend (required - do NOT open index.html as file; use this URL)
# Usage: .\run_frontend.ps1
# Then open http://127.0.0.1:8080 in browser (start backend first with run_backend.ps1)

$ProjectRoot = $PSScriptRoot
$FrontendPath = Join-Path $ProjectRoot "frontend"

$pythonExe = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $pythonExe = "python" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" }

if (-not $pythonExe) {
    Write-Host "Python not found. Install from https://www.python.org/"
    exit 1
}

Write-Host "Serving frontend at http://127.0.0.1:8080"
Write-Host "OPEN THIS URL IN YOUR BROWSER: http://127.0.0.1:8080"
Write-Host "Do not open index.html as a file - the app must be loaded from this server."
Write-Host "Start backend first (run_backend.ps1 in another window) for full functionality."
Set-Location $FrontendPath
& $pythonExe -m http.server 8080
