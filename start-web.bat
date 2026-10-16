@echo off
title CineMax Cinemas Server
echo ====================================================
echo    DANG KHOI DONG HE THONG CINEMAX CINEMAS...
echo ====================================================
cd /d "%~dp0"
echo Dang mo trinh duyet...
start http://localhost:3000
npm run dev
pause
