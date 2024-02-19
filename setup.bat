@echo off
setlocal

REM Solicitar ao usuário o token
set /p TOKEN=Por favor, insira o token API do Holyrics: 

REM Solicitar ao usuário o caminho da pasta local
set /p PASTA_LOCAL=Por favor, insira o caminho onde as apresentacoes serao salvas: 

REM Construir a imagem Docker com o token fornecido
docker build --build-arg TOKEN=%TOKEN% -t holyrics-controller .

REM Executar o contêiner Docker com o caminho da pasta local fornecido
docker run -d -p 3000:3000 -v "%PASTA_LOCAL%:/usr/app/data" --restart=always holyrics-controller

@echo "Instalacao realizada com sucesso!"

endlocal