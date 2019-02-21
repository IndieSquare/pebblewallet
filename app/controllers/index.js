require("init");

globals.dataDir = "";
globals.lndMobileStarted = false;
globals.alreadyUnlocked = false;
globals.stopHyperloop = false; //needed as live view doesnt work when hyperloop libs are used so slows down dev
globals.lnGRPC = require("/requires/lnrpc_controller");

if (Ti.App.Properties.getInt("autoPilot", 3) == 3) { //no record
  Ti.App.Properties.setInt("autoPilot", 1);
}

if (OS_IOS) {
  Ti.Network.addEventListener('change', function(e) {

    if (Ti.App.Properties.getString("mode", "") == "lndMobile" && globals.lndMobileStarted == true) {
      if (e.type == "change") {

        var loading = globals.util.showLoading(globals.screenView, {
          "width": Ti.UI.FILL,
          "height": Ti.UI.FILL,
          "style": "dark",
          "message": L("network_change")
        });

        globals.lnGRPC.stopLND(function(error, response) {

          setTimeout(function() {
            globals.startLNDMobile();
            loading.removeSelf();
          }, 5000);
        });

      }
    }

  });
}
globals.getIndieSquareHub = function() {
  if (Alloy.Globals.network == "testnet") {
    return globals.hubURITestnet
  } else {
    alert("mainnet hub not yet added");
    return ""
  }
}

globals.lnGRPC.setUpEnv(function(error, response) {
  globals.console.log("setup env", error);
  globals.console.log("setup env", response);
});

globals.invoiceUpdateFunctions = {};
var denomination = Ti.App.Properties.getString("denomination", "");
if (denomination == "") {
  Ti.App.Properties.setString("denomination", "SAT");
}

globals.removeEverything = function(callback) {

  Ti.App.Properties.removeAllProperties()
  globals.console.log("removing user data");
  globals.nativeCrypto.resetItem(function(success) {
    if (success) {
      globals.console.log("loading!");

      callback(true);

    } else {
      globals.console.error("removing user data error");
      callback(false);
    }

  });

};

globals.console.log("loading keychain");
globals.nativeCrypto.loadItem(function(success, userKey) {
  globals.console.log("loading keychain res");
  if (success) {

    if (userKey != undefined) {

      globals.console.log("loading keychain can load");

      globals.userKey = userKey;

      if (Ti.App.Properties.getString(globals.accountsKey, undefined) == undefined && Ti.App.Properties.getString("passphrase", undefined) == undefined) {
        //no grpc or passphrase saved
        goToSignIn();
        return;
      }

      startFrame();
      return;

    }


  } else {
    globals.console.error("error loading from keychain");
  }
  goToSignIn();

});

function goToSignIn() {

  Alloy.createController("signin")
    .getView()
    .open();

}

function startFrame() {
  globals.console.log("start frame");
  globals.screenView = Alloy.createController("frame")
    .getView();

  globals.screenView.open();

}

globals.savePassphrase = function(passphrase, key) {

  if (key == undefined || key == "") {
    alert("user key should not be null");
    return false;
  }

  if (passphrase == undefined || passphrase == "") {
    alert("user key should not be null");
    return false;
  }

  var encrypted = globals.cryptoJS.AES.encrypt(passphrase, key).toString();
  Ti.App.Properties.setString("passphrase", encrypted);
  return true;
}

globals.encryptConfig = function(config, key) {
  config = JSON.stringify(config);
  if (key == undefined || key == "") {
    throw "user key should not be null";
  }
  var encrypted = globals.cryptoJS.AES.encrypt(config, key).toString();
  return encrypted;
}

globals.decryptConfig = function(encryptedConfig, key) {
  if (key == undefined || key == "") {
    throw "user key should not be null";
  }

  if (encryptedConfig == undefined) {
    globals.console.log("config undefined");
    return undefined;
  }
  try {
    var decryptedObj = globals.cryptoJS.AES.decrypt(encryptedConfig, key).toString(globals.cryptoJS.enc.Utf8);
    return JSON.parse(decryptedObj);
  } catch (e) {
    globals.console.error("error decrypt", e);
    return undefined;
  }

}

globals.decryptPassphrase = function(encryptedPassphrase, key) {
  if (key == undefined || key == "") {
    throw "user key should not be null";
  }

  if (encryptedPassphrase == undefined) {
    globals.console.log("encryptedPassphrase undefined");
    return undefined;
  }
  try {
    var decryptedObj = globals.cryptoJS.AES.decrypt(encryptedPassphrase, key).toString(globals.cryptoJS.enc.Utf8);
    return decryptedObj;
  } catch (e) {
    globals.console.error("error decrypt", e);
    return undefined;
  }

}

function decodeBase64Url(input) {
  // Replace non-url compatible chars with base64 standard chars
  input = input
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Pad out with standard base64 required padding characters
  var pad = input.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('InvalidLengthError: Input base64url string is the wrong length to determine padding');
    }
    input += new Array(5 - pad).join('=');
  }

  return input;
}
globals.parseConfig = function(config) {

  var certificate = "";

  if (config.configurations != undefined) { //probably btcpay qrcode
    globals.console.log("btcpay");

    var configs = config.configurations;

    var mainConfig = configs[0];

    var url = mainConfig.host;

    mainConfig.certificate = "";
    mainConfig.url = url;

    return mainConfig;

  } else if ((config + "").indexOf("lndconnect:") != -1) { //probably lnd connect
    globals.console.log("lndconnect");
    config = config.replace("lndconnect://", "")
    config = config.split("?cert=");

    var ip = config[0];
    var rest = config[1];

    rest = rest.split("&macaroon=");

    var cert = rest[0];
    cert = decodeBase64Url(cert);
    cert = "-----BEGIN CERTIFICATE-----\n" + cert + "\n-----END CERTIFICATE-----";

    var macaroon = rest[1];
    macaroon = decodeBase64Url(macaroon);

    var urlPort = ip.split(":");

    var mainConfig = {
      "port": urlPort[1],
      "url": urlPort[0],
      "certificate": cert,
      "macaroon": globals.bitcoin.base64toHEX(macaroon)

    };
    return mainConfig;

  } else { //probably zapconnect
    globals.console.log("zap connect");
    if (config.ip == undefined || config.c == undefined || config.m == undefined) {
      return "error";
    }
    var certificate = "";
    if (config.c != undefined && config.c != "") {
      certificate = "-----BEGIN CERTIFICATE-----\n" + config.c + "\n-----END CERTIFICATE-----";
    }
    var urlPort = config.ip.split(":");

    var mainConfig = {
      "port": urlPort[1],
      "url": urlPort[0],
      "certificate": certificate,
      "macaroon": globals.bitcoin.base64toHEX(config.m)

    };

    return mainConfig;

  }

}

globals.continueConnect = function(e, callback, error) {

  if (e.indexOf("lndconnect:") != -1) {

    callback(e);
  } else if (e.indexOf("config=") != -1) {

    var xhr = Ti.Network.createHTTPClient();

    var url = e.replace("config=", "");

    xhr.open("GET", url);
    xhr.onload = function() {

        var config = JSON.parse(this.responseText);

        callback(config);

      },
      xhr.onerror = function(e) {
        globals.console.error(e);
        error(e);

      };
    xhr.send();

  } else {
    try {
      var config = JSON.parse(e);

      callback(config);
    } catch (e) {
      error(L("error_parsing_config"));
    }
  };

}

if (OS_IOS) {
  Ti.App.addEventListener('close', function() {
    globals.lnGRPC.stopLND(function(error, response) {
      console.log("stopLND1", error);
      console.log("stopLND1", response);

    });
  });

}

globals.addAccounts = function(pubkey, details) {
  globals.console.log(pubkey, details);
  var accounts = Ti.App.Properties.getString(globals.accountsKey, "{}");
  accounts = JSON.parse(accounts);

  accounts[pubkey] = details;
  var accountsJSON = JSON.stringify(accounts);
  globals.console.log(accounts);
  Ti.App.Properties.setString(globals.accountsKey, accountsJSON);

}

globals.checkConnection = function(configRaw, callback) {

  config = globals.parseConfig(configRaw);
  if (config == "error") {
    callback(false, "error unable to parse config");
    return;
  }
  globals.console.log("connecting via grpc");
  globals.lnGRPC.connect(config.url, config.port, config.certificate, config.macaroon, function(error, response) {
    globals.console.log("connected grpc", response);
    globals.console.log("connected grpc error", error);
    if (error == true) {

      globals.console.log("error", error);

      callback(false, response);
      return;
    }

    globals.console.log("checking getinfo");
    globals.stopPing();
    globals.lnGRPC.getInfo("grpc", function(error, response) {
      if (error == true) {
        callback(false, response);
        return;

      }

      callback(true, "");

    });

  });
}
if (OS_IOS) {
  Ti.Gesture.addEventListener('shake', function(e) {
    if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
      Alloy.createController("/components/logs_view").getView().open();
    }
  });
}