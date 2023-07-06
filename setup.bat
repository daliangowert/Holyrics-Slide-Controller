@echo off

REM Verificar se o OpenJS.NodeJS está instalado
winget show OpenJS.NodeJS >nul 2>&1
if %errorlevel% equ 0 (
    echo OpenJS.NodeJS ja esta instalado.
) else (
    echo OpenJS.NodeJS nao esta instalado. Instalando...
    winget install -e --id OpenJS.NodeJS
)

REM Verificar se o Python 3.10 está instalado
python -c "import sys; sys.exit(sys.version_info < (3, 10))"
if %errorlevel% equ 0 (
    echo Python 3.10 esta instalado.
) else (
    echo Python 3.10 nao esta instalado. Instalando...
    winget install -e --id Python.Python.3.10
)

@REM Instalar dependências Node
npm ci

@REM Instalar node-windows
npm install -g node-windows
npm link node-windows

REM Verifica se o serviço existe
set SERVICE_NAME=Holyrics_Controller
sc query %SERVICE_NAME% > nul 2>&1
if %errorlevel% equ 0 (
    echo O serviço %SERVICE_NAME% ja existe.
) else (
    echo O serviço %SERVICE_NAME% nao existe. Executando o comando 'node createService'...
    node createService
)
echo Serviço p/ Windows criado!

echo.
pause
