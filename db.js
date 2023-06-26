const fs = require('fs');

var config;

function lerConfig() {
    const arquivo = 'config.txt';

    if(!fs.existsSync(arquivo)){
        config = null;
        return;
    }

    const conteudo = fs.readFileSync(arquivo, 'utf8');

    const matchIP = conteudo.match(/IP=(.*)/);
    const matchPort = conteudo.match(/port=(.*)/);
    const matchToken = conteudo.match(/token=(.*)/);

    if (matchIP && matchToken && matchPort) {
        config = {
            ip: matchIP[1],
            port: matchPort[1],
            token: matchToken[1]
        };
    } else {
        config = null;
    }
}

lerConfig();

module.exports = {
    config
};