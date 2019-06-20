globals = Alloy.Globals;
globals.networkType = Alloy.CFG.network
globals.androidLaunchData = undefined;
globals.allwaysShowGuides = false;
globals.callbackApp = null;
globals.canProcessArgs = false;

var logOff = true;

if (Alloy.CFG.isDevelopment != true) {
  logOff = true;
}

globals.console = {
  "log": function (str, data) {
    if (data == null) {
      data = "";
    }
    if (Alloy.CFG.isDevelopment && logOff == false) console.log(str, data);
  },
  "error": function (str, data) {
    if (data == null) {
      data = "";
    }
    if (Alloy.CFG.isDevelopment && logOff == false) console.error(str, data);
  },
  "warn": function (str, data) {
    if (data == null) {
      data = "";
    }
    if (Alloy.CFG.isDevelopment && logOff == false) console.warn(str, data);
  }
};

globals.feeTexts = {
  "fastest_fee": L("label_priority_high"),
  "half_hour_fee": L("label_priority_med"),
  "low_fee": L("label_priority_low"),
};

globals.addButtonEvent = function (button, callback) {
  button.addEventListener("touchstart", function (e) {
    touchPos = {
      "x": e.x,
      "y": e.y
    };
    button.opacity = 0.2;
    enabledButton = true;
  });
  button.addEventListener("touchmove", function (e) {
    var a = Math.pow(touchPos.x - e.x, 2) + Math.pow(touchPos.y - e.y, 2);
    if (a > 50) {
      button.animate({
        "opacity": 1.0,
        "duration": 200
      });
      enabledButton = false;
    }
  });
  button.addEventListener("touchend", function (e) {
    button.animate({
      "opacity": 1.0,
      "duration": 200
    });
    if (enabledButton) {
      enabledButton = false;
      callback(e);
    }
  });
};

String.prototype.format = function (arg) {
  var rep_fn = null;
  if (typeof arg == "object") rep_fn = function (m, k) {
    return arg[k];
  };
  else {
    var args = arguments;
    rep_fn = function (m, k) {
      return args[parseInt(k)];
    };
  }
  return this.replace(/\{(\w+)\}/g, rep_fn);
};
if (OS_ANDROID) {
  Number.prototype.toLocaleString = function () {

    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  };
}

String.prototype.rvew = function (bool) {

  if (bool == undefined || bool == null || !bool) {
    return this.toString();
  }
  return this.replace(/token/g, "coin");
};

String.prototype.rvew2 = function (bool) {

  if (bool == undefined || bool == null || !bool) {
    return this.toString();
  }
  return this.replace(/bitcoin\ and\ tokens/g, "coins");
};

Number.prototype.toFixed2 = function (digit) {
  if (digit == null) digit = 8;
  return this.toFixed(digit).replace(/0+$/, "").replace(/\.$/, "");
};

globals.identity = require('ti.identity');
globals.util = require("requires/util");

globals.display = {
  "height": globals.util.getDisplayHeight(),
  "width": globals.util.getDisplayWidth()
};

globals.cryptoJS = require("vendor/crypto-js.js");
globals.networkAPI = require("requires/network");
globals.auth = require("requires/auth");

globals.bitcoin = require("requires/bitcoin");
globals.tiker = require("requires/tiker");
globals.nativeCrypto = require("crypt/nativeCrypto");

require("vendor/passwordStatic.js");

function loadingFromInit() {
  if (loading != null) loading.removeSelf();
  if (globals.screenView != null) {
    return globals.util.showLoading(globals.screenView, {
      width: Ti.UI.FILL,
      height: Ti.UI.FILL,
      message: L("label_please_wait")
    });
  }

  return null;
}




require("vendor/util/handleLaunchOptions.js");

