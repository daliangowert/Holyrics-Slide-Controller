const express = require('express');
const app = express();
const path = require('path');
const axios = require('axios');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // necessário para enviar dados JSON no corpo da requisição

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/main.html'));
});

app.post('/api/slide/:type/:ip/:token', (req, res) => {
  const ip = req.params.ip;
  const token = req.params.token;
  const type = req.params.type;

  if(type == 'next')
    url = `http://${ip}:8091/api/ActionNext?token=${token}`;
  else if(type == 'previous')
    url = `http://${ip}:8091/api/ActionPrevious?token=${token}`;

  const data = req.body;

  axios.post(url, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log(response.data);
    res.send(response.data);
  })
  .catch(error => {
    console.log(error);
    res.status(500).send(error);
  });
});


app.listen(3000, () => {
  console.log('Servidor iniciado na porta 3000');
});
