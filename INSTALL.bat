@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo WORLD Arcade Engine v0.2 - React Installation
echo ================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [FAIL] Node.js >=22.16.0 not found.
  pause
  exit /b 1
)
node scripts\setup.mjs
if errorlevel 1 (pause & exit /b 1)
node scripts\build-web.mjs
if errorlevel 1 (
  echo [FAIL] Frontend React belum ter-build. Membutuhkan internet untuk npm install pertama.
  echo File project dan data tidak dihapus. Ulangi INSTALL.bat ketika internet tersedia.
  pause
  exit /b 1
)
node --experimental-sqlite scripts\check.mjs
if errorlevel 1 (pause & exit /b 1)
echo [OK] Instalasi selesai. Klik START.bat.
pause
