const http = require('http');
const config = require('./db').config; // config lida do TXT

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

  module.exports = {
    requisitionHolyricsHTML: requisitionHolyricsHTML
  }