@echo off
setlocal
cd /d "%~dp0"
node --experimental-sqlite scripts\check.mjs
if errorlevel 1 goto fail
node scripts\check-web.mjs
if errorlevel 1 goto fail
node --experimental-sqlite --test
if errorlevel 1 goto fail
echo [OK] All local checks passed.
pause
exit /b 0
:fail
echo [FAIL] Review output above.
pause
exit /b 1
