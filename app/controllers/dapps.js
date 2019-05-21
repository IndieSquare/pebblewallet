var handleWebLN = require("vendor/util/handleWebLN.js");
globals.loadedWebView = false;
var handleWebMobileUtil = require("vendor/util/handleWebMobileUtil.js");

var webView = null;
var didPostLayout = false;
var web3Script = "";

var didLoad = false;

var lastPayReq = "";

globals.loadDappUrlIOS = function () { };

globals.dappStoreUrl = globals.discoverEndpoint + "?lndbtcMode=true&testnet=false";

globals.addToBookmarks = function () {

  var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, '/scripts/setFavouriteScript.txt');

  var getFavicon = f.read().text;
  globals.evaluateJS(getFavicon, function (evalResult, error) {

    globals.console.log("bookmark is", evalResult);
    if (error != null) {
      alert(error);
      return;
    }
    evalResult = JSON.parse(evalResult);

    var hostname = globals.extractHostname(globals.getCurrentUrl());
    var favUrl = globals.getCurrentUrl();
    var favs = JSON.parse(Ti.App.Properties.getString("favourites", "{}"));

    if (favs[favUrl] !== undefined) {
      delete favs[favUrl];

      Ti.App.Properties.setString("favourites", JSON.stringify(favs));

      globals.favouriteButton.backgroundImage = "/images/icon_bookmark_not.png";
      return;
    }
    if (globals.dappStoreUrl.indexOf(hostname) != -1) {
      return;
    }
    imageURL = "";

    if (evalResult.icon != undefined) {
      imageURL = evalResult.icon;

      if (evalResult.icon.indexOf(hostname) == -1) {

        if (evalResult.icon.substring(0, 1) != "/") {
          evalResult.icon = "/" + evalResult.icon;
        }
        imageURL = "https://" + hostname + evalResult.icon;
      } else {
        if (evalResult.icon.indexOf("https://") == -1) {
          imageURL = "https://" + evalResult.icon;
        }

      }

      if (hostname.charAt(hostname.length - 1) == "/" || evalResult.icon.charAt(0) == "/") {
        if (evalResult.icon.indexOf(hostname) == -1) {
          imageURL = "https://" + hostname + evalResult.icon;
        } else {
          if (evalResult.icon.indexOf("https://") == -1) {
            imageURL = "https://" + evalResult.icon;
          }

        }

      }

    }

    favs[hostname] = {
      "image": imageURL,
      "title": evalResult.title,
      "url": favUrl
    };

    Ti.App.Properties.setString("favourites", JSON.stringify(favs));

    globals.favouriteButton.backgroundImage = "/images/icon_bookmark_checked.png";
    globals.loadFavourites();

  });

};

function setFavourited() {

  var hostname = globals.extractHostname(globals.getCurrentUrl());

  var favs = JSON.parse(Ti.App.Properties.getString("favourites", "{}"));

  if (favs[hostname] != undefined) {

    globals.favouriteButton.backgroundImage = "/images/icon_bookmark_checked.png";
  } else {

    globals.favouriteButton.backgroundImage = "/images/icon_bookmark_not.png";
  }
}

function loadWebScript() {

  var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, '/scripts/webIndie.txt');

  web3Script = f.read().text;

};

loadWebScript();

globals.refreshDapp = function () {
  $.web.remove(webView);
  didPostLayout = false;
  loadWebScript();
  loadWebView();

};

if (OS_IOS) {
  var WKWebView = require("WebKit/WKWebView"),
    WKNavigation = require("WebKit/WKNavigation"),
    NSURLRequest = require("Foundation/NSURLRequest"),
    NSURL = require("Foundation/NSURL"),
    UIScreen = require("UIKit/UIScreen"),
    CGRectMake = require('CoreGraphics').CGRectMake;

}

globals.getCurrentUrl = function () {
  if (OS_IOS) {
    return webView.URL + "";
  } else {
    return webView.getUrl() + "";
  }

};

globals.extractHostname = function (url) {
  var hostname;
  //find & remove protocol (http, ftp, etc.) and get hostname

  if (url.indexOf("//") > -1) {
    hostname = url.split('/')[2];
  } else {
    hostname = url.split('/')[0];
  }

  //find & remove port number
  hostname = hostname.split(':')[0];
  //find & remove "?"
  hostname = hostname.split('?')[0];

  return hostname;
};

function isTrustedDapp(dappUrl) {
  return true;
  if (dappUrl == "http://localhost:4200") {
    return true;
  } else {
    return false;
  }
}

var tabBarSize = 40;
if (Alloy.Globals.isiPhoneX) {
  tabBarSize = 52;
}
var webViewHeight = 0;


var screenHeight = Ti.Platform.displayCaps.platformHeight;
if (Ti.Platform.displayCaps.platformHeight < Ti.Platform.displayCaps.platformWidth) {
  screenHeight = Ti.Platform.displayCaps.platformWidth;
}
$.main.height = screenHeight;

$.web.top = Alloy.Globals.dappBarTop + Alloy.Globals.dappBarHeight;

webViewHeight = screenHeight - $.web.top;

if (OS_IOS) {

  var TiApp = require('Titanium/TiApp');
  var WebKit = require('WebKit');
  var web3 = require('web3/browser');

  var web3Obj = new web3();

  var lock = false;

  // function tht creates our delegate

  function loadWebViewIOS() {

    webView = web3Obj.getBrowserAndHeightAndUrlAndControllerAndScriptAndReceivedMessageAndNavigationMessage(Ti.Platform.displayCaps.platformWidth, webViewHeight, globals.dappStoreUrl, TiApp.app(), web3Script, function (message) {

      globals.console.log("message", typeof message);

      handleWebViewData(message, null);

    },
      function (navigationMessage) {

        if (navigationMessage == "started") {
          globals.browserBar.activityIndicator.show();
          globals.browserBar.reloadButton.hide();
        } else if (navigationMessage == "finished" || navigationMessage == "failed") {

          lock = false;
          globals.browserBar.activityIndicator.hide();
          globals.browserBar.reloadButton.show();
          updateButtons();

          setFavourited();

        }

      });
    $.web.add(webView);
    $.web.top = webTop;

    globals.loadDappUrlIOS = function () {

      globals.dappStoreUrl = Alloy.CFG.dapp_store_url + "?version=" + Ti.App.version + globals.dappStoreUrlAppend;
      if (Alloy.CFG.isDevelopment == true) {
        globals.dappStoreUrl = globals.dappStoreUrl + "&dev=true";
      }
      globals.console.log("dapp url is ", globals.dappStoreUrl);
      webView.loadRequest(NSURLRequest.alloc().initWithURL(NSURL.alloc().initWithString(globals.dappStoreUrl)));

    };

  };
  globals.loadWebViewIOS = loadWebViewIOS;

}

if (OS_ANDROID) {

  var ValueCallback = require("android.webkit.ValueCallback");

  function loadWebViewAndroid() {

    var customWebView = require("com.indiesquare.customwebview.CustomWebView");

    var CallbackInterface = require("com.indiesquare.customwebview.CallbackInterface");
    var sHeight = Ti.Platform.displayCaps.platformHeight;
    if (Ti.Platform.displayCaps.platformHeight < Ti.Platform.displayCaps.platformWidth) {
      sHeight = Ti.Platform.displayCaps.platformWidth;
    }
    webViewHeight = sHeight - ($.web.top * Ti.Platform.displayCaps.logicalDensityFactor);

    var tools = require('vendor/util/bitcoinJSLib');

    var encoded = tools.buffer(web3Script).toString('base64');

    var injectjs =
      " if(typeof web3 === 'undefined'){var parent = document.getElementsByTagName('head').item(0);" +
      "var script = document.createElement('script');" +
      "script.type = 'text/javascript';" +
      "script.innerHTML = window.atob('" + encoded + "');" +
      "parent.appendChild(script); }  ";

    injectjs = "javascript:(function() { " +
      injectjs +
      "})()";

    webView = customWebView.createWebView(Ti.Android.currentActivity, injectjs, webViewHeight, false, new CallbackInterface({
      eventFired: function (event) {
        globals.console.log("callback fired", event);

        if (event == "loaded" || event == "error") {

          lock = false;
          globals.browserBar.activityIndicator.hide();
          globals.browserBar.reloadButton.show();
          updateButtons();

          setFavourited();

        } else if (event == "started") {
          globals.browserBar.activityIndicator.show();
          globals.browserBar.reloadButton.hide();
        } else {
          handleWebViewData(event, null);
        }

      }
    }));

    $.web.add(webView);

    webView.getSettings().setDomStorageEnabled(true);

    webView.getSettings().setDatabaseEnabled(true);

    webView.loadUrl(globals.dappStoreUrl);

  }

}

function loadWebView() {
  globals.console.log("start load webview");
  if (OS_IOS) {
    setTimeout(function () {
      globals.loadWebViewIOS();
    }, 100);

  } else if (OS_ANDROID) {
    setTimeout(function () {
      if (didPostLayout == false) {
        didPostLayout = true;
        loadWebViewAndroid();

      }
      $.web.cancelBubble = true;

    }, 500);

  }

}

function updateButtons() {
  var canGoBack;
  if (OS_ANDROID) {

    canGoBack = webView.canGoBack();

  } else if (OS_IOS) {
    canGoBack = webView.canGoBack;
  }
  if (canGoBack) {

    globals.browserBar.backButton.opacity = 1;
  } else {
    globals.browserBar.backButton.opacity = 0.2;

  }
}

globals.browserGoBack = function () {
  if (webView.canGoBack) {
    webView.goBack();
    updateButtons();
    globals.console.log("go back");
  } else {
    globals.console.log("cant go back");
  }
};


globals.loadInDapp = function (newUrl) {

  if (OS_ANDROID) {
    webView.loadUrl(newUrl);

  }
  if (OS_IOS) {
    webView.loadRequest(NSURLRequest.alloc().initWithURL(NSURL.alloc().initWithString(newUrl)));

  }

};

globals.browserGoHome = function () {

  if (OS_ANDROID) {
    webView.loadUrl(globals.dappStoreUrl);
  }

  if (OS_IOS) {
    webView.loadRequest(NSURLRequest.alloc().initWithURL(NSURL.alloc().initWithString(globals.dappStoreUrl)));
  }

};

globals.browserReload = function () {

  if (OS_ANDROID) {
    webView.clearCache(true);
  }

  webView.reload();

};

globals.evaluateJS = function (js, callback) {
  if (webView == null) {
    callback(undefined, null);
    return;
  }
  if (OS_IOS) {
    webView.evaluateJavaScriptCompletionHandler(js, function (response, error) {

      callback(response, error);
    });
  } else if (OS_ANDROID) {

    webView.evaluateJavascript(js, new ValueCallback({
      onReceiveValue: function (response) {

        if (response == "null") {
          callback(undefined, null);
        } else {

          callback(response, null);
        }

        return false;
      }
    }));

  }

};

function handleWebViewData(evalResult, error) {

  globals.console.log("res", evalResult);
  if (error != null) {
    alert(error);
    lock = false;
    return;
  }

  if (evalResult != undefined && evalResult != "undefined") {

    try {
      evalResult = JSON.parse(evalResult);
    } catch (e) {
      globals.console.log(e);
      return;
    }
    globals.console.log(evalResult);

    if (evalResult.chain == "lnbtc") {

      if (evalResult.type == "createInvoice") {
        lock = true;

        handleWebLN.handleAddInvoice(evalResult);
      } else if (evalResult.type == "lookUpInvoice") {
        lock = true;

        handleWebLN.handleLookUpInvoice(evalResult);
      } else if (evalResult.type == "payInvoice") {
        lock = true;

        handleWebLN.handlePayLNRequest(evalResult);
      } else if (evalResult.type == "openChannel") {
        lock = true;

        handleWebLN.handleOpenChannelRequest(evalResult);
      }
      else if (evalResult.type == "connectPeer") {
        lock = true;

        handleWebLN.handleConnectPeerRequest(evalResult);
      }
      else if (evalResult.type == "getPubKey") {
        lock = true;

        handleWebLN.handleGetPubKey(evalResult);
      }
    } else if (evalResult.chain == "utils") {

      if (evalResult.type == "useCamera") {
        lock = true;
        handleWebMobileUtil.handleUseCamera(evalResult);
      } else if (evalResult.type == "getUserID") {
        lock = true;
        handleWebMobileUtil.handleGetUserID(evalResult);
      } else if (evalResult.type == "urlScheme") {
        lock = true;
        handleWebMobileUtil.handleUrlScheme(evalResult);
      } else if (evalResult.type == "openUrl") {
        lock = true;
        handleWebMobileUtil.handleOpenUrl(evalResult);
      } else {
        globals.clearTask();
        globals.clearCallback('type not supported');
      }
    } else {
      lock = false;
    }

  }

}

globals.clearTask = function () {
  globals.evaluateJS("CLEAR_TASK()", function (response, error) {
    if (error != undefined) {
      globals.console.error(error);
    }
    lock = false;

  });

};

globals.clearCallback = function (err) {
  globals.evaluateJS("CLEAR_CALLBACK('" + err + "')", function (response, error) {
    if (error != undefined) {
      globals.console.error(error);
    }
    lock = false;
  });
};

globals.lockBrowser = function (val) {
  lock = val;
};
globals.loadWebView = function () {
  if (globals.loadedWebView == false) {
    globals.loadedWebView = true;
    if (globals.stopHyperloop == false) {
      loadWebView();
    }
  }
}

globals.openChannelFromDapp = function (nodeURI) {
  globals.console.log("opening open channel form")

  var openChannelsFormObject = Alloy.createController("components/component_open_channel_form", {
    parent: Alloy.Globals.screenView
  })

  openChannelsFormObject.API.setPubKey(nodeURI);
}