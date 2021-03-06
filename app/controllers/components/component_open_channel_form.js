var currencyFiat = Ti.App.Properties.getString("currency", "USD");

$.mainView.height = globals.util.getDisplayHeight();

function androidChangeValue() { //keypressed event not firing on android
  if (OS_ANDROID) {
    updateAmount()
  }
}

function androidChangeValueFiat() {
  if (OS_ANDROID) {
    updateAmountFiat()
  }
}

function setUp() {

  $.amountField.addEventListener("change", function (e) {

  });

  $.amountFieldFiat.addEventListener("change", function (e) {
    updateAmountFiat()

  });
  currencyFiat = Ti.App.Properties.getString("currency", "USD");
  $.amountFieldFiat.hintText = L('label_enter_funding_hint').format({
    "currency": currencyFiat
  });
  $.status.hide();
  $.form.show();

  $.openChannelButton.title = "  " + L('open_channel_text') + "  ";
  $.recButton.title = "  " + L('set_rec_channel') + "  ";

  $.cryptoSymbol.text = globals.LNCurrencySat;

  $.fiatSymbol.text = currencyFiat

}

function hideKeyboard() {

  $.peerField.blur();
  $.amountField.blur();
  $.amountFieldFiat.blur();

}

function setRec() {

  var valueAmt = globals.getRecommendedChannelAmount();
  $.amountField.value = valueAmt + "";
  updateAmount();
}
exports.API = {
  setUp: function () {
    setUp()
  },
  setPubKey: function (pubkey) {
    $.peerField.value = pubkey;
  }
};

function updateAmountFiat() {
  setTimeout(function () {
    if ($.amountFieldFiat.value.length == 0) {
      $.amountField.value = "0";
      return;
    }

    var amountString = $.amountFieldFiat.value;
    console.log("fv", fiatValue);

    var FiatSymbol = globals.tiker.getFiatSymbol(currencyFiat);

    amountString = amountString.replace(FiatSymbol, "");

    if (amountString == "") {
      amountString = "0";
    }
    var amount = parseFloat(amountString);

    var fiatValue = globals.tiker.getFiatValue(currencyFiat);

    var cryptoAmount = amount / fiatValue;
    var valueAmt = Math.floor(globals.util.btcToSat(cryptoAmount));

    $.amountField.value = valueAmt;

  }, 100);
}

function updateAmount() {
  setTimeout(function () {
    if ($.amountField.value.length == 0) {
      $.amountFieldFiat.value = "0";
      return;
    }
    var amount = parseInt($.amountField.value);
    var currency = Ti.App.Properties.getString("currency", "USD");

    var valueAmt = globals.util.satToBtc(amount, true);

    valueAmt = globals.tiker.to("BTC", valueAmt, currency, 2);
    $.amountFieldFiat.value = valueAmt;

  }, 100);
}

function startOpenChannel() {

  var lnd = Alloy.Globals.lnd;

  var lightningAddress = $.peerField.value;

  globals.console.log(lightningAddress);

  var pubKey = lightningAddress.split('@')[0];
  var host = lightningAddress.split('@')[1];
  globals.console.log(pubKey);
  globals.console.log(host);
  $.status.text = L("label_loading")
  $.status.show();
  $.form.hide();
  $.amountField.blur();
  $.peerField.blur();
  globals.lnGRPC.connectPeer(lightningAddress,

    function (error, res) {

      globals.console.log("res", res);
      var peerAlreadyAdded = false;

      if ((res + "").indexOf("already connected") != -1) {

        peerAlreadyAdded = true;

      }

      if (error == true && peerAlreadyAdded == false) {

        var confView = Alloy.createController('components/conf_screen', {
          parent: $.getView(),
          errorMessage: res,
          type: "fail",
          callback: function () {
            globals.getWalletBalance();
            globals.listPayments();
            close();
          }
        }).getView();

        $.status.hide()
        $.form.show();

      } else {

        globals.console.log("res", res);

        globals.console.log(pubKey);
        var amount = $.amountField.value;
        globals.console.log("trying to open channel");
        globals.lnGRPC.openChannel(pubKey, amount,
          function (error, res) {
            globals.console.log("error", error);
            if (error == true) {
              globals.console.log("is error", error);
              var confView = Alloy.createController('components/conf_screen', {
                parent: $.getView(),
                errorMessage: res,
                type: "fail",
                callback: function () {
                  globals.getWalletBalance();
                  globals.listPayments();
                  close();
                }
              }).getView();
              $.status.hide()
              $.form.show();
            } else {

              globals.console.log("res is ", res);

              var fundingTxidStr = res['funding_txid_str'];
              globals.console.log("funding tx", fundingTxidStr);
              if (fundingTxidStr != undefined) {
                $.statusLabel.text = L("label_channel_opening")
              }
              setTimeout(function () {
                close();
                if (Alloy.Globals.getChannels != undefined) {
                  Alloy.Globals.getChannels();

                }
              }, 2000)

            }

          });

      }

    });

}

var startScan = function () {

  Alloy.Globals.util.readQRcodeNormal({
    callback: function (e) {
      globals.console.log(e);
      globals.console.log("callback ", e);

      var qrcodeData = e;

      $.peerField.value = qrcodeData;

    },
    textCallback: function (e) {

      globals.console.log(e);

    }
  });
};

function close() {

  globals.lnGRPC.clearChannelChecker();

  $.amountField.blur();

  $.amountFieldFiat.blur();

  $.boxView.animate({
    "curve": Ti.UI.ANIMATION_CURVE_EASE_IN_OUT,
    "opacity": 0.0,
    "duration": 200
  },
    function () {
      $.args.parent.remove($.getView());
      $.boxView.opacity = 1;

      $.status.hide()
      $.form.show();
    });

}

setUp();

$.args.parent.add($.getView());