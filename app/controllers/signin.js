var args = arguments[0] || {};
var didShowTestnetWarning = false;
$.privacypolicy.top = globals.display.height - 60;
$.signinView.top = (globals.display.height - 400) / 2;

$.wrapper.width = globals.display.width;
$.inputEachphrase.id = 1;
$.inputEachphrase2.id = 2;

$.signinPrev.opacity = 0.5;

var demoPhrase = "about foam jump fitness convince section salad defy dress theory office swim enable clay duty orchard fruit assault inch wisdom patient vibrant day promote";

var nextField = $.inputEachphrase;
var prevField = null;
var fieldcount = -2;
var isMoving = false;
var wordList = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];

if (OS_IOS) {
  if (globals.display.height > 500) {
    $.signinView.scrollingEnabled = false; //on ios titanium scroll view with jolft left and right on keyboard blur so disable for now if we can
  }

}

function init() {
  fieldcount = -2;
  wordList = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];

  $.inputEachphrase.value = "";
  $.inputEachphrase2.value = "";
}

function blurTextFields() {

  $.inputEachphrase2.blur();
  $.inputEachphrase.blur();
}

function createAccount(passphrase, fromPrevious) {
  if (globals.lnGRPC.checkCapacity() == false) {
    alert(L("not_enough_space"));
    return;
  }
  globals.console.log("creating account");
  try {

    globals.decryptedPassphrase = passphrase;
    globals.encryptedPassphrase = globals.decryptedPassphrase;

    if (fromPrevious == false) {

      Alloy.createController("introscreens", {
        fromPrevious: fromPrevious
      })
        .getView()
        .open();
    } else {
      globals.nativeCrypto.createUserKey(function (success, userKey) {
        if (success) {
          globals.userKey = userKey;

          Alloy.createController("components/pincode_screen", {
            "type": "set",
            "callback": function (number) {

              globals.passCodeHash = number;

              var encryptedPasscodeHash = globals.cryptoJS.AES.encrypt(globals.passCodeHash, globals.userKey).toString();
              globals.encryptedPassphrase = encryptedPasscodeHash;
              Ti.App.Properties.setString("passcode", encryptedPasscodeHash);
              globals.unlocked = true;

              var encrypted = globals.cryptoJS.AES.encrypt(globals.decryptedPassphrase, globals.userKey).toString();
              globals.console.log("encrypted passphrase", encrypted);
              Ti.App.Properties.setString("passphrase", encrypted);

              Alloy.createController("components/google_drive_link", { fromSignIn: true })
                .getView()
                .open();

            },
            "cancel": function () { }
          }).getView().open();
        } else {

          alert("error creating user key");

          return;
        }
      });
    }
    if (OS_IOS) {
      setTimeout(function () {
        $.signin.close();
      }, 1000);
    }

  } catch (e) {
    showLoading(false);
    isCreatingAccount = false;
    globals.util.createDialog({
      "message": e,
      "buttonNames": [L("label_close")]
    }).show();
  }
};

var f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, '/scripts/aezeedWordList.txt');

var aezeedWordList = f.read().text.split('\n');

function moveNext() {

  if (!isMoving) {
    var currentWord = (prevField == null) ? null : prevField.value;

    if (fieldcount != -2 && (aezeedWordList.indexOf(currentWord) == -1)) {
      globals.util.createDialog({
        "message": L("label_word_incorrect"),
        "buttonNames": [L("label_close")]
      }).show();
    } else {
      fieldcount++;

      if (fieldcount >= 0 && currentWord != null) {

        wordList[fieldcount] = currentWord;
      }

      if (fieldcount >= 23) {
        var passphrase = "";
        for (var i = 0; 24 > i; i++) {
          passphrase += wordList[i].toLowerCase();
          23 > i && (passphrase += ",");
        }

        signInFromExisting(passphrase);

      } else {

        isMoving = true;
        if (fieldcount >= 0) $.signinPrev.opacity = 1.0;
        if (prevField != null) {
          prevField.animate({
            "left": -100,
            "opacity": 0,
            "duration": 300
          });

          setTimeout(function () {
            prevField.visible = false;
          }, 300);
        }

        if (fieldcount >= 0) nextField.value = wordList[fieldcount + 1];
        nextField.hintText = L("label_word_num").format({
          "num": fieldcount + 2
        });
        nextField.hintTextColor = "gray";
        nextField.left = 500;
        nextField.visible = true;
        nextField.animate({
          "left": (globals.display.width - 200) / 2,
          "opacity": 1,
          "duration": 300
        });

        setTimeout(function () {
          isMoving = false;
          if (fieldcount != -1) {
            nextField.focus();
          }

          var temp = prevField;
          prevField = nextField;
          nextField = temp;

          if (nextField == null) nextField = $.inputEachphrase2;
        }, 305);
      }
    }
  }
}

function movePrev() {
  if (!isMoving && fieldcount > -1) {
    fieldcount--;
    isMoving = true;
    if (fieldcount <= -1) $.signinPrev.opacity = 0.5;

    nextField.value = wordList[fieldcount + 1];
    nextField.hintText = L("label_word_num").format({
      "num": fieldcount + 2
    });
    nextField.hintTextColor = "gray";
    nextField.visible = true;
    nextField.left = -100;
    nextField.animate({
      "left": (globals.display.width - 200) / 2,
      "opacity": 1,
      "duration": 300
    });

    setTimeout(function () {
      nextField.focus();
    }, 300);

    prevField.animate({
      "left": 500,
      "opacity": 0,
      "duration": 305
    });

    setTimeout(function () {
      prevField.visible = false;

      var temp = prevField;
      prevField = nextField;
      nextField = temp;

      isMoving = false;
    }, 305);
  }
}

var isCreatingAccount = false;

function showDisclaimer(callback) {
  if (didShowTestnetWarning == false) {
    var dialog = globals.util.createDialog({
      title: L("label_warning"),
      message: L("label_try"),
      buttonNames: [L("label_understand_risks"), L("label_close")],
      cancel: 1
    });
    dialog.addEventListener("click", function (e) {
      if (e.index != e.source.cancel) {

        var dialog = globals.util.createDialog({
          title: L("label_warning"),
          message: L("label_which_chain"),
          buttonNames: [L("label_testnet"), L("label_close"), L("label_mainnet")],
          cancel: 1
        });
        dialog.addEventListener("click", function (e) {
          globals.console.log(e.index + " " + e.source.cancel);

          if (e.index != e.source.cancel) {

            if (e.index == 0) {
              Alloy.Globals.network = "testnet";

            }
            else if (e.index == 2) {
              Alloy.Globals.network = "mainnet";
            }

            Ti.App.Properties.setString("lndMobileNetwork", Alloy.Globals.network);

            didShowTestnetWarning = true;
            globals.console.log("network", Alloy.Globals.network);
            callback();

          }

        });
        dialog.show();





      }

    });
    dialog.show();
    return;
  }
}

function createNewAccount() {

  showDisclaimer(function () {



    showLoading(true);
    setTimeout(function () {
      blurTextFields();

      globals.console.log("starting lndMobile");

      globals.lnGRPC.deleteData(function (error, response) {

        globals.console.log("delete data", error, response);

        if (error == true) {
          alert(response);
          return;
        }

        globals.lnGRPC.startLNDMobile(function (error, response) {

          globals.console.log("lndMobile1", error);
          globals.console.log("lndMobile1", response);

          if (error == true) {
            alert(response);
            return;
          }

          globals.lnGRPC.generateSeed(function (error, response) {

            if (error == true) {
              alert(response);
              return;
            }

            if (response.cipherSeedMnemonic != undefined) {
              var stringPhrase = response.cipherSeedMnemonic.join();
              createAccount(stringPhrase, false);
            } else {
              alert("error creating passphrase");
              return;
            }

          });
        });

      });

    }, 100);

  });

};

function hasPassphrase() {

  if (!isMoving) {
    isMoving = true;

    $.newwalletButton.animate({
      "top": 0,
      "opacity": 0,
      "duration": 300
    });

    $.hasuserButton.animate({
      "opacity": 0,
      "duration": 300
    });

    $.logo.animate({
      "top": -150,
      "opacity": 0,
      "duration": 300
    });

    setTimeout(function () {
      isMoving = false;
      $.newwalletButton.visible = false;
      $.hasuserButton.visible = false;
      signInWordByWord();
    }, 305);

    $.inputs.visible = true;
    $.inputs.animate({
      "opacity": 1,
      "duration": 300
    });

    init();
    if (globals.display.height <= 480) policy.visible = false;
  }
};

function signInWordByWord() {

  $.inputEachphrase.visible = true;
  $.inputEachphrase.animate({
    "left": (globals.display.width - 200) / 2,
    "opacity": 1,
    "duration": 300
  });

  $.signinInputEach.visible = true;

  moveNext();;

}

function cancel() {
  if (!isMoving) {
    isMoving = true;

    $.newwalletButton.visible = true;

    $.newwalletButton.animate({
      "top": 50,
      "opacity": 1,
      "duration": 300
    });

    $.logo.animate({
      "top": 0,
      "opacity": 1,
      "duration": 300
    });

    $.hasuserButton.visible = true;
    $.hasuserButton.animate({
      "opacity": 1,
      "duration": 300
    });

    $.inputs.animate({
      "opacity": 0,
      "duration": 300
    });

    setTimeout(function () {
      $.inputs.visible = false;

      $.inputEachphrase.left = 500;
      $.inputEachphrase.opacity = 0;
      $.inputEachphrase.visible = false;

      $.inputEachphrase2.left = 500;
      $.inputEachphrase2.opacity = 0;
      $.inputEachphrase2.visible = false;

      nextField = $.inputEachphrase;
      prevField = null;

      $.signinPrev.opacity = 0.5;
      isMoving = false;
    }, 305);

    $.signinInputEach.visible = false;

    init();
    if (globals.display.height <= 480) policy.visible = true;
  }
}

$.signinNext.addEventListener("touchend", function () {
  moveNext();
});

$.signinPrev.addEventListener("touchend", function () {
  movePrev();
});

function showLoading(show) {
  if (show) {
    $.loadingSpinner.height = Ti.UI.SIZE;
    $.loadingSpinner.top = 90;
    $.loadingSpinner.show();
    $.signin.touchEnabled = false;
    $.buttons.visible = false;
    $.privacypolicy.visible = false;
  } else {
    $.loadingSpinner.height = 0;
    $.loadingSpinner.top = 0;
    $.loadingSpinner.hide();
    $.signin.touchEnabled = true;
    $.buttons.visible = true;
    $.privacypolicy.visible = true;
  }
}

function signInFromExisting(passphrase) {

  /*double check all the words are valid*/

  var passphraseWords = passphrase.split(",");
  for (var i = 0; i < passphraseWords.length; i++) {
    var aWordToCheck = passphraseWords[i];
    if (aezeedWordList.indexOf(aWordToCheck) == -1) {
      alert(L("label_mnemonic_24") + " Word " + (i + 1));
      return;
    }
  }

  showDisclaimer(function () {



    passphrase = passphrase.split(",").join();

    if (false == isCreatingAccount) {
      isCreatingAccount = true;
      showLoading(true);
      setTimeout(function () {
        blurTextFields();
        try {

          globals.lnGRPC.deleteData(function (error, response) {

            globals.console.log("delete data", error, response);

            if (error == true) {
              alert(response);
              return;
            }

            globals.lnGRPC.startLNDMobile(function (error, response) {

              globals.console.log("lndMobile1", error);
              globals.console.log("lndMobile1", response);

              if (error == true) {
                alert(response);
                return;
              }

              createAccount(passphrase, true);

            });

          });

        } catch (e) {
          globals.console.error(e);
          throw e;
        }
      }, 100);
    }

  });

}

function goToPrivacy() {
  Ti.Platform.openURL("https://indiesquare.me/terms");
}

$.signin.addEventListener("android:back", function () {
  return true;
});

function startLink() {

  globals.util.readQRcodeAccount({
    "callback": function (e) {
      $.loadingSpinnerConnect.show();
      $.icons.hide()
      globals.continueConnect(e, function (config) {
        globals.checkConnection(config, function (success, res) {
          if (success) {
            globals.console.log("creating user key");
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

                    globals.currentConfig = config;
                    globals.screenView = Alloy.createController("frame")
                      .getView();
                    globals.screenView.open();

                    $.signin.close();

                  },
                  "cancel": function () { }
                }).getView().open();


              } else {
                throw "error creating key"
              }
            });

          } else {
            $.loadingSpinnerConnect.hide();
            $.icons.show()
            alert("error connecting, please try again");
          }
        });

      }, function (error) {
        $.loadingSpinnerConnect.hide();
        $.icons.show()
        alert(error);
      });
    }
  },
    true);

}

function goToLinkInfo() {
  Ti.Platform.openURL("https://pebble.indiesquare.me/remotenode");
}

showLoading(true);

globals.networkAPI.getStartUpInfo(function (error, res) {
  if (error != null) {
    alert(L('error_api'));
  } else {
    globals.blockHeight.testnet = res.testnetHeight;
    globals.blockHeight.mainnet = res.mainnetHeight;
    globals.hubURITestnet = res.hubUriTestnet;
    globals.hubURIMainnet = res.hubUriMainnet;
    globals.discoverEndpoint = res.discoverUrl;
    globals.console.log("res", res.hubUriMainnet);

    if (res.maintenanceMode == true) {
      alert("maintenance");
    } else {
      showLoading(false);
      //testLogin();

    }
  }

});

function testLogin() {
  showDisclaimer(function () {


    globals.lnGRPC.startLNDMobile(function (error, response) {

      globals.console.log("lndMobile1", error);
      globals.console.log("lndMobile1", response);

      if (error == true) {
        alert(response);
        return;
      }

      createAccount(demoPhrase.split(" ").join(), true);

    });

  });
}