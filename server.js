const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');

//Chama funções api.js
const router = express.Router();
const { getMediaPlaylist, changeSlide, checkPresentationActive } = require('./api');
const { printPresentation } = require('./print');
const config = require('./db').config; // config lida do TXT

//Roteamento
//router.post('/api/GetMediaPlaylist/:ip/:token', getMediaPlaylist);
router.post('/api/slide/:type/:force_change', changeSlide);
router.get('/pr1ntPresentation', printPresentation);

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

app.get('/presentation_active', (req, res) => {
  res.json(global.presentation_active)
});

// Apagar
//TODO: criar uma página para mostrar os slides no obs
// app.get('/img', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public/fundo.png'));
// });

app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');

  // Inicia o script Python para hotkey
  const pythonProcess = spawn('python', ['hotkey.py']);

  global.ID_intervalChkPresent =
    setInterval(() => {
      checkPresentationActive();
    }, 1000);
});
