var args = arguments[0] || {};
var currencyFiat = Ti.App.Properties.getString("currency", "USD");
$.blockingView.hide();
$.qrcode.hide();

var cryptoCurrency = globals.LNCurrencySat;
var denomination = Ti.App.Properties.getString("denomination", "SAT");
globals.console.log("denomination ", denomination);
if (denomination == "BTC") {

  cryptoCurrency = globals.LNCurrency;

}

var qrcode = require("requires/qrcode");

var inputverify = require("requires/inputverify");
var isFiatMode = false;
var FiatSymbol = globals.tiker.getFiatSymbol(currencyFiat);
globals.console.log("fiat symbol", FiatSymbol);
var timer = null;
var fiat_conf = "";
var fiatValue = globals.tiker.getFiatValue(currencyFiat, denomination);

globals.console.log("fiat value", fiatValue);

var currentPaymentRequest = "";
$.requestLabel.title = $.requestLabel.title.toUpperCase();
var needsToRefreshInvoices = false;

$.numberPadDot.hide();

function switchAmount(e) {

  if (!isFiatMode) {
    $.numberPadDot.show();
    isFiatMode = true;
    inputValue = $.fiat.text.replace(FiatSymbol, "").replace(/[^\d.-]/g, "");

    $.fiat.top = 0;
    $.fiat.applyProperties($.createStyle({
      classes: "size40 white",
      apiName: "Label"
    }));

    $.amountView.top = 45;
    $.amountSat.bottom = 0;
    $.amount.applyProperties($.createStyle({
      classes: "size20 white bold",
      apiName: "Label"
    }));
    $.amountSat.applyProperties($.createStyle({
      classes: "size12 white",
      apiName: "Label"
    }));
  } else {
    $.numberPadDot.hide();
    isFiatMode = false;
    inputValue = $.amount.text;

    $.fiat.top = 45;
    $.fiat.applyProperties($.createStyle({
      classes: "size20 white fiat",
      apiName: "Label"
    }));

    $.amountView.top = 0;
    $.amountSat.bottom = 5;
    $.amount.applyProperties($.createStyle({
      classes: "size40 white bold",
      apiName: "Label"
    }));
    $.amountSat.applyProperties($.createStyle({
      classes: "size20 white amountSat",
      apiName: "Label"
    }));
  }

}

function showHideLoading(hide) {
  if (hide) {
    $.blockingView.hide();
    $.requestSpinner.hide();
    $.requestLabel.show();
    $.win.touchEnabled = true;
    return;
  }
  $.blockingView.show();
  $.requestSpinner.show();
  $.requestLabel.hide();
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

  if (needsToRefreshInvoices) {
    globals.listPayments();
  }

  if (OS_ANDROID) {
    $.win.close();
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

$.inputMemo.hintText = L("request_memo");
$.inputMemo.hintTextColor = "gray";

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

$.amount.text = "0";
$.amountSat.text = cryptoCurrency;

$.keypad.height = globals.display.height - 225;

function checkAndSetValue() {
  globals.console.log("checkAndSetValue");
  if (globals.tiker) {
    clearInterval(timer);

    updateFields({
      source: {
        id: "numberPad0"
      }
    });
  }
}
timer = setInterval(checkAndSetValue, 500);

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

function updateFields(button, abstAmount) {

  function updateTheField(button, abstAmount) {
    if (abstAmount != null) {
      inputValue = abstAmount;
    } else if (button.source.id === "numberPadDel") {
      if (inputValue.length > 0) inputValue = inputValue.slice(0, inputValue.length - 1);
      if (inputValue.length <= 0) inputValue = "0";
      if (inputValue.length == undefined) inputValue = "0";
    } else if (button.source.id === "numberPadDot") {
      if (inputValue.indexOf(".") <= -1) inputValue = "" + inputValue + ".";
    } else {
      var intValue = button.source.id.replace("numberPad", "");

      if (inputValue === "0") inputValue = intValue;
      else inputValue = inputValue + intValue;
    }

    return inputValue;
  }

  if (button != null) {
    updateTheField(button, abstAmount);
  } else {
    inputValue = abstAmount;
  }
  globals.console.log(fiatValue);

  if (!isFiatMode) {
    $.amount.text = inputValue;

    var val = (inputValue * fiatValue).toFixed2(4);
    if (fiatValue == 0) val = 0;
    $.fiat.text = FiatSymbol + addCommas(val);

  } else {
    $.fiat.text = FiatSymbol + addCommas(inputValue);
    $.amount.text = parseInt((inputValue / fiatValue) + "");
  }

}

function setValues(vals) {
  vals.asset = globals.LNCurrencySat;

  if (vals.currency != null) vals.extras = {
    "currency": vals.currency
  };
  if (vals.address != null) {
    $.inputMemo.value = vals.address.toString();

    if (vals.amount != null) {
      updateFields(null, vals.amount);
    }
  }

}

function closeQR() {
  $.qrCodeInner.removeAllChildren();
  $.qrcode.hide();
}

function pressedRequest() {

  $.inputMemo.blur();
  var amountString = $.amount.text.toString();
  globals.console.log("amount is ", amountString);
  var quantity = amountString.replace(/[^\d.-]/g, "");

  quantity = parseInt(quantity);

  if (quantity == 0) {
    alert(L("enter_amount_request"));
    return;
  }
  showHideLoading(false);

  var memo = $.inputMemo.value;
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

if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
  setTimeout(function () {
    alert(L("confirm_request"));
  }, 2000);

}