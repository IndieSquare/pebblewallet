module.exports = (function () {
  var self = {};
  var lngrpc = null;
  var lndMobileObj = null;
  var currentPendingOpenChannelChecker = null; //open channel doesnt response so check if is in pendings list
  var currentPing = null;

  function getController() {
    if (OS_IOS) {
      if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
        globals.console.log("returning mobile controller");
        return lndMobileObj;
      }
      globals.console.log("returning lngrpc controller");
      return lngrpc;
    } else if (OS_ANDROID) {
      if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
        globals.console.log("returning mobile controller");
        return lndMobileWrapper;
      }
      globals.console.log("returning lngrpc controller");
      return lngrpc;

    }
  }

  self.checkCapacity = function () {
    var freeSpace = 0;
    if (OS_IOS) {
      freeSpace = LNUtils.getFreeDiskSpace() + "";


    } else if (OS_ANDROID) {
      freeSpace = lndMobileWrapper.checkStorage()
    }
    globals.console.log("freeSpace", freeSpace);

    if (freeSpace < 500000000) {
      return false;
    }
    return true;

  }

  function IsJsonString(str) {
    try {
      var json = JSON.parse(str);
      return (typeof json === 'object');
    } catch (e) {
      return false;
    }
  }

  function formatResponse(error, response) {
    globals.console.log("formatting response err", error)
    globals.console.log("formatting response", response)
    if (error == null) {
      error = false;
    }
    if (response != undefined) {

      if (response.payment_error != undefined) { //added for sendpaymentcall
        error = true;
      }

      if (response == "unable to find channel") { //added for close channel
        error = true;
      }
    }
    globals.console.log("formatting response err", error)
    globals.console.log("formatting response", response)
    if (OS_IOS) {
      if (error != false) {
        response = error + "";
        error = true;
      } else {
        if (IsJsonString(response)) {
          response = JSON.parse(response); //if json convert to object
        }
      }
    }
    globals.console.log("formatting response err 2 ", error)
    globals.console.log("formatting response 2 ", response)

    if (response.split != undefined) {
      try { //format to remove rpc prefix message i.e. rpc error: code = etc
        response = response.split("=");
        response = response[response.length - 1];
      } catch (e) {
        globals.console.log(response);
        globals.console.error(e);
      }
    }
    return [error, response];
  }

  if (OS_ANDROID) {
    lngrpc = require('Lngrpc');
    var CallbackInterface = require("CallbackInterface");

    var Activity = require('android.app.Activity');
    var lndMobileWrapper = require("com.indiesquare.lndmobilewrapper.LndMobileWrapper")
    var CallbackInterfaceLND = require("com.indiesquare.lndmobilewrapper.CallbackInterface");
    var CallbackInterfaceGoogleDrive = require("com.indiesquare.googledrive.CallbackInterface");
    var CallbackInterfaceWebSocket = require("com.indiesquare.websocket.CallbackInterface");
    var websocket = require("com.indiesquare.websocket.websocket");
    var googleDrive = require("com.indiesquare.googledrive.GoogleDrive")

    var activity = new Activity(Ti.Android.currentActivity);
    googleDrive = new googleDrive(activity);

    websocket = new websocket(activity);


  } else if (OS_IOS) {

    var websocket = require("lnGRPCWrapper/websocket");
    websocket = new websocket();

    var grpcAPI = require("lnGRPCWrapper/grpcAPI");
    lngrpc = new grpcAPI();

    var lndMobile = require("lnGRPCWrapper/lndMobileAPI");
    lndMobileObj = new lndMobile();

    var LNUtils = require("lnGRPCWrapper/utils");
    LNUtils = new LNUtils();

    LNUtils.setLogWithCallback(function (log) {
      log = log + "";
      globals.console.log("utils log", log);
    });


    lndMobileObj.setLogWithCallback(function (log) {
      log = log + "";
      globals.console.log("utils log", log);
    });

  }

  self.signOutGoogleDrive = function () {
    if (OS_IOS) {

      try {
        LNUtils.signOut();
      }
      catch (e) {
        globals.console.error(e);
      }
    }
    else if (OS_ANDROID) {
      googleDrive.signOut();
    }

  }

  self.loadLogs = function (directory) {

    if (OS_ANDROID) {

      return lndMobileWrapper.readLogs(directory);

    }

  }

  self.linkGoogleDrive = function (callback) {
    if (OS_IOS) {

      try {

        LNUtils.linkGoogleDriveWithVcClientIDCallback(Ti.getController(), Alloy.Globals.googleClientID, function (response, error) {

          globals.console.log("google drive link callback", response);
          globals.console.log("google drive link callback", error);

          if (error != null) {
            response = error;
            error = true;
          }

          if (response == "linked") {
            Ti.App.Properties.setString("google_drive_linked", "linked");
          }
          callback(error, response);

        });
      }
      catch (e) {
        globals.console.error(e);
      }
    }
    else if (OS_ANDROID) {
      try {

        googleDrive.linkGoogleDrive(new CallbackInterfaceGoogleDrive({
          eventFired: function (error, response) {

            if (error != null) {
              response = error;
              error = true;
            }
            if (response == "linked") {
              Ti.App.Properties.setString("google_drive_linked", "linked");
            }
            globals.console.log("google drive link callback", response);

            callback(error, response);

          }
        }));


      }
      catch (e) {
        globals.console.error(e);
      }

    }

  }

  var isUploading = false;
  self.uploadGoogleDrive = function (data, callback) {

    if (isUploading == true) {
      callback(true, L("already_uploading"));
      return;
    }
    if (OS_IOS) {

      try {

        var folderName = globals.util.getSCBFolderName();

        var fileName = globals.util.getSCBFileName();
        isUploading = true;

        LNUtils.uploadFileWithVcClientIDFolderNameFileNamePassphraseHashCallback(Ti.getController(), Alloy.Globals.googleClientID, folderName, fileName, " ", function (response, error) {
          isUploading = false;
          globals.console.log("google drive callback", response, error);

          if (error != null) {
            response = error;
            error = true;
          }

          if (response == "file uploaded") {
            Ti.App.Properties.setString("google_drive_linked", "linked");

            Ti.App.Properties.setString("last_back_up_" + globals.currentPubkey, Date.now() + "");
          }
          callback(error, response);

        });
      }
      catch (e) {
        globals.console.error(e);
      }
    }
    else if (OS_ANDROID) {
      try {
        isUploading = true;
        googleDrive.uploadFile(globals.util.getSCBFolderName(), globals.util.getSCBFileName(), data, new CallbackInterfaceGoogleDrive({
          eventFired: function (error, response) {
            isUploading = false;
            if (error != null) {
              response = error;
              error = true;
            }

            if (response == "file uploaded") {
              Ti.App.Properties.setString("google_drive_linked", "linked");

              Ti.App.Properties.setString("last_back_up_" + globals.currentPubkey, Date.now() + "");
            }
            globals.console.log("google drive callback", response);

            callback(error, response);

          }
        }));


      }
      catch (e) {
        globals.console.error(e);
      }

    }

  }

  self.downloadGoogleDrive = function (folderName, shortFileName, callback) {

    if (OS_IOS) {

      try {

        LNUtils.downloadFileWithVcClientIDFolderNameFileNamePassphraseHashCallback(Ti.getController(), Alloy.Globals.googleClientID, folderName, " ", shortFileName, function (response, error) {

          globals.console.log("google drive callback err", error);
          globals.console.log("google drive callback res", response);

          if (error != null) {
            response = error;
            error = true;
          }

          callback(error, response);

        });
      }
      catch (e) {
        globals.console.error(e);
      }
    }
    else if (OS_ANDROID) {
      try {

        googleDrive.downloadFile(folderName, shortFileName, new CallbackInterfaceGoogleDrive({
          eventFired: function (error, response) {
            globals.console.log("google drive callback", error);

            globals.console.log("google drive callback", response);


            if (error != null) {
              response = error;
              error = true;
            }


            callback(error, response);

          }
        }));


      }
      catch (e) {
        globals.console.error(e);
      }

    }

  }

  self.deleteData = function (callback) {
    if (OS_ANDROID) {
      callback(false, null);
    } else if (OS_IOS) {
      lndMobileObj.deleteDataWithCallback(function (response, error) {
        globals.console.log("deleteData ", error);
        globals.console.log("deleteData", response);

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.stopLND = function (callback) {
    if (OS_IOS) {
      lndMobileObj.stopLNDWithCallback(function (response, error) {
        globals.console.log("stopLND err ", error);
        globals.console.log("stopLND", response);

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        globals.console.log(error + " " + response);
        setTimeout(function () { //not perfect but give it time to shut down
          callback(error, response);
        }, 20000);
      });
    } else {

      var bytes = lngrpc.makeStopDaemonRequest();

      lndMobileWrapper.stopLND(bytes, new CallbackInterfaceLND({
        eventFired: function (event) {
          globals.console.log("callback stop lnd", event);

          var response = JSON.parse(event);
          setTimeout(function () { //not perfect but give it time to shut down
            callback(response.error, response.response);
          }, 2000);

        }
      }));
    }

  }

  self.createWallet = function (password, seed, scanBlocksForRecovery, channelBackup, callback) {

    if (OS_ANDROID) {
      var seedString = seed.join(" ");

      var bytes = lngrpc.makeCreateWalletRequest(seedString, password, scanBlocksForRecovery, channelBackup);

      lndMobileWrapper.initWallet(bytes, new CallbackInterfaceLND({
        eventFired: function (event) {
          globals.console.log("callback createdWallet", event);

          var response = JSON.parse(event);
          callback(response.error, response.response);

        }
      }));

    } else if (OS_IOS) {

      lndMobileObj.createWalletWithWalletPasswordRecoveryWindowCipherSeedMnemonicChannelBackupCallback(password, scanBlocksForRecovery, seed, channelBackup, function (response, error) {
        globals.console.log("create wallet ", error);
        globals.console.log("create wallet", response);

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.unlockWallet = function (password, recoveryWindow, channelBackUp, callback) {

    globals.console.log("unlocking wallet");

    if (globals.lndMobileStarted) {
      callback(false, "already started");
      return;
    }
    if (OS_ANDROID) {

      var bytes = lngrpc.makeUnlockWalletRequest(password);

      lndMobileWrapper.unlockWallet(bytes, new CallbackInterfaceLND({
        eventFired: function (event) {
          globals.console.log("callback unlockWallet", event);

          var response = JSON.parse(event);
          callback(response.error, response.response);

        }
      }));
    } else if (OS_IOS) {

      globals.console.log("unlocking wallet ios", channelBackUp);

      lndMobileObj.unlockWalletWithWalletPasswordRecoveryWindowChannelBackupCallback(password, recoveryWindow, channelBackUp, function (response, error) {
        globals.console.log("unlock wallet ", error);
        globals.console.log("unlock walle", response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }


  self.startLNDMobile = function (callback) {

    if (globals.lndMobileStarted) {
      callback(false, "already started");
      return;
    }
    if (OS_ANDROID) {

      var activity = new Activity(Ti.Android.currentActivity);
      var contextValue = activity.getApplicationContext();

      lndMobileWrapper.startLnd(contextValue, globals.util.getConfig(Alloy.Globals.network), globals.bootstrap, new CallbackInterfaceLND({
        eventFired: function (event) {
          globals.console.log("callback fired", event);
          var response = JSON.parse(event);
          callback(response.error, response.response);

        }
      }));

    } else if (OS_IOS) {

      lndMobileObj.startSetUpEnvironmentWithChainBootstrapCallback(Alloy.Globals.network, globals.bootstrap, function (response, error) {

        if (error != null) {

          callback(true, error);
          return;

        }

        globals.util.saveLNDConf(Alloy.Globals.network);

        lndMobileObj.startLNDWithCallback(function (response, error) {
          globals.console.log("start lnd error", error);
          globals.console.log("start lnd", response);
          var _res = formatResponse(error, response)
          error = _res[0];
          response = _res[1];
          callback(error, response);
        });

      });

    }
  }



  self.generateSeed = function (callback) {
    if (OS_ANDROID) {

      var bytes = lngrpc.makeGenerateSeedRequest();
      lndMobileWrapper.generateSeed(bytes, new CallbackInterfaceLND({
        eventFired: function (event) {

          var seed = lngrpc.parseGenerateSeedResponse(JSON.parse(event).response);


          var response = JSON.parse(seed);
          callback(response.error, response.response);

        }
      }));

    } else if (OS_IOS) {

      globals.console.log("generating seed");
      lndMobileObj.generateSeedWithCallback(function (response, error) {
        globals.console.log("seed error ", error);
        globals.console.log("seed ", response);
        var _res = formatResponse(error, response)
        globals.console.log("res is", _res);
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  }
  globals.stopPing = function () {
    clearTimeout(currentPing);
  }

  function keepConnectionAliveViaPing() {
    if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
      globals.stopPing();
      return;
    }

    globals.stopPing();

    var lndController = getController();

    if (OS_ANDROID) {

      lngrpc.GetInfo(
        new CallbackInterface({
          eventFired: function (res) {
            globals.console.log("ping");
            currentPing = setTimeout(function () {
              keepConnectionAliveViaPing();
            }, 40000);

          }
        }));

    } else if (OS_IOS) {
      lndController.getInfoWithCallback(function (response, error) {
        globals.console.log("ping");
        currentPing = setTimeout(function () {
          keepConnectionAliveViaPing();
        }, 40000);
      });

    }

  }

  function ignoreResponse(res) { //for some reaseon on async calls android grpc throws this error after a while maybe time out?
    try {
      if (JSON.stringify(res).indexOf("Rst Stream") != -1) {
        return true;

      }
    } catch (e) {
      globals.console.error(e);
    }
    return false;
  }
  self.connect = function (host, port, cert, macaroon, callback) {

    if (OS_ANDROID) {
      if (cert == "") {
        cert = null;
      }
      if (cert != null) {
        cert = cert.replace("-----BEGIN CERTIFICATE-----", "");
        cert = cert.replace("-----END CERTIFICATE-----", "");
        cert = cert.replace(/(\r\n|\n|\r)/gm, "");
        cert = cert.trim();
      }

      port = parseInt(port + "");
      globals.console.log("connecting with ", host + " " + port + " " + cert + " " + macaroon)
      globals.console.log(typeof host);
      globals.console.log(typeof port);
      globals.console.log(typeof cert);
      globals.console.log(typeof macaroon);
      lngrpc.Connect(host, port, cert, macaroon, new CallbackInterface({
        eventFired: function (res) {

          globals.console.log(res);
          res = JSON.parse(res);

          if (res.error == true) {
            console.error("connect error");
          }

          globals.console.log(res.response);

          callback(res.error, res.response);

        }
      }));

    } else if (OS_IOS) {
      var res = lngrpc.setUpWithUrlCertificateMacaroon(host + ":" + port, cert, macaroon);

      if (res != null) {

        callback(true, "error");
      } else {

        callback(false, "initialized");
      }
    }
  };

  self.getInfo = function (forceMode, callback) {
    var lndController = getController();
    if (forceMode == "grpc") {
      globals.console.log("forcing grpc mode");
      lndController = lngrpc;
      globals.console.log("lngrpc", lngrpc);
    }
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeGetInfoRequest();

        globals.console.log("start getinfo");
        lndController.getInfo(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback getinfo", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseGetInfoResponse(res.response);
              res = JSON.parse(res)
            }

            globals.console.log("callback getinfo", res);

            if (res.error == true) {
              console.error("get info error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.GetInfo(new CallbackInterface({
          eventFired: function (res) {

            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("get info error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

            keepConnectionAliveViaPing();

          }
        }));
      }

    } else if (OS_IOS) {
      globals.console.log("getting info");
      lndController.getInfoWithCallback(function (response, error) {
        globals.console.log("res", response);
        globals.console.log("error", error);

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

        keepConnectionAliveViaPing();

      });

    }
  };


  self.describeGraph = function (callback) {
    var lndController = getController();

    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeChannelGraphRequest();

        globals.console.log("start describegraph");
        lndController.describeGraph(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback describegraph", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseChannelGraphRes(res.response);
              res = JSON.parse(res)
            }

            globals.console.log("callback describegraph", res);

            if (res.error == true) {
              console.error("describegraph error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      }
    }


  };


  self.exportAllChannelBackups = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeExportAllChannelBackupsRequest();
        lndMobileWrapper.exportAllChannelBackups(bytes, new CallbackInterfaceLND({
          eventFired: function (event) {

            var seed = lngrpc.parseExportChannelResponse(JSON.parse(event).response);
            var response = JSON.parse(seed);
            callback(response.error, response.response);

          }
        }));
      } else {
        lndController.ExportAllChannelBackups(new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              globals.console.error("export channel backup error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }

    } else if (OS_IOS) {
      lndController.exportAllChannelBackupsWithCallback(function (response, error) {
        error = formatResponse(error, response);
        response = JSON.parse(response);
        callback(error, response);

      });
    }
  };

  self.getWalletBalance = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeWalletBalanceRequest();

        globals.console.log("start wb");
        lndController.walletBalance(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback wb", res);
            res = JSON.parse(res);
            if (res.error != true) {

              res = lngrpc.parseWalletBalanceResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback wb", res);

            if (res.error == true) {
              console.error("wb error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {
        lndController.GetWalletBalance(new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("get wallet balance error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }

    } else if (OS_IOS) {

      lndController.getWalletBalanceWithCallback(function (response, error) {
        error = formatResponse(error, response);
        response = JSON.parse(response);
        callback(error, response);

      });

    }
  };

  self.getChannelBalance = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {



      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeGetChannelBalanceRequest();

        globals.console.log("start gcb");
        lndController.getChannelBalance(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback gcb", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseGetChannelBalanceResponse(res.response);
              res = JSON.parse(res);
            }




            globals.console.log("callback gcb", res);

            if (res.error == true) {
              console.error("get info error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {


        lndController.GetChannelBalance(new CallbackInterface({
          eventFired: function (res) {

            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("get channel balance error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }

        }));
      }

    } else if (OS_IOS) {
      lndController.getChannelBalanceWithCallback(function (response, error) {
        globals.console.log("getting channel balance res", error, response)
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  };

  self.listPayments = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeListPaymentsRequest();

        globals.console.log("start listpayments");
        lndController.listPayments(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback lp", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseListPaymentsResponse(res.response);
              res = JSON.parse(res);
            }


            globals.console.log("callback lp", res);

            if (res.error == true) {
              console.error("get lp error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.ListPayments(new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("list payments error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }

    } else if (OS_IOS) {

      lndController.listPaymentsWithCallback(function (response, error) {
        globals.console.log("list payments res", response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  }

  self.getTransactions = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {


      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeGetTransactionsRequest();

        globals.console.log("start gt");
        lndController.getTransactions(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback gt", res);
            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseGetTransactionsResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback gt", res);

            if (res.error == true) {
              console.error("get gt error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.GetTransactions(new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("list payments error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }

    } else if (OS_IOS) {

      lndController.getTransactionsWithCallback(function (response, error) {
        globals.console.log("getTransactions res", response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  }

  self.listInvoices = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeListInvoiceRequest();

        globals.console.log("start listpinvoice");
        lndController.listInvoices(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback li", res);

            res = JSON.parse(res);
            if (res.error != true) {

              res = lngrpc.parseListInvoicesResponse(res.response);
              res = JSON.parse(res);

            }

            globals.console.log("callback li", res);


            if (res.error == true) {
              console.error("get li error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.ListInvoices(new CallbackInterface({
          eventFired: function (res) {

            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("list invoices error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }

    } else if (OS_IOS) {

      lndController.listInvoicesWithCallback(function (response, error) {
        globals.console.log("list invoices err", error)
        globals.console.log("list invoices res", response)
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  }
  self.newAddress = function (type, callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {

        globals.console.log("start na type", type);
        var bytes = lngrpc.makeNewAddressRequest(type);

        globals.console.log("start na");
        lndController.newAddress(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback na", res);


            res = JSON.parse(res);

            if (res.error != true) {
              res = lngrpc.parseNewAddressResponse(res.response);
              res = JSON.parse(res);
            }


            globals.console.log("callback na", res);


            if (res.error == true) {
              console.error("na error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {
        lndController.NewAddress(type, new CallbackInterface({
          eventFired: function (res) {

            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("new address error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }
    } else if (OS_IOS) {
      lndController.newAddressWithAddressTypeCallback(type, function (response, error) {
        globals.console.log("get address", error, response, type);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });
    }
  }

  self.listChannels = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeListChannelsRequest();

        globals.console.log("start ls");
        lndController.listChannels(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback ls", res);


            res = JSON.parse(res);

            if (res.error != true) {
              res = lngrpc.parseListChannelsResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback ls", res);

            if (res.error == true) {
              console.error("ls error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.ListChannels(new CallbackInterface({
          eventFired: function (res) {

            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("list channels error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));

      }

    } else if (OS_IOS) {
      lndController.listChannelsWithCallback(function (response, error) {
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }

  self.pendingChannels = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makePendingChannelsRequest();

        globals.console.log("start pc");
        lndController.pendingChannels(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback pc", res);

            res = JSON.parse(res);

            if (res.error != true) {

              res = lngrpc.parsePendingChannelsResponse(res.response);
              res = JSON.parse(res);

            }


            globals.console.log("callback pc", res);


            if (res.error == true) {
              console.error("pc error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {


        lndController.PendingChannels(new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("pending channels error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));

      }

    } else if (OS_IOS) {
      lndController.pendingChannelsWithCallback(function (response, error) {
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.decodePayReq = function (payReq, callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makePayReqString(payReq);

        globals.console.log("start pr");
        lndController.decodePayReq(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback pr", res);



            res = JSON.parse(res);

            if (res.error != true) {
              res = lngrpc.parsePayReqResponse(res.response);
              res = JSON.parse(res);

            }

            globals.console.log("callback pr", res);

            if (res.error == true) {
              console.error("pr error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      } else {
        lndController.DecodePayReq(payReq, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("decode payreq error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }

    } else if (OS_IOS) {
      lndController.decodePayReqWithPayReqCallback(payReq, function (response, error) {
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.sendPayment = function (payReq, amount, callback) {
    globals.console.log("sending payment amount ", amount);
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeSendPaymentRequest(payReq, amount);

        globals.console.log("start sending payment");
        lndController.sendPayment(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback sending payment", res);
            res = JSON.parse(res);

            if (res.error != true) {

              res = lngrpc.parseSendPaymentResponse(res.response);
              res = JSON.parse(res);

            }

            globals.console.log("callback sending payment", res);


            if (res.error == true) {
              console.error("sending payment error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {
        lndController.SendPayment(payReq, amount, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("send payment error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }

    } else if (OS_IOS) {

      lndController.sendPaymentWithPaymentRequestAmountCallback(payReq, amount, function (response, error) {

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.connectPeer = function (nodeURI, callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      var components = nodeURI.split("@");

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeConnectPeerRequest(components[0], components[1]);

        globals.console.log("start cp");
        lndController.connectPeer(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback cp", res);
            res = JSON.parse(res);

            if (res.error != true) {
              res = lngrpc.parseConnectPeerResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback cp", res);


            if (res.error == true) {
              console.error("cp error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {
        lndController.ConnectPeer(components[0], components[1], new CallbackInterface({
          eventFired: function (res) {

            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("connect peer");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      }
    } else if (OS_IOS) {

      var components = nodeURI.split("@");
      globals.console.log(components[0] + " " + components[1]);

      lndController.connectPeerWithHostPubkeyCallback(components[1], components[0], function (response, error) {

        globals.console.log("connect peer res", response);
        globals.console.error("connect peer error", error);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });
    }

  }

  self.sendCoins = function (amount, destination, fee, callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeSendCoinsRequest(amount, destination, fee);

        globals.console.log("start sc");
        lndController.sendCoins(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback sc", res);
            res = JSON.parse(res);
            if (res.error != true) {

              res = lngrpc.parseSendCoinsResponse(res.response);
              res = JSON.parse(res);

            }

            globals.console.log("callback sc", res);

            if (res.error == true) {
              console.error("sc error");
            }

            globals.console.log(res.response);

            var _res = formatResponse(res.error, res.response)
            error = _res[0];
            response = _res[1];

            callback(error, response);


          }
        }));
      } else {

        lndController.SendCoins(amount, destination, fee, new CallbackInterface({
          eventFired: function (res) {

            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("send coins error");
            }

            globals.console.log(res.response);

            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));
      }

    } else if (OS_IOS) {

      lndController.sendCoinsWithAmountAddressFeeCallback(amount, destination, fee, function (response, error) {

        globals.console.log("send coins res", response);
        globals.console.error("send coins error", error);

        if (error == null) {

          error = false;
          try {
            response = JSON.parse(response);
          } catch (e) {
            globals.console.error(e);
          }
          callback(error, response);
          return;
        } else {

          response = error + "";
          error = true;

          callback(error, response);
        }

      });
    }

  }

  self.clearChannelChecker = function () {
    try {
      clearTimeout(currentPendingOpenChannelChecker);
    } catch (e) {
      globals.console.error(e);
    }
  }
  self.openChannel = function (pub_key, amount, callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      amount = parseInt(amount + "");

      if (lndController == lndMobileWrapper) {
        //lndmobile doesnt return response for some reason so check manually
        clearTimeout(currentPendingOpenChannelChecker);
        checkIfChannelIsOpening(pub_key, function (opened) {
          callback(false, {
            funding_txid_str: "na"
          })
        })
        var bytes = lngrpc.makeOpenChannelRequest(pub_key, amount);

        globals.console.log("start oc");
        lndController.openChannel(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback oc", res);
            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseOpenChannelResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback oc", res);

            if (res.error == true) {
              console.error("oc error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);

          }
        }));
      } else {
        lndController.OpenChannel(pub_key, amount, new CallbackInterface({
          eventFired: function (res) {

            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("open channel");
            }

            globals.console.log(res.response);

            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));
      }
    } else if (OS_IOS) {
      //lndmobile doesnt return response for some reason so check manually
      clearTimeout(currentPendingOpenChannelChecker);
      checkIfChannelIsOpening(pub_key, function (opened) {
        callback(false, {
          funding_txid_str: "na"
        })
      })


      lndController.openChannelWithLocalFundingAmountPubkeyCallback(amount, pub_key, function (response, error) {
        globals.console.log("open channel", response);
        globals.console.error("open channel", error);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        if (error == true) {
          globals.console.log("clearning checking pending channels");

          clearTimeout(currentPendingOpenChannelChecker);
        }
        callback(error, response);
      });
    }

  }

  function checkIfChannelIsOpening(pub_key, callback) {
    globals.console.log("checking pending channels");
    self.pendingChannels(function (error, res) {
      globals.console.log("checking pending channels", res);
      if (error == false || error == 0) {

        if (res.pending_open_channels != undefined) {
          for (var i = 0; i < res.pending_open_channels.length; i++) {

            var aPendingChannel = res.pending_open_channels[i];
            if (aPendingChannel.channel.remote_node_pub == pub_key) {
              clearTimeout(currentPendingOpenChannelChecker);
              callback(true);

              return;
            }

          }
        }

      }
      currentPendingOpenChannelChecker = setTimeout(function () {
        checkIfChannelIsOpening(pub_key, callback);
      }, 3000);
    });

  }

  self.closeChannel = function (txid, output, force, callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeCloseChannelRequest(txid, output, force);

        globals.console.log("start cc");
        lndController.closeChannel(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback cc", res);
            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseCloseChannelResponse(res.response);
              res = JSON.parse(res)
            }

            globals.console.log("callback cc", res);

            if (res.error == true) {
              console.error("cc error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {


        lndController.CloseChannel(txid, output, force, new CallbackInterface({
          eventFired: function (res) {

            globals.console.log("close channel res", res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("close channel error");

            }
            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));
      }

    } else if (OS_IOS) {
      globals.console.log("closing channel", txid + " " + output + " " + force);
      globals.console.log("output is", output)
      output = parseInt(output);
      globals.console.log("output is", output)

      lndController.closeChannelWithTxidOutputForceCallback(txid, output, force, function (response, error) {

        globals.console.log("close channel", "error:" + error + " res:" + response);

        error = formatResponse(error, response);
        response = JSON.parse(response);
        callback(error, response);
      });
    }

  }

  self.subscribeTransactions = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      lndController.subscribeTransactions(new CallbackInterface({
        eventFired: function (res) {
          globals.console.log(res);
          res = JSON.parse(res);

          if (res.error == true) {
            console.error("subscribe transactions error", res);

          }

          globals.console.log("subscribe Transaction", res.response);

          if (ignoreResponse(res.response) == false) {

            callback(res.error, res.response);
          }

        }
      }));

    } else if (OS_IOS) {
      globals.console.log("subscribe transaction");

      lndController.subscribeTransactionsWithCallback(function (response, error) {

        globals.console.log("subscribe transaction res", "error:" + error + " res:" + response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }

  self.subscribeSingleInvoice = function (rhash, callback) {
    var lndController = getController();
    if (OS_ANDROID) {


      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeSubscribeSingleInvoiceRequest(rhash);

        globals.console.log("start subscribe si");
        lndController.subscribeSingleInvoice(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback subscribe si", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseSubscribeInvoicesResponse(res.response);
              res = JSON.parse(res)
            }



            globals.console.log("callback subscribe si", res);

            if (res.error == true) {
              console.error("subscribe si error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.SubscribeSingleInvoice(rhash, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("subscribe single invoice error", res);
              callback(true, res.response);
              return;
            }

            globals.console.log("subscribe single Invoice", res.response);

            if (ignoreResponse(res.response) == false) {

              callback(res.error, res.response);
            }

          }
        }));

      }

    } else if (OS_IOS) {

    }
  }

  self.subscribeInvoices = function (callback) {
    var lndController = getController();
    if (OS_ANDROID) {


      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeSubscribeInvoicesRequest();

        globals.console.log("start si");
        lndController.subscribeInvoices(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback si", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseSubscribeInvoicesResponse(res.response);
              res = JSON.parse(res)
            }



            globals.console.log("callback si", res);

            if (res.error == true) {
              console.error("si error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.SubscribeInvoices(new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("subscribe invoices error", res);
              callback(true, res.response);
              return;
            }

            globals.console.log("subscribe Invoice", res.response);

            if (ignoreResponse(res.response) == false) {

              callback(res.error, res.response);
            }

          }
        }));

      }

    } else if (OS_IOS) {
      globals.console.log("subcsribe invoice");
      lndController.subscribeInvoicesWithCallback(function (response, error) {

        globals.console.log("subscribe invoices res", "error:" + error + " res:" + response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }

  self.addInvoice = function (amount, memo, expiry, callback) {
    globals.console.log("expiry is ", expiry);
    var lndController = getController();
    if (OS_ANDROID) {


      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeAddInvoiceRequest(amount, expiry, memo);

        globals.console.log("start ai");
        lndController.addInvoice(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback ai", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseAddInvoiceResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback ai", res);

            if (res.error == true) {
              console.error("ai error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {
        lndController.AddInvoice(amount, expiry, memo, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("add invoice error");
            }

            globals.console.log("add Invoice", res.response);

            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));

      }

    } else if (OS_IOS) {

      lndController.addInvoiceWithAmountExpiryMemoCallback(amount, expiry, memo, function (response, error) {

        globals.console.log("add invoice", "error:" + error, " res:" + response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }


  self.lookUpInvoice = function (rhash, callback) {
    globals.console.log("rhash ", rhash);
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeLookupInvoiceRequest(rhash);

        globals.console.log("start look up invoice");
        lndController.lookupInvoice(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback look up invoice", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseLookupInvoiceResponse(res.response);
              res = JSON.parse(res)
            }


            globals.console.log("callback look up invoice", res);

            if (res.error == true) {
              console.error("look up invoice error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {
        lndController.LookupInvoice(rhash, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("lookup invoice error");
            }

            globals.console.log("lookup invoice red", res.response);

            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));
      }

    } else if (OS_IOS) {
      lndController.lookUpInvoiceWithRhashCallback(rhash, function (response, error) {

        globals.console.log("lookup invoice", "error:" + error, " res:" + response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }


  self.addHoldInvoice = function (hash, amount, memo, expiry, callback) {
    globals.console.log("expiry is ", expiry);
    var lndController = getController();
    if (OS_ANDROID) {


      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeAddHoldInvoiceRequest(hash, amount, expiry, memo);

        globals.console.log("start ahi");
        lndController.addHoldInvoice(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback ahi", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseAddHoldInvoiceResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback ahi", res);

            if (res.error == true) {
              console.error("ahi error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.AddHoldInvoice(hash, amount, expiry, memo, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("add hold invoice error");
            }

            globals.console.log("add hold Invoice", res.response);

            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));
      }

    } else if (OS_IOS) {


    }
  }

  self.sendSettleInvoiceMsg = function (preimage, callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeSettleInvoiceMsg(preimage);

        globals.console.log("start si");
        lndController.settleInvoice(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback si", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseSettleInvoiceResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback si", res);

            if (res.error == true) {
              console.error("si error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.SettleInvoice(preimage, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("settle invoice error");
            }

            globals.console.log("settle Invoice", res.response);

            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));
      }

    } else if (OS_IOS) {


    }
  }

  self.sendCancelInvoiceMsg = function (hash, callback) {
    globals.console.log("cancel hash", hash);
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeCancelInvoiceMsg(hash);

        globals.console.log("start ci");
        lndController.cancelInvoice(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback ci", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseCancelInvoiceResponse(res.response);
              res = JSON.parse(res);
            }

            globals.console.log("callback ci", res);

            if (res.error == true) {
              console.error("ci error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {

        lndController.CancelInvoice(hash, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("hash invoice error");
            }

            globals.console.log("hash Invoice", res.response);

            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));

      }

    } else if (OS_IOS) {


    }
  }

  self.getNodeInfo = function (pubkey, callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeGetNodeInfoRequest(pubkey);

        globals.console.log("start ni");
        lndController.getNodeInfo(bytes, new CallbackInterfaceLND({
          eventFired: function (res) {

            globals.console.log("callback ni", res);

            res = JSON.parse(res);
            if (res.error != true) {
              res = lngrpc.parseGetNodeInfoResponse(res.response);
              res = JSON.parse(res)
            }


            globals.console.log("callback ni", res);

            if (res.error == true) {
              console.error("ni error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {
        lndController.GetNodeInfo(pubkey, new CallbackInterface({
          eventFired: function (res) {
            globals.console.log(res);
            res = JSON.parse(res);

            if (res.error == true) {
              console.error("get node info error");
            }

            globals.console.log("get node info", res.response);

            if (ignoreResponse(res.response) == false) {
              callback(res.error, res.response);
            }

          }
        }));
      }
    } else if (OS_IOS) {

      lndController.getNodeInfoWithPubkeyCallback(pubkey, function (response, error) {

        globals.console.log("get node info error", error);
        globals.console.log("get node info res", response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }


  self.startWebSocket = function (uri, callback) {

    globals.console.log("starting web", uri);

    if (OS_ANDROID) {
      websocket.connect(uri, new CallbackInterfaceWebSocket({
        eventFired: function (error, res) {
          globals.console.log("websocket error", error);
          globals.console.log("websocket res", res);
          callback(false, res);

        }
      }));
    }
    else if (OS_IOS) {
      websocket.startWebSocketWithUrlCallback(uri, function (response, error) {

        globals.console.log("websocket res", error + " " + response);
        if (error != null) {
          response = error;
          error = true;
        }

        callback(error, response);

      });
    }

  }

  self.closeWebSocket = function () {

    if (OS_ANDROID) {
      websocket.closeWebSocket();
    }
    else if (OS_IOS) {

      websocket.closeWebSocket();
    }

  }

  self.sendWebSocketMessage = function (message) {

    if (OS_ANDROID) {
      globals.console.log("sending msg", message);
      websocket.sendMessage(message);
    } else if (OS_IOS) {

      websocket.sendWebSocketMessageWithMsg(message);
    }


  }

  return self;
}());