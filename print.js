const { Console } = require('console');
const api = require('./api');
const config = require('./db').config; // config lida do TXT
const { requisitionHolyricsHTML } = require('./reqHTML');
const { type } = require('os');
const striptags = require('striptags');
const pdf = require('./pdf');
const { rgb } = require('pdf-lib');
const { setTimeout } = require('timers');
const { title } = require('process');

// --------- Variáveis --------- 
pdfDoc = null;
page = null;
marginPage = 50;
borderThickness = 0.5; // Espessura da borda em pontos 
borderColor = rgb(0, 0, 0); // Cor da borda
scaleW = 0.14; // scaleWidht
scaleH = 0.14; // scaleHeight
dataHTML = null;
flagPosId = -1;
//backup_id = null;

// Enum para tipos de texto
const TextType = {
  TITLEPRIN: 0,
  TITLE: 1,
  REGULAR: 2,
  REGULAR_BOLD: 3
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

  pos_id_atual = -1;

  titlePrinc = await formatTitulo();
  await pdf.initDocumentPDF(marginPage, borderThickness, borderColor, titlePrinc);

  //Verifica se o arquivo PDF de destino está aberto
  ret = await pdf.verifyPDFisOpen();

  if(ret.status == 'error'){
    res.send(ret);
    return;
  }

  await pdf.organizeTextPDF(titlePrinc, pdf.textParams[TextType.TITLEPRIN]);

  await api.closeCurrentPresentation();

  dataHTML = await requisitionHolyricsHTML();
  await waitDataHTMLNull();

  console.log("PRINT SLIDES");

  // Atualiza list_media
  await api.getMediaPlaylist(api.req_local, api.res_local);

  // Redefine intervalo função checkPresentationActive
  clearInterval(global.ID_intervalChkPresent);

  global.ID_intervalChkPresent =
    setInterval(() => {
      api.checkPresentationActive();
    }, 150);

  flagPosId = 0;
  while (flagPosId < Object.keys(global.list_media).length) {
    id_atual = global.list_media[flagPosId].id;
    name_atual = global.list_media[flagPosId].name;
    type_atual = global.list_media[flagPosId].type;

    if (flagPosId != -1)
      console.log("==> " + id_atual + " | " + name_atual + " | " + type_atual);

    switch (global.list_media[flagPosId].type) {
      case "song":
        console.log("ENTROU SONG");

        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActive(id_atual);

        await waitSlideAtual(-1, dataHTML);

        slide_total = global.slide_atual.slide_total;
        slide_index = global.slide_atual.slide_index;

        console.log("Slide Total: " + slide_total + " | Slide Atual: " + slide_index);

        // Requisição título
        dataHTML = await requisitionHolyricsHTML();
        await pdf.organizeTextPDF(dataHTML.map.text, pdf.textParams[TextType.TITLE]);

        for (j = 1; j <= slide_total; j++) {
          await api.changeSlide(req_next_slide, simulatedResponse);
          await waitSlideAtual(slide_index, dataHTML);
          dataHTML = await requisitionHolyricsHTML();

          slide_index = global.slide_atual.slide_index;

          // Verifica Slide errado
          await verificaSlide(j, slide_index);

          await pdf.organizeTextPDF(j + ". " + dataHTML.map.text, pdf.textParams[TextType.REGULAR]);
        }

        await api.closeCurrentPresentation();
        break;
      case "text":
        console.log("ENTROU TEXT");

        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActive(id_atual);

        await waitSlideAtual(-1, dataHTML);

        slide_total = global.slide_atual.slide_total;
        slide_index = global.slide_atual.slide_index;

        console.log("Slide Total: " + slide_total + " | Slide Atual: " + slide_index);

        // Requisição título
        dataHTML = await requisitionHolyricsHTML();
        await pdf.organizeTextPDF(dataHTML.map['$system_var_text_title'], pdf.textParams[TextType.TITLE]);
        await pdf.organizeTextPDF(dataHTML.map.text, pdf.textParams[TextType.REGULAR]);

        for (j = 2; j <= slide_total; j++) {
          await api.changeSlide(req_next_slide, simulatedResponse);
          await waitSlideAtual(slide_index, dataHTML);
          dataHTML = await requisitionHolyricsHTML();

          slide_index = global.slide_atual.slide_index;

          // Verifica Slide errado
          await verificaSlide(j, slide_index);

          // TODO: Precisa separar linhas de O - 
          // if (dataHTML.map.text.includes('C -') || dataHTML.map.text.includes('C –')) {
          //   console.log("bold\n\n\n");
          //   await pdf.organizeTextPDF(dataHTML.map.text, pdf.textParams[TextType.REGULAR_BOLD]);
          // } else
          await pdf.organizeTextPDF(dataHTML.map.text, pdf.textParams[TextType.REGULAR]);
        }

        dataHTML = await requisitionHolyricsHTML();
        await api.closeCurrentPresentation();
        break;
      case "image":
        console.log("ENTROU IMAGE");

        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActiveImg(id_atual);

        // Título Img
        await pdf.organizeTextPDF(global.list_media[flagPosId].name, pdf.textParams[TextType.TITLE]);

        dataHTML = await requisitionHolyricsHTML();
        img64 = dataHTML.map.img64;

        pdf.drawPhoto(img64.split("'")[0], scaleW, scaleH);

        await api.closeCurrentPresentation();
        break;
      case "announcement":
        console.log("ENTROU ANNOUNCEMENT");

        dataHTML = await requisitionHolyricsHTML();
        imgID = 0;

        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActiveAnunc(id_atual, imgID);

        // Título
        await pdf.organizeTextPDF(global.list_media[flagPosId].name, pdf.textParams[TextType.TITLE]);

        slide_total = global.slide_atual.total_slides;

        for (j = 1; j <= slide_total; j++) {
          await waitPresentationActiveAnunc(id_atual, imgID);

          dataHTML = await requisitionHolyricsHTML();
          img64 = dataHTML.map.img64;
          pdf.drawPhoto(img64.split("'")[0], scaleW, scaleH);
          imgID = dataHTML.map.img_id;

          if (j != slide_total)
            await api.changeSlide(req_next_slide, simulatedResponse);
        }

        await api.closeCurrentPresentation();

        // Aguarda 1,5s para chamar a próxima presentation
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 1500);
        });

        break;
      case "verse":
        await api.MediaPlaylistAction(id_atual);

        await waitPresentationActiveVerse(id_atual);

        // Título
        await pdf.organizeTextPDF(global.list_media[flagPosId].name, pdf.textParams[TextType.TITLE]);

        while (global.pos_id == flagPosId) {
          //await waitPresentationActiveVerse(id_atual);

          dataHTML = await requisitionHolyricsHTML();

          header = striptags(dataHTML.map.header).split(" - ")[0] + " - ";

          await pdf.organizeTextPDF(header + dataHTML.map.text, pdf.textParams[TextType.REGULAR]);

          await api.changeSlide(req_next_slide, simulatedResponse);

          // Aguarda 1,5s para chamar a próxima presentation
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 1500);
          });
        }

        await api.closeCurrentPresentation();

        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 3000);
        });
        break;
      default:
        break;
    }

    await waitDataHTMLNull();

    flagPosId++;
  }

  // Volta intervalo original função checkPresentationActive
  clearInterval(global.ID_intervalChkPresent);

  global.ID_intervalChkPresent =
    setInterval(() => {
      api.checkPresentationActive();
    }, 1000);

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
      console.log("Wait DataHTML TEXT: " + dataHTML.map.text)
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

// Exportar funções
module.exports = {
  printPresentation: printPresentation
};