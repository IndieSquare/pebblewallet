var args = arguments[0] || {};

var webSocketUrl =  "ws://localhost:3000"
if (OS_ANDROID) {
  if (webSocketUrl.indexOf("localhost") != -1) {
    webSocketUrl = "ws://10.0.2.2:3000"
  }
}
var recivedAmount = 0;


$.background.animate({
  "opacity": 1.0,
  "duration": 200
});



var firstInvoice = false;

function close() {
  globals.lnGRPC.closeWebSocket();
  $.win.close();
}

var didConnectWS = false;

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

function continueGameMode(connectionInfo) {

  globals.console.log("qr callback", connectionInfo);
 
  connectionInfo = JSON.parse(connectionInfo);
  globals.console.log(connectionInfo.data);
  $.balanceText.text = "connecting to game...";

  globals.lnGRPC.startWebSocket(connectionInfo.data, function (error, response) {
    globals.console.log("websocket", error + " " + response)

    if (didConnectWS == false && response == "connected") {
      var JSONObjMsg = {
        "recipient": "game",
        "type": "link",
        "data": globals.currentPubkey,
        "player": connectionInfo.player
      }

      globals.console.log("sending message", JSON.stringify(JSONObjMsg));
      globals.lnGRPC.sendWebSocketMessage(JSON.stringify(JSONObjMsg));
      didConnectWS = true;

      $.balanceText.text = "connected to game!";
      setTimeout(function () {

        setBalanceText(0);
      }, 2000)
    }
    try {
      globals.console.log("got message", response);
      var jsonObject = JSON.parse(response);


      if (jsonObject.recipient == globals.currentPubkey) {
        if (jsonObject.type == "createInvoice") {
          globals.console.log("requesting invoice");

          globals.lnGRPC.addInvoice(jsonObject.amount, jsonObject.message, jsonObject.expiry, function (error, response) {

            if (error == true) {
              globals.console.error("add invoice", response);
              alert(response);
              return;

            } else {

              globals.console.log("response", response);

              var JSONObjMsg = {
                "recipient": jsonObject.payer,
                "type": "payInvoice",
                "payee": globals.currentPubkey,
                "data": response.payment_request,
              }

              globals.console.log("JSONObjMsg", JSONObjMsg);

              globals.lnGRPC.sendWebSocketMessage(JSON.stringify(JSONObjMsg));


            }
          });


        } else if (jsonObject.type == "payment") {
          if (jsonObject.data == "success") {

            showDamage(true);
            recivedAmount += 1;
            setBalanceText(recivedAmount)
          }
        } else if (jsonObject.type == "payInvoice") {

          globals.lnGRPC.sendPayment(jsonObject.data, -1, function (error, response) {
            globals.console.log(response);
            if (error == true) {
              globals.console.error(error);
              return;
            }

            showDamage(false);
            recivedAmount -= 1;
            setBalanceText(recivedAmount)

            var JSONObjMsg = {
              "recipient": jsonObject.payee,
              "type": "payment",
              "data": "success",
            }

            globals.lnGRPC.sendWebSocketMessage(JSON.stringify(JSONObjMsg));


          });
        }
      } else if (jsonObject.op == "ping") {


      } else {
        globals.console.log("not mine", jsonObject.recipient + "   " + globals.currentPubkey);
      }
    } catch (e) {
      globals.console.error(e);
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



var data = JSON.parse(args.data);
$.gameTitle.text = L('game_terms').format({ "title": "'" + data.game + "'", "max_amount": data.maxAmount });
$.gameImage.image = data.icon;




function connect() {
  $.confView.animate({
    "opacity": 0.0,
    "duration": 200
  });
  continueGameMode(args.data);
}
