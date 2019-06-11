$.firstLoader.show();

$.firstLoader.top = Alloy.Globals.btclnTopHeight - 30;

$.table.height = globals.util.getDisplayHeight() - Alloy.Globals.btclnTopBarHeight - globals.switchTabHeight;

Alloy.Globals.openChannels = [];
Alloy.Globals.pendingChannels = [];
globals.getChannels = function () {

  globals.console.log("getting channels");

  globals.lnGRPC.listChannels(function (error, res) {
    if (error == true) {
      alert(res);
      return;
    } else {

      globals.console.log("channels", res);

      var openChannelsResult = res;

      if (openChannelsResult.channels != undefined) {
        openChannelsResult = openChannelsResult.channels;
      }

      Alloy.Globals.openChannels = [];

      if (openChannelsResult.reverse != undefined) {
        Alloy.Globals.openChannels = openChannelsResult.reverse();
      }

    }
    updateChannelsList();
    globals.tryAndBackUpChannels();

  });

  globals.lnGRPC.pendingChannels(function (error, res) {
    globals.console.log("pending channels", res);
    if (error == true) {

      alert(res);
      return;
    } else {

      Alloy.Globals.pendingChannels = res;

      if (Alloy.Globals.pendingChannels != undefined) {

        if (Alloy.Globals.pendingChannels.pending_force_closing_channels != undefined) {

          Alloy.Globals.pendingChannels.pending_force_closing_channels.reverse();
        }
        if (Alloy.Globals.pendingChannels.pending_closing_channels != undefined) {
          Alloy.Globals.pendingChannels.pending_closing_channels.reverse();
        }
        if (Alloy.Globals.pendingChannels.pending_open_channels != undefined) {
          Alloy.Globals.pendingChannels.pending_open_channels.reverse();
        }

        if (Alloy.Globals.pendingChannels.waiting_close_channels != undefined) {
          Alloy.Globals.pendingChannels.waiting_close_channels.reverse();
        }
      }

      $.firstLoader.hide();
      updateChannelsList();
      control.endRefreshing();

    }

  });

};

function showPeers() {
  Alloy.createController("peers", {})
    .getView();
}

function showOpenChannel() {
  Alloy.createController("components/component_open_channel_form", {
    parent: globals.channelsFundsView
  })

}

var control = Ti.UI.createRefreshControl({
  tintColor: Alloy.Globals.mainColor,
});
control.addEventListener('refreshstart', function (e) {
  globals.getWalletBalance();
  globals.getChannels();

});

$.table.refreshControl = control;

function openChannelForm() {
  Alloy.createController("components/component_open_channel_form", {
    parent: globals.channelsFundsView
  })

}

function updateChannelsList() {

  $.table.height = globals.util.getDisplayHeight() - Alloy.Globals.btclnTopBarHeight - globals.switchTabHeight;


  var tableData = [];
  var sections = [];

  var openChannelsSection = Ti.UI.createTableViewSection();

  var openChannels = Alloy.Globals.openChannels;

  for (var i = 0; i < openChannels.length; i++) {

    var row = Ti.UI.createTableViewRow({
      className: 'openChannel',
      backgroundSelectedColor: 'transparent',
      rowIndex: i,
      height: 120
    });

    if (OS_IOS) {
      row.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.NONE;
    }

    var aChannel = openChannels[i];
    var openChannel = Alloy.createController('components/component_open_channel', aChannel);
    row.add(openChannel.getView());
    openChannelsSection.add(row);

  }
  var pendingChannelsSection = Ti.UI.createTableViewSection();

  var sectionHeaderView = Titanium.UI.createView({
    backgroundColor: '#33FFFFFF',
    width: "100%",
    height: 30
  });
  var headertitle = Ti.UI.createLabel({
    color: Alloy.Globals.fontColor1,
    font: {
      fontSize: 16
    },
    left: 5,
    text: 'pending',
    textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
    width: Ti.UI.SIZE,
    height: Ti.UI.SIZE
  });
  sectionHeaderView.add(headertitle);
  pendingChannelsSection.setHeaderView(sectionHeaderView);

  var pendingChannels = Alloy.Globals.pendingChannels.pending_open_channels;
  if (pendingChannels == undefined) {
    pendingChannels = [];
  }

  for (var i = 0; i < pendingChannels.length; i++) {

    var row = Ti.UI.createTableViewRow({
      className: 'pendingChannel',
      backgroundSelectedColor: 'transparent',
      rowIndex: i,
      height: 120
    });
    if (OS_IOS) {
      row.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.NONE;
    }

    var aChannel = pendingChannels[i];
    var pendingChannel = Alloy.createController('components/component_pending_channel', aChannel);
    row.add(pendingChannel.getView());
    pendingChannelsSection.add(row);

  }

  var closingChannelsSection = Ti.UI.createTableViewSection();

  var sectionHeaderView = Titanium.UI.createView({
    backgroundColor: '#33FFFFFF',
    width: "100%",
    height: 30
  });
  var headertitle = Ti.UI.createLabel({
    color: Alloy.Globals.fontColor1,
    font: {
      fontSize: 16
    },
    left: 5,
    text: 'closing',
    textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
    width: Ti.UI.SIZE,
    height: Ti.UI.SIZE
  });
  sectionHeaderView.add(headertitle);
  closingChannelsSection.setHeaderView(sectionHeaderView);

  var closingChannels = Alloy.Globals.pendingChannels.waiting_close_channels;
  if (closingChannels == undefined) {
    closingChannels = [];
  }

  for (var i = 0; i < closingChannels.length; i++) {

    var row = Ti.UI.createTableViewRow({
      className: 'closingChannel',
      backgroundSelectedColor: 'transparent',
      rowIndex: i,
      height: 120
    });
    if (OS_IOS) {
      row.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.NONE;
    }

    var aChannel = closingChannels[i];
    var closingChannel = Alloy.createController('components/component_closing_channel', aChannel);
    row.add(closingChannel.getView());
    closingChannelsSection.add(row);

  }

  var forceClosingChannelsSection = Ti.UI.createTableViewSection();

  var sectionHeaderView = Titanium.UI.createView({
    backgroundColor: '#33FFFFFF',
    width: "100%",
    height: 30
  });
  var headertitle2 = Ti.UI.createLabel({
    color: Alloy.Globals.fontColor1,
    font: {
      fontSize: 16
    },
    left: 5,
    text: 'force closing',
    textAlign: Ti.UI.TEXT_ALIGNMENT_LEFT,
    width: Ti.UI.SIZE,
    height: Ti.UI.SIZE
  });
  sectionHeaderView.add(headertitle2);
  forceClosingChannelsSection.setHeaderView(sectionHeaderView);

  var forceClosingChannels = Alloy.Globals.pendingChannels.pending_force_closing_channels;

  if (forceClosingChannels == undefined) {
    forceClosingChannels = [];
  }
  for (var i = 0; i < forceClosingChannels.length; i++) {

    var row = Ti.UI.createTableViewRow({
      className: 'forceClosingChannel',
      backgroundSelectedColor: 'transparent',
      rowIndex: i,
      height: 90
    });
    if (OS_IOS) {
      row.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.NONE;
    }

    var aChannel = forceClosingChannels[i];
    var forceClosingChannel = Alloy.createController('components/component_force_closing_channel', aChannel);
    row.add(forceClosingChannel.getView());
    forceClosingChannelsSection.add(row);

  }

  var tableData = [];

  if (pendingChannels.length > 0) {
    tableData.push(pendingChannelsSection);
  }
  if (closingChannels.length > 0) {
    tableData.push(closingChannelsSection);
  }
  if (forceClosingChannels.length > 0) {
    tableData.push(forceClosingChannelsSection);
  }
  if (Alloy.Globals.openChannels.length > 0) {
    tableData.push(openChannelsSection);
  }

  $.table.data = tableData;

}


function connectToPebbleHUB() {

  var openChannelsFormObject = Alloy.createController("components/component_open_channel_form", {
    parent: globals.channelsFundsView
  })

  openChannelsFormObject.API.setPubKey(globals.getIndieSquareHub());
}

setTimeout(function () {
  globals.getChannels();
}, 2000);