# Holyrics Slide Controller

## Instalação
Para instalar, siga as etapas abaixo:

1. Execute o arquivo `setup.bat` para instalar todas as dependências do Node.

2. Abra o arquivo `config.txt` e altere os seguintes parâmetros:

```
IP: <IP-do-Holyrics>
PORT: <Porta API SERVER/Holyrics>
TOKEN: <Token API SERVER/Holyrics>
```

3. Reinicie o serviço com o seguinte comando no PowerShell executado como Administrador (sempre que fizer alterações nos arquivos):

```
Restart-Service -Name Holyrics_Controller
```

4. Abra o Holyrics e verifique se consegue controlar a apresentação através dos seguintes links:

- Para o uso do Controller: `http://<IP-do-server>:3000`
- Para o uso do OBS: `http://<IP-do-server>:3000/obs`

> **Observação:** Ao iniciar o programa pela primeira vez, execute o arquivo `teste_conexao.bat` para fazer a depuração do código. Certifique-se de desligar o serviço usando o comando `Stop-Service -Name Holyrics_Controller` antes de executar o teste de conexão.
