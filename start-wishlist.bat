@echo off
setlocal

cd /d "%~dp0"

set "NODE_EXE=C:\Users\la_ma\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "WISHLIST_URL=http://localhost:8787/wishlist.html"

if not exist "%NODE_EXE%" (
  echo Could not find the bundled Node.js runtime.
  echo Expected: %NODE_EXE%
  pause
  exit /b 1
)

echo.
echo Matthew Birthday Wishlist
echo =========================
echo.

if "%NOTION_API_KEY%"=="" (
  echo Paste your Notion access token below.
  echo It will only be used for this window while the wishlist server is running.
  echo.
  set /p NOTION_API_KEY=Notion token: 
)

if "%NOTION_API_KEY%"=="" (
  echo.
  echo No token entered, so the wishlist cannot connect to Notion.
  pause
  exit /b 1
)

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8787" ^| findstr "LISTENING"') do (
  echo Stopping existing local server on port 8787...
  taskkill /F /PID %%P >nul 2>nul
)

echo.
echo Starting wishlist server...
echo Opening %WISHLIST_URL%
echo.

start "" "%WISHLIST_URL%"
"%NODE_EXE%" server.js

echo.
echo Wishlist server stopped.
pause
