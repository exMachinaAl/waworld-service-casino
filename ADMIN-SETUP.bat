@echo off
setlocal
cd /d "%~dp0"
echo ===============================================
echo WORLD ARCADE - ADMIN SETUP v0.5.0
echo ===============================================
where node >nul 2>nul
if errorlevel 1 (echo [FAIL] Node.js not found. & pause & exit /b 1)
node --experimental-sqlite scripts\admin-setup.mjs
if errorlevel 1 (echo [FAIL] Admin setup failed. & pause & exit /b 1)
echo [OK] Setup complete. See docs\ADMIN_ACR.md
pause
