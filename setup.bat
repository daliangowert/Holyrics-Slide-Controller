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

REM Verificar se o arquivo config.txt já existe

set "config_file=config.txt"

if not exist "%config_file%" (
    echo Criando arquivo config.txt...
    echo IP= >> "%config_file%"
    echo port= >> "%config_file%"
    echo token= >> "%config_file%"
    echo Arquivo config.txt criado com sucesso.
) else (
    echo O arquivo config.txt ja existe.
)

@REM REM Instalar dependências Node
npm ci

echo.
pause
