var args = arguments[0] || {};

if (args.onlyOne == true) {
  $.removeButton.hide();
}

if (args.isLNDMobile == true) {

  $.removeButton.hide();

  $.pubKey.text = L("local_wallet_description");

  $.alias.text = L('connect_lndmobile')

  if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
    $.selectButtonOuter.hide();
  } else {
    $.selectButtonOuter.show();
    $.selectButton.text = L('label_connect')
  }


  function connect() {


    globals.closeAccounts();

    globals.closeSettings();

    globals.startLNDMobile();


  }


} else {

  $.pubKey.text = args.identity_pubkey.substring(0, 40) + "...";

  if (args.alias == undefined || args.alias == "") {
    args.alias = args.identity_pubkey.substring(0, 10)
  }
  $.alias.text = args.alias;

  function connect() {
    var config = globals.decryptConfig(args.config, globals.userKey);
    if (config != undefined) {
      globals.closeAccounts();
      globals.closeSettings();
      globals.connectLNDGRPC(config);
    }

  }

}

function remove() {
  var accounts = JSON.parse(Ti.App.Properties.getString(globals.accountsKey, "{}"));
  delete accounts[args.identity_pubkey]
  Ti.App.Properties.setString(globals.accountsKey, JSON.stringify(accounts))
  globals.loadAccountsList();
}