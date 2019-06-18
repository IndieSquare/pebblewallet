var args = arguments[0] || {};
var currencyFiat = Ti.App.Properties.getString("currency", "USD");
$.blockingView.hide();
$.qrcode.hide();

var cryptoCurrency = globals.LNCurrencySat;
var denomination = Ti.App.Properties.getString("denomination", "SAT");


var qrcode = require("requires/qrcode");

 
$.generateLabel.title = $.generateLabel.title.toUpperCase();


var isFiatMode = false;
var FiatSymbol = globals.tiker.getFiatSymbol(currencyFiat);
$.fiatSymbol.text = FiatSymbol;

globals.console.log("fiat symbol", FiatSymbol);
 
var fiat_conf = "";
var fiatValue = globals.tiker.getFiatValue(currencyFiat, denomination);

globals.console.log("fiat value", fiatValue);


function selectedFiat() {
  coolDown = false;
  globals.console.log("selected fiat");
  isFiatMode = true;
}
function selectedCrypto() {
  coolDown = false;
  globals.console.log("selected crypto")
  isFiatMode = false;
}
var coolDown = false;
function updateValues() {
  if (coolDown) {
    return;
  }
  if (!isFiatMode) {
    var inputValue = $.amount.value;

    if (inputValue.startsWith("0") && !inputValue.startsWith("0.")) {
      coolDown = true;
      $.amount.value = $.amount.value.substr(1, $.amount.value.length);
      inputValue = $.amount.value;
      coolDown = false;
    }

    var val = (inputValue * fiatValue).toFixed2(4);
    if (isNaN(val)) {
      val = 0;
    }
    if (fiatValue == 0) val = 0;
    $.fiat.value = addCommas(val);

  } else {

    if ($.fiat.value.startsWith("0") && !$.fiat.value.startsWith("0.")) {
      coolDown = true;
      $.fiat.value = $.amount.value.substr(1, $.fiat.value.length);
      coolDown = false;
    }



    var inputValue = parseFloat($.fiat.value) / fiatValue;
    globals.console.log("inputvalue", inputValue);
    coolDown = true;
    val = parseInt(inputValue + "");
    if (isNaN(val)) {
      val = 0;
    }
    $.amount.value = val;
    coolDown = false;
  }

}

coolDown = true;
$.amount.value = "0";
$.fiat.value = "0";
coolDown = false;

function pressedRequest() {

  $.memo.blur();
  var amountString = $.amount.value.toString();
  globals.console.log("amount is ", amountString);
  var quantity = amountString.replace(/[^\d.-]/g, "");

  quantity = parseInt(quantity);

  if (quantity == 0) {
    alert(L("enter_amount_request"));
    return;
  }
  showHideLoading(false);

  var memo = $.memo.value;
  if (memo.length == 0) {
    memu = null;
  }

  var expirySeconds = expiry * 60
  globals.console.log("expiry seconds", expirySeconds);
  globals.lnGRPC.addInvoice(quantity, memo, expirySeconds, function (error, response) {

    showHideLoading(true);
    if (error == true) {
      globals.console.error("add invoice", response);
      alert(response);
      return;

    }
    currentRhash = response.r_hash;
    currentPaymentRequest = response.payment_request;
    globals.console.log("add invoice", response);

    globals.console.log("currentPaymentRequest", currentPaymentRequest);
    needsToRefreshInvoices = true;

    var newQrcodeView = qrcode.QRCode({
      "text": currentPaymentRequest,
      "errorCorrectLevel": "H"
    })
      .createQRCodeView({
        "width": globals.display.width * 0.9,
        "height": globals.display.width * 0.9,
      });
    $.statusText.text = L("waiting_payment");
    $.statusSpinner.show();
    $.qrCodeInner.add(newQrcodeView);
    $.qrcode.show();

    if (OS_IOS && Ti.App.Properties.getString("mode", "") == "lndMobile") {
      Ti.App.Properties.setBool("didRequest", true);
      globals.util.scheduleReminderNotif()
    }

    globals.updateCurrentInvoice = function (invoice) {
      if (invoice.payment_request = currentPaymentRequest) {
        globals.updateCurrentInvoice = null;
        closeQR();
        var confView = Alloy.createController('components/conf_screen', {
          parent: $.win,
          isInvoice: true,
          token: "",
          type: "success",
          callback: function () {

            close();
          }
        }).getView();

      }
    }

  });

}


function checkPayment() {

  if (OS_IOS) {
    var rhash = globals.bitcoin.base64toHEX(currentRhash);
  }
  else {
    var rhash = currentRhash;
  }

  globals.lnGRPC.lookUpInvoice(rhash, function (error, res) {

    if (error == true) {

      alert(res);

      return;
    }

    globals.console.log(res);

    if (res.settled == true) {
      globals.updateCurrentInvoice(res);
    } else {
      alert(L("not_yet_paid"));
    }



  });


}

function closeQR() {
  $.qrCodeInner.removeAllChildren();
  $.qrcode.hide();
}

function showHideLoading(hide) {
  if (hide) {
    $.blockingView.hide();
    $.requestSpinner.hide();
    $.generateLabel.show();
    $.win.touchEnabled = true;
    return;
  }
  $.blockingView.show();
  $.requestSpinner.show();
  $.generateLabel.hide();
  $.win.touchEnabled = false;
}

var inputValue = "";

function isiPhoneX() {
  return (Ti.Platform.displayCaps.platformWidth === 375 && Ti.Platform.displayCaps.platformHeight == 812) || // Portrait
    (Ti.Platform.displayCaps.platformHeight === 812 && Ti.Platform.displayCaps.platformWidth == 375); // Landscape
}
if (isiPhoneX()) {
  $.win.extendSafeArea = false;
}

function close(e) {

  if (OS_ANDROID) {
    $.win.close();
    return;
  }
  $.background.animate({
    "opacity": 0,
    "duration": 200
  });

  $.mainView.animate({
    "left": globals.display.width,
    "duration": 200
  });

  setTimeout(function () {
    $.win.width = 0;
    $.win.close();
  }, 200);
}

if (OS_ANDROID) {
  $.win.addEventListener('android:back', function () {
    close();
    return true;
  });
}

$.memo.hintText = L("request_memo");
$.memo.hintTextColor = "gray";

$.background.animate({
  "opacity": 0.5,
  "duration": 200
});
if (OS_IOS) {
  $.mainView.animate({
    "left": 0,
    "duration": 200
  });
}

$.amount.value = "0";
$.amountBTC.text = globals.LNCurrencySat;




function hideKeyboard(e) {
  $.fiat.blur();
  $.amount.blur();
}


function addCommas(nStr) {
  nStr += "";
  x = nStr.split(".");
  x1 = x[0];
  x2 = x.length > 1 ? "." + x[1] : "";
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, "$1" + "," + "$2");
  }
  return x1 + x2;
}


var expiry = globals.defaultExpiry;
$.time.text = L('expiry_time').format({
  "time": expiry
});

function addExpiry() {
  if (expiry < 1000) {
    expiry += 10;
    $.time.text = L('expiry_time').format({
      "time": expiry
    });
  }
}

function minusExpiry() {
  if (expiry > 10) {
    expiry -= 10;
    $.time.text = L('expiry_time').format({
      "time": expiry
    });
  }
}

function copyClipboard() {
  Ti.UI.Clipboard.setText(currentPaymentRequest);
  globals.util.createDialog({
    "message": L("label_copied"),
    "buttonNames": [L("label_close")]
  }).show();
}