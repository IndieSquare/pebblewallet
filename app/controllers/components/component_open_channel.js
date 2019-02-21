 var aChannel = arguments[0] || {};

 var channelPoint = aChannel.channel_point;

 var activeText = L("offline");
 var force = false;
 if (aChannel["active"] == "1") {
   activeText = L("online");
 }
 $.active.text = activeText;

 $.pubKey.text = aChannel.remote_pubkey.substr(0, 60) + "...";

 if (aChannel.local_balance == undefined) {
   aChannel.local_balance = 0;
 }

 if (aChannel.remote_balance == undefined) {
   aChannel.remote_balance = 0;
 }

 $.closeChannelButton.text = " " + $.closeChannelButton.text + " ";

 if (OS_IOS) {

   $.closeChannelButton.text = $.closeChannelButton.text + "  ";

 }

 var local_balance_str = aChannel.local_balance + "";
 var localBalanceText = local_balance_str + " SAT";

 if (aChannel.local_balance != undefined) {
   var attr = Titanium.UI.createAttributedString({
     text: localBalanceText,
     attributes: [

       {
         type: Ti.UI.ATTRIBUTE_FONT,
         value: {
           fontSize: 13,
           fontFamily: 'GillSans-Light',
           fontWeight: 'light'
         },
         range: [localBalanceText.indexOf(local_balance_str + ""), (local_balance_str + "").length]
       },
       {
         type: Ti.UI.ATTRIBUTE_FONT,
         value: {
           fontSize: 8,
           fontFamily: 'GillSans-Light',
           fontWeight: 'light'
         },
         range: [localBalanceText.indexOf(" SAT"), (" SAT").length]
       }
     ]
   });
 }

 $.localAmount.attributedString = attr;

 var remoteBalanceText = aChannel.remote_balance + " SAT";

 var attr2 = Titanium.UI.createAttributedString({
   text: remoteBalanceText,
   attributes: [

     {
       type: Ti.UI.ATTRIBUTE_FONT,
       value: {
         fontSize: 13,
         fontFamily: 'GillSans-Light',
         fontWeight: 'light'
       },
       range: [remoteBalanceText.indexOf(aChannel.remote_balance + ""), (aChannel.remote_balance + "").length]
     },
     {
       type: Ti.UI.ATTRIBUTE_FONT,
       value: {
         fontSize: 8,
         fontFamily: 'GillSans-Light',
         fontWeight: 'light'
       },
       range: [remoteBalanceText.indexOf(" SAT"), (" SAT").length]
     }
   ]
 });

 $.remoteAmount.attributedString = attr2;

 function continueCloseChannel() {

   $.closeChannelButton.hide();
   $.loadingSpinner.show();

   try {

     var channelPointObject = channelPoint.split(":");
     var txid = channelPointObject[0];

     var output = channelPointObject[1];
     output = parseInt(output);

     globals.lnGRPC.closeChannel(txid, output, force, function(error, res) {

       if (error == true) {
         try {
           if (res.indexOf("force closing") != -1) {

             var dialog = globals.util.createDialog({
               title: L("label_closechannel_confirm_title"),
               message: L("label_closechannel_confirm_force_description"),
               buttonNames: [L("label_cancel"), L("label_force_close")]
             });

             dialog.addEventListener("click", function(e) {

               if (e.index != e.source.cancel) {
                 force = true;
                 continueCloseChannel();
               } else {
                 $.closeChannelButton.show();
                 $.loadingSpinner.hide();
               }
             });
             dialog.show();

             return;
           }

           globals.console.log(error);
           alert(res);

           $.closeChannelButton.show();
           $.loadingSpinner.hide();

           return;
         } catch (e) {
           globals.console.error(e);
         }
       }
       globals.console.log("close channel", res);
       try {
         console.log(res)
         try {
           console.log(res.close_pending)
         } catch (e) {

         }

         if (res.channel_close_update != undefined) {
           if (res.channel_close_update.txid != undefined) {

             Alloy.Globals.getChannels();
             return
           }
         }
         if (res.pending_update != undefined) {
           if (res.pending_update.txid != undefined) {
             alert("channel closing");
             Alloy.Globals.getChannels();
             return
           }
         }

         //for ios grpc
         if (res.close_pending != undefined) {

           if (res.close_pending.txid != undefined) {
             Alloy.Globals.getChannels();
             return
           }

         }

       } catch (e) {
         globals.console.error(e);
       }

     });
   } catch (e) {
     $.closeChannelButton.show();
     $.loadingSpinner.hide();
     console.error(e);
   }

 }

 function closeChannel() {

   var buttons = [L("label_force_close"), L("label_cancel"), L("label_close")];

   var forceCloseIndex = 0;
   var cancelIndex = 1;
   var closeIndex = 2;

   if (OS_IOS) {
     buttons = [L("label_close"), L("label_force_close"), L("label_cancel")];
     forceCloseIndex = 1;
     cancelIndex = 2;
     closeIndex = 0;
   }

   var dialog = globals.util.createDialog({
     title: L("label_closechannel_confirm_title"),
     message: L("label_closechannel_confirm_description"),
     buttonNames: buttons
   });
   dialog.addEventListener("click", function(e) {
     if (e.index == forceCloseIndex) {
       force = true;
       continueCloseChannel();

     } else if (e.index == closeIndex) {
       continueCloseChannel();
     }

   });
   dialog.show();

 }
 var cachedAlias = Ti.App.Properties.getString(aChannel.remote_pubkey + "_alias", "");
 if (cachedAlias != "") {
   $.alias.text = cachedAlias
 } else {

   globals.lnGRPC.getNodeInfo(aChannel.remote_pubkey, function(error, res) {
     $.alias.text = L('label_loading');

     if (error == false) {
       try {

         $.alias.text = res.node.alias;
         Ti.App.Properties.setString(aChannel.remote_pubkey + "_alias", res.node.alias)
         return;
       } catch (e) {

       }
       $.alias.text = "";

     }

   });
 }