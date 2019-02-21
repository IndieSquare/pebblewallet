var aChannel = arguments[0] || {};
globals.console.log("adding pending channel", aChannel);
$.pubKey.text = aChannel.channel.remote_node_pub;

if (aChannel.channel.local_balance == undefined) {
	aChannel.channel.local_balance = 0;
}
if (aChannel.channel.remote_balance == undefined) {
	aChannel.channel.remote_balance = 0;
}

$.detailsButton.text = " " + $.detailsButton.text + " ";

var localBalanceText = aChannel.channel.local_balance + " SAT";
if (OS_IOS) {
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
				range: [localBalanceText.indexOf(aChannel.channel.local_balance + ""), (aChannel.channel.local_balance + "").length]
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
} else {
	$.localAmount.text = localBalanceText;
}
$.status.text = aChannel.confirmation_height;

var remoteBalanceText = aChannel.channel.remote_balance + " SAT";
if (OS_IOS) {
	var attr2 = Titanium.UI.createAttributedString({
		text: remoteBalanceText,
		attributes: [

			{
				type: Ti.UI.ATTRIBUTE_FONT,
				value: {
					fontSize: 13,
					fontFamily: 'GillSans-Light',
					fontWeight: 'light'
				},
				range: [remoteBalanceText.indexOf(aChannel.channel.remote_balance + ""), (aChannel.channel.remote_balance + "").length]
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

	$.remoteAmount.attributedString = attr2;
} else {
	$.remoteAmount.text = remoteBalanceText;
}

function viewDetails() {

	var txid = aChannel.channel.channel_point.split(":")[0];
	if (Alloy.Globals.network == "testnet") {
		Ti.Platform.openURL("https://www.blockstream.info/testnet/tx/" + txid);
	} else {
		Ti.Platform.openURL("https://www.blockstream.info/tx/" + txid);
	}
}

globals.console.log("added pending channel");
