@echo off
setlocal
cd /d "%~dp0"
if not exist .env (
  echo [FAIL] Jalankan INSTALL.bat.
  pause
  exit /b 1
)
if not exist web-dist\index.html (
  echo [FAIL] React belum dibuild. Jalankan INSTALL.bat lagi.
  pause
  exit /b 1
)
echo WORLD Arcade Engine v0.2 - React UI
echo Open http://127.0.0.1:8787
echo Server backend dan Web UI menggunakan port yang SAMA.
node --experimental-sqlite src\server.mjs
if errorlevel 1 pause
