const axios = require('axios');
const config = require('./db').config; // config lida do TXT

// --------- Variáveis --------- 
// Variável Global
list_media = '';
slide_atual = null;
presentation_active = false;
list_updated = false;
id_current = '0';
type_current = null;
pos_id = -1;
isPrevious = false;

if (!config) {
  console.log("#########");
  console.log("Arquivo config.txt não encontrado! Preencha-o com:\n\nIP={IP_HOLYRICS}\nport=8091\ntoken={TOKEN_HOLYRICS}\n");
  console.log("#########");
  throw new Error("Arquivo config.txt não encontrado!");
}

// criando um objeto de solicitação simulado
const req_local = {
  params: {
    ip: config.ip,
    token: config.token
  },
  body: {
    data: 'example'
  }
};

// criando um objeto de resposta simulado
const res_local = {
  data: null,
  status: null,
  send: function (response) {
    this.data = response;
  },
  status: function (statusCode) {
    this.status = statusCode;
    return this;
  }
};

// Gera a url de comunicação com o Holyrics
// Exemplo: http://192.168.100.5:8091/api/GetMediaPlaylist?token=MXdskASO1edgBsTG
function generate_url(content) {
  return `http://${config.ip}:${config.port}/api/` + content + `?token=${config.token}`;
}


// GetMediaPlaylist
function getMediaPlaylist(req, res) {
  url = generate_url('GetMediaPlaylist');

  const data = req.body;

  axios.post(url, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      list_media = response.data.data;
      list_updated = true;

      //console.log(list_media);

      // Verificar a posição do id atual
      for (i = 0; i < Object.keys(list_media).length; i++) {
        if (list_media[i].id == id_current) {
          pos_id = i;
          break;
        }
      }

      console.log("Playlist atualizada!");
      res.send(response.data);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send(error);
    });
}

async function changeSlide(req, res) {
  const type = req.params.type;
  const force_change = req.params.force_change;

  console.log("Requisição " + type);

  // ------- FORCE CHANGE ------- 
  if (force_change == 1) {
    await nextID();
    res.send({ status: "Chamando próxima presentation!", type: type_current });
    return;
  }
  else if (force_change == -1) {
    await previousID();
    res.send({ status: "Chamando presentation anterior!", type: type_current });
    return;
  }
  // -----------------------------

  if (presentation_active) {
    if (type_current != 'verse') {
      await SlideAtual();
      //console.log(list_media);
      //console.log(slide_atual)

      // Próxima apresentação
      if (slide_atual.slide_index == slide_atual.slide_total && type == 'next') {
        await nextID();
        res.send({ status: "Chamando próxima presentation!", type: type_current });
        return;
      }
      // Apresentação anterior
      else if (type == 'previous') {
        if ((type_current == 'text' && slide_atual.slide_index == 1) ||
          (type_current != 'text' && slide_atual.slide_index == 0)) {
          console.log("previous aqui");
          await previousID();
          res.send({ status: "Chamando presentation anterior!", type: type_current });
          return;
        }
      }
    }
    else {
      // TODO: Como passar para o próximo id quando terminar os versículos?
      //console.log("VERSE");
    }
  }

  if (type == 'next')
    url = generate_url('ActionNext');
  else if (type == 'previous')
    url = generate_url('ActionPrevious');

  const data = req.body;

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // TODO: Verificar a apresentação atual e ver se é VERSE
    // if()
    // response.data.type = list_media[pos_id].type;
    response.data.type = type_current;
    console.log(response.data);

    res.send(response.data);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
}

function SlideAtual() {
  url = generate_url('SlideAtual');

  const data = {
    isprevious: isPrevious
  };

  return new Promise((resolve, reject) => {
    axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        slide_atual = response.data.data;
        isPrevious = false;
        resolve();
      })
      .catch(error => {
        console.log(error);
        reject(error);
      });
  });
}

// Verificar próximo ID da list_media
function nextID() {
  //Fim da lista
  if (pos_id + 1 == Object.keys(list_media).length) {
    console.log("Chegou no final");
    pos_id = -1;
    presentation_active = false;
    id_current = null;
    type_current = null;
    CloseCurrentPresentation();
  }
  else if (pos_id == -1) // Não iniciou nenhuma apresentação
  {
    console.log("Nenhuma apresentação armazenada");
  }
  else {
    pos_id++;
    id_current = list_media[pos_id].id;
    type_current = list_media[pos_id].type;
    console.log(type_current);

    // Iniciar apresentação do próximo id
    console.log("Chamando próximo ID!");
    MediaPlaylistAction();
  }
}

// Verificar ID anterior da list_media
function previousID() {
  //Começo da lista
  console.log(pos_id);
  if (pos_id == 0) {
    console.log("Começo da lista");
  }
  else if (pos_id == -1) // Não iniciou nenhuma apresentação
  {
    console.log("Nenhuma apresentação armazenada");
  }
  else {
    pos_id--;
    id_current = list_media[pos_id].id;
    type_current = list_media[pos_id].type;
    isPrevious = true;

    // Iniciar apresentação do id anterior
    console.log("Chamando ID anterior!");
    MediaPlaylistAction();
  }
}

//MediaPlaylistAction
async function MediaPlaylistAction() {
  url = `http://${config.ip}:${config.port}/api/MediaPlaylistAction?id=${id_current}&token=${config.token}`;

  try {
    const response = await axios.post(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Se chamou uma apresentação anterior a atual
    if (isPrevious) {
      await SlideAtual();
    }

  } catch (error) {
    console.log(error);
  }
}

//GetCurrentPresentation
function checkPresentationActive() {
  url = generate_url('GetCurrentPresentation');

  axios.post(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      //console.log(response.data);
      if (response.data.data == null)
        presentation_active = false;
      else if (presentation_active == true) {
        SlideAtual();
        //console.log("Apresentação já ativa!");
        type_current = response.data.data.type;

        if (id_current != response.data.data.id && type_current != 'verse') {
          id_current = response.data.data.id;
          getMediaPlaylist(req_local, res_local);
        }

      }
      else {
        console.log("Apresentação iniciada!");
        presentation_active = true;
        id_current = response.data.data.id;
        type_current = response.data.data.type;
        SlideAtual();

        getMediaPlaylist(req_local, res_local);
      }
    })
    .catch(error => {
      console.log(error.cause);
    });
}

//CloseCurrentPresentation
function CloseCurrentPresentation() {
  url = generate_url('CloseCurrentPresentation');

  axios.post(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => {
      console.log("Close presentation atual!");
    })
    .catch(error => {
      console.log(error);
    });
}

// Exportar funções
module.exports = {
  getMediaPlaylist: getMediaPlaylist,
  changeSlide: changeSlide,
  checkPresentationActive, checkPresentationActive
};