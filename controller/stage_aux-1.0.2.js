var htmlType = 0;

var delay = 50;
var count_delay = 0;

var error_count = 0;

items = [];
var selected_index = -1;
var selected_index_changed = -1;
var current_json;

var cssHash = "0";

let timeoutId;

var config;

var isText = false;

function init() {
    // Pega as configs para conversação com o Holyrics
    $.ajax({
        url: '/config',
        method: 'GET',
        cache: false,
        async: false,
        dataType: 'json',
        timeout: 1000,
        success: function (response) {
            // Variável config recebida na resposta
            config = response;
        },
        error: function (error) {
            console.error('Erro ao obter a configuração:', error);
        }
    });

    update();
}

function update() {
    if (++count_delay < 4) {
        callbackJson("none");
        return;
    }
    count_delay = 0;
    var _selected_index = (selected_index_changed >= 0 ? selected_index_changed : -1);
    selected_index_changed = -1;
    //var _selected_index_changed = selected_index_changed ? true : false;

    // Função para simular página front OBS aberta
    simulate_front();

    $.ajax({
        type: 'GET',
        url: `http://${config.ip}:7575/stage-view/text-aux-control.json`,
        data: {
            'html_type': htmlType,
            'selected_index': _selected_index,
            'css_hash': cssHash
        },
        cache: false,
        async: false,
        dataType: 'json',
        timeout: 1000,
        success: function (response) {
            try {
                if (response.reload === "_true") {
                    location.reload();
                }
            } catch (err) {
                //ignore
            }
            try {
                callbackJson(response);
            } catch (err) {
                //ignore
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            callbackJson('ajax-error');
        }
    });
}

function requireTextJson() {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: 'GET',
            url: `http://${config.ip}:7575/stage-view/text.json`,
            data: {
                html_type: -1,
                css_hash: cssHash
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
                try {
                    resolve(response); // Resolvendo a promessa com a resposta
                } catch (err) {
                    reject(err); // Rejeitando a promessa com o erro
                }
            },
            error: function (xmlhttprequest, textstatus, message) {
                reject(message); // Rejeitando a promessa com a mensagem de erro
            }
        });
    });
}

function setItem(data) {
    // Criar uma instância do objeto XMLHttpRequest
    var xhr = new XMLHttpRequest();

    // Configurar a requisição
    xhr.open('POST', '/setItem', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    // Definir a função a ser executada quando a requisição for concluída
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
        } else {
            // Erro na requisição
            console.error('Erro na requisição:', xhr.statusText);
        }
    };

    // Definir a função a ser executada em caso de erro na requisição
    xhr.onerror = function () {
        console.error('Erro de rede');
    };

    // Enviar a requisição com os dados convertidos para JSON
    xhr.send(JSON.stringify(data));
}

function callbackJson(json) {
    try {
        if (json == 'none') {
            return;
        }
        if (json == 'ajax-error') {
            error_count++;
            if (error_count >= 8) {
                items = ['Server not found'];
                selected_index = -1;
                current_json = null;
                createTable();
            }
            return;
        }
        error_count = 0;
        updateList(json.map);
    } catch (e) {
        //ignore
    } finally {
        setTimeout(function () {
            update();
        }, delay);
    }
}

async function updateList(json) {
    var json_str = JSON.stringify(json);
    if (current_json !== null && json_str == current_json) {
        if (tmp == false && tmp2 == false) {
            tmp2 = true;
            timeoutId = setTimeout(() => {
                tmp = true;
                tmp2 = false;
            }, 1500);
        }
        // if(tmp == false && tmp2 == false)
        // {
        //     console.log("dentro if");
        //     if(timeoutId)
        //         clearTimeout(timeoutId);

        //     tmp2 = true;
        //     timeoutId = setTimeout(() => {
        //         analisajson();
        //     }, 900);
        // }
        return;
    }
    // tmp2 = false;
    // console.log("DEPOIS_IGUAL");
    current_json = json_str;

    var textJson = await requireTextJson();
    if (textJson.map.type == 'TEXT') {
        json.items = verifyItems(json.items);
        isText = true;
    }
    else
        isText = false;

    updateItems(json);
    updateSelectedIndex(json);
}

function verifyItems(items) {
    var items = items.map(function (item) {
        return item.trim();
    });

    console.log(items);

    for (i = 0; i < items.length; i++) {
        var item = items[i];
        var itemSplit = item.split('\n');

        // if(item.length > 100){

        if (itemSplit.length == 1) // dividir
        {
            // não tem \n
            var partes = dividirTexto(item, 140);
            items.splice(i, 1, ...partes);
            i += partes.length - 1;
        }
        else {
            console.log(itemSplit[1].length);
            var partes;
            partes = dividirTexto(item, 100);
            
            items.splice(i, 1, ...partes);
            i += partes.length - 1;
        }
        // }       
    }

    items = items.filter(function(item) {
        return item.trim() !== "";
    });

    console.log(items);

    return items;
}

function dividirTexto(texto, tamanhoMax = 80) {
    let partes = [];
    let inicio = 0;
    let fim = tamanhoMax;

    while (fim < texto.length) {
        let posicao = fim;
        while (posicao > inicio && !".;,?".includes(texto[posicao])) {
            posicao--;
        }
        if (posicao === inicio) {
            posicao = fim;
            while(!" ".includes(texto[posicao])){
                posicao--;
            }
            posicao++;
        } else {
            posicao++;
        }
        partes.push(texto.slice(inicio, posicao));
        inicio = posicao;
        fim = inicio + tamanhoMax;
    }
    partes.push(texto.slice(inicio));

    return partes;
}

// function analisajson()
// {
//     console.log("igual");
//     if(tmp2 == false) // já mudou slide
//         return;
//     else
//         tmp = true;

//     tmp2 = false;
// }

function updateItems(json) {
    // console.log(items.length);
    // const saoIguais = json.items.length === items.length && 
    //               json.items.every((valor, indice) => valor === items[indice]);
    // console.log(saoIguais);


    if (json.items.length == items.length) {
        var equals = true;


        for (var i = 0; i < items.length; i++) {
            if (json.items[i] != items[i]) {
                equals = false;
                break;
            }
        }
        if (equals) {
            return;
        }
    }
    items = json.items;

    //console.log("diferente");
    //tmp = true;
    selected_index = -2;
    createTable();
}

function createTable() {
    var tableElem = document.createElement('table');
    tableElem.id = 'table_items';
    tableElem.cellSpacing = 0;
    for (var i = 0; i < items.length; i++) {
        var rowElem = document.createElement('tr');
        var colElem = document.createElement('td');
        colElem.id = 'td_index_' + i;
        var spanElem = document.createElement('span');
        spanElem.innerHTML = items[i];
        colElem.appendChild(spanElem);

        rowElem.appendChild(colElem);

        tableElem.appendChild(rowElem);
    }
    var content = document.getElementById("content");
    while (content.firstChild) {
        content.removeChild(content.firstChild);
    }
    content.appendChild(tableElem);
    setupOnclick();
}

function setupOnclick() {
    var _tr = $('#table_items').find('tr');
    if (_tr == null) {
        return;
    }
    _tr.click(function () {
        selected_index = $(this).index();
        selected_index_changed = $(this).index();
        refreshSelectedIndex();
    });
}

function updateSelectedIndex(json) {
    if (json.selected_index == selected_index) {
        return;
    }
    selected_index = parseInt(json.selected_index);
    refreshSelectedIndex();
}

function refreshSelectedIndex() {
    var i = 0;
    var colElem = document.getElementById("td_index_" + i);
    while (colElem != null) {
        if (selected_index == i) {
            colElem.classList.add("selected_index_td");
        } else {
            colElem.classList.remove("selected_index_td");
            colElem.style.backgroundColor = null;
            colElem.style.color = null;
        }
        i++;
        colElem = document.getElementById("td_index_" + i);
    }

    setItem({ active: isText, item: items[selected_index] });
}

function textAreaKeyPressed(evt) {
    if (window.mobileAndTabletCheck() == true) {
        return;
    }

    // TODO: com SHIFT pressiondo, mudar slide 
    // if (evt.shiftKey && (evt.keyCode === 37 || evt.keyCode === 38)) {
    //     console.log("ok");
    // }


    if (evt.keyCode === 37 || evt.keyCode === 38) { //left || up
        change_slide('previous');
        flashButton('left');
    }
    else if (evt.keyCode === 39 || evt.keyCode === 40) { //right || down
        change_slide('next');
        flashButton('right');
    }
    else
        return;

    evt.stopPropagation();
    evt.preventDefault();


    // ##### OLD
    // if (evt.keyCode === 37 || evt.keyCode === 38) { //left || up
    //     selected_index--;
    // } else if (evt.keyCode === 39 || evt.keyCode === 40) { //right || down
    //     selected_index++;
    //     if (selected_index >= items.length) {
    //         change_slide('next');
    //         selected_index = items.length - 1;
    //     }
    // } else {
    //     return;
    // }
    // if (selected_index < 0) {
    //     change_slide('previous');
    //     selected_index = 0;
    // }
    // selected_index_changed = selected_index;
    // evt.stopPropagation();
    // evt.preventDefault();
    // refreshSelectedIndex();
}

// Pisca o botão ao selecionar com a seta do teclado correspondente
function flashButton(button) {
    var buttonElement = document.querySelector('.control-btn.' + button);
    buttonElement.style.boxShadow = '0 0 0 3px rgb(248, 248, 248)';
    setTimeout(function () {
        buttonElement.style.boxShadow = '';
    }, 200);
}
