// Faz as requisições a API do Holyrics para voltar e avançar slide
ip = "192.168.100.5"
token = "MXdskASO1edgBsTG"
itens_old = [], items_new = [];
tmp = false, tmp2 = false;

function change_slide(type) {
    tmp = false;
    items_old = items;

    $.ajax({
        type: 'POST',
        url: '/api/slide/' + type + '/'+ ip + '/' + token,
        contentType: "application/json; charset=utf-8",

        success: function (response) {
            console.log(response);
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log('Erro: ' + textStatus + ' ' + errorThrown);
        }
    });
}

// async function sendSlide(type) {
//     return new Promise((resolve, reject) => {
//         $.ajax({
//             type: 'POST',
//             url: '/api/slide/' + type + '/'+ ip + '/' + token,
//             contentType: "application/json; charset=utf-8",

//             success: function (response) {
//                 console.log(response);
//                 resolve();
//             },
//             error: function (xhr, textStatus, errorThrown) {
//                 console.log('Erro: ' + textStatus + ' ' + errorThrown);
//                 reject();
//             }
//         });
//     });
// }

// async function change_slide(type) {
//     items_old = items;
//     await sendSlide(type);
//     tmp = false;
//     await waitForTempToBeTrue();
//     console.log('após aguardar');
//     console.log(items_old);
//     items_new = items;
//     console.log(items_new);
//     check_fim_presentation();
// }

// // Compara se dois arrays itens são iguais e volta/avança apresentação
// function check_fim_presentation(){
//     console.log(items_new.length);
//     console.log(items_old.length);
//     const saoIguais = items_new.length === items_old.length && 
//                  items_new.every((valor, indice) => valor === items_old[indice]);

//     console.log(saoIguais);
//     console.log(items);
// }

// function waitForTempToBeTrue() {
//     return new Promise((resolve) => {
//       const checkTemp = () => {
//         if (tmp === true) {
//           resolve();
//         } else {
//           setTimeout(checkTemp, 50);
//         }
//       };
//       checkTemp();
//     });
//   }