const { Console } = require('console');
const api = require('./api');
const config = require('./db').config; // config lida do TXT
const bible = require('./bibles/bible');
const { requisitionHolyricsHTML, requisitionWidescreen } = require('./reqHTML');
const { type } = require('os');
const striptags = require('striptags');
const pdf = require('./pdf');
const { rgb } = require('pdf-lib');
const { setTimeout } = require('timers');
const { title } = require('process');

// --------- Variáveis --------- 
pdfDoc = null;
page = null;
marginPage = 40;
borderThickness = 0.5; // Espessura da borda em pontos 
borderColor = rgb(0, 0, 0); // Cor da borda
scaleW = 0.18; // scaleWidht 0.14
scaleH = 0.18; // scaleHeight
dataHTML = null;
flagPosId = -1;
//backup_id = null;

hashNull = 'd84d4707f30e4df0ec60fd3bf9c98283506b8cb8ae496a60ad05c18573329a55';
hashTemp = '';

// Enum para tipos de texto
const TextType = {
  TITLEPRIN: 0,
  TITLE: 1,
  REGULAR: 2,
  REGULAR_BOLD: 3
};

const dataCurrentPresentation = {
  include_slides: true,
  include_slide_comment: true
};

const dataCurrentPresentationWithSlides = {
  include_slides: true,
  include_slide_comment: true,
  include_slide_preview: true,
  slide_preview_size: '320x180'
};

const req_next_slide = {
  params: {
    ip: config.ip,
    token: config.token,
    type: 'next',
    force_change: 0
  },
  body: {
    data: 'example'
  }
};

const req_previous_slide = {
  params: {
    ip: config.ip,
    token: config.token,
    type: 'previous',
    force_change: 0
  },
  body: {
    data: 'example'
  }
};

// ??
const simulatedResponse = {
  send: function (data) {
    //console.log("Simulated Response:", data);
  },
  status: function (statusCode) {
    return {
      send: function (data) {
        console.log("Simulated Response (Status " + statusCode + "):", data);
      }
    };
  }
};

// APAGAR
//printPresentation(global.req, global.res);

async function printPresentation(req, res) {
  dataHTML = null;
  countSlide = 1;
  pos_id_atual = -1;

  titlePrinc = await formatTitulo();
  await pdf.initDocumentPDF(marginPage, borderThickness, borderColor, titlePrinc);

  //Verifica se o arquivo PDF de destino está aberto
  ret = await pdf.verifyPDFisOpen();

  if (ret.status == 'error') {
    res.send(ret);
    return;
  }

  await pdf.organizeTextPDF(titlePrinc, pdf.textParams[TextType.TITLEPRIN]);

  await api.closeCurrentPresentation();

  await waitWidescreenNull();
  hashTemp = hashNull;

  // dataHTML = await requisitionHolyricsHTML();
  // await waitDataHTMLNull();

  console.log("PRINT SLIDES");

  // Atualiza list_media
  await api.getMediaPlaylist(api.req_local, api.res_local);

  // // Redefine intervalo função checkPresentationActive
  // clearInterval(global.ID_intervalChkPresent);

  // global.ID_intervalChkPresent =
  //   setInterval(() => {
  //     api.checkPresentationActive();
  //   }, 150);

  flagPosId = 0;
  while (flagPosId < Object.keys(global.list_media).length) {
    id_atual = global.list_media[flagPosId].id;
    name_atual = global.list_media[flagPosId].name;
    type_atual = global.list_media[flagPosId].type;

    if (flagPosId != -1)
      console.log("==> " + id_atual + " | " + name_atual + " | " + type_atual);

    switch (type_atual) {
      case "song":
        var presentation = await actionItem(id_atual, name_atual);

        slides = presentation.data.slides;

        total_slides = presentation.data.total_slides - 1;

        for (i = 1; i < total_slides; i++) {
          var text = await verifyVariables(slides[i].text, i, true);
          await pdf.organizeTextPDF(i + ". " + text, pdf.textParams[TextType.REGULAR]);
        }
        break;
      case "text":
        var presentation = await actionItem(id_atual, name_atual);

        slides = presentation.data.slides;

        total_slides = presentation.data.total_slides - 1;

        for (let i = 0; i < total_slides; i++) {

          var text = await verifyVariables(slides[i].text, i);

          // Remover títulos que estão embutidos nos slides
          // Ex: LT I - Gloria Patri e o Slide já inclui Gloria Patri
          var title_split = name_atual.split(' - ');
          var firstLine = text.split('\n')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

          for (let title of title_split) {
            var normalizedTitle = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (firstLine === normalizedTitle) {
              text = text.substring(text.indexOf('\n') + 1);
              break; // Uma vez que encontramos uma correspondência, podemos sair do loop
            }
          }

          await pdf.organizeTextPDF(text, pdf.textParams[TextType.REGULAR]);
        }
        break;
      case "image":
      case "announcement":
        //case "file":
        if (global.list_media[flagPosId].type === 'file') {
          const isPPTXFile = global.list_media[flagPosId].name.toLowerCase().endsWith('.pptx');

          if (!isPPTXFile) {
            console.log("Arquivo não é do tipo .pptx!");
            await api.closeCurrentPresentation();
            break;
          }
        }

        var presentation = await actionItem(id_atual, name_atual);

        slides = presentation.data.slides;

        total_slides = presentation.data.total_slides;

        await waitWidescreenNotNull();

        for (let i = 0; i < total_slides; i++) {
          dataWidescreen = await requisitionWidescreen();
          await pdf.drawPhoto(dataWidescreen.base64.split("'")[0], scaleW, scaleH);

          hashTemp = dataWidescreen.hash;
          await api.ActionNextorPrevious('next');
          await waitWidescreenDistinct();
        }

        await waitWidescreenNull();
        hashTemp = hashNull;
        break;
      case "verse":
        const verse_id = global.list_media[flagPosId].verse_id.split(',');
        const verses = await bible.searchVerse(verse_id, 'ntlh');
        const references = await bible.searchReference(verse_id);

        await pdf.organizeTextPDF(name_atual, pdf.textParams[TextType.TITLE]);

        for (let i = 0; i < verse_id.length; i++)
          await pdf.organizeTextPDF(references[i] + ' — ' + verses[i], pdf.textParams[TextType.REGULAR]);

        break;
      default:
        break;
    }

    await api.closeCurrentPresentation();
    //await waitDataHTMLNull();

    flagPosId++;
  }

  // // Volta intervalo original função checkPresentationActive
  // clearInterval(global.ID_intervalChkPresent);

  // global.ID_intervalChkPresent =
  //   setInterval(() => {
  //     api.checkPresentationActive();
  //   }, 1000);

  // Salvando arquivo PDF resultante
  await pdf.saveDocumentPDF();

  res.send({ status: "ok" });
}

async function formatTitulo() {
  playlistInfo = JSON.parse((await api.getPlaylistInfo()).data);

  dataHoraSplit = playlistInfo.datetime.split(' '); // Divide a string em data e hora
  dataSplit = dataHoraSplit[0].split('-'); // Divide a parte da data em ano, mês e dia
  ano = dataSplit[0];
  mes = dataSplit[1];
  dia = dataSplit[2];
  hora = dataHoraSplit[1]; // Mantém a parte da hora

  dataFormatada = dia + '-' + mes + '-' + ano;

  const title = "Lista de reprodução - " + playlistInfo.name + " - " + dataFormatada;

  return title;
}

// Exemplo: await getPresentation(id_atual, dataCurrentPresentation)
async function getPresentation(id, data) {
  await sleep(1300);

  presentation_tmp = await api.getCurrentPresentation(data);

  var tmp = 0;
  while (presentation_tmp.data === null) {
    presentation_tmp = await api.getCurrentPresentation(data);
    console.log("#### Aguardando Presentation: ");

    tmp++;
    if (tmp == 5) {
      await api.MediaPlaylistAction(id);
      await sleep(500);
      tmp = 0;
    }

    await sleep(100);
  }

  return presentation_tmp;
}

async function actionItem(id, name, data = dataCurrentPresentation) {
  await api.MediaPlaylistAction(id);

  var presentation = await getPresentation(id, data);

  await pdf.organizeTextPDF(name, pdf.textParams[TextType.TITLE]);

  return presentation;
}

async function verifyVariables(text, slide_index, isSong = false) {
  let textTemp = '';
  if (isSong) // SONG
    textTemp = text.replace(/(\n\s*|\n\s*\n)/g, function (match) {
      return match === '\n \n' ? '\n' : ' // ';
    });
  else
    textTemp = text.replace(/(\n\s*|\n\s*\n)/g, function (match) {
      return match === '\n \n' ? '\n' : ' ';
    });

  const matches = textTemp.match(/@js{([^}]*)}/g);

  if (matches) {
    await api.actionGoToIndex(slide_index);
    await sleep(500);
    const variables = matches.map(match => match.replace(/@js{|}/g, ''));
    const replacements = await Promise.all(variables.map(variable => api.getGlobal(variable)));

    for (let j = 0; j < matches.length; j++) {
      const match = matches[j];
      const variable = variables[j];
      const replacement = replacements[j];

      if (replacement.data !== undefined && replacement.data !== null) {
        textTemp = textTemp.replace(match, replacement.data);
      }
    }
  }

  return textTemp;
}

function waitWidescreenNotNull() {
  return new Promise((resolve, reject) => {
    async function checkAndClearInterval() {
      try {
        dataWidescreen = await requisitionWidescreen();
        if (dataWidescreen.hash !== hashNull) {
          clearInterval(global.intervalWidescreen);
          resolve(); // Resolvendo a Promise quando o widescreen não é nulo
        } else {
          setTimeout(checkAndClearInterval, 50);
        }
      } catch (error) {
        clearInterval(global.intervalWidescreen);
        reject(error); // Rejeitando a Promise em caso de erro
      }
    }

    global.intervalWidescreen = setTimeout(checkAndClearInterval, 50);
  });
}

function waitWidescreenDistinct() {
  return new Promise((resolve, reject) => {
    let tentativas = 0;

    async function checkAndClearInterval() {
      try {
        dataWidescreen = await requisitionWidescreen();
        if (dataWidescreen.hash !== hashTemp) {
          clearInterval(global.intervalWidescreenDistinct);
          resolve(); // Resolvendo a Promise quando o widescreen não é nulo
        } else {
          // Incrementando o número de tentativas
          tentativas++;

          if (tentativas >= 20) {
            clearInterval(global.intervalWidescreenDistinct);
            resolve(); // Resolvendo a Promise após 20 tentativas
          } else {
            // Aguardando 50 milissegundos antes da próxima tentativa
            setTimeout(checkAndClearInterval, 50);
          }
        }
      } catch (error) {
        clearInterval(global.intervalWidescreenDistinct);
        reject(error); // Rejeitando a Promise em caso de erro
      }
    }

    global.intervalWidescreenDistinct = setTimeout(checkAndClearInterval, 50);
  });
}

function waitWidescreenNull() {
  return new Promise((resolve, reject) => {
    async function checkAndClearInterval() {
      try {
        dataWidescreen = await requisitionWidescreen();
        if (dataWidescreen.hash === hashNull) {
          clearInterval(global.intervalNotWidescreen);
          resolve(); // Resolvendo a Promise quando o widescreen está OK
        } else {
          setTimeout(checkAndClearInterval, 50);
        }
      } catch (error) {
        clearInterval(global.intervalNotWidescreen);
        reject(error); // Rejeitando a Promise em caso de erro
      }
    }

    global.intervalNotWidescreen = setTimeout(checkAndClearInterval, 50);
  });
}

async function waitPresentationActive(id_atual) {
  tentativas = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      dataHTML_new = await requisitionHolyricsHTML();
      console.log(global.presentation_active + " | Global ID: " + global.pos_id + " | Flag ID: " + flagPosId + " | dataHTML.text: " + dataHTML.map.text + " | dataHTML_new.text:" + dataHTML_new.map.text)
      if (global.presentation_active === true && global.pos_id === flagPosId && dataHTML_new !== dataHTML) {
        dataHTML_new = await requisitionHolyricsHTML(false);
        if (striptags(dataHTML_new.map.items[0]) !== striptags(dataHTML.map.text)) {
          console.log("pos ID: " + global.pos_id)
          clearInterval(interval);
          resolve();
        }
      }
      else if (tentativas > 2) {
        console.log("\n ##### ERROR: Fazendo nova chamada da apresentação\n");
        await api.MediaPlaylistAction(id_atual);
      }
      tentativas++;
    }, 250);
  });
}

async function waitPresentationActiveImg(id_atual) {
  tentativas = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      dataHTML_new = await requisitionHolyricsHTML();
      console.log(global.presentation_active + " | Global ID: " + global.pos_id + " | Flag ID: " + flagPosId + " | dataHTML.text: " + dataHTML.map.img_id + " | dataHTML_new.text:" + dataHTML_new.map.img_id)
      if (global.presentation_active === true && global.pos_id === flagPosId && dataHTML_new.map.img_id) {
        console.log("pos ID: " + global.pos_id + " | img_id: " + dataHTML_new.map.img_id);
        clearInterval(interval);
        resolve();
      }
      else if (tentativas > 2) {
        console.log("\n ##### ERROR: Fazendo nova chamada da apresentação\n");
        await api.MediaPlaylistAction(id_atual);
      }
      tentativas++;
    }, 250);
  });
}

async function waitPresentationActiveAnunc(id_atual, imgID) {
  tentativas = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      dataHTML_new = await requisitionHolyricsHTML();
      console.log(global.presentation_active + " | dataHTML_new.id:" + dataHTML_new.map.img_id)
      if (global.presentation_active === true && dataHTML_new.map.img_id && dataHTML_new.map.img_id !== imgID) {
        console.log("img_id: " + dataHTML_new.map.img_id);
        clearInterval(interval);
        resolve();
      }
      else if (tentativas > 4) {
        console.log("\n ##### ERROR: Fazendo nova chamada da apresentação\n");
        await api.MediaPlaylistAction(id_atual);
      }
      tentativas++;
    }, 250);
  });
}

async function waitPresentationActiveVerse(id_atual) {
  tentativas = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      dataHTML_new = await requisitionHolyricsHTML();
      console.log(global.presentation_active + " | Global ID: " + global.pos_id + " | Flag ID: " + flagPosId + " | dataHTML.text: " + dataHTML.map.text + " | dataHTML_new.text:" + dataHTML_new.map.text)
      if (global.presentation_active === true && global.pos_id === flagPosId && dataHTML_new !== dataHTML) {
        console.log("pos ID: " + global.pos_id)
        clearInterval(interval);
        resolve();
      }
      else if (tentativas > 4) {
        console.log("\n ##### ERROR: Fazendo nova chamada da apresentação\n");
        await api.MediaPlaylistAction(id_atual);
      }
      tentativas++;
    }, 250);
  });
}

async function waitDataHTMLNull() {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      // console.log("Wait DataHTML TEXT: " + dataHTML.map.text)
      dataHTML = await requisitionHolyricsHTML();
      if (dataHTML.map.text == '') {
        clearInterval(interval);
        resolve();
      }
    }, 150);
  });
}

async function waitSlideAtual(index, dataHTML) {
  tentativas = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      dataHTML_new = await requisitionHolyricsHTML();
      //console.log("NEW HTML: " + striptags(dataHTML_new.map.text) + "\n HTML: " + striptags(dataHTML.map.text));
      if (global.slide_atual && global.slide_atual.slide_index !== index && dataHTML_new !== dataHTML) {
        // Verificação no HTML control
        dataHTML_new = await requisitionHolyricsHTML(false);
        // console.log(striptags(dataHTML_new.map.items[0]))
        // console.log(striptags(dataHTML.map.text))
        if (striptags(dataHTML_new.map.items[0]) !== striptags(dataHTML.map.text)) {
          //console.log("index novo: " + global.slide_atual.slide_index);
          clearInterval(interval);
          resolve();
        }
      }

      if (tentativas >= 20) {
        console.log("Mais de 20 tentativas! Escrevendo mesmo slide...")
        clearInterval(interval);
        resolve();
      }
      tentativas++;
    }, 150);
  });
}

async function waitTrocaPresentation(dataHTML) {
  tentativas = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      dataHTML_new = await requisitionHolyricsHTML();
      // Apagar
      if (dataHTML) {
        console.log("NEW HTML: " + striptags(dataHTML_new.map.text) + "\n HTML: " + striptags(dataHTML.map.text));
        console.log("Global pos ID: " + global.pos_id + " | pos_id_atual: " + pos_id_atual)
        console.log("--------------------------\n")
      }

      if (dataHTML && dataHTML_new !== dataHTML && global.pos_id != pos_id_atual) {
        // Verificação no HTML control
        dataHTML_new = await requisitionHolyricsHTML(false);
        // console.log(striptags(dataHTML_new.map.items[0]))
        // console.log(striptags(dataHTML.map.text))
        if (striptags(dataHTML_new.map.items[0]) !== striptags(dataHTML.map.text)) {
          //console.log("index novo: " + global.slide_atual.slide_index);
          clearInterval(interval);
          resolve();
        }
      }

      if (tentativas >= 20) {
        console.log("Mais de 20 tentativas! TrocaPresentation")
        clearInterval(interval);
        resolve();
      }
      tentativas++;
    }, 150);
  });
}

async function verificaSlide(j, slide_index) {
  if (slide_index !== j) {
    console.log("==> SLIDE ERRADO");
    if (slide_index > j) {
      // Faz 3 tentativas de consertar o slide
      for (i = 0; i < 3; i++) {
        await api.changeSlide(req_previous_slide, simulatedResponse);
        dataHTML = await requisitionHolyricsHTML();
        await api.SlideAtual();

        slide_index = global.slide_atual.slide_index;
        if (slide_index === j)
          break;
      }
    } else if (slide_index < j) {
      // Faz 3 tentativas de consertar o slide
      for (i = 0; i < 3; i++) {
        await api.changeSlide(req_next_slide, simulatedResponse);
        dataHTML = await requisitionHolyricsHTML();
        await api.SlideAtual();

        slide_index = global.slide_atual.slide_index;
        if (slide_index === j)
          break;
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Exportar funções
module.exports = {
  printPresentation: printPresentation
};