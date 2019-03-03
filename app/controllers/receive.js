function goToWithdraw() {
  Alloy.createController("withdraw", {}).getView().open();
}

function generateDepositAddress() {
  Alloy.createController("/components/component_deposit_address", {
    parent: globals.channelsFundsView
  })
}