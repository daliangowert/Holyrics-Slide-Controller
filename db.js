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
            ip: matchIP[1],         // Ip do Holyrics
            port: matchPort[1],     // Port API
            token: matchToken[1],   // Token API
        };
    } else {
        config = null;
    }
}

lerConfig();

module.exports = {
    config
};