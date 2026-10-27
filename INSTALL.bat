@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo WORLD Arcade Engine v1.0.0-rc.3 - Release Candidate
echo ================================================
where node >nul 2>nul
if errorlevel 1 (
  echo [FAIL] Node.js >=22.16.0 not found.
  pause
  exit /b 1
)
node scripts\setup.mjs
if errorlevel 1 (pause & exit /b 1)
node --experimental-sqlite scripts\migrate.mjs
if errorlevel 1 (pause & exit /b 1)
node --experimental-sqlite scripts\migrate-rc2.mjs
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
