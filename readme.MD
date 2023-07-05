- Para instalar:
1)Execute setup.bat para instalar todas as dependências node.

2)Altere o arquivo config.txt com os seguintes parâmetros:

IP: <IP-do-Holyrics>
PORT: <Porta API SERVER/Holyrics>
TOKEN: <Token API SERVER/Holyrics>

3) No OBS, adicione o caminho de instalação do Python em Ferramentas->Scripts->Configurações do Python. (Versão 3.10 ou menor)

4) Adicione o script "holyrics_controller.py" na aba Scripts.

5) Abra o Holyrics e veja se consegue controlar pelos seguintes links:

Para o uso:

Link Controller: http://<IP-do-server>:3000
Link OBS:        http://<IP-do-server>:3000/obs

P.S: Ao iniciar o programa pela primeira vez, execute teste_conexao.bat para fazer depuração do código.