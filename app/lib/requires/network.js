module.exports = (function() {
  var self = {};

  function onerror(params, e, error) {
    var message = {
      code: "unknown",
      type: "Error",
      message: e.error
    };
    if (error != undefined && error != null) {
      try {
        globals.console.error(error);
        message = JSON.parse(error);
      } catch (e) {}
    }
    globals.console.error("Error: " + e.error + ":" + e.code + ": " + JSON.stringify(message));

    if (params.onError) params.onError(message);
  };

  self.connectPOST = function(params) {

    var xhr = Ti.Network.createHTTPClient({
      "validatesSecureCertificate": !Alloy.CFG.isLocal
    });

    var url = Alloy.CFG.api_uri + "/" + params.version + "/" + params.method;

    if (params.chain != undefined) {

      url = Alloy.CFG.api_uri + params.chain + "/" + params.version + "/" + params.method;

    }

    if (params.url != undefined) {
      url = params.url;
    }

    globals.console.warn("curl -H \"Content-Type: application/json\" -H \"X-Api-Key:" + Alloy.Globals.api_key + "\" -X POST -d '" + JSON.stringify(params.post) + "' " + url);

    xhr.open("POST", url);

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.setRequestHeader("charset", "utf-8");
    xhr.setRequestHeader("X-Api-Key", Alloy.Globals.api_key);

    xhr.onload = function() {

        var results = "";
        try {
          results = JSON.parse(this.responseText);
        } catch (e) {}
        params.callback(results);
        if (params.always != null) params.always();

      },
      xhr.onerror = function(e) {

        globals.console.error("POST Method: " + params.method);
        params.type = "POST";
        params.endpoint = globals.apiUri + "v1/" + params.method;
        onerror(params, e, this.responseText);
        if (params.always != null) params.always();
      };
    xhr.send(JSON.stringify(params.post));

    return xhr;
  };

  self.connectBlockchainInfo = function(callback) {

    var xhr = Ti.Network.createHTTPClient();

    var url = "https://api.blockcypher.com/v1/btc/test3";

    xhr.open("GET", url);

    xhr.onload = function() {
        var results = "";
        try {
          results = JSON.parse(this.responseText);
          callback(null, results);
        } catch (e) {
          callback(e, null);
        }

      },
      xhr.onerror = function(e) {

        globals.console.error("GET Method: " + params.method);
        callback(e, null);
      };
    xhr.send();

    return xhr;
  };

  self.connectGET = function(params) {

    var xhr = Ti.Network.createHTTPClient({
      "validatesSecureCertificate": !Alloy.CFG.isLocal
    });

    var url = Alloy.CFG.api_uri + "/" + params.version + "/" + params.method;

    if (params.chain != undefined) {

      url = Alloy.CFG.api_uri + params.chain + "/" + params.version + "/" + params.method;

    }

    globals.console.warn("curl -H \"Content-Type: application/json\" -H \"X-Api-Key:" + Alloy.Globals.api_key + "\" -X GET -d \"" + JSON.stringify(params.post) + "\" " + url);

    xhr.open("GET", url);

    xhr.setRequestHeader("X-Api-Key", Alloy.Globals.api_key);

    xhr.onload = function() {

        var results = "";
        try {
          results = JSON.parse(this.responseText);
        } catch (e) {}
        params.callback(results);
        if (params.always != null) params.always();
      },
      xhr.onerror = function(e) {

        globals.console.error("GET Method: " + params.method);
        params.type = "GET";
        params.endpoint = globals.apiUri + "v1/" + params.method;
        onerror(params, e, this.responseText);
        if (params.always != null) params.always();
      };
    xhr.send();

    return xhr;
  };

  return self;
}());