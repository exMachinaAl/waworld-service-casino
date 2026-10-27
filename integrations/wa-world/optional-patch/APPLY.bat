@echo off
setlocal DisableDelayedExpansion
set "WAE_TARGET=%~1"
if not defined WAE_TARGET set /p "WAE_TARGET=Masukkan path folder WA-WORLD: "
if not defined WAE_TARGET exit /b 1
node --experimental-sqlite "%~dp0upgrade.mjs" APPLY "%WAE_TARGET%"
set "WAE_RESULT=%ERRORLEVEL%"
if "%WAE_RESULT%"=="0" (echo [OK] APPLY selesai.) else (echo [GAGAL] Periksa laporan di atas. Jangan memaksa overwrite.)
pause
exit /b %WAE_RESULT%
