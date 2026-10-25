@echo off
setlocal
cd /d "%~dp0"
echo Start WAE backend using START.bat in another window.
echo React dev URL: http://127.0.0.1:5173
cd web
call npm run dev
if errorlevel 1 pause
