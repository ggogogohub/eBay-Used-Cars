@echo off
echo ===================================================
echo        Starting eBay Used Cars Servers
echo ===================================================
echo.

REM Set the current directory as the project root
set PROJECT_ROOT=%~dp0
cd %PROJECT_ROOT%

REM Check if setup has been completed
if not exist "%PROJECT_ROOT%\backend\venv" (
    echo [ERROR] Backend virtual environment not found.
    echo Please run setup_project.bat first.
    pause
    exit /b 1
)

if not exist "%PROJECT_ROOT%\frontend\node_modules" (
    echo [ERROR] Frontend dependencies not found.
    echo Please run setup_project.bat first.
    pause
    exit /b 1
)

REM Create a temporary file to store the backend PID
set PID_FILE=%TEMP%\ebay_used_cars_backend.pid

REM Check if servers are already running
if exist "%PID_FILE%" (
    echo [INFO] Checking if backend server is already running...
    for /f %%i in (%PID_FILE%) do (
        tasklist /FI "PID eq %%i" | find "%%i" > nul 2>&1
        if not errorlevel 1 (
            echo [WARNING] Backend server is already running.
            echo.
            choice /C YN /M "Do you want to restart the servers?"
            if !ERRORLEVEL! EQU 2 (
                echo [INFO] Keeping existing servers running.
                goto open_browser
            ) else (
                echo [INFO] Stopping existing servers...
                taskkill /F /PID %%i > nul 2>&1
            )
        )
    )
)

REM Start the backend server
echo ===================================================
echo             Starting Backend Server
echo ===================================================
echo.

cd %PROJECT_ROOT%\backend

REM Activate virtual environment
call venv\Scripts\activate.bat

echo [INFO] Starting Flask backend server...
echo [INFO] The backend will be available at http://localhost:5001

REM Start the backend server in a new window and save its PID
start "eBay Used Cars Backend" cmd /c "python app.py & echo Backend server started successfully!"

REM Wait for backend to start
echo [INFO] Waiting for backend server to start...
timeout /t 5 /nobreak > nul

REM Check if backend is running
curl -s http://localhost:5001/health > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Could not verify backend server is running.
    echo The backend might still be starting up.
) else (
    echo [SUCCESS] Backend server is running.
)

REM Start the frontend server
echo.
echo ===================================================
echo             Starting Frontend Server
echo ===================================================
echo.

cd %PROJECT_ROOT%\frontend

echo [INFO] Starting Angular frontend server...
echo [INFO] The frontend will be available at http://localhost:4200

REM Start the frontend server in a new window
start "eBay Used Cars Frontend" cmd /c "npm start & echo Frontend server started successfully!"

REM Wait for frontend to start
echo [INFO] Waiting for frontend server to start...
timeout /t 10 /nobreak > nul

:open_browser
REM Open the application in the default browser
echo.
echo ===================================================
echo             Opening Application
echo ===================================================
echo.

echo [INFO] Opening eBay Used Cars in your default browser...
start http://localhost:4200

echo.
echo ===================================================
echo                Servers Started
echo ===================================================
echo.
echo Frontend: http://localhost:4200
echo Backend: http://localhost:5001
echo.
echo [INFO] Both servers are running in separate windows.
echo [INFO] Close those windows to stop the servers.
echo.
echo Press any key to exit this window (servers will continue running)...
pause > nul
