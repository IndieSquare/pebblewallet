
  
var walletConfirmedBalance = 0;
var walletUnconfirmedBalance = 0;
 
setBalances();

globals.currentOnchainBalance = 0;
 

function close(e) {
  globals.console.log("closed");

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
 
$.totalBalanceFiat.hide();
$.totalBalance.hide();
function getWalletBalance() { 
  $.totalBalanceFiat.hide();
  $.totalBalance.hide();
  globals.console.log("getting wallet balance");

  globals.lnGRPC.getWalletBalance(function (error, response) {
     
    $.onchain_description.show();
    if (error == true) {
      globals.console.error("error", error);
    }

    globals.console.log("get wallet balance", response);

    if (response.confirmed_balance != undefined) {
      walletConfirmedBalance = parseInt(response.confirmed_balance);
      globals.currentOnchainBalance = walletConfirmedBalance;
      if (Ti.App.Properties.getString("mode", "") == "lndMobile") {
        Ti.App.Properties.setInt("last_wallet_balance", walletConfirmedBalance);
      }
    }

    if (response.unconfirmed_balance != undefined) {
      walletUnconfirmedBalance = parseInt(response.unconfirmed_balance);

    }

    setBalances();

    $.totalBalanceFiat.show();
    $.totalBalance.show();

  });

}

setTimeout(function () {
   getWalletBalance();
}, 300);

function setBalances() {
  var currency = globals.LNCurrency;

  walletUnconfirmedValue = globals.util.satToBtc(walletUnconfirmedBalance);

  if (walletUnconfirmedBalance == 0) {
    walletUnconfirmedValue = "";
  } else {
    walletUnconfirmedValue = "\n" + L("unconfirmed") + ": " + walletUnconfirmedValue;
  }
  walletConfirmedValue = globals.util.satToBtc(parseInt(walletConfirmedBalance), true);

  var totalText = walletConfirmedValue + " " + currency + " " + walletUnconfirmedValue
  globals.console.log("total text", totalText + "sd" + globals.LNCurrency);

  var walletConfirmedValueFiat = globals.util.satToBtc(parseInt(walletConfirmedBalance));

  var currencyFiat = Ti.App.Properties.getString("currency", "USD");
  globals.console.log("currencyFiat1", currencyFiat);
  var walletConfirmedValueFiat = globals.tiker.to("BTC", walletConfirmedValueFiat, currencyFiat, 2);
  globals.console.log("currencyFiat", currencyFiat);
  if (Alloy.Globals.network == "testnet") {
    currencyFiat = "t" + currencyFiat;
  }
  globals.console.log("currencyFiat", currencyFiat);
  var totalTextFiat = walletConfirmedValueFiat + " " + currencyFiat;
  globals.console.log("currencyFiat", totalTextFiat);
  var attrTotal = Ti.UI.createAttributedString({
    text: totalText,
    attributes: [{
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 60,
        fontFamily: Alloy.Globals.lightFont,
        fontWeight: "light",
      },
      range: [totalText.indexOf(walletConfirmedValue + ""), (walletConfirmedValue + "").length]
    },
    {
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 30,
        fontFamily: Alloy.Globals.lightFont,
        fontWeight: "light",
      },
      range: [totalText.indexOf(" " + currency), (" " + currency).length]
    },
    {
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 15,
        fontFamily: Alloy.Globals.lightFont,
        fontWeight: "light",
      },
      range: [totalText.indexOf(" " + walletUnconfirmedValue), (" " + walletUnconfirmedValue).length]
    }
    ]
  });

  $.totalBalance.attributedString = attrTotal;

  attrTotal = Ti.UI.createAttributedString({
    text: totalTextFiat,
    attributes: [{
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 30,
        fontFamily: Alloy.Globals.lightFont,
        fontWeight: "light",
      },
      range: [totalTextFiat.indexOf(walletConfirmedValueFiat + ""), (walletConfirmedValueFiat + "").length]
    },
    {
      type: Ti.UI.ATTRIBUTE_FONT,
      value: {
        fontSize: 30,
        fontFamily: Alloy.Globals.lightFont,
        fontWeight: "light",
      },
      range: [totalTextFiat.indexOf(" " + currencyFiat), (" " + currencyFiat).length]
    }
    ]
  });

  $.totalBalanceFiat.attributedString = attrTotal;

}
 
 
 

$.noTransactions.hide();

var control = Ti.UI.createRefreshControl({
  tintColor: Alloy.Globals.mainColor
});
control.id = "refreshControl";

control.addEventListener('refreshstart', function (e) {


  getWalletBalance();
  loadTransactions();

});
var didLoadOnce = false;
$.paymentList.refreshControl = control;


      function loadTransactions(){

        globals.console.log("get transactions");
        if(didLoadOnce == false){
          didLoadOnce = true;
        //$.initialLoading.show();
        }
        globals.lnGRPC.getTransactions(function (error, transactionsResponse) {

          if (error == true) {
            globals.console.error("get transactions error", error);
  
            alert("error getting transactions");
            return;
          }
          //$.initialLoading.hide();
          globals.console.log("get transactions", transactionsResponse);
  
          if (OS_IOS) {
            if (transactionsResponse.transactions == undefined) {
              transactionsResponse.transactions = [];
            }
  
            transactionsResponse = transactionsResponse.transactions;
            delete transactionsResponse.transactions;
          }
  
          var fitleredTransactions = [];
   
          for (var i = 0; i < transactionsResponse.length; i++) {
            var aTransaction = transactionsResponse[i];
            aTransaction.creation_date = aTransaction.time_stamp;
            aTransaction.isTransaction = true;
            if(aTransaction.amount != undefined && aTransaction.amount != 0){
              fitleredTransactions.push(aTransaction); 
            }
  
          }

            if(fitleredTransactions.reverse != undefined){
              fitleredTransactions = fitleredTransactions.reverse();
            } 
          if (fitleredTransactions.length == 0) { 
            $.noTransactions.show();
          }
  
          addPayments(fitleredTransactions);
  
        });
      }
      

      function addPayments(payments) { 
        control.endRefreshing();
        var tableData = [];
      
        for (var i = 0; i < payments.length; i++) {
          var aPayment = payments[i];
      
          var args = {
            "id": i,
            "payment": aPayment,
      
          };
      
          var row = Ti.UI.createTableViewRow({
            className: 'payment',
            backgroundSelectedColor: 'transparent',
            rowIndex: i,
            height: Ti.UI.SIZE
          });
      
          row.add(Alloy.createController('components/component_payment_cell', args).getView());
      
          tableData.push(row);
      
        }
 
      
        $.paymentList.data = tableData;
        globals.console.log("finished payments");
      }


      loadTransactions();

      function showSend(){
        Alloy.createController("withdraw").getView().open();
      }