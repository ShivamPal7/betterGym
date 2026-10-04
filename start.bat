@echo off
title openGym Launcher
setlocal enabledelayedexpansion

:: Navigate to project root directory
cd /d "%~dp0"

echo ===================================================
echo               openGym Local Setup & Launch
echo ===================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: 2. Ensure data directory exists
if not exist "data" (
    echo [*] Creating data directory...
    mkdir "data"
)

:: 3. Ensure .env file exists
if not exist ".env" (
    echo [*] Creating default local .env file...
    (
        echo # openGym local dev environment
        echo RP_ID=localhost
        echo ORIGIN=http://localhost:5173
        echo WEB_PORT=5173
        echo PORT=3000
        echo DATA_DIR=./data
        echo RP_NAME=openGym
        echo ALLOW_GUEST=1
        echo PASSWORD_LOGIN=1
        echo API_ORIGIN=http://localhost:5173
        echo API_TARGET=http://127.0.0.1:3000
    ) > .env
)

:: 4. Install backend dependencies
echo.
echo [1/4] Installing backend dependencies...
cd /d "%~dp0api"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b %errorlevel%
)

:: 5. Install frontend dependencies
echo.
echo [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install frontend dependencies.
    pause
    exit /b %errorlevel%
)

:: 6. Launch Backend API Server in a separate window
echo.
echo [3/4] Starting backend server on port 3000...
cd /d "%~dp0api"
start "openGym API Backend" cmd /k "cd /d "%~dp0api" && set PORT=3000&& set DATA_DIR=..\data&& set ORIGIN=http://localhost:5173&& set RP_ID=localhost&& set PASSWORD_LOGIN=1&& set ALLOW_GUEST=1&& node --env-file=..\.env server.js"

:: 7. Wait briefly and open browser
echo.
echo [4/4] Opening openGym in browser (http://localhost:5173)...
timeout /t 3 /nobreak >nul 2>&1 || ping 127.0.0.1 -n 4 >nul
start http://localhost:5173

:: 8. Launch Frontend Dev Server in the current window
echo.
echo ===================================================
echo  openGym is running! Press Ctrl+C to stop.
echo ===================================================
echo.
cd /d "%~dp0frontend"
set API_ORIGIN=http://localhost:5173
set API_TARGET=http://127.0.0.1:3000
call npm run dev

pause
