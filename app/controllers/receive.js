function goToWithdraw() {
  Alloy.createController("withdraw", {
    balance: globals.util.satToBtc(globals.currentOnchainBalance)
  }).getView().open();
}

function generateDepositAddress() {
  Alloy.createController("/components/component_deposit_address", {
    parent: globals.channelsFundsView
  })
}