@echo off
cd /d "%~dp0.."
"C:\Program Files\Git\cmd\git.exe" add -A
echo Add live demo URL for business-owner access.> commitmsg.txt
echo.>> commitmsg.txt
echo Deploy TravelFlow Growth OS to Vercel and surface the public app link at the top of the README.>> commitmsg.txt
"C:\Program Files\Git\cmd\git.exe" commit -F commitmsg.txt
del commitmsg.txt
"C:\Program Files\Git\cmd\git.exe" push origin main
exit /b %ERRORLEVEL%
