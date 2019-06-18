var args = arguments[0] || {};
var currencyFiat = Ti.App.Properties.getString("currency", "USD");
$.blockingView.hide();
var timer = null;

$.sendLabel.title = $.sendLabel.title.toUpperCase();


var isFiatMode = false;
var FiatSymbol = globals.tiker.getFiatSymbol(currencyFiat);
$.fiatSymbol.text = FiatSymbol;

globals.console.log("fiat symbol", FiatSymbol);
var timer = null;
var fiat_conf = "";
var fiatValue = globals.tiker.getFiatValue(currencyFiat, "BTC");

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
    val = inputValue.toFixed2(4);
    if (isNaN(val)) {
      val = 0;
    }
    $.amount.value = val;
    coolDown = false;
  }

}
function showHideLoading(hide) {
  if (hide) {
    $.blockingView.hide();
    $.sendSpinner.hide();
    $.sendLabel.show();
    $.win.touchEnabled = true;
    return;
  }
  $.blockingView.show();
  $.sendSpinner.show();
  $.sendLabel.hide();
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

$.inputDestination.hintText = L("label_send_destination");
$.inputDestination.hintTextColor = "gray";

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
$.amountBTC.text = globals.LNCurrency;


function switchAmount(e) {

  if (!isFiatMode) {
    isFiatMode = true;
    inputValue = $.fiat.value.replace(FiatSymbol, "").replace(/[^\d.-]/g, "");

    $.fiat.top = 0;
    $.fiat.applyProperties($.createStyle({
      classes: "size40 white",
      apiName: "Label"
    }));

    $.amountView.top = 45;
    $.amountBTC.bottom = 0;
    $.amount.applyProperties($.createStyle({
      classes: "size20 white bold",
      apiName: "Label"
    }));
    $.amountBTC.applyProperties($.createStyle({
      classes: "size12 white",
      apiName: "Label"
    }));
  } else {
    isFiatMode = false;
    inputValue = $.amount.value;

    $.fiat.top = 45;
    $.fiat.applyProperties($.createStyle({
      classes: "size20 white fiat",
      apiName: "Label"
    }));

    $.amountView.top = 0;
    $.amountBTC.bottom = 5;
    $.amount.applyProperties($.createStyle({
      classes: "size40 white bold",
      apiName: "Label"
    }));
    $.amountBTC.applyProperties($.createStyle({
      classes: "size20 white amountBTC",
      apiName: "Label"
    }));
  }

}

function setFeeLabel(fee) {
  globals.console.log("setting fee label", fee)
  currentFee = fee;
  if (isFinite(currentFee)) {
    $.priorityLabel.text = currentFee + " " + globals.LNCurrencySat + " ▼";
  }
  else {
    $.priorityLabel.text = globals.feeTexts[currentFee] + "▼";
  }

}
function hideKeyboard(e) {
  $.fiat.blur();
  $.amount.blur();
}

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
    $.amount.value = inputValue;

    var val = (inputValue * fiatValue).toFixed2(4);
    if (fiatValue == 0) val = 0;
    $.fiat.value = addCommas(val);

  } else {
    $.fiat.value = addCommas(inputValue);
    $.amount.value = (inputValue / fiatValue).toFixed2(4) + "";
  }

}

function setValues(vals) {

  if (vals.currency != null) vals.extras = {
    "currency": vals.currency
  };
  if (vals.address != null) {
    $.inputDestination.value = vals.address.toString();

    if (vals.amount != null) {
      $.amount.value = vals.amount;
    }
  }

}

function prioritySet() {
  Alloy.createController("priority", {
    "setFeeLabel": setFeeLabel,
  })
    .getView().open();
}

function scanQRCode() {
  globals.util.readQRcodeNormal({
    "callback": setValues
  }, false);
}

function pressedSend() {

  var result = null;
  var quantity = $.amount.value.replace(/[^\d.-]/g, "");
  quantity = parseFloat(quantity);
  quantity = globals.util.btcToSat(quantity);

  if ($.inputDestination.value.length == 0) {
    alert(L("label_enter_destination"));
    return;
  }

  if (quantity == 0) {
    alert(L("label_quantity_send"));
    return;
  }

  showHideLoading(false);

  globals.console.log("currentFee", currentFee);
  if (!isNaN(currentFee)) {
    continueSend(quantity, currentFee);
  } else {
    globals.networkAPI.connectGET({
      "chain": "btc",
      "version": "v1",
      "method": "transactions/estimatefee",
      "callback": function (result) {
        globals.console.log("fees res", result);

        fee = parseInt((result[currentFee] / 1000) + "");


        continueSend(quantity, fee);

      },
      "onError": function (error) {
        globals.console.error(error);
        showHideLoading(true);
        var dialog = globals.util.createDialog({
          "title": error.type,
          "message": "error calculating fees, please set a custom sat fee and try again",
          "buttonNames": [L("label_close")]
        }).show();
      }
    });

  }

};

function sendAll() {

  if ($.inputDestination.value.length == 0) {
    alert(L("label_enter_destination"));
    return;
  }
  var dialog = globals.util.createDialog({
    title: L("label_confirm"),
    message: L("label_send_all_check").format({ "address": $.inputDestination.value }),
    buttonNames: [L("label_send"), L("label_close")]
  });
  dialog.addEventListener("click", function (e) {
    if (e.index != e.source.cancel) {
      showHideLoading(false);
      continueSend(-1, -1);
    }
  });
  dialog.show();


}

function continueSend(quantity, fee) {
  globals.console.log("current fee", fee);

  globals.lnGRPC.sendCoins(quantity, $.inputDestination.value, parseInt(fee), function (error, response) {
    showHideLoading(true);
    if (error == true) {

      alert(response);
      return;
    }
    globals.console.log("send coins res", response);
    globals.util.saveTxid(response.txid, $.inputDestination.value);
    var confView = Alloy.createController('components/conf_screen', {
      parent: $.win,
      isInvoice: false,
      token: globals.LNCurrency,
      type: "success",
      callback: function () {
        if (globals.getWalletBalance != undefined) {
          globals.getWalletBalance();
        }
        if (globals.listPayments != undefined) {
          globals.listPayments();
        }
        close();
      }
    }).getView();

  });
}


if (args.destination != undefined) {
  $.inputDestination.value = args.destination;
}

if (args.amount != undefined) {
  updateFields(null, args.amount);
}


$.balance.text = L("loading");

setTimeout(function () {
  globals.lnGRPC.getWalletBalance(function (error, response) {

    if (response.confirmed_balance == undefined) {

      response.confirmed_balance = 0;

    }
    globals.console.log("blance ", response.confirmed_balance)

    globals.console.log("blance ", parseInt(response.confirmed_balance))
    globals.currentOnchainBalance = parseInt(response.confirmed_balance);
    $.balance.text = globals.util.satToBtc(globals.currentOnchainBalance) + " " + globals.LNCurrency;


  });

}, 1000);