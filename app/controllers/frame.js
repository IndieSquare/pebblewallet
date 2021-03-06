globals.LNCurrencySat = "sat";
$.nodeInfo.top = globals.util.getDisplayHeight();
$.nodeInfo.hide();
$.nodeInfo.height = globals.util.getDisplayHeight();
$.nodeInfo.width = globals.util.getDisplayWidth();
var didGetArguments = false;
var walletConfirmedBalance = 0;
var channelConfirmedBalance = 0;
var andTimeSince100 = 0;
var totalConfirmedBalance = 0;
var continueSyncTimeout = null;
globals.nodeInfo = null;
globals.lnConnected = false;

globals.fiatMode = false;

globals.updateValuesFuncs = [];

if (OS_ANDROID) {
  $.walletName.top = Alloy.Globals.infoTop + 10;
  $.syncStatus.top = Alloy.Globals.infoTop + 10;
}

function setTestnet() {
  globals.console.log("setting testnet");
  Alloy.Globals.network = "testnet";
  globals.LNCurrency = "tBTC";
  globals.LNCurrencySat = "tSat";
  globals.dappStoreUrl = globals.discoverEndpoint + "?lndbtcMode=true&testnet=true";
  globals.console.log("dappStoreUrl", globals.dappStoreUrl);

}

function setMainnet() {
  globals.console.log("setting mainnet");
  Alloy.Globals.network = "mainnet";
  globals.LNCurrency = "BTC";
  globals.LNCurrencySat = "sat";
  globals.dappStoreUrl = globals.discoverEndpoint + "?lndbtcMode=true&testnet=false";
  globals.console.log("dappStoreUrl", globals.dappStoreUrl);


}

globals.connectLNDGRPC = function (config) {
  globals.synced = true;
  globals.didGetTransactionsOnce = false;
  globals.hideNoTransactions();
  stopSyncUI();
  clearTimeout(continueSyncTimeout);
  /*if (OS_IOS) {
    Ti.App.iOS.cancelLocalNotification("check");
  }*/
  globals.console.log("connectLNDGRPC")
  globals.clearTransactionsTable();
  globals.showTransactionsLoader();

  $.statusText.text = "";
  $.connecting.visible = true;
  $.syncStatus.visible = false;
  $.totalBalanceFiat.text = "";
  $.totalBalance.text = "";

  Ti.App.Properties.setString("mode", "grpc");
  Alloy.Globals.openChannels = [];

  Alloy.Globals.pendingChannels = [];
  globals.console.log("connectLNDGRPC")
  var configRes = globals.parseConfig(config);
  globals.console.log("connectLNDGRPC continue")
  if (configRes == "error") {
    alert("error unable to connect");
    return;
  }
  globals.LNCurrency = "BTC";
  globals.LNCurrencySat = "sat";
  setMainnet();
  if (configRes.chainType != undefined) {
    if (configRes.chainType.toLowerCase() == "testnet") {
      setTestnet();
    }
  }

  globals.console.log("connectLNDGRPC 2")

  globals.lnGRPC.connect(configRes.url, configRes.port, configRes.certificate, configRes.macaroon, function (error, response) {
    $.walletName.text = "";
    globals.nodeInfo = null;
    globals.console.log("connecting...");
    $.connecting.visible = false;
    $.statusText.text = L("connecting");

    if (error == true) {
      globals.console.log("error", error);
      alert(error);
      return;
    }

    globals.console.log("response", response);

    globals.console.log("getting info");

    globals.lnGRPC.getInfo("", function (error, response) {
      if (error == true) {
        globals.console.error("get info error", error);
        globals.console.error("get info error", response);

        var dialog = globals.util.createDialog({
          title: "",
          message: L('error_connecting'),
          buttonNames: [L("label_tryagain")]
        });
        dialog.addEventListener("click", function (e) {
          globals.connectLNDGRPC(config);
        });
        dialog.show();
        return;

      }
      globals.synced = true;
      globals.nodeInfo = response;
      globals.setNodeInfo(globals.nodeInfo);

      if (response.testnet == true) {
        setTestnet();
      }

      globals.lnConnected = true;
      globals.console.log("info", response);

      globals.console.log("getting wallet balance");

      if (response.alias != undefined) {

        $.walletName.text = response.alias;
        if (response.alias == undefined || response.alias == "") {
          $.walletName.text = L('wallet_info')
        }
      }

      globals.loadMainScreen();

      var details = response;
      details.config = globals.encryptConfig(config, globals.userKey);
      if (details.config != undefined) {
        globals.addAccounts(response.identity_pubkey, details)
        Ti.App.Properties.setString("currentGRPCAccount", response.identity_pubkey);
      } else {
        alert("error adding account");
      }

    });

  });

};

globals.loadMainScreen = function (dontShowSpinner) {

  globals.menuWidget.show();
  globals.lnGRPC.getChannelBalance(function (error, response) {
    $.statusText.text = "";

    if (error == true) {
      globals.console.log("error", error);
    }

    globals.console.log("get channel balance", response.balance);

    channelConfirmedBalance = 0;
    if (response.balance != undefined) {
      channelConfirmedBalance = parseInt(response.balance);
    }

    if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
      Ti.App.Properties.setInt("last_channel_balance", channelConfirmedBalance);
      if (globals.bootstrap == true) {
        globals.lightning_manager.bootStrapChannel(); //try to open one channel to pebble hub
      }

    }
    totalConfirmedBalance = channelConfirmedBalance;

    setBalances(true);

    globals.listPayments(dontShowSpinner);
    startSubscribeInvoices();


    globals.tryAndBackUpChannels();

    globals.canProcessArgs = true;
    if (didGetArguments == false) {
      didGetArguments = true;
      globals.console.log("processing args start");

      globals.processArgs();

    }


  });

}

function startSubscribeInvoices() {

  globals.console.log("starting subscribe invoice");
  setTimeout(function () {
    globals.lnGRPC.subscribeInvoices(function (error, response) {


      globals.console.log("invoice subscription res", error, response);

      if (error == false) {
        console.log("invoice res", response);

        if (response.settled != undefined && response.settled == true) {

          if (globals.updateCurrentInvoice != undefined) {
            globals.updateCurrentInvoice(response);

          }

          var cellUpdateFunction = globals.invoiceUpdateFunctions[response.r_hash];
          if (cellUpdateFunction != undefined) {
            cellUpdateFunction(response);
          }

        }
      } else {
        if (response.indexOf("io.grpc.StatusRuntimeException:") != -1) { //some bug in grpc or btcpay if this error shows need to restart subscription invoice
          globals.console.log("restart invoice subscription");
          startSubscribeInvoices();
        }


      }

    });
  }, 1000);
}




function startSubscribeTransactions() {
  globals.console.log("starting subscribe transactions");
  setTimeout(function () {
    globals.lnGRPC.subscribeTransactions(function (error, response) {

      if (error == false) {

        console.log("subscription res", response);

      } else {

        startSubscribeTransactions();

      }

    });
  }, 1000);
}

function switchFiatBTC() {

  if (globals.fiatMode == false) {
    globals.fiatMode = true;
  } else {
    globals.fiatMode = false;
  }
  setBalances();

  for (var i = 0; i < globals.updateValuesFuncs.length; i++) {
    globals.updateValuesFuncs[i]();
  }
}

function setBalances() {
  var channelConfirmedValueBTC = globals.util.satToBtc(parseInt(channelConfirmedBalance), true);

  var currentCurrency = globals.LNCurrencySat;

  var channelConfirmedValueStr = "";
  if (Ti.App.Properties.getString("denomination", "") == "BTC") {

    channelConfirmedValueStr = channelConfirmedValueBTC;
    currentCurrency = globals.LNCurrency;
  } else {
    channelConfirmedValueStr = parseInt(channelConfirmedBalance).toLocaleString();
  }



  globals.console.log("confirmed bal", channelConfirmedValueStr);
  var totalText = channelConfirmedValueStr + " " + currentCurrency;

  var channelConfirmedValueFiat = globals.util.satToBtc(parseInt(channelConfirmedBalance));

  var currencyFiat = Ti.App.Properties.getString("currency", "USD");

  var channelConfirmedValueFiat = globals.tiker.to("BTC", channelConfirmedValueFiat, currencyFiat, 2);

  if (Alloy.Globals.network == "testnet") {
    currencyFiat = "t" + currencyFiat;
  }
  var totalTextFiat = channelConfirmedValueFiat + " " + currencyFiat;

  var attrTotal = Ti.UI.createAttributedString({
    text: totalText,
    attributes: [{
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 50,
        fontFamily: Alloy.Globals.lightFont,
        fontWeight: "light",
      },
      range: [totalText.indexOf(channelConfirmedValueStr), (channelConfirmedValueStr).length]
    },
    {
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 30,
        fontFamily: Alloy.Globals.lightFont,
        fontWeight: "light",
      },
      range: [totalText.indexOf(" " + currentCurrency), (" " + currentCurrency).length]
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
      range: [totalTextFiat.indexOf(channelConfirmedValueFiat + ""), (channelConfirmedValueFiat + "").length]
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

function didLoad() {

}

globals.btclnView = $.win;

globals.console.log("opened");

globals.launchPayScan = function () {

  globals.util.readQRcodeInvoice({
    "callback": globals.continuePay
  }, true);

};

globals.continuePay = function (req) {


  globals.console.log("req", req);

  if (req.toLowerCase().startsWith("lnurl") || req.toLowerCase().startsWith("lightning:lnurl")) {

    req = req.replace("lightning:", "");
    req = req.replace("LIGHTNING:", "");

    globals.console.log("lnurl", req);

    try {
      var bech32 = require('vendor/util/bech32')

      var dec = bech32.decode(req, 30000)

      let bytes = globals.bitcoin.bitcoin.buffer.from(bech32.fromWords(dec.words))

      var url = bytes.toString('utf8');

      globals.console.log("url", url);
      var requestResult = null;
      var callbackUrl = "";
      Alloy.createController("confirmation_screen", {
        "showLoading": true,
        "message": "",
        "cancel": function () {
        },
        "first": function (controller,errorCallback) {


          var xhr = Ti.Network.createHTTPClient({
            onload: function (e) {

              globals.console.log("response data", this.responseText);
              requestResult = JSON.parse(this.responseText); 

               callbackUrl = requestResult.callback + "?k1=" + requestResult.k1 + "&remoteid=" + globals.currentPubkey + "&private=0";

              globals.console.log("callback url", callbackUrl);

              if (requestResult.tag == "channelRequest") {

                var message = L("channel_request").format({ "uri": requestResult.callback, "capacity": requestResult.capacity, "push":requestResult.push })

                  controller.setMessage(message);

              }



            },
            onerror: function (e) {
              Ti.API.debug(e.error);
              alert(e.error);
              errorCallback();
            },
            timeout: 5000 // milliseconds
          });

          xhr.open('GET', url);
          xhr.send();
        },
        "task": function (callback, errorCallback) {

          globals.lnGRPC.connectPeer(requestResult.uri,

            function (error, res) {

              globals.console.log("res", res);
              globals.console.log("error", error);
              var peerAlreadyAdded = false;

              if ((res + "").indexOf("already connected") != -1) {

                peerAlreadyAdded = true;

              }

              if (error == 1) {
                error = true;
              }

              if (error == true && peerAlreadyAdded == false) {
                errorCallback();
                return;
              }
              
              globals.console.log("requesting channel",callbackUrl);

              var xhr = Ti.Network.createHTTPClient({
                onload: function (e) {
                  globals.console.log("response data", this.responseText);

                  callback();

                },
                onerror: function (e) {
                  Ti.API.debug(e.error);
                  errorCallback();
                  alert(e.error);

                },
                timeout: 8000 // milliseconds
              });

              xhr.open('GET', callbackUrl);
              xhr.send();

 
            });
        }
        ,
        "confirm": function () {




        },

      });





    }
    catch (e) {
      alert(e);
    }


    return;
  }



  if (req.indexOf("bitcoin:") != -1) {
    var decodedURI = globals.bitcoin.decodeBip21(req);

    if (decodedURI.address != undefined) {
      try {
        Alloy.createController("withdraw", {
          destination: decodedURI.address,
          amount: decodedURI.amount
        }).getView().open();
      } catch (e) {
        globals.console.log(e);
      }
    }
    return;
  }

  if (globals.bitcoin.validateAddress(req, Alloy.Globals.network) == true) {

    Alloy.createController("withdraw", {
      destination: req,
    }).getView().open();
    return;
  }

  if (req.indexOf("lightning:") != -1) {
    req = req.replace("lightning:", '');
  }

  if (req.indexOf("LIGHTNING:") != -1) {
    req = req.replace("LIGHTNING:", '');
  }
  globals.lnGRPC.decodePayReq(req, function (error, res) {

    if (error == true) {
      alert(res);
      return;
    }

    globals.console.log(res.payment_hash);

    if (res.payment_hash != undefined) {

      var rhash = res.payment_hash;

      globals.console.log(res);
      var memo = null;

      if (res.description != undefined) {
        memo = res.description;
      }

      if (globals.bitcoin.checkExpired(res)) {

        alert(L('text_payment_expired'));
        return;
      }

      var urlName = "";

      if (urlName.length > 10) {
        urlName = urlName.substr(0, 10) + "...";
      }
      var needsAmount = false;

      if (res.num_satoshis == 0) {
        res.num_satoshis = undefined;
      }

      var message = L('text_request_pay_ln').format({
        "url": urlName,
        "value": res.num_satoshis,
      });
      if (res.num_satoshis == undefined) {
        var message = L('text_request_pay_ln_no_amount').format({
          "url": urlName,
        });
      }
      if (memo != null) {
        message = L('text_request_pay_ln_memo').format({
          "url": urlName,
          "memo": memo,
          "value": res.num_satoshis
        });
        if (res.num_satoshis == undefined) {
          message = L('text_request_pay_ln_memo_no_amount').format({
            "url": urlName,
            "memo": memo,
          });
        }

      }
      if (res.num_satoshis == undefined) {
        needsAmount = true;
      }
      Alloy.createController("transaction_conf", {
        "small": true,
        "message": message,
        "payReq": req,
        "needsAmount": needsAmount,
        "cancel": function () {
          lock = false;
        },
        "confirm": function () {

          globals.console.log("setting memo", rhash + " " + memo)
          Ti.App.Properties.setString("memo_" + rhash, memo);

          globals.loadMainScreen();

          lock = false;

        },

      });
    }

  });

}

$.connecting.visible = true;

globals.getStartUpInfo(function () {
  if (globals.unlocked == true) {
    continueLoad();
  } else {
    globals.auth.check({
      "title": "",
      "callback": function (e) {
        if (e.success) {
          continueLoad();

        }
      }
    });
  }

});
function continueLoad() {

  if (globals.tikerLoaded == false) {

    globals.tiker.getTiker(function () {

      if (globals.stopHyperloop == false) {

        startLoadFromCache()
      }

    });
  } else {
    setTimeout(function () {

      if (globals.stopHyperloop == false) {
        startLoadFromCache()
      }
    }, 100);
  }
}

globals.startLNDMobile = function () {
  globals.didGetTransactionsOnce = false;
  globals.console.log("starting lnd");
  globals.nodeInfo = null;
  $.walletName.text = "";
  $.statusText.text = "";
  $.totalBalanceFiat.text = "";
  $.totalBalance.text = "";
  globals.clearTransactionsTable();
  globals.showTransactionsLoader();

  Ti.App.Properties.setString("mode", "lndMobile")
  startLoadFromCache()

}

function startLoadFromCache() {

  globals.nodeInfo = null;
  $.walletName.text = "";
  if (globals.stopHyperloop == true) {
    return;
  }

  if (Ti.App.Properties.getString("mode", "") == "lndMobile") {

    if (Alloy.Globals.network == "testnet") {

      setTestnet();

    } else {

      setMainnet();

    }

    $.connecting.visible = false;
    $.syncStatus.visible = false;
    $.statusText.text = L("initializing_wallet");


    if (globals.alreadyUnlocked == false) {
      globals.console.log("starting lnd mobile");
      globals.lnGRPC.startLNDMobile(function (error, response) {

        console.log("lndMobile1", error);
        console.log("lndMobile1", response);

        if (error == true) {
          alert(response);
          return;
        }

        globals.lnGRPC.unlockWallet(globals.createPassword(globals.passCodeHash), -1, "", function (error, response) {
          console.log("unlock wallet err ", error);
          console.log("unlock wallet", response);

          if (error == true) {
            alert(response);
            return;
          }

          globals.alreadyUnlocked = true;


          setTimeout(function () {
            if (Ti.App.Properties.getBool("didShowGuideScreenSync", false) == false || globals.allwaysShowGuides) {
              Ti.App.Properties.setBool("didShowGuideScreenSync", true)
              Alloy.createController("/components/guide_screen", {
                title: L("intro_sync_title"),
                text: L("intro_sync_description")
              }).getView().open();
            }
            andTimeSince100 = 0;
            checkSyncStatus()

          }, 1000);

        });

      });

    } else {
      setTimeout(function () {
        if (Ti.App.Properties.getBool("didShowGuideScreenSync", false) == false || globals.allwaysShowGuides) {
          Ti.App.Properties.setBool("didShowGuideScreenSync", true)
          Alloy.createController("/components/guide_screen", {
            title: L("intro_sync_title"),
            text: L("intro_sync_description")
          }).getView().open();
        }
        andTimeSince100 = 0;
        checkSyncStatus()

      }, 1000);
    }

  } else {

    var currentAccount = Ti.App.Properties.getString("currentGRPCAccount", undefined);
    if (currentAccount != undefined) {

      var accounts = Ti.App.Properties.getString(globals.accountsKey, "{}");
      accounts = JSON.parse(accounts);

      var account = accounts[currentAccount];
      globals.console.log("current account", account);
      if (account != undefined) {
        var config = globals.decryptConfig(account.config, globals.userKey);
        if (config != undefined) {
          globals.connectLNDGRPC(config);
          return;
        } else {
          alert("error decrypting config");
        }
      }

      $.statusText.text = "";
      $.connecting.visible = true;

    } else {
      if (globals.currentConfig != undefined) {
        globals.connectLNDGRPC(globals.currentConfig);
        globals.currentConfig = undefined;
        return;
      }
    }

  }
}

function stopSyncUI() {
  //$.syncStatus.visible = false;
}

function setSyncingUI() {

  $.syncStatus.visible = true;
  $.statusText.text = "";

  walletConfirmedBalance = Ti.App.Properties.getInt("last_wallet_balance", 0);
  channelConfirmedBalance = Ti.App.Properties.getInt("last_channel_balance", 0);
  setBalances(true);

  var matrix2d = Ti.UI.create2DMatrix();
  matrix2d = matrix2d.rotate(180); // in degrees
  var a = Ti.UI.createAnimation({
    transform: matrix2d,
    duration: 600,
    repeat: 1000000, //not sure how to set to unlimited
    curve: Titanium.UI.ANIMATION_CURVE_LINEAR
  });
  $.syncIcon.animate(a);
  globals.console.log("starting animation");

}
if (OS_IOS) {
  var syncIcon = null;
  globals.reAddSyncIcon = function () {
    if ($.syncStatus.visible == false) {
      return;
    }

    $.syncStatus.remove($.syncIcon);

    if (syncIcon != null) {
      $.syncStatus.remove(syncIcon);
    }
    syncIcon = Ti.UI.createImageView({
      image: "/images/syncIcon.png",
      left: 5,
      top: 0,
      height: 25,
    });
    $.syncStatus.add(syncIcon);

    var matrix2d = Ti.UI.create2DMatrix();
    matrix2d = matrix2d.rotate(180); // in degrees
    var a = Ti.UI.createAnimation({
      transform: matrix2d,
      duration: 600,
      repeat: 1000000, //not sure how to set to unlimited
      curve: Titanium.UI.ANIMATION_CURVE_LINEAR
    });
    syncIcon.animate(a);
  }
}
function checkSyncStatus() {

  globals.lnGRPC.getInfo("", function (error, response) {
    globals.console.log("getInfo1", error);
    globals.console.log("getInfo1", response);

    if (error == true) {
      alert(response);
      return;
    }

    globals.currentPubkey = response.identity_pubkey;

    if (response.testnet == true) {
      setTestnet();
    }
    if (response.block_height == undefined) {
      response.block_height = 0;
    }
    if (response.synced_to_chain == undefined || response.synced_to_chain == false) {
      globals.synced = false;
      setSyncingUI();
      var currentNetworkBlockHeight = globals.util.getCurrentNetworkBlockHeight(Alloy.Globals.network);
      var percentage = Math.floor(((response.block_height / currentNetworkBlockHeight) * 100));
      if (percentage > 100) {
        percentage = 100;
      }
      if (percentage == 100) {
        andTimeSince100++;
      }
      if (Ti.App.Properties.getBool("didLoadFirstTime", false) == false) {
        globals.showSyncingInfo();
      }
      if (percentage < 100 && andTimeSince100 < 20) {
        $.syncText.text = percentage + "% " + L("synchronizing") + " " + L("block_height_sync").format({
          height: response.block_height
        });
      } else {
        $.syncText.text = L("still_synchronizing");
      }

      continueSyncTimeout = setTimeout(function () {
        globals.console.log("continue check sync")
        checkSyncStatus()
      }, 6000);

      if (Ti.App.Properties.getBool("didLoadFirstTime", false) == true) {
        if (globals.didGetTransactionsOnce == false) { //kind of heavy so only grab once whilst syncing
          setBalances();
          globals.listPayments();
        }
      }


    } else {
      if (response.synced_to_chain == 1) {
        globals.synced = true;
        Ti.App.Properties.setBool("didLoadFirstTime", true);
        globals.hideSyncingInfo();
        try {

          Ti.App.Properties.setInt("latest_block_height_" + Alloy.Globals.network, response.block_height);
          var currentTimeStamp = Math.floor(Date.now() / 1000);
          Ti.App.Properties.setInt("latest_time_stamp_" + Alloy.Globals.network, currentTimeStamp);

          $.syncStatus.visible = false;
          globals.nodeInfo = response;
          globals.setNodeInfo(globals.nodeInfo);
          $.walletName.text = L('wallet_info')
          globals.lndMobileStarted = true;

          /*if (OS_IOS) {
            Ti.App.iOS.cancelLocalNotification("check");
            if (Ti.App.Properties.getBool("didRequest")) {
              globals.util.scheduleReminderNotif();
            }
          }*/

          globals.loadMainScreen();

          globals.tryAndBackUpChannels();

        } catch (e) {
          console.error(e);
        }
      }
    }

  });
}

globals.discover = $.discover;
globals.discover.visible = false;

if (OS_ANDROID) {
  $.win.addEventListener('android:back', function () {

    if (globals.discover.visible) {
      globals.closeDiscover();
      return true;

    }

  });
}

globals.tryAndBackUpChannels = function () {

  if (Ti.App.Properties.getString("google_drive_linked", undefined) != undefined) {
    if (globals.synced == true) {
      globals.console.log("attempting to back up channels");
      globals.util.backUpChannels(function (error, response) {

      });

    }
  }
}

function showNodeInfo() {
  globals.console.log("presssed show node info");
  globals.hideShowNodeInfo(true);
}

globals.hideShowNodeInfo = function (show) {
  $.nodeInfo.show();
  if (globals.nodeInfo == undefined) {
    return;
  }
  if (show == false) {

    var a = Ti.UI.createAnimation({
      top: globals.util.getDisplayHeight(),
      duration: 300,

    });
    $.nodeInfo.animate(a);
  } else {
    var a = Ti.UI.createAnimation({
      top: 0,
      duration: 300,
    });
    $.nodeInfo.animate(a);
  }
}

/*
if (OS_IOS) {
  Ti.App.iOS.registerUserNotificationSettings({
    types: [
      Ti.App.iOS.USER_NOTIFICATION_TYPE_ALERT,
      Ti.App.iOS.USER_NOTIFICATION_TYPE_SOUND,
      Ti.App.iOS.USER_NOTIFICATION_TYPE_BADGE
    ]
  });
}*/

globals.menuWidget.show();