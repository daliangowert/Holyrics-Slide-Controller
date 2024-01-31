const { Console } = require('console');
const http = require('http');
const config = require('./db').config; // config lida do TXT
const crypto = require('crypto');

async function requisitionHolyricsHTML(isFront = true, html_type = 2) {
    const pathHTML = isFront ? `/stage-view/text.json?html_type=${html_type}` : `/stage-view/text-aux-control.json?html_type=${html_type}`;
  
    const options = {
      hostname: config.ip,
      port: 7575,
      path: pathHTML,
      method: 'GET'
    };
  
    try {
      const responseData = await new Promise((resolve, reject) => {
        const req = http.get(options, res => {
          let data = '';
  
          res.on('data', chunk => {
            data += chunk;
          });
  
          res.on('end', () => {
            resolve(data);
          });
        });
  
        req.on('error', reject);
        req.end();
      });
  
      const jsonData = JSON.parse(responseData);
      return jsonData; // Retorna os dados JSON da resposta
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function requisitionWidescreen(isFront = true, html_type = 2) {  
    const options = {
      hostname: config.ip,
      port: 7575,
      path: '/stage-view/widescreen.jpg',
      method: 'GET'
    };
  
    try {
      const responseData = await new Promise((resolve, reject) => {
        const req = http.get(options, res => {
          let data = '';

          res.setEncoding('base64');
  
          res.on('data', chunk => {
            data += chunk;
          });
  
          res.on('end', () => {
            resolve(data);
          });
        });
  
        req.on('error', reject);
        req.end();
      });

      // calcula um hash do base64 da imagem
      const hash = calcularHash(responseData);

      const jsonData = {
        hash: hash,
        base64: responseData
      };

      return jsonData; // Retorna os dados JSON da resposta
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  function calcularHash(base64Data) {
    const hash = crypto.createHash('sha256');
    hash.update(base64Data, 'base64');
    return hash.digest('hex');
  }

  module.exports = {
    requisitionHolyricsHTML: requisitionHolyricsHTML,
    requisitionWidescreen: requisitionWidescreen
  }