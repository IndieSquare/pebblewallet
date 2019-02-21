module.exports = (function() {
  var self = {};

  self.handlePayLNRequest = function(evalResult) {

    var payReq = evalResult.data;

    var res = null;

    if (payReq.indexOf("lightning:") != -1) {
      payReq = payReq.replace("lightning:", '');
    }

    var res = globals.lnGRPC.decodePayReq(payReq, function(error, res) {

      if (error == true) {
        globals.clearTask();
        alert(res);
        return;
      }

      if (res.payment_hash != undefined) {

        var rhash = res.payment_hash;

        globals.console.log(res);
        var memo = null;

        if (res.description != undefined) {
          memo = res.description;
        }

        if (globals.bitcoin.checkExpired(res)) {

          alert(L('text_payment_expired'));
          globals.clearTask();
          return;
        }

        globals.console.log(res);

        var urlName = globals.extractHostname(globals.getCurrentUrl());

        if (urlName.length > 30) {
          urlName = urlName.substr(0, 30) + "...";
        }
        if (res.num_satoshis == 0) {
          res.num_satoshis = undefined;
        }
        var message = L('text_request_pay_ln_web').format({
          "url": urlName,
          "value": res.num_satoshis
        });
        if (res.num_satoshis == undefined) {
          message = L('text_request_pay_ln_web').format({
            "url": urlName,
          });
        }
        if (memo != null) {
          message = L('text_request_pay_ln_memo_web').format({
            "url": urlName,
            "memo": memo,
            "value": res.num_satoshis
          });

          if (res.num_satoshis == undefined) {
            message = L('text_request_pay_ln_memo_web_no_amount').format({
              "url": urlName,
              "memo": memo,
            });
          }

        }

        var needsAmount = false;
        if (res.num_satoshis == undefined) {
          needsAmount = true;
        }
        Alloy.createController("transaction_conf", {
          "small": true,
          "message": message,
          "payReq": payReq,
          "needsAmount": needsAmount,
          "sizeToIncrease": 60,
          "cancel": function() {
            globals.lockBrowser(false);
            globals.clearTask();
          },
          "confirm": function() {

            Ti.App.Properties.setString("memo_" + rhash, memo);
            globals.console.log("saving " + rhash + " " + memo);

            globals.loadMainScreen();

            globals.lockBrowser(false);
            globals.clearTask();

          },

        });

      } else {
        globals.clearTask();
      }

    });

  };

  self.handleOpenChannelRequest = function(evalResult) {

    var nodeURI = evalResult.data;

    var res = null;

    if (nodeURI.indexOf("lightning:") != -1) {
      nodeURI = nodeURI.replace("lightning:", '');
    }
    var fundingAmount = 100000;
    var urlName = globals.extractHostname(globals.getCurrentUrl());

    if (urlName.length > 30) {
      urlName = urlName.substr(0, 30) + "...";
    }

    var message = L('text_request_open_channel_web').format({
      "url": urlName,
      "uri": nodeURI,
    });

    globals.openChannelFromDapp(nodeURI);
    return;

    Alloy.createController("transaction_conf", {
      "message": message,
      "nodeURI": nodeURI,
      "fundingAmt": fundingAmount,
      "cancel": function() {
        globals.lockBrowser(false);
        globals.clearTask();
      },
      "confirm": function() {
        console.log("pressed cloed");
        globals.lockBrowser(false);
        globals.clearTask();

      },

    });

  };

  self.handleAddInvoice = function(evalResult) {

    var params = evalResult.data;
    globals.console.log("here", params);
    var amount = parseInt(params.amount);
    var memo = params.memo;
    var expiry = parseInt(params.expiry);

    globals.console.log("here1", params);

    var res = globals.lndGRPC.addInvoiceAndExpiryAndMemoAndCompletion(amount, expiry, memo, function(error, res) {
      globals.console.log("callback");
      if (error != null) {
        globals.clearTask();
        alert(error);
        return;
      }

      res = JSON.parse(res);

      var returnMessage = JSON.stringify({
        "chain": evalResult.chain,
        "type": evalResult.type,
        "data": res
      });

      globals.evaluateJS("START_CALLBACK('" + returnMessage + "')", function(response, error) {
        if (error != undefined) {
          globals.console.error(error);
        }
        globals.lockBrowser(false);
      });

    });

  };

  self.handleLookUpInvoice = function(evalResult) {

    var params = evalResult.data;
    globals.console.log("here", params);

    globals.console.log("here1", params);

    var res = globals.lndGRPC.lookUpInvoiceAndCompletion(params.rhash, function(error, res) {
      globals.console.log("callback");
      if (error != null) {
        globals.clearTask();
        alert(error);
        return;
      }

      res = JSON.parse(res);

      var returnMessage = JSON.stringify({
        "chain": evalResult.chain,
        "type": evalResult.type,
        "data": res
      });

      globals.evaluateJS("START_CALLBACK('" + returnMessage + "')", function(response, error) {
        if (error != undefined) {
          globals.console.error(error);
        }
        globals.lockBrowser(false);
      });

    });

  };

  return self;
}());