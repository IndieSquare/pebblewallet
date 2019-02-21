var args = arguments[0] || {};

function close(e) {

  if (OS_ANDROID) {
    $.win.close();
    return;
  }

  $.background.animate({
    "opacity": 0,
    "duration": 200
  });

  $.mainView.animate({
    "left": globals.display.width,
    "duration": 200
  });

  setTimeout(function() {
    $.win.width = 0;
    $.win.close();
  }, 200);
}

globals.closeSettings = close;

if (OS_ANDROID) {

  $.win.addEventListener('android:back', function() {
    close();
    return true;
  });
}

$.background.animate({
  "opacity": 0.5,
  "duration": 200
});

if (OS_IOS) {
  $.mainView.animate({
    "left": 0,
    "duration": 200
  });
}

function signin() {
  if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
    globals.lnGRPC.stopLND(function(error, response) {
      Alloy.createController("signin")
        .getView()
        .open();
      $.win.close();
    });
  } else {
    Alloy.createController("signin")
      .getView()
      .open();
    $.win.close();

  }

}

if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
  globals.console.log("is lndmobile ") + Ti.App.Properties.getInt("autoPilot", 1);
  if (Ti.App.Properties.getInt("autoPilot", 0) == 1) {
    globals.console.log("is autopilot");

    $.autoPilotImage.image = "/images/icon_checked.png";
  } else {
    globals.console.log("is not autopilot");
    $.autoPilotImage.image = "/images/icon_unchecked.png";
  }
} else {
  $.scrollView.remove($.autoPilot);
  $.scrollView.remove($.passphraseView);
  $.scrollView.remove($.logsView);
}

function autoPilot() {

  if (Ti.App.Properties.getInt("autoPilot", 1) == 0) {
    Ti.App.Properties.setInt("autoPilot", 1)
    $.autoPilotImage.image = "/images/icon_checked.png";
  } else {
    Ti.App.Properties.setInt("autoPilot", 0)
    $.autoPilotImage.image = "/images/icon_unchecked.png";
  }
  globals.util.saveLNDConf();

  var loading = globals.util.showLoading($.settingsView, {
    "width": Ti.UI.FILL,
    "height": Ti.UI.FILL,
    "style": "dark",
    "message": L("label_loading")
  });

  globals.lnGRPC.stopLND(function(error, response) {

    setTimeout(function() {
      globals.startLNDMobile();
      loading.removeSelf();
    }, 5000);
  });

}

function showPassPhrase() {

  globals.decryptedPassphrase = globals.decryptPassphrase(Ti.App.Properties.getString("passphrase", undefined), globals.userKey);
  var dialog = globals.util.createDialog({
    title: L("label_confirm"),
    message: L("label_confirm_showpassphrase"),
    buttonNames: [L("label_close"), L("label_show")]
  });
  dialog.addEventListener("click", function(e) {
    if (e.index != e.source.cancel) {

      Alloy.createController("introscreens", {
          "isPassphraseOnly": true
        })
        .getView()
        .open();

    }
  });
  dialog.show();
}

function goToSignOut() {

  var passphrase = Ti.App.Properties.getString("passphrase", undefined);
  if (passphrase) {
    var signoutText = L("label_settings_signout_message_local")
  } else {
    var signoutText = L("label_settings_signout_message")
  }
  var dialog = globals.util.createDialog({
    title: L("label_settings_signout"),
    message: signoutText,
    buttonNames: [L("label_cancel"), L("label_settings_signout")]
  });
  dialog.addEventListener("click", function(e) {
    if (e.index != e.source.cancel) {

      globals.removeEverything(function(success) {
        if (success) {

          var loading = globals.util.showLoading($.mainView, {
            "width": Ti.UI.FILL,
            "height": Ti.UI.FILL,
            "style": "dark",
            "message": L("label_loading")
          });
          signin();

        } else {
          globals.console.error("error removing from keychain");
        }
      });
    }

  });
  dialog.show();
};
var version = 'ver ' + Ti.App.version + ((Alloy.CFG.isDevelopment) ? ' dev' : '') + '\n\n' + '(c) 2019 IndieSquare Inc';

$.version.text = version;

function showAccounts() {
  Alloy.createController("accounts").getView().open();
}

function goToLogs() {
  Alloy.createController("/components/logs_view").getView().open();
}