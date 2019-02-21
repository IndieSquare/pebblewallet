var aChannel = arguments[0] || {};
globals.console.log("adding closing channel", aChannel);

if (aChannel.channel.local_balance == undefined) {
  aChannel.channel.local_balance = 0;
}
if (aChannel.channel.remote_balance == undefined) {
  aChannel.channel.remote_balance = 0;
}
$.pubKey.text = aChannel.channel.remote_node_pub;

$.detailsButton.text = " " + $.detailsButton.text + " ";

var local_balance_str = aChannel.channel.local_balance + "";

var localBalanceText = aChannel.channel.local_balance + " SAT";
var attr = Titanium.UI.createAttributedString({
  text: localBalanceText,
  attributes: [

    {
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 13,
        fontFamily: 'GillSans-Light',
        fontWeight: 'light'
      },
      range: [localBalanceText.indexOf(local_balance_str), local_balance_str.length]
    },
    {
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 8,
        fontFamily: 'GillSans-Light',
        fontWeight: 'light'
      },
      range: [localBalanceText.indexOf(" SAT"), (" SAT").length]
    }
  ]
});

$.localAmount.attributedString = attr;

var remote_balance_str = aChannel.channel.remote_balance + "";
var remoteBalanceText = remote_balance_str + " SAT";
var attr = Titanium.UI.createAttributedString({
  text: remoteBalanceText,
  attributes: [

    {
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 13,
        fontFamily: 'GillSans-Light',
        fontWeight: 'light'
      },
      range: [remoteBalanceText.indexOf(remote_balance_str), remote_balance_str.length]
    },
    {
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 8,
        fontFamily: 'GillSans-Light',
        fontWeight: 'light'
      },
      range: [remoteBalanceText.indexOf(" SAT"), (" SAT").length]
    }
  ]
});

$.remoteAmount.attributedString = attr;

$.status.text = L("closing");

function viewDetails() {
  if (Alloy.Globals.network == "testnet") {
    Ti.Platform.openURL("https://www.blockstream.info/testnet/tx/" + aChannel.closing_txid);
  } else {
    Ti.Platform.openURL("https://www.blockstream.info/tx/" + aChannel.closing_txid);
  }
}

globals.console.log("added closed channel");