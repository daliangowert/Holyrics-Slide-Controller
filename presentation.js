const api = require('./api');
const config = require('./db').config; // config lida do TXT
const { requisitionWidescreen } = require('./reqHTML');
const { createDirectory } = require('./pdf.js');
const fs = require('fs');
const path = require('path');
const officegen = require('officegen');

// --------- Variáveis --------- 
dataWidescreen = null;
hashNull = 'd84d4707f30e4df0ec60fd3bf9c98283506b8cb8ae496a60ad05c18573329a55';
hashTemp = '';
countSlide = 1;

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

//APAGAR
//converterMediaPlaylistFromPPT(global.req, global.res);

async function converterMediaPlaylistFromPPT(req, res) {
  dataWidescreen = null;
  countSlide = 1;
  pos_id_atual = -1;

  tempDir = await createDirectory();
  clearFolder(tempDir);

  await api.closeCurrentPresentation();

  await waitWidescreenNull();
  hashTemp = hashNull;

  // Atualiza list_media
  await api.getMediaPlaylist(api.req_local, api.res_local);

  flagPosId = 0;
  while (flagPosId < Object.keys(global.list_media).length) {
    id_atual = global.list_media[flagPosId].id;
    name_atual = global.list_media[flagPosId].name;
    type_atual = global.list_media[flagPosId].type;

    if (flagPosId != -1)
      console.log("==> " + id_atual + " | " + name_atual + " | " + type_atual);

    switch (global.list_media[flagPosId].type) {
      case "song":
      case "text":
        await api.MediaPlaylistAction(id_atual);

        await waitWidescreenNotNull();

        await waitGetCurrentPresentation();
        var presentation = await api.getCurrentPresentation();

        while(presentation.data === null){
          presentation = await api.getCurrentPresentation();
          console.log("#### Aguardando Presentation: ");
          await sleep(100);
        }

        total_slides = presentation.data.total_slides;

        for (i = 1; i < total_slides; i++) {
          dataWidescreen = await requisitionWidescreen();

          await saveWidescreen(dataWidescreen.base64, countSlide);

          hashTemp = dataWidescreen.hash;
          countSlide++;

          await api.ActionNextorPrevious('next');
          await waitWidescreenDistinct();
        }

        await api.closeCurrentPresentation();
        await waitWidescreenNull();
        hashTemp = hashNull;

        break;
      case "image":
      case "announcement":
      case "file":
        if (global.list_media[flagPosId].type === 'file') {
          const isPPTXFile = global.list_media[flagPosId].name.toLowerCase().endsWith('.pptx');

          if (!isPPTXFile) {
            console.log("Arquivo não é do tipo .pptx!");
            await api.closeCurrentPresentation();
            await waitWidescreenNull();
            hashTemp = hashNull;
            break;
          }
        }

        await api.MediaPlaylistAction(id_atual);

        await waitWidescreenNotNull();

        await waitGetCurrentPresentation();
        var presentation = await api.getCurrentPresentation();

        while(presentation.data === null){
          presentation = await api.getCurrentPresentation();
          console.log("#### Aguardando Presentation: ");
          await sleep(100); 
        }

        total_slides = presentation.data.total_slides;

        for (i = 1; i <= total_slides; i++) {
          dataWidescreen = await requisitionWidescreen();

          await saveWidescreen(dataWidescreen.base64, countSlide);

          hashTemp = dataWidescreen.hash;
          countSlide++;

          await api.ActionNextorPrevious('next');
          await waitWidescreenDistinct();
        }

        await api.closeCurrentPresentation();
        await waitWidescreenNull();
        hashTemp = hashNull;

        break;
      case "verse":
        await api.MediaPlaylistAction(id_atual);

        await waitWidescreenNotNull();

        await waitGetCurrentPresentation();
        var presentation = await api.getCurrentPresentation();

        while(presentation.data === null){
          presentation = await api.getCurrentPresentation();
          console.log("#### Aguardando Presentation: ");
          await sleep(100); 
        }

        const verseId = global.list_media[flagPosId].verse_id.split(',');
        const lastId = verseId[verseId.length - 1];

        while (presentation.data.id !== lastId) {
          dataWidescreen = await requisitionWidescreen();

          await saveWidescreen(dataWidescreen.base64, countSlide);

          hashTemp = dataWidescreen.hash;
          countSlide++;

          await api.ActionNextorPrevious('next');
          await waitWidescreenDistinct();
          presentation = await api.getCurrentPresentation();
        }

        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 1500);
        });

        while (global.pos_id == flagPosId) {
          dataWidescreen = await requisitionWidescreen();

          await saveWidescreen(dataWidescreen.base64, countSlide);

          hashTemp = dataWidescreen.hash;
          countSlide++;

          await api.waitForVerseChange(simulatedResponse, 'next');

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

        await waitWidescreenNull();
        hashTemp = hashNull;

        break;
      default:
        break;
    }

    flagPosId++;
  }

  pathPPT = await createPowerPoint();

  res.send({ status: "ok" , path: pathPPT});
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

function waitGetCurrentPresentation() {
  return new Promise((resolve, reject) => {
    async function checkAndClearInterval() {
      try {
        presentation = await api.getCurrentPresentation();
        if (presentation.type !== null) {
          clearInterval(global.intervalGetCurrentPresentation);
          resolve(); // Resolvendo a Promise quando o widescreen não é nulo
        } else {
          setTimeout(checkAndClearInterval, 50);
        }
      } catch (error) {
        clearInterval(global.intervalGetCurrentPresentation);
        reject(error); // Rejeitando a Promise em caso de erro
      }
    }

    global.intervalGetCurrentPresentation = setTimeout(checkAndClearInterval, 50);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function saveWidescreen(base64String, fileName) {
  try {
    // Remova o cabeçalho da string base64 (por exemplo, 'data:image/jpeg;base64,')
    const base64Data = base64String.replace(/^data:image\/jpeg;base64,/, '');

    // Crie um buffer a partir da string base64
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // // Defina o caminho para a pasta onde você deseja salvar a imagem
    // const folderPath = 'C:\\Windows\\Temp\\Widescreen';

    // Garanta que a pasta exista, se não existir
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Crie o caminho completo para o arquivo
    const filePath = path.join(tempDir, `${fileName}.jpeg`);

    // Salve a imagem no arquivo
    fs.writeFileSync(filePath, imageBuffer);

    //console.log(`Imagem salva com sucesso em: ${filePath}`);
  } catch (error) {
    console.error('Erro ao salvar a imagem:', error);
  }
}

async function createPowerPoint() {
  const pptx = officegen('pptx');

  pptx.setWidescreen(true); // For 16:9 presentation

  try {
    const files = fs.readdirSync(tempDir).filter(file => file.toLowerCase().endsWith('.jpeg'));

    const compareNumeric = (a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0, 10); // Extrai o número de cada string ou usa 0 se não houver número
      const numB = parseInt(b.match(/\d+/)?.[0] || 0, 10);
      return numA - numB;
    };

    // Ordenar o array usando a função de comparação personalizada
    const filesOrdely = files.sort(compareNumeric);

    files.forEach((filesOrdely) => {
      let slide = pptx.makeNewSlide();
      slide.name = 'Imagem';
      slide.back = 'ffffff';
      slide.addImage(path.join(tempDir, filesOrdely), { x: 0, y: 0, cx: '100%', cy: '100%' });
    });

    var schedule = await api.getCurrentSchedule();
    pathPPT = config.folderPresentation + '\\' + schedule.data[0].name + ' - ' + schedule.data[0].datetime.split(' ')[0] +'.pptx';

    await new Promise((resolve, reject) => {
      let stream = fs.createWriteStream(pathPPT);
      pptx.generate(stream, { finalize: (written) => resolve() });
      stream.on('error', (err) => reject('Erro ao salvar a apresentação: ' + err));
    });

    console.log('Apresentação salva com sucesso: ' + config.folderPresentation);
    return pathPPT;
  } catch (error) {
    console.error('Erro ao criar a apresentação: ', error);
  }
}

async function clearFolder(path) {
  if (!fs.existsSync(path)) {
    return;
  }

  try {
    await fs.promises.rmdir(path, { recursive: true });
    console.log('Pasta excluída com sucesso!');
  } catch (error) {
    console.error('Erro ao excluir a pasta:', error);
  }
  
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}


// Exportar funções
module.exports = {
  converterMediaPlaylistFromPPT: converterMediaPlaylistFromPPT
};