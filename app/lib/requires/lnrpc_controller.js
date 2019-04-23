module.exports = (function() {
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

  self.checkCapacity = function(){
    var freeSpace = 0;
    if(OS_IOS){
     freeSpace = lndMobileObj.getFreeDiskspace()+"";

   
  }else if(OS_ANDROID){
     freeSpace = lndMobileWrapper.checkStorage()
  }
  globals.console.log("freeSpace",freeSpace);
  if(freeSpace < 2000000000){
    return false;
  }
   return true;
     
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
        try {
          response = JSON.parse(response); //if json convert to object
        } catch (e) {
          globals.console.error("json error", e)
        }
      }
    }
    globals.console.log("formatting response err 2 ", error)
    globals.console.log("formatting response 2 ", response)

    try { //format to remove rpc prefix message i.e. rpc error: code = etc
      response = response.split("=");
      response = response[response.length - 1];
    } catch (e) {

    }
    return [error, response];
  }

  if (OS_ANDROID) {
    lngrpc = require('Lngrpc');
    var CallbackInterface = require("CallbackInterface");

    var Activity = require('android.app.Activity');
    var lndMobileWrapper = require("com.indiesquare.lndmobilewrapper.LndMobileWrapper")
    var CallbackInterfaceLND = require("com.indiesquare.lndmobilewrapper.CallbackInterface");



  } else if (OS_IOS) {

    var lndGRPC = require("ISWLNGRPC/connection");

    lngrpc = new lndGRPC();

    var lndMobile = require("ISWLNGRPC/lndMobileInterface");

    lndMobileObj = new lndMobile();

    lndMobileObj.initLNDAPI(function(log) {
      log = log + "";
      globals.console.log("log", log);

    });

  }

  self.deleteData = function(callback) {
    if (OS_ANDROID) {
      callback(false, null);
    } else if (OS_IOS) {
      lndMobileObj.deleteData(function(error, response) {
        globals.console.log("deleteData ", error);
        globals.console.log("deleteData", response);

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.stopLND = function(callback) {
    if (OS_IOS) {
      lndMobileObj.stopLND(function(error, response) {
        globals.console.log("stopLND err ", error);
        globals.console.log("stopLND", response);

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        setTimeout(function() { //not perfect but give it time to shut down
          callback(error, response);
        }, 1000);
      });
    } else {
      callback(null, null);
    }

  }

  self.createWallet = function(password, seed, scanBlocksForRecovery, callback) {
    
    if (OS_ANDROID) {
      var seedString = seed.join(" ");
      globals.console.log("password " + seedString + " " + password);
      
      var bytes = lngrpc.makeCreateWalletRequest(seedString, password, scanBlocksForRecovery);

      lndMobileWrapper.initWallet(bytes, new CallbackInterfaceLND({
        eventFired: function(event) {
          globals.console.log("callback createdWallet", event);

          var response = JSON.parse(event);
          callback(response.error, response.response);

        }
      }));

    } else if (OS_IOS) {

      lndMobileObj.createWalletAndRecoveryWindowAndSeedAndCompletion(password, scanBlocksForRecovery, seed, function(error, response) {
        globals.console.log("create wallet ", error);
        globals.console.log("create wallet", response);

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.unlockWallet = function(password, callback) {
    if (globals.lndMobileStarted) {
      callback(false, "already started");
      return;
    }
    if (OS_ANDROID) {

      var bytes = lngrpc.makeUnlockWalletRequest(password);

      lndMobileWrapper.unlockWallet(bytes, new CallbackInterfaceLND({
        eventFired: function(event) {
          globals.console.log("callback unlockWallet", event);

          var response = JSON.parse(event);
          callback(response.error, response.response);

        }
      }));
    } else if (OS_IOS) {
      lndMobileObj.unlockWalletAndCompletion(password, function(error, response) {
        globals.console.log("unlock wallet ", error);
        globals.console.log("unlock walle", response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }
/*
  self.setUpEnv = function(callback) {

    if (OS_IOS) {
     
      
      lndMobileObj.setUpEnvironmentAndBootstrapAndCompletion(globals.lndMobileNetwork,globals.bootstrap,function(error, response) {

        if (error != null) {

          callback(true, error);
          return;

        }

        globals.util.saveLNDConf(globals.lndMobileNetwork);

      });

    }

  }*/

  self.startLNDMobile = function(callback) {
     
    if (globals.lndMobileStarted) {
      callback(false, "already started");
      return;
    }
    if (OS_ANDROID) {

      var activity = new Activity(Ti.Android.currentActivity);
      var contextValue = activity.getApplicationContext();
       
      lndMobileWrapper.startLnd(contextValue, globals.util.getConfig(globals.lndMobileNetwork), globals.bootstrap, new CallbackInterfaceLND({
        eventFired: function(event) {
          globals.console.log("callback fired", event);
          var response = JSON.parse(event);
          callback(response.error, response.response);

        }
      }));

    } else if (OS_IOS) {

      lndMobileObj.setUpEnvironmentAndBootstrapAndCompletion(globals.lndMobileNetwork,globals.bootstrap,function(error, response) {

        if (error != null) {

          callback(true, error);
          return;

        }

        globals.util.saveLNDConf(globals.lndMobileNetwork);

        lndMobileObj.startLND(function(error, response) {
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

  self.generateSeed = function(callback) {
    if (OS_ANDROID) {

      var bytes = lngrpc.makeGenerateSeedRequest();
      lndMobileWrapper.generateSeed(bytes, new CallbackInterfaceLND({
        eventFired: function(event) {

          var seed = lngrpc.parseGenerateSeedResponse(JSON.parse(event).response);


          var response = JSON.parse(seed);
          callback(response.error, response.response);

        }
      }));

    } else if (OS_IOS) {

      globals.console.log("generating seed");
      lndMobileObj.generateSeed(function(error, response) {
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
  globals.stopPing = function() {
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
          eventFired: function(res) {
            globals.console.log("ping");
            currentPing = setTimeout(function() {
              keepConnectionAliveViaPing();
            }, 40000);

          }
        }));

    } else if (OS_IOS) {
      lndController.getInfo(function(error, response) {
        globals.console.log("ping");
        currentPing = setTimeout(function() {
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
  self.connect = function(host, port, cert, macaroon, callback) {

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
        eventFired: function(res) {

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

      lngrpc.initWithUrlAndCertificateAndMacaroonAndCompletion(host + ":" + port, cert, macaroon, function(error, response) {
        globals.console.log("res", response);
        globals.console.log("error", error);

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  };

  self.getInfo = function(forceMode, callback) {
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
          eventFired: function(res) {

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
          eventFired: function(res) {

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
      lndController.getInfo(function(error, response) {
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


  self.exportAllChannelBackups = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
      var bytes = lngrpc.makeExportAllChannelBackupsRequest();
      lndMobileWrapper.exportAllChannelBackups(bytes, new CallbackInterfaceLND({
        eventFired: function(event) {

          var seed = lngrpc.parseExportChannelResponse(JSON.parse(event).response);
          var response = JSON.parse(seed);
          callback(response.error, response.response);

        }
      }));
    }else {
      lndController.ExportAllChannelBackups(new CallbackInterface({
        eventFired: function(res) {
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
      lndController.exportAllChannelBackups(function(error, response) {
        error = formatResponse(error, response);
        response = JSON.parse(response);
        callback(error, response);

      });
    }
  };

  self.getWalletBalance = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeWalletBalanceRequest();

        globals.console.log("start wb");
        lndController.walletBalance(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {
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

      lndController.getWalletBalance(function(error, response) {
        error = formatResponse(error, response);
        response = JSON.parse(response);
        callback(error, response);

      });

    }
  };

  self.getChannelBalance = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {



      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeGetChannelBalanceRequest();

        globals.console.log("start gcb");
        lndController.getChannelBalance(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {

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
      globals.console.log("getting channel balance")
      lndController.getChannelBalance(function(error, response) {
        globals.console.log("getting channel balance res", error, response)
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  };

  self.listPayments = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeListPaymentsRequest();

        globals.console.log("start listpayments");
        lndController.listPayments(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {
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

      lndController.listPayments(function(error, response) {
        globals.console.log("list payments res", response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  }

  self.getTransactions = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {


      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeGetTransactionsRequest();

        globals.console.log("start gt");
        lndController.getTransactions(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {
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

      lndController.getTransactions(function(error, response) {
        globals.console.log("getTransactions res", response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  }

  self.listInvoices = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeListInvoiceRequest();

        globals.console.log("start listpinvoice");
        lndController.listInvoices(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {

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

      lndController.listInvoices(function(error, response) {
        globals.console.log("list invoices err", error)
        globals.console.log("list invoices res", response)
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });

    }
  }
  self.newAddress = function(type, callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {

        globals.console.log("start na type", type);
        var bytes = lngrpc.makeNewAddressRequest(type);

        globals.console.log("start na");
        lndController.newAddress(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {

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
      lndController.newAddressAndCompletion(type, function(error, response) {
        globals.console.log("get address", error, response, type);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });
    }
  }

  self.listChannels = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeListChannelsRequest();

        globals.console.log("start ls");
        lndController.listChannels(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {

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
      lndController.listChannels(function(error, response) {
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }

  self.pendingChannels = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makePendingChannelsRequest();

        globals.console.log("start pc");
        lndController.pendingChannels(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {
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
      lndController.pendingChannels(function(error, response) {
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.decodePayReq = function(payReq, callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makePayReqString(payReq);

        globals.console.log("start pr");
        lndController.decodePayReq(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {
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
      lndController.decodePayReqAndCompletion(payReq, function(error, response) {
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.sendPayment = function(payReq, amount, callback) {
    globals.console.log("amount ", amount);
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeSendPaymentRequest(payReq, amount);

        globals.console.log("start sp");
        lndController.sendPayment(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

            globals.console.log("callback sp", res);
            res = JSON.parse(res);

            if (res.error != true) {

              res = lngrpc.parseSendPaymentResponse(res.response);
              res = JSON.parse(res);

            }

            globals.console.log("callback sp", res);


            if (res.error == true) {
              console.error("sp error");
            }

            globals.console.log(res.response);

            callback(res.error, res.response);


          }
        }));
      } else {
        lndController.SendPayment(payReq, amount, new CallbackInterface({
          eventFired: function(res) {
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
      lndController.sendPaymentAndAmountAndCompletion(payReq, amount, function(error, response) {

        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }

  }

  self.connectPeer = function(nodeURI, callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      var components = nodeURI.split("@");

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeConnectPeerRequest(components[0], components[1]);

        globals.console.log("start cp");
        lndController.connectPeer(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {

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
      lndController.connectPeerAndPubkeyAndCompletion(components[1], components[0], function(error, response) {

        globals.console.log("connect peer res", response);
        globals.console.error("connect peer error", error);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);

      });
    }

  }

  self.sendCoins = function(amount, destination, fee, callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeSendCoinsRequest(amount, destination, fee);

        globals.console.log("start sc");
        lndController.sendCoins(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {

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

      lndController.sendCoinsAndAddressAndFeeAndCompletion(amount, destination, fee, function(error, response) {

        globals.console.log("send coins res", response);
        globals.console.error("send coins error", error);

        if (error == null) {

          error = false;
          try {
            response = JSON.parse(response);
          } catch (e) {

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

  self.clearChannelChecker = function() {
    try {
      clearTimeout(currentPendingOpenChannelChecker);
    } catch (e) {

    }
  }
  self.openChannel = function(pub_key, amount, callback) {
    var lndController = getController();
    if (OS_ANDROID) {
      amount = parseInt(amount + "");

      if (lndController == lndMobileWrapper) {
        //lndmobile doesnt return response for some reason so check manually
        clearTimeout(currentPendingOpenChannelChecker);
        checkIfChannelIsOpening(pub_key, function(opened) {
          callback(false, {
            funding_txid_str: "na"
          })
        })
        var bytes = lngrpc.makeOpenChannelRequest(pub_key, amount);

        globals.console.log("start oc");
        lndController.openChannel(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {

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
      checkIfChannelIsOpening(pub_key, function(opened) {
        callback(false, {
          funding_txid_str: "na"
        })
      })
      lndController.openChannelAndPubkeyAndCompletion(amount, pub_key, function(error, response) {
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
    self.pendingChannels(function(error, res) {
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
      currentPendingOpenChannelChecker = setTimeout(function() {
        checkIfChannelIsOpening(pub_key, callback);
      }, 3000);
    });

  }

  self.closeChannel = function(txid, output, force, callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeCloseChannelRequest(txid, output, force);

        globals.console.log("start cc");
        lndController.closeChannel(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {

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
      lndController.closeChannelAndOutputAndForceAndCompletion(txid, output, force, function(error, response) {

        globals.console.log("close channel", "error:" + error + " res:" + response);

        error = formatResponse(error, response);
        response = JSON.parse(response);
        callback(error, response);
      });
    }

  }

  self.subscribeTransactions = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      lndController.subscribeTransactions(new CallbackInterface({
        eventFired: function(res) {
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
      globals.console.log("subscribe transactions");
      lndController.subscribeTransactions(function(error, response) {

        globals.console.log("subscribe transaction res", "error:" + error + " res:" + response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }

  self.subscribeInvoices = function(callback) {
    var lndController = getController();
    if (OS_ANDROID) {


      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeSubscribeInvoicesRequest();

        globals.console.log("start si");
        lndController.subscribeInvoices(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {
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
      lndController.subscribeInvoices(function(error, response) {

        globals.console.log("subscribe invoices res", "error:" + error + " res:" + response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }

  self.addInvoice = function(amount, memo, expiry, callback) {
    globals.console.log("expiry is ", expiry);
    var lndController = getController();
    if (OS_ANDROID) {


      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeAddInvoiceRequest(amount, expiry, memo);

        globals.console.log("start ai");
        lndController.addInvoice(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {
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

      lndController.addInvoiceAndExpiryAndMemoAndCompletion(amount, expiry, memo, function(error, response) {

        globals.console.log("add invoice", "error:" + error, " res:" + response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }

  self.getNodeInfo = function(pubkey, callback) {
    var lndController = getController();
    if (OS_ANDROID) {

      if (lndController == lndMobileWrapper) {
        var bytes = lngrpc.makeGetNodeInfoRequest(pubkey);

        globals.console.log("start ni");
        lndController.getNodeInfo(bytes, new CallbackInterfaceLND({
          eventFired: function(res) {

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
          eventFired: function(res) {
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

      lndController.getNodeInfoAndCompletion(pubkey, function(error, response) {

        globals.console.log("get node info error", error);
        globals.console.log("get node info res", response);
        var _res = formatResponse(error, response)
        error = _res[0];
        response = _res[1];
        callback(error, response);
      });
    }
  }

  return self;
}());