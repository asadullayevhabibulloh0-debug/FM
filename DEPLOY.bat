@echo off
chcp 65001 >nul
title Futbol Market - Vercel ga yuklash
cd /d "%~dp0"
echo.
echo  Futbol Market saytini internetga (Vercel) yuklash...
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js topilmadi. Avval nodejs.org saytidan LTS ni ornating, keyin qayta ishga tushiring.
  echo.
  pause
  exit /b
)
call npx vercel --prod
echo.
echo  Tugadi. Endi Telegram da dokonni yopib, qayta oching.
pause
