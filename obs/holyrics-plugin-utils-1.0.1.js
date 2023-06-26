String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function escapeHTML(string) {
    var str = string.replaceAll('&', "&#38;");
    str = str.replaceAll('"', "&#34;");
    str = str.replaceAll('\'', "&#39;");
    str = str.replaceAll('<', "&lt;");
    str = str.replaceAll('>', "&gt;");
    return str;
}

function toast(msg, onclick) {
    var el = document.getElementById("snackbar");
    el.innerHTML = msg;
    el.className = "show";
    if (typeof onclick !== 'undefined') {
        el.onclick = onclick;
    }
    setTimeout(function () {
        el.className = "";
        el.onclick = null;
    }, 4000);
}

var modal = document.getElementById('modal');
var modalContent = document.createElement("div");
var modalClose = document.createElement("span");
var modalText = document.createElement("p");
var modalButtons = document.createElement("div");
var modalButtonOk = document.createElement("button");
var modalButtonCancel = document.createElement("button");

modalContent.className = 'modal-content';
modalClose.className = 'modal-close';
modalText.className = 'modal-text';
modalButtons.className = 'modal-buttons';
modalButtonOk.className = 'modal-button-delay';
modalButtonOk.className = 'modal-button-ok';
modalButtonCancel.className = 'modal-button-cancel';

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

modalClose.onclick = function () {
    modal.style.display = "none";
};

modalButtonCancel.onclick = function () {
    modal.style.display = "none";
};

modalClose.innerHTML = '&times;';

modalButtons.appendChild(modalButtonOk);
modalButtons.appendChild(modalButtonCancel);

modalContent.appendChild(modalClose);
modalContent.appendChild(modalText);
modalContent.appendChild(modalButtons);
modal.appendChild(modalContent);

function confirmDialog(msg, onclick, delay, wPositive, wNegative) {
    var id = "cancel_id_" + new Date().getTime();
    modalText.innerHTML = msg;
    modalButtonCancel.id = id;
    wPositive = typeof wPositive !== 'undefined' ? wPositive : "Ok";
    wNegative = typeof wNegative !== 'undefined' ? wNegative : "Cancelar";
    var showButtons = (typeof onclick !== 'undefined' && onclick !== null);
    var showDelay = (typeof delay !== 'undefined' && delay !== null);
    if (showButtons) {
        modalButtonOk.innerHTML = wPositive;
        modalButtonCancel.innerHTML = wNegative + (showDelay ? " (" + delay + ")" : "  ");
        modalButtons.style.display = "";
        $('.modal-button-ok').prop("onclick", null);
        modalButtonOk.onclick = function () {
            modal.style.display = "none";
            onclick.call();
        };
    } else {
        modalButtons.style.display = "none";
    }

    modal.style.display = "block";
    modalButtonOk.focus();

    if (showDelay) {
        var count = delay - 1;
        delayFunction = function () {
            if (modalButtonCancel.id != id) {
                return;
            }
            if (count > 0) {
                modalButtonCancel.innerHTML = wNegative + (showDelay ? " (" + count + ")" : "  ");
                setTimeout(function () {
                    count--;
                    delayFunction.call();
                }, 1000);
            } else {
                modal.style.display = "none";
            }
        };
        setTimeout(delayFunction, 1000);
    }
}

function confirmDialogOkCancel(msg, onclick, delay) {
    confirmDialog(msg, onclick, delay, "Ok", "Cancel");
}

function confirmDialogYesNo(msg, onclick, delay) {
    confirmDialog(msg, onclick, delay, "Sim", "Não");
}

function fullscreenToggle() {
    if (!document.fullscreenElement && // alternative standard method
            !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {  // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}