var args = arguments[0] || {};
var lastLength = -1;

function close(e) {

  if (OS_ANDROID) {
    $.win.close();
    return;
  }

  $.background.animate({
    "opacity": 0,
    "duration": 200
  });

  $.mainView.animate({
    "left": globals.display.width,
    "duration": 200
  });

  setTimeout(function() {
    $.win.width = 0;
    $.win.close();
  }, 200);
}

globals.closeSettings = close;

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

if (OS_IOS) {
  $.mainView.animate({
    "left": 0,
    "duration": 200
  });
}
$.logs_text.width = globals.util.getDisplayWidth();
$.scrollView.width = $.logs_text.width;

function loadLogs() {
  globals.dataDir = Ti.Filesystem.applicationSupportDirectory + "lnd/logs/bitcoin/testnet/lnd.log";
  try {

    var f = Ti.Filesystem.getFile(globals.dataDir);

    var logs = f.read().text;
    var logsArray = logs.split("\n");

    if (lastLength == -1) {
      lastLength = logsArray.length;
      var startI = logsArray.length - 2;
      if (logsArray.length > 50) {
        startI = logsArray.length - 50;
      }

      for (var i = startI; i < logsArray.length; i++) {
        var nextLog = logsArray[i];

        globals.console.log(logsArray.length + "  -  " + nextLog);

        $.logs_text.text += "\n" + nextLog;
      }
    }

    if (lastLength != logsArray.length) {
      lastLength = logsArray.length;
      var nextLog = logsArray[logsArray.length - 2];
      globals.console.log(logsArray.length + "  -  " + nextLog);

      $.logs_text.text += "\n" + nextLog;
    }

    $.scrollView.scrollToBottom();
    updateLogs();
  } catch (e) {
    globals.console.error(e);
    globals.console.log(globals.dataDir);
  }

}

function updateLogs() {
  setTimeout(function() {
    loadLogs()

  }, 500);
}
updateLogs()