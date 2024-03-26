# Holyrics Slide Controller

## Instalação - via Docker
Para instalar, siga as etapas abaixo:

1. Instalar o Docker Desktop.

2. Execute o arquivo `setup.bat` para instalar o container Docker

3. Copie e cole o arquivo `.wslconfig` em `%userprofile%` path.

4. Reinicie o WSL com `wsl --shutdown`

5. No Docker, defina `Start Docker Desktop when you sign in to your computer`

6. Também no Docker, selecione o container que está executando o Holyrics-slide-controller. Acesse a guia files e na localização:
`usr/app/obs/fundos` adicione os fundos para as lower Thirds.

7. Abra o Holyrics e verifique se consegue controlar a apresentação através dos seguintes links:

- Para o uso do Controller: `http://<IP-do-server>:3000`
- Para o uso do OBS: `http://<IP-do-server>:3000/obs`

> **Observação:** Ao iniciar o programa pela primeira vez, faça a depuração do código pelo Log do contâiner.

## Instalação - via Serviço Windows
Para instalar, siga as etapas abaixo:

1. Verifique se o NodeJS está instalado no computador. Link Download: https://nodejs.org/en/download/current

2. Acesse a pasta desse código via PowerShell.

3. Execute `npm ci` para instalar as dependências deste projeto.

4. Execute `npm install -g node-windows` e `npm link node-windows`;

5. Instale o serviço com o comando: `node createService`

6. Abra o Holyrics e verifique se consegue controlar a apresentação através dos seguintes links:

- Para o uso do Controller: `http://<IP-do-server>:3000`
- Para o uso do OBS: `http://<IP-do-server>:3000/obs`

7. Selecione os fundos desejados para biblia, texto e letra de música e coloque no caminho `/obs/fundos`