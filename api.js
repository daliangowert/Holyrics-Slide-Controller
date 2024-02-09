const axios = require('axios');
const config = require('./db').config; // config lida do TXT
const { requisitionHolyricsHTML } = require('./reqHTML');
const striptags = require('striptags');
const { response } = require('express');

// --------- Variáveis --------- 
// Variáveis Global
global.list_media = '';
global.slide_atual = null;
global.presentation_active = false;
global.list_updated = false;
global.id_current = '0';
global.type_current = null;
global.pos_id = -1;
global.isPrevious = false;
global.ID_intervalChkPresent;
global.flag_verse_unico = false;
global.tipos_permitidos = ['song', 'text', 'image', 'announcement', 'verse', 'video'];

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
async function getMediaPlaylist() {
  return new Promise((resolve, reject) => {
    const url = generate_url('GetMediaPlaylist');

    axios.post(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        list_media = response.data.data;
        list_updated = true;

        //console.log(list_media);

        // Verificar a posição do id atual
        // for (let i = 0; i < Object.keys(list_media).length; i++) {
        //   if (list_media[i].id == id_current) {
        //     pos_id = i;
        //     break;
        //   }
        // }

        pos_id = list_media.findIndex(item => item.id === id_current);

        flag_verse_unico = false;
        console.log("Playlist atualizada!");
        resolve(response.data);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      });
  });
}


async function changeSlide(req, res) {
  const type = req.params.type;
  const force_change = req.params.force_change;

  console.log("Requisição " + type + " | Force Change: " + force_change);

  // // ------- FORCE CHANGE ------- 
  // if (force_change == 1) {
  //   await nextID();
  //   res.send({ status: "Chamando próxima presentation!", type: type_current });
  //   return;
  // }
  // else if (force_change == -1) {
  //   await previousID();
  //   res.send({ status: "Chamando presentation anterior!", type: type_current });
  //   return;
  // }
  // // -----------------------------

  if (presentation_active) {
    await SlideAtual();
    //console.log(slide_atual);

    if (slide_atual) { // TODO: VERSE retorna slide_atual Nulo
      switch (type_current) {
        case 'song':
        case 'text':
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
          break;
        case 'announcement':
        case 'image':
          if (slide_atual.slide_number == slide_atual.total_slides) {
            if (slide_atual.total_slides > 1) { // p/ tratar Anúncio (TODOS) ou Anúncio (LISTA)
              await closeCurrentPresentation();
              res.send({ status: "Encerrando presentation!", type: type_current });
              return;
            }
            if (type == 'next') {
              await nextID();
              res.send({ status: "Chamando próxima presentation!", type: type_current });
              return;
            } else if (type == 'previous') {
              console.log("previous aqui");
              await previousID();
              res.send({ status: "Chamando presentation anterior!", type: type_current });
              return;
            }
          }
          break;
        // case 'video':
        // case 'audio':

        //   break;
        case 'verse':
          await waitForVerseChange(res, type);
          return;
          break;
        case 'file':
          if (list_media[pos_id].name.endsWith('.pptx')) {
            if (slide_atual.slide_number == slide_atual.slide_total && type == 'next') {
              await nextID();
              res.send({ status: "Chamando próxima presentation!", type: type_current });
              return;
            }
            if (slide_atual.slide_number == 1 && type == 'previous') {
              console.log("previous aqui");
              await previousID();
              res.send({ status: "Chamando presentation anterior!", type: type_current });
              return;
            }
          }
          break;
        default:
          break;
      }
    }
  }

  res.send(await ActionNextorPrevious(type));
}

// Apagar res depois, usado em control_slide.js
async function ActionNextorPrevious(type) {
  if (type == 'next')
    url = generate_url('ActionNext');
  else if (type == 'previous')
    url = generate_url('ActionPrevious');

  try {
    const response = await axios.post(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    response.data.type = type_current;
    console.log(response.data);

    return response.data;
  } catch (error) {
    console.log(error);
    return error;
  }
}

async function waitForVerseChange(res, type) {
  dateHTML = await requisitionHolyricsHTML(true, 1); // Requisição para HTML do versiculo atual
  verse = striptags(dateHTML.map.text);

  resp = await ActionNextorPrevious(type);

  tentativas = 0;
  async function checkVerseChange() {
    dateHTML_new = await requisitionHolyricsHTML(true, 1);
    verse_new = striptags(dateHTML_new.map.text);

    console.log(verse_new)

    if (verse !== verse_new) {
      console.log("Verse diferente");
      res.send(resp);
    } else if (tentativas > 6) {
      console.log("Mais de 6 tentativas, mudando para a apresentação anterior/seguinte!");

      if (type === 'next') {
        await nextID();
        res.send({ status: "Chamando próxima presentation!", type: type_current });
      } else if (type === 'previous') {
        console.log("previous aqui");
        await previousID();
        res.send({ status: "Chamando presentation anterior!", type: type_current });
      }

      return;
    } else {
      tentativas++;
      setTimeout(checkVerseChange, 150);
    }
  }

  checkVerseChange();
}


async function SlideAtual() {
  url = generate_url('SlideAtual');

  const data = {
    isprevious: isPrevious,
    type: type_current
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
async function nextID() {
  //Fim da lista
  if (pos_id + 1 == Object.keys(list_media).length) {
    console.log("Chegou no final");
    pos_id = -1;
    presentation_active = false;
    id_current = null;
    type_current = null;
    await closeCurrentPresentation();
  }
  else if (pos_id == -1) // Não iniciou nenhuma apresentação
  {
    console.log("Nenhuma apresentação armazenada");
  }
  else {
    pos_id_ant = pos_id;
    do {
      pos_id++;
      id_current = list_media[pos_id].id;
      type_current = list_media[pos_id].type;

      console.log(type_current);
      // Verifica se é um PowerPoint
      if (type_current == 'file' && list_media[pos_id].name.endsWith('.pptx'))
        break;
    }
    while (!tipos_permitidos.includes(type_current) && (pos_id + 1) < Object.keys(list_media).length);

    // Caso percorra toda a lista e não ache o próximo ID
    if (!tipos_permitidos.includes(type_current) &&
      !list_media[pos_id].name.endsWith('.pptx') &&
      (pos_id + 1) >= Object.keys(list_media).length) {
      console.log("Chegou ao FINAL da lista e não encontrou outra presentation!");
      pos_id = -1;
      presentation_active = false;
      id_current = null;
      type_current = null;
      await closeCurrentPresentation();
      return;
    }

    // Para fechar apresentação atual
    if (type_current == 'video')
      await closeCurrentPresentation();

    // Iniciar apresentação do próximo id
    console.log("Chamando próximo ID!");
    console.log(id_current)
    await MediaPlaylistAction(id_current);
  }
}

// Verificar ID anterior da list_media
async function previousID() {
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
    do {
      pos_id--;
      id_current = list_media[pos_id].id;
      type_current = list_media[pos_id].type;

      console.log(type_current);
      // Verifica se é um PowerPoint
      if (type_current == 'file' && list_media[pos_id].name.endsWith('.pptx'))
        break;
    } while (!tipos_permitidos.includes(type_current) && pos_id > 0);

    // Caso chegue ao começo da lista e não encontre outra presentation
    if (!tipos_permitidos.includes(type_current) &&
      !list_media[pos_id].name.endsWith('.pptx') &&
      pos_id == 0) {
      console.log("Chegou ao COMEÇO da lista e não encontrou outra presentation!");
      return;
    }

    isPrevious = true;

    // Para fechar apresentação atual
    if (type_current == 'video')
      await closeCurrentPresentation();

    // Iniciar apresentação do id anterior
    console.log("Chamando ID anterior!");
    await MediaPlaylistAction(id_current);
  }
}

//MediaPlaylistAction
async function MediaPlaylistAction(id) {
  url = `http://${config.ip}:${config.port}/api/MediaPlaylistAction?id=${id}&token=${config.token}`;

  console.log("Media Playlist Action - Chamando ID: " + id);
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
async function checkPresentationActive() {
  try {
    const url = generate_url('GetCurrentPresentation');
    const response = await axios.post(url, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.data === null) {
      presentation_active = false;
    } else if (presentation_active) {
      await SlideAtual();
      type_current = response.data.data.type;

      // Verifica se apresentação atual é do tipo VERSE
      if (type_current == 'verse') {
        dateHTML = await requisitionHolyricsHTML();
        header = striptags(dateHTML.map.header);
        headerPrefix = header.substring(0, header.indexOf('.')); // Extrai o prefixo do cabeçalho

        // Encontre o índice do item em list_media cujas referências do name correspondem ao prefixo do cabeçalho
        pos_id = list_media.findIndex(item => {
          const references = item.name.split(', '); // Divide as referências em uma lista
          for (const reference of references) {
            const itemPrefix = reference.substring(0, reference.indexOf('.')); // Extrai o prefixo de cada referência
            if (itemPrefix === headerPrefix) {
              return true; // Se encontrarmos uma correspondência, retorna verdadeiro
            }
          }
          return false; // Se não encontrarmos correspondências, retorna falso
        });

        if (pos_id == -1) {
          console.log("POS_ID não encontrado!")
          nextID();
        }
        else {
          // NÃO é uma lista de versículo
          if ((list_media[pos_id].name.indexOf('-') == -1 || header.split('-').length - 1 >= 2 || flag_verse_unico) && list_media[pos_id].name.indexOf(', ') == -1) {
            flag_verse_unico = true;
            if (header.substring(0, header.indexOf(' - ')) == list_media[pos_id].name)
              id_current = list_media[pos_id].id;
            else {
              console.log("Verse passou do especificado. Chamando prox ID da lista...");
              flag_verse_unico = false;
              nextID();
            }
          }
          else {
            id_current = list_media[pos_id].id;
          }
        }
      } else if (type_current == 'announcement' && response.data.data.total_slides > 1) {
        // Bug: não consigo tratar o tipo Anúncio(lista) ou Anúncio(todos)
        id_current = null;
        type_current = 'announcement';
      }
      else {
        // Caso não entre nas outras condições faz esse tratamento
        if (id_current !== response.data.data.id) {
          id_current = response.data.data.id;
          await getMediaPlaylist(req_local, res_local);
        }
      }
    } else {
      console.log("Apresentação iniciada!");
      presentation_active = true;
      type_current = response.data.data.type;

      if (type_current == 'verse') {
        await getMediaPlaylist(req_local, res_local);
        dateHTML = await requisitionHolyricsHTML();
        header = striptags(dateHTML.map.header);
        pos_id = list_media.findIndex(item => item.name.substring(0, item.name.indexOf('.')) === header.substring(0, header.indexOf('.')));
        console.log("POS_ID encontrado p/ VERSE: " + pos_id)
        id_current = list_media[pos_id].id;
      }
      else if (type_current == 'announcement' && response.data.data.total_slides > 1) {
        // Bug: não consigo tratar o tipo Anúncio(lista) ou Anúncio(todos)
        console.log("Anúncio (TODOS) ou Anúncio (LISTA), não há tratamento disponível!");
        id_current = null;
        type_current = 'announcement';
      }
      else
        id_current = response.data.data.id;

      await SlideAtual();
      getMediaPlaylist(req_local, res_local);
    }
  } catch (error) {
    console.log(error.message);
  }
}

//GetCurrentPresentation
async function getCurrentPresentation() {
  try {
    const url = generate_url('GetCurrentPresentation');
    // const data = {
    //   include_slides: false,
    //   include_slide_preview: true,
    //   slide_preview_size: '320x180'
    // };

    const response = await axios.post(url, /*data,*/ {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    //console.log(response.data);

    return response.data;
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

//GetCurrentPresentation
async function getCurrentPresentation(data) {
  try {
    const url = generate_url('GetCurrentPresentation');

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    //console.log(response.data);

    return response.data;
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

//CloseCurrentPresentation
async function closeCurrentPresentation() {
  try {
    const url = generate_url('CloseCurrentPresentation');

    await axios.post(url, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    presentation_active = false;
    console.log("Apresentação atual fechada!");
  } catch (error) {
    console.error(error);
  }
}

//GetMediaPlayerInfo
async function GetMediaPlayerInfo() {
  return new Promise((resolve, reject) => {
    const url = generate_url('GetMediaPlayerInfo');

    axios.post(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log(response.data)

        resolve(response.data);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      });
  });
}

//getPlaylistInfo
async function getPlaylistInfo() {
  return new Promise((resolve, reject) => {
    const url = generate_url('getPlaylistInfo');

    axios.post(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log(response.data)

        resolve(response.data);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      });
  });
}

//GetCurrentSchedule
async function getCurrentSchedule(){
  try {
    const url = generate_url('GetCurrentSchedule');

    const response = await axios.post(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

async function getGlobal(variavel)
{
  try {
    const url = generate_url('GetGlobal');
    const data = {
      variavel: variavel
    };

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    //console.log(response.data);

    return response.data;
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

//actionGoToIndex
async function actionGoToIndex(index){
  try {
    const url = generate_url('ActionGoToIndex');
    const data = {
      index: index
    };

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

// Exportar funções
module.exports = {
  getMediaPlaylist: getMediaPlaylist,
  changeSlide: changeSlide,
  checkPresentationActive: checkPresentationActive,
  getCurrentPresentation: getCurrentPresentation,
  MediaPlaylistAction: MediaPlaylistAction,
  closeCurrentPresentation: closeCurrentPresentation,
  getPlaylistInfo: getPlaylistInfo,
  SlideAtual: SlideAtual,
  ActionNextorPrevious: ActionNextorPrevious,
  waitForVerseChange: waitForVerseChange,
  getCurrentSchedule: getCurrentSchedule,
  getGlobal: getGlobal,
  actionGoToIndex: actionGoToIndex,
  req_local: req_local,
  res_local: res_local
};