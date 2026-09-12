@echo off
title AEGIS React Vite Dev Server
echo ========================================================
echo   Starting AEGIS Vite Hot-Reload Dev Server
echo   Running at: http://localhost:5173/
echo ========================================================
echo.
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
call npm.cmd run dev
pause
