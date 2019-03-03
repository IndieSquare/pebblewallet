var args = arguments[0] || {};

var closeDuration = 1000;

$.passphraseLabel.text = globals.decryptedPassphrase.split(",").join(", ");
$.nextButtonPassphrase.title = L("label_continue");
$.nextButtonPassphrase.opacity = 0.2;

if (args.isPassphraseOnly != null) {
  $.nextButtonPassphrase.title = L("label_close");
  closeDuration = 300;
}

var slider = globals.util.createSlider({
  init: false,
  on: function() {
    $.nextButtonPassphrase.opacity = 1.0;
  },
  off: function() {
    $.nextButtonPassphrase.opacity = 0.2;
  }
});

var sliderGroup = globals.util.group({
  "slider": slider.origin,
  "text": globals.util.makeLabel({
    text: L("label_intro_wroteitdown"),
    textAlign: "left",
    color: "white",
    font: {
      fontFamily: "HelveticaNeue-Light",
      fontSize: 15,
      fontWeight: "light"
    },
    left: 10
  })
}, "horizontal");
sliderGroup.bottom = 80;
$.passphrase.add(sliderGroup);

function close() {

  if (OS_ANDROID) {
    $.win.close();
    return;
  }

  $.win.animate({
    "curve": Ti.UI.ANIMATION_CURVE_EASE_IN_OUT,
    "opacity": 0.0,
    "duration": closeDuration
  });
  setTimeout(function() {
    $.win.close();

  }, closeDuration + 5);
}

if (args.fromPrevious == true) {
  continueFromPassphrase();
}

function continueFromPassphrase() {
  if (slider.is || args.fromPrevious == true) {
    if (args.isPassphraseOnly != null) {
      close();
    } else {

      setTimeout(function() {

        globals.console.log("generating user key and saving to keychain")

        globals.nativeCrypto.createUserKey(function(success, userKey) {
          if (success) {
            globals.userKey = userKey;

            var encrypted = globals.cryptoJS.AES.encrypt(globals.decryptedPassphrase, globals.userKey).toString();

            Ti.App.Properties.setString("passphrase", encrypted);

            complete();
          } else {

            alert("error creating user key");

            return;
          }
        });

      }, 300);

    }
  }
}

function complete() {
  setTimeout(function() {

    var seedArray = globals.decryptedPassphrase.split(","); //convert to string array

    globals.lnGRPC.createWallet(globals.userKey, seedArray, function(error, response) {
      console.log("create wallet", error);
      console.log("create wallet", response);
      if (error == true) {
        alert(response);
        return;
      }

      if (globals.savePassphrase(globals.decryptedPassphrase, globals.userKey)) {
        globals.console.log("setting lnd mobile");
        Ti.App.Properties.setString("mode", "lndMobile");
        globals.alreadyUnlocked = true; //because we created a new wallet so no need to unlock
        Alloy.createController("frame")
          .getView()
          .open();

        close();
      }

    });

  }, 100);
}

if (OS_ANDROID) {
  $.win.addEventListener('android:back', function() {
    return true;
  });
}