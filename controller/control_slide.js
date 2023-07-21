// Faz as requisições a API do Holyrics para voltar e avançar slide
itens_old = [], items_new = [];
tmp = true, tmp2 = false;
current_type = null;

// ### OLD ###
// function change_slide(type) {
//     tmp = false;
//     items_old = items;
//     //console.time('change');

//     $.ajax({
//         type: 'POST',
//         url: '/api/slide/' + type + '/'+ ip + '/' + token,
//         contentType: "application/json; charset=utf-8",

//         success: function (response) {
//             console.log(response);
//             //console.timeEnd('change');
//         },
//         error: function (xhr, textStatus, errorThrown) {
//             console.log('Erro: ' + textStatus + ' ' + errorThrown);
//         }
//     });
// }

async function sendSlide(type, force_change) {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: '/api/slide/' + type + '/' + force_change,
      contentType: "application/json; charset=utf-8",

      success: function (response) {
        console.log(response);
        current_type = response.type;
        resolve();
      },
      error: function (xhr, textStatus, errorThrown) {
        console.log('Erro: ' + textStatus + ' ' + errorThrown);
        reject();
      }
    });
  });
}

async function change_slide(type) {
  // Passa próxima/anterior linha do slide
  if (type == 'previous') {
    selected_index--;
    if (selected_index < 0)
      selected_index = 0;
    else {
      selected_index_changed = selected_index;
      refreshSelectedIndex();
      return;
    }
  }
  else if (type == 'next') {
    selected_index++;
    if (selected_index >= items.length)
      selected_index = items.length - 1;
    else {
      selected_index_changed = selected_index;
      refreshSelectedIndex();
      return;
    }
  }

  // Muda de slide
  items_old = items;
  await sendSlide(type, 0);
  if (current_type == 'verse') {
    if (tmp) {
      if (type == 'next')
        previousButton.disabled = true;
      else
        nextButton.disabled = true;

      tmp = false;
      await waitForTempToBeTrue();
      console.log('após aguardar');
      console.log(items_old);
      items_new = items;
      console.log(items_new);
      if (check_fim_presentation())
        if (type == 'previous')
          await sendSlide(type, -1);
        else
          await sendSlide(type, 1);

      previousButton.disabled = false;
      nextButton.disabled = false;
    }
    else {
      console.log("tmp is false");
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        tmp = true;
        tmp2 = false;
      }, 1500);
    }
  }
}

// Compara se dois arrays itens são iguais e volta/avança apresentação
function check_fim_presentation() {
  console.log(items_new.length);
  console.log(items_old.length);
  const saoIguais = items_new.length === items_old.length &&
    items_new.every((valor, indice) => valor === items_old[indice]);

  console.log(saoIguais);
  return saoIguais;
}

function waitForTempToBeTrue() {
  return new Promise((resolve) => {
    const checkTemp = () => {
      if (tmp === true) {
        resolve();
      } else {
        setTimeout(checkTemp, 50);
      }
    };
    checkTemp();
  });
}

//Simular requisição front OBS
function simulate_front() {
  $.ajax({
    type: 'GET',
    url: `http://${config.ip}:7575/stage-view/text.json`,
    data: {
      html_type: htmlType,
      // img_id: fields['img_id'],
      // css_hash: cssHash
    },
    cache: false,
    async: true,
    dataType: 'json',
    timeout: 2000,
    success: function (response) {
      try {
        if (response.reload === "_true") {
          location.reload();
        }
      } catch (err) {
        //ignore
      }
    }
  });
}