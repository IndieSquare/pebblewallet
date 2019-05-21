module.exports = (function () {
  var self = {};

  var network = require("requires/network");

  self.getTiker = function (callback) {
    globals.tikerType = {
      "BTC": {},
      "ETH": {}
    };
    network.connectGET({
      "chain": "btc",
      "version": "v1",
      "method": "markets/btc",
      "callback": function (tiker) {

        globals.tikerType["BTC"] = tiker;

        if (callback != null) callback(tiker);

      },
      "onError": function (error) {
        if (callback != null) callback();
      }
    });
  };

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

  self.getFiatValue = function (currency, denomination = "BTC") {

    if (!self.isAvailable(currency)) return null;
    var val = globals.tikerType["BTC"][currency].last;

    if (denomination == "SAT") {
      val = val / 100000000;
    }
    return val;

  };

  self.getFiatSymbol = function (currency) {

    var chainName = "BTC";

    if (!self.isAvailable(currency)) return null;

    return globals.tikerType[chainName][currency].symbol;

  };

  self.to = function (type, quantity, currency, digit) {

    var chainName = "BTC";

    if (!self.isAvailable(currency)) return null;

    if (!isFinite(quantity)) return "???";

    var price = globals.tikerType[chainName][currency].last;
    var symbol = globals.tikerType[chainName][currency].symbol;

    if (digit == null) digit = 4;

    if (globals.tikerType[chainName].hasOwnProperty(type)) {

      var val = globals.tikerType[chainName][type].last;
      return "{0}{1}".format(symbol, addCommas((quantity * price).toFixed2(digit)));

    } else if (type === "BTC" || type === "ETH") {
      return "{0}{1}".format(symbol, addCommas((quantity * price).toFixed2(digit)));
    } else {

      return "";
    }
  };

  self.swapCurrency = function (params) {

    var chainName = "BTC";

    if (!self.isAvailable(params.chain, params.from)) return null;
    if (!self.isAvailable(params.chain, params.to)) return null;

    var BTC = params.amount / globals.tikerType[chainName][params.from].last;
    var rate_to = globals.tikerType[chainName][params.to].last;

    return (rate_to * BTC).toFixed2(4);
  };

  self.getRate = function (currency) {
    var chainName = "BTC";

    if (!self.isAvailable(chain, currency)) return null;
    var xcp_btc = globals.tikerType[chainName]["XCP"].last;
    return globals.tikerType[chainName][currency].last * xcp_btc;
  };

  self.isAvailable = function (currency) {
    var chainName = "BTC";

    if (globals.tikerType == null) return false;
    return currency in globals.tikerType[chainName];
  };

  return self;
}());