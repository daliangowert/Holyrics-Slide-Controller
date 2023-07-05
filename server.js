const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');

//Chama funções api.js
const router = express.Router();
const { getMediaPlaylist, changeSlide, checkPresentationActive } = require('./api');
const config = require('./db').config; // config lida do TXT

//Roteamento
//router.post('/api/GetMediaPlaylist/:ip/:token', getMediaPlaylist);
router.post('/api/slide/:type/:force_change', changeSlide);

app.use(express.static(path.join(__dirname, 'controller')));
app.use(express.static(path.join(__dirname, 'obs')));
app.use(express.json()); // necessário para enviar dados JSON no corpo da requisição
app.use('/', router);

//
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'controller/main.html'));
});

app.get('/obs', (req, res) => {
  res.sendFile(path.join(__dirname, 'obs/main.html'));
});

app.get('/config', (req, res) => {
  // Retornar a variável na resposta
  res.json(config);
});


// Apagar
//TODO: criar uma página para mostrar os slides no obs
// app.get('/img', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public/fundo.png'));
// });

app.listen(3000, () => {  
  console.log('Servidor iniciado na porta 3000');
  setInterval(() => {
    checkPresentationActive();
  }, 1000);
});
