const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');

//Chama funções api.js
const router = express.Router();  
const { getMediaPlaylist, changeSlide, checkPresentationActive} = require('./api');

//Roteamento
router.post('/api/GetMediaPlaylist/:ip/:token', getMediaPlaylist);
router.post('/api/slide/:type/:ip/:token', changeSlide);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // necessário para enviar dados JSON no corpo da requisição
app.use('/', router);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/main.html'));
});

app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
  checkPresentationActive();
});
