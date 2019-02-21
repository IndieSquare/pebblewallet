var args = arguments[0] || {};

$.bitcoinFees.visible = true;

$.topbar.backgroundColor = globals.currentColor;

function close() {

  if (OS_ANDROID) {
    $.win.close();
    return;
  }
  $.background.animate({
    "opacity": 0,
    "duration": 200
  });

  $.mainView.animate({
    "bottom": -292,
    "duration": 200
  });

  setTimeout(function() {
    $.win.width = 0;
    $.win.close();
  }, 200);
}

if (OS_ANDROID) {
  $.win.addEventListener('android:back', function() {
    close();
    return true;
  });
}

$.background.animate({
  "opacity": 0.5,
  "duration": 200
});

$.mainView.animate({
  "bottom": 0,
  "duration": 200
});

var currentFee = Ti.App.Properties.getString("currentFee", "half_hour_fee");
if (currentFee === "fastest_fee") $.checkedHigh.visible = true;
else if (currentFee === "low_fee") $.checkedLow.visible = true;
else if (currentFee === "half_hour_fee") $.checkedMed.visible = true;
else $.checkedCustom.visible = true;

function setCurrentFee(fee) {
  args.setFeeLabel(fee);

  Ti.App.Properties.setString("currentFee", fee);

  $.checkedHigh.visible = false;
  $.checkedMed.visible = false;
  $.checkedLow.visible = false;
  $.checkedCustom.visible = false;
}

$.highButton.addEventListener("click", function() {
  setCurrentFee("fastest_fee");
  $.checkedHigh.visible = true;
  close();
});

$.medButton.addEventListener("click", function() {
  setCurrentFee("half_hour_fee");
  $.checkedMed.visible = true;
  close();
});

$.lowButton.addEventListener("click", function() {
  setCurrentFee("low_fee");
  $.checkedLow.visible = true;
  close();
});

$.customButtonBtc.addEventListener("click", function() {
  var dialog = globals.util.createInputDialog({
    "title": L("label_inputcustom"),
    "message": L("label_inputcustom_message"),
    "value": "",
    "keyboardType": Ti.UI.KEYBOARD_TYPE_DECIMAL_PAD,
    "buttonNames": [L("label_close"), L("label_apply")]
  });
  dialog.origin.addEventListener("click", function(e) {
    var inputText = (OS_ANDROID) ? dialog.androidField.getValue() : e.text;
    if (e.index != e.source.cancel) {
      if (isFinite(inputText)) {
        setCurrentFee(inputText);
        $.checkedCustom.visible = true;
        close();
      } else {
        self.createDialog({
          "message": L("label_inputcustom_error"),
          "buttonNames": [L("label_close")]
        }).show();
      }
    }
  });
  dialog.origin.show();
});