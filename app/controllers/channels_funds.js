$.channelsFunds.height = Ti.Platform.displayCaps.platformHeight - Alloy.Globals.btclnTopBarHeight;
$.channelsFunds.top = Alloy.Globals.btclnTopBarHeight;
$.channels.top = $.switchTab.height;
$.funds.top = $.switchTab.height;
globals.switchTabHeight = $.switchTab.height;
var walletConfirmedBalance = 0;
var walletUnconfirmedBalance = 0;

globals.channelsFundsView = $.getView();
setBalances();

globals.currentOnchainBalance = 0;

$.onchain_description.hide();

function close(e) {
  globals.console.log("closed");

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

  setTimeout(function() {
    $.win.width = 0;
    $.win.close();
  }, 200);
}

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

$.statusText.text = L('loading_balance');
$.totalBalanceFiat.hide();
$.totalBalance.hide();
globals.getWalletBalance = function() {
  $.statusText.text = L('loading_balance');
  $.totalBalanceFiat.hide();
  $.totalBalance.hide();
  globals.console.log("getting wallet balance");

  globals.lnGRPC.getWalletBalance(function(error, response) {
    $.statusText.text = "";
    $.onchain_description.show();
    if (error == true) {
      globals.console.error("error", error);
    }

    globals.console.log("get wallet balance", response);

    if (response.confirmed_balance != undefined) {
      walletConfirmedBalance = parseInt(response.confirmed_balance);
      globals.currentOnchainBalance = walletConfirmedBalance;
      if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
        Ti.App.Properties.setInt("last_wallet_balance", walletConfirmedBalance);
      }
    }

    if (response.unconfirmed_balance != undefined) {
      walletUnconfirmedBalance = parseInt(response.unconfirmed_balance);

    }

    setBalances();

    $.totalBalanceFiat.show();
    $.totalBalance.show();

  });

}

setTimeout(function() {
  globals.getWalletBalance();
}, 300);

function setBalances() {
  var currency = globals.LNCurrency;

  walletUnconfirmedValue = globals.util.satToBtc(walletUnconfirmedBalance);

  if (walletUnconfirmedBalance == 0) {
    walletUnconfirmedValue = "";
  } else {
    walletUnconfirmedValue = "\n" + L("unconfirmed") + ": " + walletUnconfirmedValue;
  }
  walletConfirmedValue = globals.util.satToBtc(parseInt(walletConfirmedBalance), true);

  var totalText = walletConfirmedValue + " " + currency + " " + walletUnconfirmedValue

  var walletConfirmedValueFiat = globals.util.satToBtc(parseInt(walletConfirmedBalance));

  var currencyFiat = Ti.App.Properties.getString("currency", "USD");

  var walletConfirmedValueFiat = globals.tiker.to("BTC", walletConfirmedValueFiat, currencyFiat, 2);

  if (Alloy.Globals.network == "testnet") {
    currencyFiat = "t" + currencyFiat;
  }
  var totalTextFiat = walletConfirmedValueFiat + " " + currencyFiat;

  var attrTotal = Ti.UI.createAttributedString({
    text: totalText,
    attributes: [{
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
          fontSize: 60,
          fontFamily: Alloy.Globals.lightFont,
          fontWeight: "light",
        },
        range: [totalText.indexOf(walletConfirmedValue + ""), (walletConfirmedValue + "").length]
      },
      {
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
          fontSize: 30,
          fontFamily: Alloy.Globals.lightFont,
          fontWeight: "light",
        },
        range: [totalText.indexOf(" " + currency), (" " + currency).length]
      },
      {
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
          fontSize: 15,
          fontFamily: Alloy.Globals.lightFont,
          fontWeight: "light",
        },
        range: [totalText.indexOf(" " + walletUnconfirmedValue), (" " + walletUnconfirmedValue).length]
      }
    ]
  });

  $.totalBalance.attributedString = attrTotal;

  attrTotal = Ti.UI.createAttributedString({
    text: totalTextFiat,
    attributes: [{
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
          fontSize: 30,
          fontFamily: Alloy.Globals.lightFont,
          fontWeight: "light",
        },
        range: [totalTextFiat.indexOf(walletConfirmedValueFiat + ""), (walletConfirmedValueFiat + "").length]
      },
      {
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
          fontSize: 30,
          fontFamily: Alloy.Globals.lightFont,
          fontWeight: "light",
        },
        range: [totalTextFiat.indexOf(" " + currencyFiat), (" " + currencyFiat).length]
      }
    ]
  });

  $.totalBalanceFiat.attributedString = attrTotal;

}

function selectChannels() {

  $.channelsTab.backgroundColor = Alloy.Globals.mainColorDarker;
  $.fundsTab.backgroundColor = Alloy.Globals.mainColorLighter;
  $.fundsTab.opacity = 0.5;
  $.channelsTab.opacity = 1.0;
  $.channels.show();
  $.funds.hide();

  if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
    if (Ti.App.Properties.getBool("didShowGuideScreenChannels", false) == false || globals.allwaysShowGuides) {
      Ti.App.Properties.setBool("didShowGuideScreenChannels", true)
      setTimeout(function() {
        Alloy.createController("/components/guide_screen", {
          title: L("channels"),
          text: L("channels_help")
        }).getView().open();
      }, 300);
    }
  }

  globals.getChannels();
}

function selectFunds() {
  $.fundsTab.opacity = 1.0;
  $.channelsTab.opacity = 0.5;
  $.fundsTab.backgroundColor = Alloy.Globals.mainColorDarker;
  $.channelsTab.backgroundColor = Alloy.Globals.mainColorLighter;
  $.channels.hide();
  $.funds.show();
}

selectFunds();

if (Ti.App.Properties.getString("mode", "") == "lndMobile") {

  if (Ti.App.Properties.getBool("didShowGuideScreenDeposit", false) == false || globals.allwaysShowGuides) {
    setTimeout(function() {
      Ti.App.Properties.setBool("didShowGuideScreenDeposit", true)
      Alloy.createController("/components/guide_screen", {
        title: L("deposit"),
        text: L("deposit_help"),
      }).getView().open();
    }, 500);

  }
}