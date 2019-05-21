globals.lnConnected = false;

$.othersView.opacity = 0;
$.modesView.opacity = 0;

$.bookmarkList.opacity = 0;
$.bookmarkList.touchEnabled = false;

var menuIsOpen = false;

globals.menuWidget = $.menuButton;

globals.openCloseMenu = function () {
  openCloseMenu();
};

function animateUI(obj, alpha, time) {
  if (obj == undefined) {
    return;
  }
  obj.animate({
    opacity: alpha,
    duration: time
  });
}

function openCloseMenu() {

  globals.loadFavourites();
  menuIsOpen = !menuIsOpen;
  if (menuIsOpen == true) {
    $.buttonImage.image = Alloy.Globals.currentMenuButtonClose;
    $.mainView.touchEnabled = true;

    animateUI($.bookmarkList, 1, 300);

    $.bookmarkList.touchEnabled = true;

    animateUI($.modesView, 1, 300);
    animateUI($.othersView, 1, 300);
    $.othersView.touchEnabled = true;
    $.modesView.touchEnabled = true;
    animateUI($.darkView, 0.3, 300);
    $.darkView.touchEnabled = true;

  } else {

    $.mainView.touchEnabled = false;
    $.buttonImage.image = Alloy.Globals.currentMenuButton;
    $.othersView.touchEnabled = false;
    animateUI($.modesView, 0, 300);
    animateUI($.othersView, 0, 300);
    animateUI($.bookmarkList, 0, 300);

    $.bookmarkList.touchEnabled = false;
    animateUI($.darkView, 0, 300);
    $.darkView.touchEnabled = false;
    $.modesView.touchEnabled = false;

  }

}

globals.showHideMenu = function (hide) {

  function animateView(obj, opa) {
    obj.animate({
      opacity: opa,
      duration: 300
    });
  };

  if (hide) {
    animateView($.menuButton, 1);
    animateView($.mainView, 1);
    if (menuIsOpen) {
      animateView($.bookmarkList, 1);
    }

    // needs to move these views as on android touchenabled doesnt work in slide view
    if (OS_ANDROID) {
      $.mainView.bottom = 0;
    }

  } else {
    animateView($.menuButton, 0);
    animateView($.mainView, 0);
    animateView($.bookmarkList, 0);

    // needs to move these views as on android touchenabled doesnt work in slide view

    if (OS_ANDROID) {
      if ($.mainView.touchEnabled == true) {
        $.mainView.touchEnabled = false;
      };

      setTimeout(function () {
        $.mainView.bottom = 10000;
      }, 300);

    }
  }

};

function lnPay() {

  globals.launchPayScan();

}

globals.loadFavourites = function () {
  var favs = JSON.parse(Ti.App.Properties.getString("favourites", "{}"));

  var dapps = Object.keys(favs);
  var dappsSection = Ti.UI.createTableViewSection();

  for (var i = 0; i < dapps.length; i++) {

    var aDapp = favs[dapps[i]];

    aDapp["hostname"] = dapps[i] + "";
    var aDappIcon = Alloy.createController("components/dapp_icon", aDapp).getView();

    var row = Ti.UI.createTableViewRow({
      className: 'dappIcon',
      backgroundSelectedColor: 'transparent',
      rowIndex: i,
      height: Ti.UI.SIZE
    });
    row.add(aDappIcon);
    dappsSection.add(row);

  }

  $.bookmarkList.height = dapps.length * 60;

  if ($.bookmarkList.height > (globals.display.height * 0.9)) {
    $.bookmarkList.height = (globals.display.height * 0.9);
  }

  $.bookmarkList.setData([dappsSection]);

};

globals.loadFavourites();

globals.updateMenuUI = function () {
  $.buttonImage.image = Alloy.Globals.currentMenuButton;
};

function showSettings() {

  Alloy.createController("settings").getView().open();
  openCloseMenu();

}

function scanNormal() {

  globals.util.readQRcodeNormal({
    "callback": function (e) {
      try {
        var data = JSON.parse(e);
        if (data.game != undefined) {
          Alloy.createController("/gaming_mode", {
            data: e
          }).getView().open();
        }
      }
      catch (error) {
        globals.continuePay(e);
      }

    }
  }, true);
}

function loadDiscover() {
  if (globals.discover.visible) {
    globals.closeDiscover();
  } else {
    $.lappsBrowserTitle.text = L('label_close');
    globals.discover.visible = true;

    globals.loadWebView();
  }
  openCloseMenu();
}

globals.loadDiscover = function () {
  loadDiscover()
}
globals.closeDiscover = function () {
  $.lappsBrowserTitle.text = L('lapp_browser_option');
  globals.discover.visible = false;
}

function loadReceive() {
  Alloy.createController("request").getView().open();
  openCloseMenu();
}

function goToChannelsfunds() {

  Alloy.createController("/channels_funds").getView().open();
  openCloseMenu();
}

function link() {

  function doScan() {
    globals.util.readQRcodeInvoice({
      'callback': function (str) {
        setTimeout(function () {
          globals._parseArguments(str, {
            qrcode: true,
            completemessage: true
          });
        }, 500); //need to set a timeout or scanner shows twice

      }
    }, true);

  }

  doScan();

}
globals.menuWidget.hide();