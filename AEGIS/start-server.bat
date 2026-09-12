@echo off
title AEGIS Master Localhost Hub (Port 3000)
echo ========================================================
echo   Starting AEGIS Autonomous Multi-Agent OS
echo   Unified Command Center: http://localhost:3000/
echo   React App Direct:       http://localhost:3001/
echo   Standalone Console:     http://localhost:3002/
echo   API Gateway:            http://localhost:8000/api/agents
echo ========================================================
echo.
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
node master-server.cjs
pause
