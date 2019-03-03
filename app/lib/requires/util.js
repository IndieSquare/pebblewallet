module.exports = (function() {

  var self = {};

  var currentCallbackQR = null;
  var bitcoin = require("requires/bitcoin");
  var tiker = require("requires/tiker");
  var qrMode = "";
  globals.tikerLoaded = false;

  globals.dappStoreUrlAppend = "";

  globals.wallets = {};

  function merge(obj1, obj2) {
    if (!obj2) obj2 = {};
    for (var attrname in obj2) {
      if (obj2.hasOwnProperty(attrname)) obj1[attrname] = obj2[attrname];
    }
    return obj1;
  };

  function getFont(params) {
    var basic_font = {
      fontSize: 15,
      fontFamily: "HelveticaNeue-Light"
    };
    if (params.font) basic_font = merge(basic_font, params.font);

    return basic_font;
  };

  function makeAnimation(directory, num, params) {
    var images = [];

    for (var i = 0; i < num; i++) {
      images.push("/images/" + directory + "/" + i + ".png");
    }
    var basic = {
      "images": images,
    };
    var animation = Ti.UI.createImageView(merge(basic, params));
    animation.start();

    return animation;
  };

  self.makeImage = function(params) {
    var image = Ti.UI.createImageView(params);
    return image;
  };

  self.makeImageButton = function(params) {
    var image = Ti.UI.createImageView(params);
    if (params.listener != null) {
      image.addEventListener("click", function() {
        params.listener(image);
      });
    }
    return image;
  };

  self.makeLabel = function(params) {
    var basic = {
      color: "#000000",
      textAlign: Ti.UI.TEXT_ALIGNMENT_CENTER,
    };
    params.font = getFont(params);
    var label = Ti.UI.createLabel(merge(basic, params));

    return label;
  };

  self.makeAnimation = makeAnimation;

  var overlay = Ti.UI.createView({
    backgroundColor: 'transparent',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%"
  });

  var scanImage = Ti.UI.createImageView({
    image: "/images/qrScanOverlay.png",
    width: "70%",
    oapcity: 0.5

  });

  var cancelButton = Ti.UI.createButton({
    title: L('label_cancel'),
    textAlign: 'center',
    color: '#000',
    backgroundColor: '#fff',
    style: 0,
    font: {
      fontWeight: 'light',
      fontSize: 16
    },
    borderColor: '#000',
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.5,
    width: 220,
    height: 30,
    bottom: 10
  });
  cancelButton.addEventListener('click', function() {
    Barcode.cancel();
  });

  var qrMode = "none";
  var enterInfoButton = Ti.UI.createButton({
    title: L('enter_invoice'),
    textAlign: 'center',
    color: '#000',
    backgroundColor: '#fff',
    style: 0,
    font: {
      fontWeight: 'light',
      fontSize: 16
    },
    borderColor: '#000',
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.5,
    width: 220,
    height: 30,
    bottom: 60
  });
  enterInfoButton.addEventListener('click', function() {
    Barcode.cancel();

    if (qrMode == "invoice") {

      Alloy.createController("transaction_conf", {
        "small": true,
        "message": L("enter_payment_request_description"),
        "enterRequest": true,
        "cancel": function() {

        },
        "confirm": function() {

          globals.loadMainScreen();

        },

      });

    } else if (qrMode == "account") {

      Alloy.createController("transaction_conf", {
        "small": true,
        "conf": true,
        "message": L("enter_grpc_config"),
        "enterConfig": true,
        "cancel": function() {

        },
        "confirm": function(res) {
          currentCallbackQR(res);

        },

      });

    }

  });

  overlay.add(enterInfoButton);

  overlay.add(cancelButton);

  overlay.add(scanImage);

  var Barcode = require("ti.barcode");
  Barcode.allowRotation = false;
  Barcode.displayedMessage = "";
  Barcode.useLED = false;


  if (OS_ANDROID) {
    Barcode.allowMenu = false;
  }

  var currentV = null;
  var scannedBarcodes = {},
    scannedBarcodesCount = 0;
  Barcode.addEventListener("error", function(e) {
    Ti.API.info("error received");
    if (currentV.error != undefined) {
      currentV.error({
        "error": e
      });
    }
  });
  Barcode.addEventListener("cancel", function(e) {
    if (currentV.cancel != undefined) {
      currentV.cancel({
        "cancel": e
      });
    }
  });
  Barcode.addEventListener("success", function(e) {
    globals.console.log("Success called with barcode: " + e.result);

    currentV.callback({
      "barcode": e.result
    });

  });

  self.openScanner = function(v) {
    currentV = v;

    function open() {

      Barcode.capture({
        animate: true,
        overlay: overlay,
        showCancel: false,
        showRectangle: false,
        keepOpen: false,
        acceptedFormats: [
          Barcode.FORMAT_QR_CODE
        ]
      });

    }
    if (OS_ANDROID) {
      camera_callback = v;
      currentV = v;
      var permission = "android.permission.CAMERA";
      var has = Ti.Android.hasPermission(permission);
      if (!has) {
        Ti.Android.requestPermissions([permission], function(e) {
          if (e.success) {
            open();
          } else {
            var dialog = self.createDialog({
              message: L("label_permission_deny_camera"),
              buttonNames: [L("label_close"), L("label_go_settings")]
            });
            dialog.addEventListener("click", function(e) {
              if (e.index != e.source.cancel) {
                var intent = Ti.Android.createIntent({
                  action: "android.settings.APPLICATION_DETAILS_SETTINGS",
                  data: "package:" + Ti.App.id
                });
                intent.addFlags(Ti.Android.FLAG_ACTIVITY_NEW_TASK);
                Ti.Android.currentActivity.startActivity(intent);
              }
            });
            dialog.show();
          }
        });
      } else open();
    } else open();
  };

  self.group = function(params, layout) {
    var basic = {
      width: Ti.UI.SIZE,
      height: Ti.UI.SIZE
    };
    if (layout != null) basic.layout = layout;

    var group = Ti.UI.createView(basic);
    for (key in params) {
      group.add(params[key]);
      group[key] = params[key];
    }

    group.addView = function(params) {
      for (key in params) {
        group.add(params[key]);
        group[key] = params[key];
      }
    };

    group.removeView = function(params) {
      for (key in params) {
        group.remove(params[key]);
        group[key] = null;
      }
    };

    return group;
  };

  self.createDialog = function(params, listener) {
    if (params.title == null) params.title = "";
    if (params.buttonNames != null && params.buttonNames.length == 2) {
      if (OS_ANDROID) {
        params.buttonNames.reverse();
        if (params.cancel == null) params.cancel = 1;
      } else if (params.cancel == null) params.cancel = 0;
    }
    var dialog = Ti.UI.createAlertDialog(params);
    if (listener != null) dialog.addEventListener("click", listener);

    return dialog;
  };

  self.createInputDialog = function(params) {
    var dialog = {};
    if (params.title == null) params.title = "";

    var origin;
    if (OS_ANDROID) {
      var inputView = Ti.UI.createView({
        backgroundColor: "#ffffff"
      });
      var style = {
        hintText: (params.hintText) ? params.hintText : "",
        height: 45,
        width: "100%",
        color: "#000000",
        borderStyle: Ti.UI.INPUT_BORDERSTYLE_ROUNDED
      };
      if (params.passwordMask) style.passwordMask = true;
      if (params.keyboardType) style.keyboardType = params.keyboardType;

      dialog.androidField = Ti.UI.createTextField(style);
      inputView.add(dialog.androidField);
      if (params.buttonNames.length == 2) {
        params.buttonNames.reverse();
        if (params.cancel == null) params.cancel = 1;
      }
      if (params.cancel == null) params.cancel = 1;

      origin = Ti.UI.createOptionDialog({
        title: params.title,
        message: params.message,
        androidView: inputView,
        buttonNames: params.buttonNames,
        cancel: params.cancel
      });
      if (params.value) dialog.androidField.setValue(params.value);
    } else {
      if (params.buttonNames.length == 2) {
        if (params.cancel == null) params.cancel = 0;
      }
      var style = {
        title: params.title,
        message: params.message,
        style: Ti.UI.iOS.AlertDialogStyle.PLAIN_TEXT_INPUT,
        buttonNames: params.buttonNames,
        cancel: params.cancel
      };
      if (params.keyboardType) style.keyboardType = params.keyboardType;
      if (params.passwordMask) style.style = Ti.UI.iOS.AlertDialogStyle.SECURE_TEXT_INPUT;
      origin = Ti.UI.createAlertDialog(style);
    }
    dialog.origin = origin;

    return dialog;
  };

  self.createEasyInput = function(params) {
    var inputView = {};

    inputView.view = Ti.UI.createView({
      width: Ti.UI.FILL,
      height: Ti.UI.FILL,
      top: self.getDisplayHeight() - 1
    });

    var back = Ti.UI.createView({
      backgroundColor: "#ffffff",
      width: Ti.UI.FILL,
      height: Ti.UI.FILL,
      top: 0,
      opacity: 0.95
    });
    inputView.view.add(back);

    var comp_marks = {
      m0: self.makeImage({
        image: "/images/image_easyinput_none.png",
        width: 12,
        left: 0
      }),
      m1: self.makeImage({
        image: "/images/image_easyinput_none.png",
        width: 12,
        left: 20
      }),
      m2: self.makeImage({
        image: "/images/image_easyinput_none.png",
        width: 12,
        left: 40
      }),
      m3: self.makeImage({
        image: "/images/image_easyinput_none.png",
        width: 12,
        left: 60
      })
    };

    var numberArray = new Array();
    var numbers = {
      reconfirmed: false
    };

    function flush() {
      for (var i = 0; i < 4; i++) {
        comp_marks["m" + i].image = "/images/image_easyinput_none.png";
        numberArray.pop();
      }
    }

    var callback = function(sign) {
      if (sign === L("label_close")) {
        inputView.close();
        if (params.cancel != null) params.cancel();
      } else if (sign === L("label_erase")) {
        if (numberArray.length > 0) {
          comp_marks["m" + (numberArray.length - 1)].image = "/images/image_easyinput_none.png";
          numberArray.pop();
        }
      } else if (sign === L("label_easypass_redo")) {
        comp_whole.text.text = L("label_easypass_set");
        numbers = {
          reconfirmed: false
        };
        buttons.bc.opacity = 0.0;
        flush();
      } else {
        if (numberArray.length < 4) {
          comp_marks["m" + numberArray.length].image = "/images/image_easyinput_on.png";
          numberArray.push(sign);

          if (numberArray.length >= 4) {
            var number = "";
            for (var i = 0; i < 4; i++) {
              number += numberArray[i];
            }
            if (params.type === "reconfirm") {
              if (numbers.reconfirmed) {
                if (numbers.number === number) {
                  params.callback(Titanium.Utils.md5HexDigest(number));
                  inputView.close();
                } else flush();
              } else {
                comp_whole.text.text = L("label_easypass_reconfirm");
                numbers.number = number;
                numbers.reconfirmed = true;
                buttons.bc.opacity = 1.0;
                flush();
              }
            } else {
              var enc_number = Titanium.Utils.md5HexDigest(number);
              if (enc_number === globals.passCodeHash) {
                params.callback(enc_number);
                inputView.close();
              } else {
                comp_whole.text.text = L("label_easypass_wrongpass");
                flush();
              }
            }
          }
        }
      }
    };

    function createButton(sign, params, callback) {
      if (sign === L("label_close") || sign === L("label_erase") || sign === L("label_easypass_redo")) {
        font = 15;
        opacity = 0.0;
      } else {
        font = 25;
        opacity = 1.0;
      }
      var button = self.group({
        image: self.makeImage({
          image: "/images/image_easyinput_keypad.png",
          width: 60,
          opacity: opacity
        }),
        text: self.makeLabel({
          text: sign,
          color: "#e54353",
          font: {
            fontSize: font
          },
        }),
      });
      button.top = params.top;
      button.left = params.left;

      button.addEventListener("click", function() {
        callback(sign);
      });

      return button;
    }

    var buttons = self.group({
      b1: createButton("1", {
        top: 0,
        left: 0
      }, callback),
      b2: createButton("2", {
        top: 0,
        left: 70
      }, callback),
      b3: createButton("3", {
        top: 0,
        left: 140
      }, callback),
      b4: createButton("4", {
        top: 70,
        left: 0
      }, callback),
      b5: createButton("5", {
        top: 70,
        left: 70
      }, callback),
      b6: createButton("6", {
        top: 70,
        left: 140
      }, callback),
      b7: createButton("7", {
        top: 140,
        left: 0
      }, callback),
      b8: createButton("8", {
        top: 140,
        left: 70
      }, callback),
      b9: createButton("9", {
        top: 140,
        left: 140
      }, callback),
      b0: createButton("0", {
        top: 210,
        left: 70
      }, callback),
      bc: (params.type === "reconfirm") ? createButton(L("label_easypass_redo"), {
        top: 210,
        left: -3
      }, callback) : createButton(L("label_close"), {
        top: 210,
        left: -3
      }, callback),
      bd: createButton(L("label_erase"), {
        top: 210,
        left: 140
      }, callback)
    });
    if (params.type === "reconfirm") buttons.bc.opacity = 0.0;
    buttons.top = 120;

    var logos = self.group({
      logo: self.makeImage({
        image: "/images/icon_logo.png",
        width: 70,
      })
    });
    logos.top = 0;

    var marks = self.group(comp_marks);
    marks.top = 80;

    var instruction_text = L("label_easypass");

    if (params.type === "reconfirm") {
      instruction_text = L("label_easypass_set");
    } else if (params.type === "change") {
      instruction_text = L("label_easypass_current");
    }

    var comp_whole = {
      logos: logos,
      text: self.makeLabel({
        text: instruction_text,
        color: "#e54353",
        font: {
          fontSize: 12
        },
        top: 95
      }),
      marks: marks,
      buttons: buttons
    };
    var whole_view = self.group(comp_whole);
    inputView.view.add(whole_view);

    var inputWindow = null;
    inputView.open = function() {
      inputWindow = Ti.UI.createWindow({
        "orientationModes": [Ti.UI.PORTRAIT],
        "navBarHidden": true,
        "backgroundColor": "transparent",
        "theme": (OS_ANDROID) ? "Theme.AppCompat.Translucent.NoTitleBar" : null,
        "windowSoftInputMode": (OS_ANDROID) ? Ti.UI.Android.SOFT_INPUT_STATE_ALWAYS_HIDDEN : null
      });
      inputWindow.add(inputView.view);
      inputWindow.open();
      inputView.view.animate({
        top: 0,
        duration: 500
      });
    };

    inputView.close = function() {
      inputView.view.animate({
        top: self.getDisplayHeight(),
        duration: 500
      }, function() {
        inputWindow.close();
        inputWindow.remove(inputView.view);
        inputView = null;
      });
    };

    return inputView;
  };

  self.showLoading = function(parent, params) {
    params.font = getFont(params);
    params.style = "dark";
    if (params.width == Ti.UI.FILL && params.height == Ti.UI.FILL) {
      params.backgroundColor = "#ffffff";
      if (params.opacity == undefined) {
        params.opacity = 0.7;
      }
      params.font = {
        fontSize: 15,
        fontFamily: "HelveticaNeue-Light"
      };
      params.color = "#333333";
    }
    var style = Ti.UI.ActivityIndicatorStyle.PLAIN;
    if (params.style != null) {
      if (params.style === "dark") style = Ti.UI.ActivityIndicatorStyle.DARK;
    }
    params.style = style;

    var act = Ti.UI.createActivityIndicator(params);
    act.show();

    parent.add(act);

    act.removeSelf = function() {
      if (act != null) {
        parent.remove(act);
        act = null;
      }
    };

    return act;
  };

  self.qrcodeCallback = function(e, params) {
    var uri = bitcoin.decodeBip21((e.barcode.indexOf("bitcoin:") >= 0) ? e.barcode : "bitcoin:" + e.barcode);
    if (uri == null) {
      var matches = e.barcode.match(/[a-zA-Z0-9]{27,34}/);
      var vals = {};
      vals.address = (matches != null) ? matches[0] : null;
      if (e.barcode.indexOf("&") >= 0) {
        var args = e.barcode.split("&");
        for (var i = 1; i < args.length; i++) {
          var a = args[i].split("=");
          vals[a[0]] = a[1];
        }
      }
      uri = vals;

    }
    if (uri != null) params.callback(uri);
  };

  self.readQRcodeAccount = function(params, any) {
    qrMode = "account";
    enterInfoButton.show();
    enterInfoButton.title = L("enter_config_url")
    self.readQRcode(params, any);
  };

  self.readQRcodeNormal = function(params, any) {

    enterInfoButton.hide();
    self.readQRcode(params, any);
  };

  self.readQRcodeInvoice = function(params, any) {
    qrMode = "invoice";
    enterInfoButton.show();
    enterInfoButton.title = L('enter_invoice')
    self.readQRcode(params, any);
  };

  self.readQRcode = function(params, any) {
    currentCallbackQR = params.callback;
    if (any == false) {

      self.openScanner({
        "callback": function(e) {
          self.qrcodeCallback(e, params);
        }
      });
    } else {
      self.openScanner({
        "callback": function(e) {
          params.callback(e.barcode);
        }
      });
    }
  };

  self.createSlider = function(params) {
    var slider = {};
    var slideColor = "#5c8077";
    slider.is = params.init || false;
    slider.editable = params.editable || true;
    slider.origin = Ti.UI.createView({
      borderRadius: 2,
      backgroundColor: params.init ? slideColor : "#666666",
      width: 60,
      height: 25
    });

    var swit = self.makeImage({
      image: "/images/image_slider.png",
      height: 22.5,
      width: 64.2
    });
    swit.left = (!params.init) ? -18.6 : 16;

    slider.origin.add(swit);
    slider.origin.addEventListener("click", function() {
      if (slider.editable) {
        if (slider.is) {
          if (OS_ANDROID) slider.origin.backgroundColor = "#666666";
          else slider.origin.animate({
            backgroundColor: "#666666",
            duration: 500
          });

          swit.animate({
            left: -18.6,
            duration: 300
          }, params.off);
          slider.is = false;
        } else {
          if (OS_ANDROID) slider.origin.backgroundColor = slideColor;
          else slider.origin.animate({
            backgroundColor: slideColor,
            duration: 500
          });
          swit.animate({
            left: 16,
            duration: 300
          }, params.on);
          slider.is = true;
        }
      }
    });

    slider.on = function() {
      slider.is = true;
      swit.left = 16;
      slider.origin.backgroundColor = slideColor;
    };

    slider.off = function() {
      slider.is = false;
      swit.left = -18.6;
      slider.origin.backgroundColor = "#666666";
    };

    return slider;
  };

  self.getStatusBarHeight = function() {
    switch (Ti.Platform.displayCaps.density) {
      case 160:
        return 25;
      case 120:
        return 19;
      case 240:
        return 38;
      case 320:
        return 50;
      default:
        return 25;
    }
  };

  self.getDisplayHeight = function() {
    if (OS_ANDROID) {
      return (Ti.Platform.displayCaps.platformHeight / Ti.Platform.displayCaps.logicalDensityFactor);
    }
    return Ti.Platform.displayCaps.platformHeight;
  };

  self.getDisplayWidth = function() {
    if (OS_ANDROID) {
      return (Ti.Platform.displayCaps.platformWidth / Ti.Platform.displayCaps.logicalDensityFactor);
    }
    return Ti.Platform.displayCaps.platformWidth;
  };

  self.convert_x = function(val) {
    return (OS_ANDROID) ? (val / Ti.Platform.displayCaps.logicalDensityFactor) : val;
  };

  self.convert_y = function(val) {
    return (OS_ANDROID) ? (val / Ti.Platform.displayCaps.logicalDensityFactor) : val;
  };

  self.isTestAccount = function() {
    return (globals.datas.identifier === "test" && globals.datas.password === "test");
  };

  self.satToBtc = function(value, format) {

    function roundFix(number, precision) {
      var multi = Math.pow(10, precision);
      return Math.round((number * multi).toFixed(precision + 1)) / multi;
    }

    var val = value / 100000000;

    if (format == true) {
      return roundFix(val, 6).toString();
    }

    return val;
  };

  self.btcToSat = function(value) {

    var val = value * 100000000;

    return val;
  };

  self.setReorg = function(parent) {
    var params = {};

    params.width = params.height = Ti.UI.FILL;
    params.backgroundColor = "#e54353";
    params.opacity = 0.0;

    var view = Ti.UI.createView(params);
    var texts = self.group({
      "title": self.makeLabel({
        text: L("label_reorganisation"),
        color: "#ffffff",
        font: {
          fontSize: 18
        },
        top: 0
      }),
      "text": self.makeLabel({
        text: L("text_reorganisation"),
        color: "#ffffff",
        font: {
          fontSize: 15
        },
        top: 10
      }),
      "text2": self.makeLabel({
        text: L("text_reorganisation2"),
        color: "#ffffff",
        font: {
          fontSize: 12
        },
        top: 10
      })
    }, "vertical");
    texts.width = "90%";

    var loading = self.showLoading(texts, {});
    loading.top = 10;

    view.add(texts);
    view.animate({
      opacity: 0.9,
      duration: 300
    });

    parent.add(view);

    view.removeSelf = function() {
      parent.remove(view);
      view = null;
    };

    return view;
  };

  self.saveLNDConf = function() {

    var confString = "[Application Options]\n\n";
    confString += "debuglevel=info\n"
    confString += "nolisten=1\n"

    confString += "maxlogfiles=3\n"
    confString += "maxlogfilesize=10\n"
    confString += "debuglevel=trace\n"

    confString += "\n[Bitcoin]\n"
    confString += "bitcoin.active=1\n"
    confString += "bitcoin.testnet=1\n"
    confString += "bitcoin.node=neutrino\n"

    confString += "\n[Autopilot]\n\n"
    if (Ti.App.Properties.getInt("autoPilot", 1) == 0) {

      confString += "autopilot.active=0\n"
    } else {

      confString += "autopilot.active=1\n"
    }
    confString += "autopilot.allocation=0.6\n"
    confString += "autopilot.maxchannels=5\n"
    confString += "autopilot.minchansize=20000\n"
    confString += "autopilot.maxchansize=16000000\n"


    confString += "\n[Neutrino]\n\n"
    confString += "neutrino.addpeer=159.203.125.125\n"
    confString += "neutrino.addpeer=faucet.lightning.community\n"

    var filePath = Ti.Filesystem.applicationSupportDirectory + "lnd/lnd.conf";
    var file = Ti.Filesystem.getFile(filePath);
    file.write(confString);

  }

  self.saveTxid = function(txid, address) {

    var txids = Ti.App.Properties.getString("txidsV1", "{}");

    txids = JSON.parse(txids);

    txids[txid] = address;

    globals.console.log(txids);

    Ti.App.Properties.setString("txidsV1", JSON.stringify(txids));

  }

  self.scheduleReminderNotif = function() {
    var notification = Ti.App.iOS.scheduleLocalNotification({
      userInfo: {
        "id": "check"
      },
      alertBody: L("check_notification"),
      date: new Date(new Date().getTime() + 172800)
    });
  }

  self.saveAddress = function(address) {

    var addresses = Ti.App.Properties.getString("addresses", "[]");

    addresses = JSON.parse(addresses);
    addresses.push(address);

    globals.console.log(addresses);

    Ti.App.Properties.setString("addresses", JSON.stringify(addresses));

  }

  self.getCurrentNetworkBlockHeight = function(network) {

    var lastHeight = globals.blockHeight[network];
    globals.console.log("lastheight", lastHeight);

    var lastTimeStamp = Ti.App.Properties.getInt("latest_time_stamp_" + network, 1548240202);

    var currentTimeStamp = Math.floor(Date.now() / 1000);

    var diff = currentTimeStamp - lastTimeStamp;

    var numberOfNewBlocks = Math.floor(diff / 600);
    globals.console.log("number of new blocks", numberOfNewBlocks);
    return Math.floor((lastHeight + numberOfNewBlocks));
  }

  self.addPullEvent = function(view, params) {
    var a = null;
    if (OS_ANDROID) {
      a = view.children[0].convertPointToView({
        "x": view.children[0].rect.x,
        "y": view.children[0].rect.y
      }, params.parent);
    }

    var reload = self.makeImageButton({
      "image": '/images/icon_reload_off.png',
      "width": 30,
      "top": (a != null) ? self.convert_y(a.y) : params.marginTop,
      opacity: 0.0
    });
    params.parent.add(reload);

    var s = 0,
      s_total = 0,
      top = view.children[0].top;
    var howpull = params.howpull || 60;

    function scroll(y) {
      if (y > -howpull) {
        reload.opacity = (y / -howpull);
        reload.image = '/images/icon_reload_off.png';
      } else {
        reload.opacity = 1.0;
        reload.image = '/images/icon_reload_on.png';
      }
      var t = Ti.UI.create2DMatrix();
      reload.transform = t.rotate(90 - (90 * reload.opacity)).scale(reload.opacity, reload.opacity);
    }

    function release(y) {
      if (y < -howpull) {
        if (OS_ANDROID) {
          //view.children[0].top = y;
          view.children[0].animate({
            "top": top,
            "duration": 100
          });
        } else if (OS_IOS) {
          view.children[0].animate({
            "top": top,
            "duration": 100
          });
        }
        //var loading = self.showLoading(params.parent, { width: Ti.UI.FILL, height: 25, top: (a != null)? self.convert_y(a.y): params.marginTop });
        params.callback();
      } else if (OS_ANDROID) {
        view.children[0].animate({
          "top": top,
          "duration": 100
        });
        s_total = 0;
      }
      reload.image = '/images/icon_reload_off.png';
      reload.opacity = 0.0;
    }
    if (OS_IOS) {
      view.addEventListener('scroll', function(e) {
        if (view.contentOffset.y <= 0) scroll(view.contentOffset.y);
      });
      view.addEventListener('dragEnd', function(e) {
        release(view.contentOffset.y);
      });
    } else if (OS_ANDROID) {
      var move = 0;
      view.addEventListener('touchstart', function(e) {
        s = e.y;
        move = 0;
        if (s_total < 0) s_total = 0;
      });
      view.addEventListener('touchmove', function(e) {
        if (move++ > 3) {
          globals.isScrolling = true;
          if (view.contentOffset.y <= 0 || view.children[0].top > top) {
            if (s != 0) {
              var diff = (s - e.y) / 2;
              if (Math.abs(diff) < 100) s_total += diff;
              view.children[0].top = -s_total;
              if (view.children[0].top <= top) {
                view.children[0].top = top;
                view.scrollingEnabled = true;
              }
              scroll(-view.children[0].top);
            }
            s = e.y;
          }
        }
      });
      view.addEventListener('touchend', function(e) {
        globals.isScrolling = false;
        release(-view.children[0].top);
        s = 0;
      });
    }
  };

  return self;
}());