# Run Model Monitoring backend (Flask API)
# Usage: .\run_backend.ps1
# Ensure dependencies: pip install -r requirements.txt

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

$pythonExe = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $pythonExe = "python" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" }

if (-not $pythonExe) {
    Write-Host "Python not found. Install from https://www.python.org/ (add to PATH or use default install)."
    exit 1
}

Write-Host "Starting backend at http://127.0.0.1:5000 ..."
Write-Host "Keep this window open. Open the app at http://127.0.0.1:8080 (run run_frontend.ps1 first in another window)."
Set-Location (Join-Path $ProjectRoot "backend")
& $pythonExe app.py
