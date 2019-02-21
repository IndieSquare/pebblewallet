function close() {
  globals.hideShowNodeInfo(false);
}

function copyClipboard() {
  Ti.UI.Clipboard.setText($.pubkey.text);
  globals.util.createDialog({
    "message": L("label_copied"),
    "buttonNames": [L("label_close")]
  }).show();
}

var qrcode = require("requires/qrcode");

function setURI(uri) {

  $.qrcode.removeAllChildren();

  $.pubkey.text = uri;

  var newQrcodeView = qrcode.QRCode({
      "text": uri,
      "errorCorrectLevel": "H"
    })
    .createQRCodeView({
      "width": 250,
      "height": 250,
    });

  $.qrcode.add(newQrcodeView);
}

globals.setNodeInfo = function(nodeInfo) {
  globals.console.log("setting node info", nodeInfo);
  $.pubkey.text = "";
  $.alias.text = nodeInfo.alias;
  if (nodeInfo.alias == undefined || nodeInfo.alias == "") {
    $.alias.text = nodeInfo.identity_pubkey.substr(0, 10) + "...";
  }
  if (nodeInfo.uris == undefined) {
    nodeInfo.uris = [];
  }
  var nodeURI = nodeInfo.uris[0];
  if (nodeURI != undefined) {
    $.pubkey.text = nodeURI;
    var comps = nodeURI.split("@");
    if (comps.length == 2) {
      $.host.text = comps[1];
    } else {
      $.host.text = "";
    }
  } else {
    $.pubkey.text = nodeInfo.identity_pubkey;
    $.host.text = "";
    $.hostTitle = "";
  }
  try {
    $.chain.text = nodeInfo.chains[0];
    if (nodeInfo.testnet == true || nodeInfo.testnet == 1) {
      $.chain.text = $.chain.text += " testnet";
    }
  } catch (e) {
    globals.console.error(e);
  }

  setURI($.pubkey.text);

}