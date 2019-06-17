module.exports = (function () {
  var self = {};

  var network = require("requires/network");
  globals.tikerType = {
    "BTC": {},
    "ETH": {}
  };
  globals.tikerType["BTC"] = {
    "USD": {
    "last": 7998.75,
    "symbol": "$"
    },
    "AUD": {
    "last": 11491.9,
    "symbol": "$"
    },
    "BRL": {
    "last": 31011.25,
    "symbol": "R$"
    },
    "CAD": {
    "last": 10617.14,
    "symbol": "$"
    },
    "CHF": {
    "last": 7932.39,
    "symbol": "CHF"
    },
    "CLP": {
    "last": 5548733.55,
    "symbol": "$"
    },
    "CNY": {
    "last": 55446.54,
    "symbol": "¥"
    },
    "DKK": {
    "last": 52874.19,
    "symbol": "kr"
    },
    "EUR": {
    "last": 7082.37,
    "symbol": "€"
    },
    "GBP": {
    "last": 6320.5,
    "symbol": "£"
    },
    "HKD": {
    "last": 62733.6,
    "symbol": "$"
    },
    "INR": {
    "last": 556727.9
    },
    "ISK": {
    "last": 991925.91,
    "symbol": "kr"
    },
    "JPY": {
    "last": 869271.09,
    "symbol": "¥"
    },
    "KRW": {
    "last": 9477720.03,
    "symbol": "₩"
    },
    "NZD": {
    "last": 12093.67,
    "symbol": "$"
    },
    "PLN": {
    "last": 30179.74,
    "symbol": "zł"
    },
    "RUB": {
    "last": 517947.12,
    "symbol": "RUB"
    },
    "SEK": {
    "last": 75427.18,
    "symbol": "kr"
    },
    "SGD": {
    "last": 10938.3,
    "symbol": "$"
    },
    "THB": {
    "last": 250748.84,
    "symbol": "฿"
    },
    "TWD": {
    "last": 251399.39,
    "symbol": "NT$"
    }
    };

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