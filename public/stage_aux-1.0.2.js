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

function init() {
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

    $.ajax({
        type: 'GET',
        url: 'http://192.168.100.5:7575/stage-view/text-aux-control.json',
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
        //console.log(json);
        updateList(json.map);
    } catch (e) {
        //ignore
    } finally {
        setTimeout(function () {
            update();
        }, delay);
    }
}

function updateList(json) {
    var json_str = JSON.stringify(json);
    if (current_json !== null && json_str == current_json) {
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
    updateItems(json);
    updateSelectedIndex(json);
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
}

function textAreaKeyPressed(evt) {
    if (window.mobileAndTabletCheck() == true) {
        return;
    }
    if (evt.keyCode === 37 || evt.keyCode === 38) { //left || up
        selected_index--;
    } else if (evt.keyCode === 39 || evt.keyCode === 40) { //right || down
        selected_index++;
        if (selected_index >= items.length) {
            selected_index = items.length - 1;
        }
    } else {
        return;
    }
    if (selected_index < 0) {
        selected_index = 0;
    }
    selected_index_changed = selected_index;
    evt.stopPropagation();
    evt.preventDefault();
    refreshSelectedIndex();
}