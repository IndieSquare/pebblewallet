// Initiallize
globals = Alloy.Globals;

globals.networkType = Alloy.CFG.network
globals.androidLaunchData = undefined;
globals.allwaysShowGuides = false;
var logOff = true;

globals.console = {
  "log": function(str, data) {
    if (data == null) {
      data = "";
    }
    if (Alloy.CFG.isDevelopment && logOff == false && Alloy.CFG.isDevelopment) console.log(str, data);
  },
  "error": function(str, data) {
    if (data == null) {
      data = "";
    }
    if (Alloy.CFG.isDevelopment && logOff == false && Alloy.CFG.isDevelopment) console.error(str, data);
  },
  "warn": function(str, data) {
    if (data == null) {
      data = "";
    }
    if (Alloy.CFG.isDevelopment && logOff == false && Alloy.CFG.isDevelopment) console.warn(str, data);
  }
};

globals.feeTexts = {
  "fastest_fee": L("label_priority_high"),
  "half_hour_fee": L("label_priority_med"),
  "low_fee": L("label_priority_low"),
};

globals.addButtonEvent = function(button, callback) {
  button.addEventListener("touchstart", function(e) {
    touchPos = {
      "x": e.x,
      "y": e.y
    };
    button.opacity = 0.2;
    enabledButton = true;
  });
  button.addEventListener("touchmove", function(e) {
    var a = Math.pow(touchPos.x - e.x, 2) + Math.pow(touchPos.y - e.y, 2);
    if (a > 50) {
      button.animate({
        "opacity": 1.0,
        "duration": 200
      });
      enabledButton = false;
    }
  });
  button.addEventListener("touchend", function(e) {
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

String.prototype.format = function(arg) {
  var rep_fn = null;
  if (typeof arg == "object") rep_fn = function(m, k) {
    return arg[k];
  };
  else {
    var args = arguments;
    rep_fn = function(m, k) {
      return args[parseInt(k)];
    };
  }
  return this.replace(/\{(\w+)\}/g, rep_fn);
};
if (OS_ANDROID) {
  Number.prototype.toLocaleString = function() {

    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  };
}

String.prototype.rvew = function(bool) {

  if (bool == undefined || bool == null || !bool) {
    return this.toString();
  }
  return this.replace(/token/g, "coin");
};

String.prototype.rvew2 = function(bool) {

  if (bool == undefined || bool == null || !bool) {
    return this.toString();
  }
  return this.replace(/bitcoin\ and\ tokens/g, "coins");
};

Number.prototype.toFixed2 = function(digit) {
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




function urlToObject(url) {

  globals.console.log("url scheme", url);
  var returnObj = {};

  url = url.replace('lightning://?', '');
  url = url.replace('lightning:', '');

  var params = url.split('&');

  params.forEach(function(param) {

    var keyAndValue = param.split('=');

    returnObj[keyAndValue[0]] = decodeURI(keyAndValue[1]);

  });

  return returnObj;
}

globals.processArgs = function(e) {
  var url = undefined;
  if (OS_IOS) {
    if (Ti.App.getArguments().url) {
      url = Ti.App.getArguments().url;
      Ti.App.getArguments().url = null;


    }
  } else {
    if (e == undefined) {
      e = globals.androidLaunchData;
      globals.androidLaunchData = undefined;
    }
    if (e != undefined) {
      url = e.data;
    }
    globals.console.log("args ", e);
  }
  if (url != undefined) {
    url = url.replace('lightning://?', '');
    url = url.replace('lightning:', '');
    if (url.indexOf("@") != -1) { //probably open channel nodeURI

    } else {
      if (globals.continuePay != undefined) {
        globals.continuePay(url);
      } else {
        globals.console.error("continuePay not defined");
      }
    }
  }
}


if (OS_IOS) {
  // on resume
  Ti.App.addEventListener("resumed", function() {
    globals.processArgs();
  });
}

if (OS_ANDROID) {
  var SharedPreferences = require("android.content.SharedPreferences");
  var Context = require("android.content.Context");
  var Activity = require('android.app.Activity');
  var Intent = require('android.content.Intent');
  var Bundle = require('android.os.Bundle');


  var PreferenceManager = require('android.preference.PreferenceManager');

  var activity = new Activity(Ti.Android.currentActivity);
  var appContext = activity.getApplicationContext();

  var sharedPref = PreferenceManager.getDefaultSharedPreferences(appContext);


  var intentData = sharedPref.getString("intentData", "");
  globals.console.log("*** sav", intentData);



  Ti.Android.currentActivity.addEventListener("app:resume", function(e) {
    globals.console.log("app resumed", e);
    globals.processArgs(e);
    return;
  });

  if (intentData != "") {
    var editor = sharedPref.edit();
    editor.remove("intentData");
    editor.commit();
    globals.androidLaunchData = {
      data: intentData
    };
    globals.console.log("launch source check", globals.androidLaunchData);
  }


}