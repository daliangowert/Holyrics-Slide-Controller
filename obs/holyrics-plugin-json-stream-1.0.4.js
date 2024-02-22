if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function (search, rawPos) {
            var pos = rawPos > 0 ? rawPos | 0 : 0;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}

var defaultValues = {
    type: 'empty',
    color: '#FAFAFA',
    background: '#000000',
    font: 'Arial',
    bold: false,
    halign: 'center',
    valign: 'middle',
    alert_color: '#FAFAFA',
    alert_background: '#000000',
    alert_font: 'Arial',
    alert_bold: false,
    alert_height: "10%",
    alert_velocity: 40,
    text: '',
    alert: '',
    img64: '',
    img_format: 'jpeg',
    img_id: '',
    page_count: '',
    header: '',
    font_max_rows: 10,
    custom_class: '',
    $system_var_music_title: '',
    $system_var_music_artist: '',
    $system_var_music_author: '',
    $system_var_text_title: ''
};
var fields = {};
var alert_velocity = 40;
var valign_diff = 0;
var vpadding = 8;
var currentText = '';
var currentAlert = '';
var currentImg64 = '';
var currentPageCount = '';
var htmlType = 0;
var countError = 0;
var transparentMode = false;
var imgDisplayNone = null;
var displayErrors = '_true';
var cssHash = "0";
var config;

//transition
var transition_on = false;

var jsonItem = { active: false, item: '' };

function bodyOnload() {
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

    var keys = Object.keys(defaultValues);
    for (var i = 0; i < keys.length; i++) {
        fields[keys[i]] = defaultValues[keys[i]];
    }
    refresh();
}

function refresh() {
    $.ajax({
        type: 'GET',
        url: `http://${config.ip}:7575/stage-view/text.json`,
        data: {
            html_type: htmlType,
            img_id: fields['img_id'],
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
                fillAndUpdate(response.map);
            } catch (err) {
                //ignore
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            fillAndUpdate('ajax-error');
        }
    });
}

function getItem() {
    $.ajax({
        type: 'GET',
        url: `/getItem`,
        cache: false,
        async: false,
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
                if (response.active && response.item != jsonItem.item) {
                    console.log(response)
                    jsonItem = response;
                    fields['text'] = response.item + "<span style='visibility:hidden;display:none' id='text-force-update_0'></span>";
                    setupFields();
                    update();
                }
            } catch (err) {
                //ignore
            }
        },
        error: function (xmlhttprequest, textstatus, message) {
            console.log(message);
        }
    });
}


var current_json = null;

function fillAndUpdate(json) {
    try {
        if (transition_on === true) {
            return null;
        }
        if (json != null && json != 'ajax-error') {
            var json_str = JSON.stringify(json);
            if (current_json !== null && json_str == current_json) {
                return null;
            }

            var element = document.querySelector('.screen-custom');
            element.style.visibility = 'visible';
            switch (json.type) {
                case "MUSIC":
                    element.style.background = "url('./fundos/music.png')";
                    element.style.backgroundSize = '100% 100%';
                    break;
                case "TEXT":
                    element.style.background = "url('./fundos/text.png')";
                    element.style.backgroundSize = '100% 100%';
                    // Para setar uma margem esquerda pequena
                    // var div_vis = document.querySelector('#visible');
                    // div_vis.style.paddingLeft = '2%';
                    break;
                case "BIBLE":
                    element.style.background = "url('./fundos/bible.png')";
                    element.style.backgroundSize = '100% 100%';
                    break;
                // case "ANNOUNCEMENT":
                //     return "announcement_slide";
                // case "IMAGE":
                //     return "image_slide";
                // case "CP":
                default:
                    element.style.visibility = 'hidden';
                    console.log("hidden");
                    break;
            }
        }
        current_json = json_str;
        fillFields(json);
        update();
    } catch (err) {
        //ignore
    } finally {
        setTimeout('refresh()', ((json == "ajax-error") ? 2000 : 100));
        if (json.type == "TEXT") setTimeout('getItem()', 100);
    }
}

function fillFields(json) {
    if (json == null) {
        return null;
    }
    if (json == "ajax-error") {
        countError++;
        if (countError <= 5) {
            return null;
        }
        if (displayErrors === '_true') {
            fields['text'] = 'plugin offline';
        }
        //fields['alert'] = '';
    } else {
        try {
            displayErrors = json['display_errors'];
            if (displayErrors === "_false" && json['is_error'] === '_true') {
                return null;
            }
        } catch (e) {
            //ignore
        }
        countError = 0;
        var keys = Object.keys(fields);
        for (var i = 0; i < keys.length; i++) {
            var value = json[keys[i]];
            if (value === null || value === undefined) {
                fields[keys[i]] = defaultValues[keys[i]];
            } else {
                if (keys[i] == 'img64' && value == 'equals') {
                    continue;
                }
                fields[keys[i]] = value;
            }
        }
    }

    if (json.type != 'TEXT')
        setupFields();
}

function setupFields() {
    if (fields['alert'] == null) {
        fields['alert'] = '';
    }
    fields['text'] = fields['text'].split('\n');
    var textToDisplay = fields['text'].join('<br>');
    textToDisplay = textToDisplay.replaceAll("script", "");
    fields['text'] = "<span class='" + getClassFromType(fields['type'], textToDisplay) + " " + fields['custom_class'] + "'>" + textToDisplay + "</span>";
    console.log(fields['text']);
    if (fields['header'].length > 0) {
        var header = fields['header'].split('\n');
        fields['text'] = "<span class='header bible-header-custom' style='font-size: 70%'>" + header.join('<br>') + "</span>" + fields['text'];
    }
    if (fields['type'] === 'MUSIC') {
        if (fields['page_count'].length > 0) {
            fields['text'] += "<span class='page-count page-count-custom'>" + fields['page_count'] + "</span>";
        }
    }
    if (fields['bold']) {
        fields['text'] = "<b>" + fields['text'] + "</b>";
    }
    if (fields['img64'] != null && fields['img64'].length > 0) {
        var imageFormat = getImageFormat(fields['img_format']);
        fields['text'] = "<img src='data:image/" + imageFormat + ";base64," + fields['img64'] + "' class='image-custom " + getClassFromType(fields['type'], "") + "' id='img64'>";
    }
    if (fields['alert_bold'] && fields['alert'] != null && fields['alert'].length > 0) {
        fields['alert'] = "<b>" + fields['alert'] + "</b>";
    }
}

function updateOnResize() {
    try {
        currentText += '<span></span>';
        currentAlert += '<span></span>';
        currentImg64 += '<span></span>';
        update();
    } catch (err) {
        //ignore
    }
}
function update() {
    updateStyle();
    updateExtraInfo();
    var alertUpdated = updateAlert();
    updateDisplay(alertUpdated);
}

function updateExtraInfo() {
    try {
        var arr = ['music_title', 'music_artist', 'music_author', 'text_title'];
        var len = arr.length;
        for (var i = 0; i < len; i++) {
            var element = document.getElementById(arr[i]);
            var newValue = escapeHTML(fields["$system_var_" + arr[i]]);
            if (element.innerHTML != newValue) {
                element.innerHTML = newValue;
            }
        }
    } catch (e) {
        //ignore
    }
}

function updateStyle() {
    try {
        var display = document.getElementById("display");
        var alert = document.getElementById("alert");

        display.style.color = fields['color'];
        display.style.textAlign = fields['halign'];

        if (fields['background'] == '#FFFFFF' || isImgTransparency()) {
            display.style.backgroundColor = null;
            transparentMode = true;
        } else {
            display.style.backgroundColor = fields['background'];
        }

        document.getElementById("visible").style.fontFamily = fields['font'];
        document.getElementById("invisible").style.fontFamily = fields['font'];

        alert.style.fontFamily = fields['alert_font'];
        alert.style.color = fields['alert_color'];
        alert.style.backgroundColor = fields['alert_background'];
        updateAlertFontSize();

        updateVAlign();
    } catch (err) {
        //ignore
    }
}

function isImgTransparency() {
    try {
        if (imgDisplayNone === null) {
            var img64 = document.getElementById('img64');
            if (img64 == null) {
                return fields['img64'] != null && fields['img64'].length > 0;
            }
            imgDisplayNone = getComputedStyle(img64, null).display == 'none';
        }
        return transparentMode && imgDisplayNone && fields['background'] == 'black';
    } catch (err) {
        return false;
    }
}

function updateVAlign() {
    var visibleJQuery = jQuery('#visible');
    var y = vpadding;
    switch (fields['valign']) {
        case 'middle':
            y += (valign_diff / 2.0);
            break;
        case 'bottom':
            y += valign_diff;
            break;
    }
    var oldY = parseInt(visibleJQuery.css("padding-top"), 10);
    if (oldY !== y) {
        visibleJQuery.css({ paddingTop: y + 'px' });
    }
}

function updateAlert() {
    var divAlert = document.getElementById("alert");

    var showAlert = fields['alert'].length > 0;
    var currentAlertNotEmpty = currentAlert.length > 0;
    var alertEquals = currentAlert === fields['alert'];
    var durationEquals = alert_velocity === fields['alert_velocity'];

    var _return = false;
    if (showAlert !== currentAlertNotEmpty || !alertEquals) {
        _return = true;
        updateAlertHeight(showAlert);
        updateAlertFontSize();
    }
    if (!alertEquals) {
        currentAlert = fields['alert'];
        divAlert.innerHTML = "<span id='animation'>" + fields['alert'] + "</span>";
        document.getElementById("alert-invisible").innerHTML = "<span style='white-space:nowrap'>" + fields['alert'] + "</span>";
    }
    if (!alertEquals || !durationEquals) {
        updateAlertAnimation();
    }
    return _return;
}

function updateAlertHeight(showAlert) {
    var divDisplay = document.getElementById("display");
    var divAlert = document.getElementById("alert");
    var alertHeight = parseInt(fields['alert_height'], 10);
    if (showAlert) {
        divDisplay.style.height = (100 - alertHeight) + '%';
        divAlert.style.height = alertHeight + '%';
        if (fields['background'] == fields['alert_background']) {
            divAlert.style.borderTop = '3px ' + fields['color'] + ' dashed';
        } else {
            divAlert.style.borderTop = '0px black solid';
        }
    } else {
        divDisplay.style.height = '100%';
        divAlert.style.height = '0%';
        divAlert.style.borderTop = '0px black solid';
    }
    divAlert.style.top = ((100 - alertHeight) + '%');
}

function updateAlertFontSize() {
    try {
        var divAlert = document.getElementById("alert");
        var divAlertInvisible = document.getElementById("alert-invisible");
        divAlertInvisible.style.font = fields['alert_font'];

        var divAlertInvisibleJQuery = jQuery('#alert-invisible');
        var height = parseInt(jQuery('#alert').height(), 10);
        var maxHeight = Math.max(height - 16, 2);
        var fontSize = maxHeight;
        do {
            divAlertInvisible.style.fontSize = --fontSize + 'px';
        } while (fontSize > 2 && parseInt(divAlertInvisibleJQuery.height(), 10) > maxHeight);
        if (parseInt(divAlert.style.fontSize, 10) != fontSize) {
            divAlert.style.fontSize = fontSize + 'px';
            divAlert.style.lineHeight = height + 'px';
        }
    } catch (err) {
        //ignore
    }
}

function updateDisplay(forceUpdate) {
    updateText(forceUpdate);
    updatePageCount();
}

function updateText(forceUpdate) {
    if (!forceUpdate && (fields['text'] === currentText || fields['text'] === currentImg64)) {
        return false;
    }
    if (fields['text'].startsWith('<img src=\'data:image')) {
        updateImg64();
        return false;
    }
    vpadding = -15;

    var divVisible = document.getElementById("visible");
    var divInvisible = document.getElementById("invisible");
    var divVisibleJQuery = jQuery('#visible');
    var divInvisibleJQuery = jQuery('#invisible');
    var divDisplayJQuery = jQuery('#display');

    // var hpadding = parseInt(divVisibleJQuery.css("padding-left"), 10);
    // if (hpadding != 2) {
    //     divVisibleJQuery.css("padding-left", "10%");
    //     divVisibleJQuery.css("padding-right", "10%");
    // }
    // var rows = fields['text'].split('<br>');

    // var maxHeight = parseInt(divDisplayJQuery.height(), 10) - (vpadding * 2);
    // var maxWidth = parseInt(divVisibleJQuery.width(), 10) + 8;
    //var fontSize = maxHeight / Math.max(rows.length, Math.max(100.0 / fields['font_max_rows'], 3));

    var parser = new DOMParser();
    var doc = parser.parseFromString(fields['text'], "text/html");

    var bElement = doc.querySelector('b');
    bElement.setAttribute('id', 'visible_b');

    fields['text'] = doc.documentElement.outerHTML;

    divInvisible.innerHTML = fields['text'];

    //divInvisible.style.fontSize = fontSize + 'px';
    // do {
    //     fontSize -= 2;
    //     divInvisible.style.fontSize = fontSize + "px";
    //     var currentHeight = parseInt(divInvisibleJQuery.css('height'), 10);
    //     var currentWidth = parseInt(divInvisible.scrollWidth, 10);
    //     console.log("Font-size: " + fontSize + "\ncurrentHeight: " + currentHeight + " | MAX_Height: " + maxHeight + "\ncurrentWidth:  " + currentWidth + " | MAX_Width:  " + maxWidth);
    // } while (fontSize > 4 && (currentHeight > maxHeight || currentWidth > maxWidth));
    var displayHeight = divDisplayJQuery.height();

    var animation_delay = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--animation_out_delay'));
    if (animation_delay > 0) {
        currentText = fields['text'];
        currentImg64 = '';
        var transition_text_pending = divInvisible.innerHTML;
        var transition_font_size_pending = divInvisible.style.fontSize;
        if (transition_on === false) {
            transition_on = true;

            divVisibleJQuery.addClass("animation_out");
            setTimeout(function () {
                transition_on = false;

                divVisibleJQuery.removeClass("animation_out");
                //jQuery('#visible').height(displayHeight + 'px');
                divVisible.style.fontSize = transition_font_size_pending;
                divVisible.innerHTML = transition_text_pending;
                valign_diff = 0;
                if (displayHeight > divInvisibleJQuery.height() + (vpadding * 2)) {
                    valign_diff = (displayHeight - (divVisibleJQuery.height() + (vpadding * 2)));
                }
                vpadding = 0;
                updateVAlign();
                // var bElement = jQuery('#visible #visible_b');
                // console.log(bElement.height());
                //jQuery('#visible').height(bElement.height() + 'px');
            }, animation_delay);
        }
        return null;
    }
    //jQuery('#visible').height(displayHeight + 'px');
    currentText = fields['text'];
    currentImg64 = '';
    divVisible.innerHTML = divInvisible.innerHTML;
    divVisible.style.fontSize = divInvisible.style.fontSize;
    divVisible.style.fontSize = fontSize;
    valign_diff = 0;
    if (displayHeight > divInvisibleJQuery.height() + (vpadding * 2)) {
        valign_diff = (displayHeight - (divVisibleJQuery.height() + (vpadding * 2)));
    }
    vpadding = 0;
    updateVAlign();
}

function updatePageCount() {
    try {
        var div = document.getElementById('page-count');
        var arr = fields['page_count'].split(';');
        if (fields['type'] != 'MUSIC' || arr[2].length <= 0) {
            div.style.visibility = 'hidden';
            return false;
        }
        if (true || fields['page_count'] === currentPageCount) {
            return false;
        }
        var divInvisible = document.getElementById('page-count-invisible');
        var divInvisibleJQuery = jQuery('#page-count-invisible');
        var height = parseInt(divInvisibleJQuery.height(), 10);
        var maxHeight = Math.max(height, 2);
        var fontSize = maxHeight;
        divInvisible.innerHTML = arr[2];
        do {
            divInvisible.style.fontSize = --fontSize + 'px';
        } while (fontSize > 2 && parseInt(divInvisibleJQuery.height(), 10) > maxHeight);
        if (parseInt(div.style.fontSize, 10) != fontSize) {
            div.style.fontSize = fontSize + 'px';
            div.style.lineHeight = height + 'px';
        }
        currentPageCount = fields['page_count'];
        div.innerHTML = divInvisible.innerHTML;
        div.style.visibility = 'visible';
    } catch (err) {
        //ignore
    }
}

function updateHeader() {
    try {
        var div = document.getElementById('page-count');
        var arr = fields['page_count'].split(';');
        if (fields['type'] != 'MUSIC' || arr[2] <= 0) {
            div.style.visibility = 'hidden';
            return false;
        }
        var divInvisible = document.getElementById('page-count-invisible');
        var divInvisibleJQuery = jQuery('#page-count-invisible');
        var height = parseInt(divInvisibleJQuery.height(), 10);
        var maxHeight = Math.max(height, 2);
        var fontSize = maxHeight;
        divInvisible.innerHTML = arr[2];
        do {
            divInvisible.style.fontSize = --fontSize + 'px';
        } while (fontSize > 2 && parseInt(divInvisibleJQuery.height(), 10) > maxHeight);
        if (parseInt(div.style.fontSize, 10) != fontSize) {
            div.style.fontSize = fontSize + 'px';
            div.style.lineHeight = height + 'px';
        }
        div.innerHTML = divInvisible.innerHTML;
        div.style.visibility = 'visible';
    } catch (err) {
        //ignore
    }
}

function updateImg64() {
    var divVisibleJQuery = jQuery('#visible');

    var hpadding = parseInt(divVisibleJQuery.css("padding-left"), 10);
    if (hpadding > 0) {
        divVisibleJQuery.css("padding-left", "0%");
        divVisibleJQuery.css("padding-right", "0%");
    }

    var divVisible = document.getElementById("visible");
    currentText = '';
    currentImg64 = fields['text'];
    divVisible.innerHTML = fields['text'];
    valign_diff = 0;
    vpadding = 0;
    divVisibleJQuery.height(jQuery('#display').height() + 'px');
    updateVAlign();
}

function updateAlertAnimation() {
    alert_velocity = fields['alert_velocity'];
    var pps = alert_velocity * 1.5;
    var animation = document.getElementById('animation');
    if (animation == null) {
        return;
    }
    var animationJQuery = $('#animation');
    var alertWidth = $('#alert').width();

    var textWidth = animation.offsetWidth - parseInt(animationJQuery.css("padding-left"), 10);

    if (textWidth >= alertWidth - 16) {
        animationJQuery.css("padding-left", "100%");
        var duration = ((alertWidth + textWidth) / pps) + 's';
        animation.style.animationDuration = duration;
        animationJQuery.css("-webkit-animation-duration", duration);
    } else {
        animation.style.webkitAnimationName = "none";
        animation.style.animationName = "none";
        animationJQuery.css("padding-left", "0%");
    }
}

function getClassFromType(type, textToDisplay) {
    if (type == null) {
        return "empty_slide";
    }
    switch (type) {
        case "MUSIC":
            return "music_slide";
        case "TEXT":
            return "text_slide";
        case "BIBLE":
            return "bible_slide";
        case "ANNOUNCEMENT":
            return "announcement_slide";
        case "IMAGE":
            return "image_slide";
        case "CP":
            if (textToDisplay === null || textToDisplay === '') {
                return "communication_panel_slide";
            }
            if (textToDisplay.indexOf("<br>") >= 0) {
                return "communication_panel_slide";
            }
            var regex = /((^\d{1,2}:\d{2})|(^\d{1,2}:\d{2}(:\d{2})?))/gm;
            if (textToDisplay.search(regex) >= 0) {
                return "communication_panel_slide communication_panel_clock_slide";
            } else {
                return "communication_panel_slide";
            }
        default:
            return "empty_slide";
    }
}

function getImageFormat(imageFormat) {
    if (imageFormat == null) {
        return "jpeg";
    }
    switch (imageFormat) {
        case "jpeg":
        case "png":
        case "gif":
            return imageFormat;
        default:
            return "jpeg";
    }
}