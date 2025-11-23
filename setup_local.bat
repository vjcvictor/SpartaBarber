@echo off
echo ==========================================
echo   Configuracion Local de Barberia Sparta
echo ==========================================
echo.

REM Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado. Por favor instala Node.js (v20+) y vuelve a intentar.
    pause
    exit /b 1
)

echo [1/4] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al instalar dependencias.
    pause
    exit /b 1
)

echo.
echo [2/4] Generando cliente de Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al generar cliente de Prisma.
    pause
    exit /b 1
)

echo.
echo [3/4] Configurando base de datos (SQLite)...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo [ERROR] Fallo al ejecutar migraciones.
    pause
    exit /b 1
)

echo.
echo [3.5/4] Cargando datos de prueba (Seed)...
call npx tsx prisma/seed.ts
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] Fallo al cargar datos de prueba. Puede que ya existan o haya un error en el script.
    echo Continuando...
)

echo.
echo [4/4] Iniciando aplicacion...
echo La aplicacion estara disponible en http://localhost:5000
echo Presiona Ctrl+C para detener el servidor.
echo.
call npm run dev

pause
