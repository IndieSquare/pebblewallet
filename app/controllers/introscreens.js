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
  on: function () {
    $.nextButtonPassphrase.opacity = 1.0;
  },
  off: function () {
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
  setTimeout(function () {
    $.win.close();

  }, closeDuration + 5);
}

if (args.fromPrevious == true) {
  continueFromPassphrase();
}

function continueFromPassphrase() {
  $.nextButtonPassphrase.touchEnabled = false;
  if (slider.is || args.fromPrevious == true) {
    if (args.isPassphraseOnly != null) {
      close();
    } else {

      setTimeout(function () {

        globals.console.log("generating user key and saving to keychain")

        globals.nativeCrypto.createUserKey(function (success, userKey) {
          if (success) {
            globals.userKey = userKey;

            Alloy.createController("components/pincode_screen", {
              "type": "set",
              "callback": function (number) {

                globals.passCodeHash = number;

                var encryptedPasscodeHash = globals.cryptoJS.AES.encrypt(globals.passCodeHash, globals.userKey).toString();

                Ti.App.Properties.setString("passcode", encryptedPasscodeHash);
                globals.unlocked = true;
                complete();

              },
              "cancel": function () { }
            }).getView().open();


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
  setTimeout(function () {

    var seedArray = globals.decryptedPassphrase.split(","); //convert to string array
    globals.console.log("create wallet");
    globals.lnGRPC.createWallet(globals.createPassword(globals.passCodeHash), seedArray, -1, "", function (error, response) {
      globals.console.log("create wallet", error);
      globals.console.log("create wallet", response);
      if (error == true) {
        alert(response);
        return;
      }

      if (globals.savePassphrase(globals.decryptedPassphrase, globals.userKey)) {
        globals.console.log("setting lnd mobile");
        Ti.App.Properties.setString("mode", "lndMobile");
        globals.alreadyUnlocked = true; //because we created a new wallet so no need to unlock


        Alloy.createController("components/google_drive_link", { fromIntro: true })
          .getView()
          .open();


        close();
      }

    });

  }, 100);
}

if (OS_ANDROID) {
  $.win.addEventListener('android:back', function () {
    return true;
  });
}