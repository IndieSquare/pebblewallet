var win = Ti.UI.createWindow({
  "orientationModes": [Ti.UI.PORTRAIT],
  "navBarHidden": true,
  "backgroundColor": "transparent",
  "theme": (OS_ANDROID) ? "Theme.AppCompat.Translucent.NoTitleBar" : null,
  "windowSoftInputMode": (OS_ANDROID) ? Ti.UI.Android.SOFT_INPUT_STATE_ALWAYS_HIDDEN : null
});
var recivedAmount = 0;
win.add($.gaming_mode);
win.open();

$.background.animate({
  "opacity": 0.9,
  "duration": 200
});

var util = require("requires/util");
util.readQRcode({
  "callback": continueGameMode
}, true);

var firstInvoice = false;

function close() {
  win.close();
}

var didConnectWS = false;
var myPlayerID = "myUniqueID";

function setBalanceText(amount) {
  var text = amount + " sat";
  var attrChannel = Ti.UI.createAttributedString({
    text: text,
    attributes: [{
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
          fontSize: 94,
          fontWeight: 'ultralight'

        },
        range: [text.indexOf(amount + ""), (amount + "").length]
      },
      {
        type: Ti.UI.ATTRIBUTE_FONT,
        value: {
          fontSize: 18,
          fontFamily: 'Helvetica Neue Light',
        },
        range: [text.indexOf(" sat"), (" sat").length]
      }
    ]
  });

  $.balanceText.attributedString = attrChannel;
}

function continueGameMode(req) {
  globals.console.log(req);

  $.balanceText.text = "connecting to game...";

  globals.lndGRPC.startWebSocketAndCompletion("ws://lit-castle-74426.herokuapp.com", function(error, response) {
    console.log("websocket", error + " " + response)

    if (didConnectWS == false) {
      var JSONObjMsg = {
        "recipient": "game",
        "type": "link",
        "data": myPlayerID,
      }
      globals.lndGRPC.sendWebSocketMessage(JSON.stringify(JSONObjMsg));
      didConnectWS = true;

      $.balanceText.text = "connected to game!";
      setTimeout(function() {

        setBalanceText(0);
      }, 2000)
    }
    try {
      var jsonObject = JSON.parse(response);
      if (jsonObject.recipient == myPlayerID) {
        if (jsonObject.type == "createInvoice") {
          globals.lndGRPC.addInvoiceAndExpiryAndMemoAndCompletion(parseInt(jsonObject.data), 60, "ws test", function(error, res) {
            res = JSON.parse(res);
            console.log(res);
            var JSONObjMsg = {
              "recipient": "game",
              "type": "payreq",
              "data": res.payment_request,
            }
            globals.lndGRPC.sendWebSocketMessage(JSON.stringify(JSONObjMsg));

          });
        } else if (jsonObject.type == "payment") {
          if (jsonObject.data == "success") {
            if (firstInvoice == false) {
              firstInvoice = true;
              return;
            }
            showDamage(true);
            recivedAmount += 1;
            setBalanceText(recivedAmount)
          }
        } else if (jsonObject.type == "payInvoice") {
          globals.lndGRPC.sendPaymentAndCompletion(jsonObject.data, function(error, response) {
            if (error != null) {
              console.error(error);
              return;
            }

            showDamage(false);
            recivedAmount -= 1;
            setBalanceText(recivedAmount)

          });
        }
      }
    } catch (e) {

    }

  });

}

function showDamage(up) {

  var diff = 140;
  $.amountLab.left = diff + Math.floor(Math.random() * (globals.display.width - diff))
  $.amountLab.top = diff + Math.floor(Math.random() * (globals.display.height - diff))
  $.amountLab.opacity = 1;
  if (up) {
    $.amountLab.color = "#62b579",
      $.amountLab.text = "+1";
  } else {
    $.amountLab.color = "#e94f5f",
      $.amountLab.text = "-1";

  }

  $.amountLab.animate({
    "opacity": 0.0,
    "duration": 800
  });

}