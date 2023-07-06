@echo off

REM Verificar se o OpenJS.NodeJS está instalado
winget show OpenJS.NodeJS >nul 2>&1
if %errorlevel% equ 0 (
    echo OpenJS.NodeJS ja esta instalado.
) else (
    echo OpenJS.NodeJS nao esta instalado. Instalando...
    winget install -e --id OpenJS.NodeJS
)

@REM Instalar dependencias Node
echo Instalando dependencias Node...
call npm ci

@REM Instalar node-windows
call npm install -g node-windows
call npm link node-windows

REM Verifica se o serviço existe
set SERVICE_NAME=Holyrics_Controller
sc query %SERVICE_NAME% > nul 2>&1
if %errorlevel% equ 0 (
    echo O servico %SERVICE_NAME% ja existe.
) else (
    echo O servico %SERVICE_NAME% nao existe. Executando o comando 'node createService'...
    node createService
)
echo Servico p/ Windows criado!
echo Script executado!

echo.
pause
