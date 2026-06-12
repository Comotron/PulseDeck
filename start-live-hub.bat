@echo off
set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%NODE_EXE%" (
  echo Bundled Codex Node runtime was not found.
  echo Open this project in Codex once so the runtime can be prepared.
  pause
  exit /b 1
)

cd /d "%~dp0"
"%NODE_EXE%" server.js
pause
