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

  setTimeout(function () {
    $.win.width = 0;
    $.win.close();
  }, 200);
}

globals.closeSettings = close;

if (OS_ANDROID) {

  $.win.addEventListener('android:back', function () {
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

if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
  globals.console.log("is lndmobile ") + Ti.App.Properties.getInt("autoPilot", 1);
  if (Ti.App.Properties.getInt("autoPilot", 0) == 1) {
    globals.console.log("is autopilot");

    $.autoPilotImage.image = "/images/icon_checked.png";
  } else {
    globals.console.log("is not autopilot");
    $.autoPilotImage.image = "/images/icon_unchecked.png";
  }

  if(!Alloy.CFG.isDevelopment){
  $.scrollView.remove($.describeGraph);
  }
} else {
  $.scrollView.remove($.autoPilot);
  $.scrollView.remove($.passphraseView);
  $.scrollView.remove($.logsView);
  $.scrollView.remove($.neutrinoPeer);
  $.scrollView.remove($.describeGraph);
}

function changeNeutrinoPeer() {


  var dialog = globals.util.createInputDialog({
    "title": L("label_settings_neutrino_peer"),
    "message": L("label_settings_neutrino_peer_description"),
    "value": Ti.App.Properties.getString("customPeer", globals.defaultPeer),
    "keyboardType": Ti.UI.KEYBOARD_TYPE_DECIMAL_PAD,
    "cancel": 1,
    "buttonNames": [L("label_apply"), L("label_cancel"), L("label_reset")]
  });
  dialog.origin.addEventListener("click", function (e) {
    var inputText = (OS_ANDROID) ? dialog.androidField.getValue() : e.text;
    globals.console.log(e.index);

    if (e.index != e.source.cancel) {

      if (e.index == 2) {
        globals.console.log("resetting");
        Ti.App.Properties.setString("customPeer", globals.defaultPeer);
      }
      else {
        globals.console.log("setting");
        Ti.App.Properties.setString("customPeer", inputText);
      }

      globals.util.saveLNDConf(Alloy.Globals.network);

      var loading = globals.util.showLoading($.settingsView, {
        "width": Ti.UI.FILL,
        "height": Ti.UI.FILL,
        "style": "dark",
        "message": L("label_loading")
      });

      globals.lnGRPC.stopLND(function (error, response) {
        loading.removeSelf();
        alert(L("restart_app"))

      });

    }
  });
  dialog.origin.show();

}

function autoPilot() {

  if (globals.synced == false) {
    alert(L("wait_for_sync"));
    return;
  }

  if (Ti.App.Properties.getInt("autoPilot", 1) == 0) {
    Ti.App.Properties.setInt("autoPilot", 1)
    $.autoPilotImage.image = "/images/icon_checked.png";
  } else {
    Ti.App.Properties.setInt("autoPilot", 0)
    $.autoPilotImage.image = "/images/icon_unchecked.png";
  }
  globals.util.saveLNDConf(Alloy.Globals.network);

  var loading = globals.util.showLoading($.settingsView, {
    "width": Ti.UI.FILL,
    "height": Ti.UI.FILL,
    "style": "dark",
    "message": L("label_loading")
  });

  globals.lnGRPC.stopLND(function (error, response) {
    loading.removeSelf();
    alert(L("restart_app"));
  });

}





$.addressType.text = Ti.App.Properties.getString("address_type","p2wkh")
 


function setAddressType(){
  var dialog = globals.util.createDialog({
    title: L("label_address_type"),
    message: L("label_settings_addresstype_description"),
    buttonNames: [L("legacy_address"), L("label_close"), L("bech32")]
  });
  dialog.addEventListener("click", function (e) {
    if (e.index != e.source.cancel) {

      if(e.index == 0){
        Ti.App.Properties.setString("address_type","np2wkh")
      }
      else if(e.index == 2){
        Ti.App.Properties.setString("address_type","p2wkh")
      }
       
      $.addressType.text = Ti.App.Properties.getString("address_type","p2wkh")

    }
  });
  dialog.show();
}

function viewPassword(){
  globals.auth.check({
    title: "",
    callback: function (e) {
      if (e.success) {
        setTimeout(function(){
          alert(globals.userKey);
        },1000);
         
      } 
    }
  });
}
 

function showPassPhrase() {

  globals.decryptedPassphrase = globals.decryptPassphrase(Ti.App.Properties.getString("passphrase", undefined), globals.userKey);
  var dialog = globals.util.createDialog({
    title: L("label_confirm"),
    message: L("label_confirm_showpassphrase"),
    buttonNames: [L("label_show"), L("label_close")]
  });
  dialog.addEventListener("click", function (e) {
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


var version = 'ver ' + Ti.App.version + ((Alloy.CFG.isDevelopment) ? ' dev' : '') + '\n\n' + '(c) 2019 IndieSquare Inc';

$.version.text = version;

function showAccounts() {
  Alloy.createController("accounts").getView().open();
}

function goToLogs() {
  Alloy.createController("/components/logs_view").getView().open();
}

function showCurrency() {
  var args = {
    "setLabel": function (currency) {
      $.currencyLabel.text = currency;
    }
  };
  Alloy.createController("currency", args)
    .getView().open();
}


$.currencyLabel.text = Ti.App.Properties.getString("currency", "USD");


function exportChannels() {
  if (globals.synced == false) {
    alert(L("wait_for_sync"));
    return;
  }
  Alloy.createController("components/google_drive_link")
    .getView()
    .open();


}



function describeGraph() {
  globals.lnGRPC.describeGraph(function (error, response) {

    globals.console.log(error)

    globals.console.log(response)
if(error == false){
    var nodes = response.nodes;
    for(var i = 0;i<nodes.length;i++){
      var aNode = nodes[i];
      globals.console.log(aNode);
    }
  }

  });

}