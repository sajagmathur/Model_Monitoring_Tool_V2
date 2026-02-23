# Start Model Monitoring app: backend + frontend + open browser
# Usage: .\run_app.ps1
# Keep the two server windows open. Use the browser tab that opens.

$ProjectRoot = $PSScriptRoot

$pythonExe = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $pythonExe = "python" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe" }
elseif (Test-Path "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe") { $pythonExe = "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe" }

if (-not $pythonExe) {
    Write-Host "Python not found. Install from https://www.python.org/"
    exit 1
}

Write-Host "Starting backend (new window)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\backend'; & '$pythonExe' app.py"

Start-Sleep -Seconds 2

Write-Host "Starting frontend (new window)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; Write-Host 'Frontend: http://127.0.0.1:8080'; & '$pythonExe' -m http.server 8080"

Start-Sleep -Seconds 3

Write-Host "Opening browser at http://127.0.0.1:8080"
try {
    Start-Process "http://127.0.0.1:8080"
} catch {
    # Fallback: use default browser via cmd
    Start-Process cmd -ArgumentList "/c start http://127.0.0.1:8080" -WindowStyle Hidden
}

Write-Host ""
Write-Host "App URL: http://127.0.0.1:8080"
Write-Host "If the browser did not open, copy the URL above and paste it in your browser."
Write-Host "Do NOT close the two server windows. Close this window when done."
