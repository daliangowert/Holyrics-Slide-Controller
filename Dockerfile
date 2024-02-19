## Comando obrigatório
## Baixa a imagem do node com versão alpine (versão mais simplificada e leve)
FROM node:latest

## Define o local onde o app vai ficar no disco do container
WORKDIR /usr/app

# Define variáveis de ambiente para solicitar informações ao usuário
ARG IP=host.docker.internal
ARG PORT=8091
ARG TOKEN
ARG FOLDER_PRESENTATION=/usr/app/data/

# Cria o arquivo config.txt com as informações fornecidas pelo usuário
RUN echo "IP=${IP}" >> /usr/app/config.txt \
    && echo "port=${PORT}" >> /usr/app/config.txt \
    && echo "token=${TOKEN}" >> /usr/app/config.txt \
    && echo "folder_presentation=${FOLDER_PRESENTATION}" >> /usr/app/config.txt

## Copia tudo que começa com package e termina com .json para dentro da pasta /usr/app
COPY package*.json ./

## Executa npm install para adicionar as dependências e criar a pasta node_modules
RUN npm install

## Copia tudo que está no diretório onde o arquivo Dockerfile está 
## para dentro da pasta /usr/app do container
## Vamos ignorar a node_modules por isso criaremos um .dockerignore
COPY . .

## Container ficará ouvindo os acessos na porta 3000
EXPOSE 3000

## Não se repete no Dockerfile
## Executa o comando npm start para iniciar o script que que está no package.json
CMD npm start
