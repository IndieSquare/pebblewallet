module.exports = (function() {
  var self = {};

  self.bootStrapChannel = function() {

    if (Ti.App.Properties.getInt("didBootstrap", 0) == 1) {
      return;
    }

    if (Ti.App.Properties.getInt("autoPilot", 0) == 0) {
      return;
    }


    globals.console.log("starting bootstrap channel with pebble hub");


    checkIfHasWalletBalance(function(hasBalance) {
      if (hasBalance == true) {

        globals.console.log("has balance, checking if has channel");

        checkIfHasChannel(function(hasChannel) {
          if (hasChannel == false) {
            //dont have a channel so open with pebble hub
            globals.console.log("try and open channel with hub")
            var lightningAddress = globals.getIndieSquareHub();

            globals.console.log(lightningAddress);

            var pubKey = lightningAddress.split('@')[0];
            var host = lightningAddress.split('@')[1];

            globals.lnGRPC.connectPeer(lightningAddress,

              function(error, res) {

                globals.console.log("connect peer res", res);
                var peerAlreadyAdded = false;

                if ((res + "").indexOf("already connected") != -1) {

                  peerAlreadyAdded = true;

                }

                if (error == true && peerAlreadyAdded == false) {

                  globals.console.error("error connecting to peer");

                } else {

                  globals.console.log("res", res);

                  globals.console.log(pubKey);
                  var amount = globals.getRecommendedChannelAmount();
                  globals.console.log("trying to open channel");
                  globals.lnGRPC.openChannel(pubKey, amount,
                    function(error, res) {
                      
                      if (error == true) {
                        globals.console.error("open channel error", error);

                      } else {

                        globals.console.log("open channel res is ", res);

                        var fundingTxidStr = res['funding_txid_str'];
                        globals.console.log("funding tx", fundingTxidStr);

                      }

                    });

                }

              });

          } else {
            console.log("already has channel")
            //end as already have a channel
          }
        });

      } else {
        //try again in a bit
        setTimeout(function() {
          self.bootStrapChannel();
        }, 10000)
      }
    });

  }


  function checkIfHasWalletBalance(callback) {


    globals.lnGRPC.getWalletBalance(function(error, response) {

      if (error == false) {
        globals.console.log("has balance", response)
        var walletConfirmedBalance = parseInt(response.confirmed_balance);
        if (walletConfirmedBalance > globals.getRecommendedChannelAmount()) {

          globals.console.log("balance is enough")
          callback(true);
          return;
        } else {
          globals.console.log("balance is not enough", globals.getRecommendedChannelAmount())
        }

      }

      callback(false);

    });


  }

  function checkIfHasChannel(callback) {

    globals.lnGRPC.listChannels(function(error, res) {
      if (error == false) {


        var openChannels = [];
        var openChannelsResult = res;

        if (openChannelsResult.channels != undefined) {
          openChannels = openChannelsResult.channels;
        }

        if (openChannels.length > 0) {
          callback(true)
          return;
        }

        globals.lnGRPC.pendingChannels(function(error, res) {

          if (error == false) {
            var pendingChannels = res;

            if (pendingChannels != undefined) {

              if (pendingChannels.pending_open_channels != undefined) {
                if (pendingChannels.pending_open_channels.length > 0) {
                  callback(true);

                  return;
                }
              }


            }

            callback(false);

            return;

          } else {
            callback(true);
            return;
          }


        });


      } else {
        callback(true);
        return;
      }

    });

  }

  return self;
}());