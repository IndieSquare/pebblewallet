function goToWithdraw() {
  Alloy.createController("withdraw", {}).getView().open();
}

function generateDepositAddress() {
  Alloy.createController("/components/component_deposit_address", {
    parent: globals.channelsFundsView
  })
}

$.noTransactions.hide();

var control = Ti.UI.createRefreshControl({
  tintColor: Alloy.Globals.mainColor
});
control.id = "refreshControl";

control.addEventListener('refreshstart', function (e) {

  loadTransactions();

});
var didLoadOnce = false;
$.paymentList.refreshControl = control;


      function loadTransactions(){

        globals.console.log("get transactions");
        if(didLoadOnce == false){
          didLoadOnce = true;
        $.initialLoading.show();
        }
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
   
          for (var i = 0; i < transactionsResponse.length; i++) {
            var aTransaction = transactionsResponse[i];
            aTransaction.creation_date = aTransaction.time_stamp;
            aTransaction.isTransaction = true;
            if(aTransaction.amount != undefined){
              fitleredTransactions.push(aTransaction);
            }
  
          }

            if(fitleredTransactions.reverse != undefined){
              fitleredTransactions = fitleredTransactions.reverse();
            }
          $.noTransactions.top = 0;
          if (fitleredTransactions.length == 0) {
            $.noTransactions.top = 30;
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