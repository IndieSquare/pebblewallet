var args = arguments[0] || {};
var didShowTestnetWarning = false;
$.privacypolicy.top = globals.display.height - 60;
$.signinView.top = (globals.display.height - 400) / 2;

$.wrapper.width = globals.display.width;
$.inputEachphrase.id = 1;
$.inputEachphrase2.id = 2;

$.signinPrev.opacity = 0.5;

var demoPhrase = "above insect rigid doctor rhythm oyster foot park oblige anchor insect cousin clean drink action lemon pulse lunar wolf choice palm horse vital latin";

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
      globals.nativeCrypto.createUserKey(function(success, userKey) {
        if (success) {
          globals.userKey = userKey;

          var encrypted = globals.cryptoJS.AES.encrypt(globals.decryptedPassphrase, globals.userKey).toString();
          globals.console.log("encrypted passphrase", encrypted);
          Ti.App.Properties.setString("passphrase", encrypted);

          var seedArray = globals.decryptedPassphrase.split(","); //convert to string array

          globals.lnGRPC.createWallet("password", seedArray, function(error, response) {
            console.log("create wallet", error);
            console.log("create wallet", response);
            if (error == true) {
              alert(response);
              return;
            }

            if (globals.savePassphrase(globals.decryptedPassphrase, globals.userKey)) {

              Ti.App.Properties.setString("mode", "lndMobile");
              globals.alreadyUnlocked = true; //because we created a new wallet so no need to unlock
              Alloy.createController("frame")
                .getView()
                .open();

              close();
            }

          });
        } else {

          alert("error creating user key");

          return;
        }
      });
    }

    $.signin.close();

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

          setTimeout(function() {
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

        setTimeout(function() {
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

    setTimeout(function() {
      nextField.focus();
    }, 300);

    prevField.animate({
      "left": 500,
      "opacity": 0,
      "duration": 305
    });

    setTimeout(function() {
      prevField.visible = false;

      var temp = prevField;
      prevField = nextField;
      nextField = temp;

      isMoving = false;
    }, 305);
  }
}

var isCreatingAccount = false;

var start = new Date().getTime();

$.buttons.show();
$.privacypolicy.show();

function createNewAccount() {

  if (OS_ANDROID && !Alloy.CFG.isDevelopment) {
    alert("Not yet implemented but comming soon!, on the mean time please connect to your existing node");
    return;
  }

  if (OS_IOS && didShowTestnetWarning == false) {
    var dialog = globals.util.createDialog({
      title: L("label_confirm"),
      message: L("label_try_testnet"),
      buttonNames: [L("label_close"), L("label_ok")]
    });
    dialog.addEventListener("click", function(e) {
      if (e.index != e.source.cancel) {
        didShowTestnetWarning = true;
        createNewAccount();

      }

    });
    dialog.show();
    return;
  }


  showLoading(true);
  setTimeout(function() {
    blurTextFields();

    globals.console.log("starting lndMobile");

    globals.lnGRPC.deleteData(function(error, response) {

      globals.console.log("delete data", error, response);

      if (error == true) {
        alert(response);
        return;
      }

      globals.lnGRPC.startLNDMobile(function(error, response) {

        globals.console.log("lndMobile1", error);
        globals.console.log("lndMobile1", response);

        if (error == true) {
          alert(response);
          return;
        }

        globals.lnGRPC.generateSeed(function(error, response) {

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

    setTimeout(function() {
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

    setTimeout(function() {
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

$.signinNext.addEventListener("touchend", function() {
  moveNext();
});

$.signinPrev.addEventListener("touchend", function() {
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

  passphrase = passphrase.split(",").join();

  if (false == isCreatingAccount) {
    isCreatingAccount = true;
    showLoading(true);
    setTimeout(function() {
      blurTextFields();
      try {

        globals.lnGRPC.deleteData(function(error, response) {

          globals.console.log("delete data", error, response);

          if (error == true) {
            alert(response);
            return;
          }

          globals.lnGRPC.startLNDMobile(function(error, response) {

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

}

function goToPrivacy() {
  Ti.Platform.openURL("https://indiesquare.me/terms");
}

$.signin.addEventListener("android:back", function() {
  return true;
});

function startLink() {

  globals.util.readQRcodeAccount({
      "callback": function(e) {
        $.loadingSpinnerConnect.show();
        $.icons.hide()
        globals.continueConnect(e, function(config) {
          globals.checkConnection(config, function(success, res) {
            if (success) {
              globals.console.log("creating user key");
              globals.nativeCrypto.createUserKey(function(success, userKey) {
                if (success) {
                  globals.userKey = userKey;

                  globals.currentConfig = config;
                  globals.screenView = Alloy.createController("frame")
                    .getView();
                  globals.screenView.open();

                  $.signin.close();

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

        }, function(error) {
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

if (OS_ANDROID && !Alloy.CFG.isDevelopment) {
  $.inputs.remove($.recoverView);
}