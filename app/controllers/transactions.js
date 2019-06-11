globals.transactions = [];
globals.didGetTransactionsOnce = false;
globals.showTransactionsLoader = function () {
  $.initialLoading.show();
}
globals.hideNoTransactions = function () {
  $.noTransactions.hide();
}

globals.hideSyncingInfo = function () {
  $.syncingInfo.hide();
}
globals.showSyncingInfo = function () {
  $.syncingInfo.show();
}
$.noTransactions.hide();
$.syncingInfo.hide();
globals.clearTransactionsTable = function () {
  $.paymentList.data = [];
}

function listPayments(dontShowSpinner) {
  $.noTransactions.hide();
  if (dontShowSpinner == undefined || dontShowSpinner == false) {
    globals.showTransactionsLoader();
  }
  globals.lnGRPC.listInvoices(function (error, invoicesResponse) {
    globals.console.log("invoices", invoicesResponse);

    if (error == true) {
      globals.console.error("list invoices error", error);

      alert("error getting invoices");
      return;
    }

    if (OS_IOS) {
      if (invoicesResponse.invoices != undefined) {
        invoicesResponse = invoicesResponse.invoices;
      } else {
        invoicesResponse = [];
      }
    }

    for (var i = 0; i < invoicesResponse.length; i++) {
      var anInvoice = invoicesResponse[i];
      anInvoice.isInvoice = true;
    }

    globals.lnGRPC.listPayments(function (error, paymentsResponse) {

      if (error == true) {
        globals.console.error("list payments error", error);

        alert("error getting payments");
        return;
      }

      if (OS_IOS) {
        if (paymentsResponse.payments == undefined) {
          paymentsResponse.payments = [];
        }

        paymentsResponse = paymentsResponse.payments;
        delete paymentsResponse.payments;
      }

      globals.transactions = invoicesResponse.concat(paymentsResponse).sort(function (x, y) {
        return y.creation_date - x.creation_date;
      });
 
      $.initialLoading.hide();
        globals.didGetTransactionsOnce = true;
        if (globals.transactions.length == 0) {

          $.noTransactions.show();
        }

        addPayments(globals.transactions);
     /* globals.console.log("get transactions");
      globals.lnGRPC.getTransactions(function (error, transactionsResponse) {

        if (error == true) {
          globals.console.error("get transactions error", error);

          alert("error getting transactions");
          return;
        }
        $.initialLoading.hide();
        globals.console.log("get transactions", transactionsResponse);

        if (OS_IOS) {
          if (transactionsResponse.transactions == undefined) {
            transactionsResponse.transactions = [];
          }

          transactionsResponse = transactionsResponse.transactions;
          delete transactionsResponse.transactions;
        }

        var fitleredTransactions = [];

        var txids = JSON.parse(Ti.App.Properties.getString("txidsV1", "{}"));

        var txidKeys = Object.keys(txids);

        globals.console.log("txids", txids);

        for (var i = 0; i < transactionsResponse.length; i++) {
          var aTransaction = transactionsResponse[i];
          aTransaction.creation_date = aTransaction.time_stamp;
          aTransaction.isTransaction = true;
          fitleredTransactions.push(aTransaction);

        }
        var transactions = paymentsAndInvoices.concat(fitleredTransactions).sort(function (x, y) {
          return y.creation_date - x.creation_date;
        });

        globals.transactions = transactions;
        globals.didGetTransactionsOnce = true;
        if (globals.transactions.length == 0) {

          $.noTransactions.show();
        }

        addPayments(transactions);

      });*/

    });

  });

}

globals.listPayments = listPayments;

var control = Ti.UI.createRefreshControl({
  tintColor: Alloy.Globals.mainColor
});
control.id = "refreshControl";

control.addEventListener('refreshstart', function (e) {

  globals.loadMainScreen(true);

});

$.paymentList.refreshControl = control;

function addPayments(payments) {
  globals.updateValuesFuncs = [];
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