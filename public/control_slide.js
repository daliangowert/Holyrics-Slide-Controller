// Faz as requisições a API do Holyrics para voltar e avançar slide

ip = "192.168.100.5"
token = "MXdskASO1edgBsTG"

function change_slide(type) {
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
    


    // var xhr = new XMLHttpRequest();
    // var url = "http://192.168.100.5:8091/api/Auth";
    // xhr.open("POST", url, true);
    // xhr.setRequestHeader("Content-Type", "application/json");
    // xhr.onreadystatechange = function () {
    //     if (xhr.readyState === 4 && xhr.status === 200) {
    //         console.log(xhr.responseText);
    //     }
    // };
    // var data = JSON.stringify({
    //     // aqui você pode adicionar os dados que deseja enviar no corpo da solicitação
    // });
    // xhr.send(data);



}
