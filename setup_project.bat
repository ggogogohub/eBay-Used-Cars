@echo off
echo ===================================================
echo        eBay Used Cars Project Setup
echo ===================================================
echo.

REM Set the current directory as the project root
set PROJECT_ROOT=%~dp0
cd %PROJECT_ROOT%

echo [INFO] Setting up project at: %PROJECT_ROOT%
echo.

REM Check if Python is installed
echo [INFO] Checking Python installation...
python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.8 or later and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Python is installed.
echo.

REM Check if Node.js is installed
echo [INFO] Checking Node.js installation...
node --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 16.x or later and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Node.js is installed.
echo.

REM Check if MongoDB is running
echo [INFO] Checking MongoDB connection...
ping -n 1 localhost > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Could not verify MongoDB connection.
    echo Please ensure MongoDB is running on localhost:27017.
    echo.
    choice /C YN /M "Continue anyway?"
    if %ERRORLEVEL% EQU 2 (
        echo Setup aborted by user.
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] MongoDB connection verified.
    echo.
)

REM Setup Backend
echo ===================================================
echo                Backend Setup
echo ===================================================
echo.

cd %PROJECT_ROOT%\backend

REM Check if virtual environment exists
if not exist venv (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    echo [SUCCESS] Virtual environment created.
) else (
    echo [INFO] Virtual environment already exists.
)

REM Activate virtual environment and install dependencies
echo [INFO] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat

REM Check if requirements are already installed
pip freeze > temp_requirements.txt
findstr /C:"Flask" temp_requirements.txt > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Installing backend dependencies...
    pip install -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install backend dependencies.
        del temp_requirements.txt
        pause
        exit /b 1
    )
    echo [SUCCESS] Backend dependencies installed.
) else (
    echo [INFO] Backend dependencies already installed.
)
del temp_requirements.txt

REM Deactivate virtual environment
call venv\Scripts\deactivate.bat
echo.

REM Setup Frontend
echo ===================================================
echo                Frontend Setup
echo ===================================================
echo.

cd %PROJECT_ROOT%\frontend

REM Check if node_modules exists
if not exist node_modules (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
    echo [SUCCESS] Frontend dependencies installed.
) else (
    echo [INFO] Checking if frontend dependencies are up to date...
    call npm list --depth=0 > nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [INFO] Updating frontend dependencies...
        call npm install
        if %ERRORLEVEL% NEQ 0 (
            echo [WARNING] Some dependencies might be missing or outdated.
            echo You may need to run 'npm install' manually in the frontend directory.
        ) else (
            echo [SUCCESS] Frontend dependencies updated.
        )
    ) else (
        echo [INFO] Frontend dependencies are already installed.
    )
)
echo.

REM Return to project root
cd %PROJECT_ROOT%

echo ===================================================
echo             Setup Completed Successfully!
echo ===================================================
echo.
echo Your eBay Used Cars project is now ready to use.
echo.
echo To start the application, run 'start_servers.bat'
echo.
pause
