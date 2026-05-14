@echo off
rem ── numista-eval ──────────────────────────────────────────────
rem Copy this file as "evaluate.bat" and fill in your settings.
rem Get your API key at: https://en.numista.com/api/doc/index.php

set API_KEY=YOUR_API_KEY_HERE
set CURRENCY=CAD
set LANG=fr

echo.
set /p FILE=Path to XLS file:
set FILE=%FILE:"=%
echo.

call npx numista-eval@latest "%FILE%" %API_KEY% %CURRENCY% --lang %LANG%
echo.
pause
