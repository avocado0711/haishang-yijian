@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title HaiShang YiJian - Development Server
set "PROJECT_ROOT=%CD%"
set "NO_BROWSER="
if /i "%~1"=="--no-browser" set "NO_BROWSER=1"

echo.
echo  HaiShang YiJian one-click launcher
echo  Project: %CD%
echo.

where node >nul 2>nul
if errorlevel 1 goto no_node

set "PNPM_CMD=pnpm"
where pnpm >nul 2>nul
if not errorlevel 1 goto pnpm_ready

where corepack >nul 2>nul
if errorlevel 1 goto no_pnpm
set "PNPM_CMD=corepack pnpm"

:pnpm_ready
if not exist "node_modules\next\package.json" (
  echo [INFO] Dependencies are missing. Running install...
  call %PNPM_CMD% install
  if errorlevel 1 goto install_failed
)

if not exist ".env.local" if exist ".env.example" (
  copy /y ".env.example" ".env.local" >nul
  echo [INFO] Created .env.local from .env.example.
  echo [INFO] Add API keys there if AI features are needed.
)

set "EXISTING_URL="
for /f "usebackq delims=" %%U in (`powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$root = [System.IO.Path]::GetFullPath($env:PROJECT_ROOT); foreach ($listener in @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue)) { if ($listener.LocalPort -ge 3000 -and $listener.LocalPort -le 3010) { $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $listener.OwningProcess) -ErrorAction SilentlyContinue; if ($process -and $process.CommandLine -and $process.CommandLine.IndexOf($root, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { Write-Output ('http://localhost:' + $listener.LocalPort); exit 0 } } }; exit 1"`) do set "EXISTING_URL=%%U"
if not defined EXISTING_URL goto new_server

echo [INFO] The development server is already running at %EXISTING_URL%.
if not defined NO_BROWSER start "" "%EXISTING_URL%"
echo [INFO] This window will close.
powershell.exe -NoProfile -Command "Start-Sleep -Milliseconds 1500"
exit /b 0

:new_server
if defined NO_BROWSER goto start_server

echo [INFO] Waiting for the development server to become ready...
start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command "$root = [System.IO.Path]::GetFullPath($env:PROJECT_ROOT); for ($i = 0; $i -lt 180; $i++) { foreach ($listener in @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue)) { if ($listener.LocalPort -ge 3000 -and $listener.LocalPort -le 3010) { $process = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $listener.OwningProcess) -ErrorAction SilentlyContinue; if ($process -and $process.CommandLine -and $process.CommandLine.IndexOf($root, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { Start-Process ('http://localhost:' + $listener.LocalPort); exit 0 } } }; Start-Sleep -Milliseconds 500 }"

:start_server
echo [INFO] Starting Next.js. Keep this window open while using the app.
echo.
call %PNPM_CMD% dev
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" echo [ERROR] Development server stopped with exit code %EXIT_CODE%.
echo Press any key to close this window.
pause >nul
exit /b %EXIT_CODE%

:no_node
echo [ERROR] Node.js was not found in PATH.
echo Install Node.js, then run start.bat again.
echo.
pause
exit /b 1

:no_pnpm
echo [ERROR] pnpm or Corepack was not found in PATH.
echo Install pnpm, then run start.bat again.
echo.
pause
exit /b 1

:install_failed
echo.
echo [ERROR] Dependency installation failed.
echo.
pause
exit /b 1
