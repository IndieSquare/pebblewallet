var tableData = [];

function loadAccounts() {

  var accountsNum = 0;
  tableData = [];
  var accounts = JSON.parse(Ti.App.Properties.getString(globals.accountsKey, "{}"));
  globals.console.log("accounts", accounts);
  var keys = Object.keys(accounts);
  globals.console.log("keys", keys);

  if (Ti.App.Properties.getString("passphrase", undefined) != undefined) {
    accountsNum++;
    var row = Ti.UI.createTableViewRow({
      className: 'payment',
      backgroundSelectedColor: 'transparent',
      rowIndex: i,
      height: Ti.UI.SIZE
    });

    row.add(Alloy.createController('components/component_account_cell', {
      isLNDMobile: true
    }).getView());

    tableData.push(row);

  }
  accountsNum += keys.length;
  for (var i = 0; i < keys.length; i++) {

    var anAccount = accounts[keys[i]];

    globals.console.log("anaccount", anAccount)

    var row = Ti.UI.createTableViewRow({
      className: 'payment',
      backgroundSelectedColor: 'transparent',
      rowIndex: i,
      height: Ti.UI.SIZE
    });
    if (accountsNum == 1) {
      anAccount.onlyOne = true;
    }
    row.add(Alloy.createController('components/component_account_cell', anAccount).getView());

    tableData.push(row);

  }

  $.accountsList.data = tableData;
}

globals.loadAccountsList = function () {
  loadAccounts();
}

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

globals.closeAccounts = close;

function addNewAccount() {

  globals.util.readQRcodeAccount({
    "callback": function (e) {
      $.connectSpinner.show();
      $.addAccount.hide();
      globals.continueConnect(e, function (config) {
        globals.checkConnection(config, function (success, res) {

          if (success) {

            globals.stopLND(function () {

              globals.closeSettings();
              globals.connectLNDGRPC(config);

              close();

            });
          } else {
            $.connectSpinner.hide();
            $.addAccount.show();
            alert(res);
          }
        });

      }, function (error) {

        $.connectSpinner.hide();
        $.addAccount.show();

        alert(error);
      });
    }
  },
    true);
}

$.accountsList.top = Alloy.Globals.topBarHeight;
$.accountsList.height = globals.util.getDisplayHeight() - Alloy.Globals.topBarHeight;

loadAccounts();