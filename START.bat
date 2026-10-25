@echo off
setlocal
cd /d "%~dp0"
if not exist .env (
  echo [FAIL] Jalankan INSTALL.bat terlebih dahulu.
  pause
  exit /b 1
)
node scripts\require-web-build.mjs
if errorlevel 1 (pause & exit /b 1)
echo WORLD Arcade Engine v0.5 - Admin ACR Toolkit
echo Open http://127.0.0.1:8787
echo Backend dan frontend berjalan di port yang SAMA.
node --experimental-sqlite src\server.mjs
if errorlevel 1 pause
