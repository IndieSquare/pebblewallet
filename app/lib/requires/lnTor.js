module.exports = (function () {
    var self = {};

    var uri = "";
    var macaroon = ""
    var header = "Grpc-Metadata-macaroon";
    self.setUp = function(host,macaroonHex){
        uri = host;
        macaroon = macaroonHex;
        globals.console.log("set host and macaroon");
    }
    self.isOnionAddress = function(host){
        return host.indexOf(".onion") != -1
    }

    self.getInfo = function(callback){
        
        var xhr = Ti.Network.createHTTPClient();
    
        var url = uri +"v1/getinfo"; 

        xhr.open("GET", url);
    
        xhr.setRequestHeader(header, macaroon);
     
        xhr.onload = function () {
            
            callback(false,JSON.parse(this.responseText));
          
        },
        xhr.onerror = function (e) {
       
            callback(true,this.responseText); 
    
          };
        xhr.send();

    }

    self.listInvoices = function(callback){
        
        var xhr = Ti.Network.createHTTPClient();
    
        var url = uri +"v1/invoices"; 

        xhr.open("GET", url);
    
        xhr.setRequestHeader(header, macaroon);
     
        xhr.onload = function () {
            
            callback(false,JSON.parse(this.responseText));
          
        },
        xhr.onerror = function (e) {
       
            callback(true,this.responseText); 
    
          };
        xhr.send();

    }

    self.getChannelBalance = function(callback){
        
        var xhr = Ti.Network.createHTTPClient();
    
        var url = uri +"v1/balance/channels"; 

        xhr.open("GET", url);
    
        xhr.setRequestHeader(header, macaroon);
     
        xhr.onload = function () {
            
            callback(false,JSON.parse(this.responseText));
          
        },
        xhr.onerror = function (e) {
       
            callback(true,this.responseText); 
    
          };
        xhr.send();

    }

    self.listPayments = function(callback){
        
        var xhr = Ti.Network.createHTTPClient();
    
        var url = uri +"v1/payments"; 

        xhr.open("GET", url);
    
        xhr.setRequestHeader(header, macaroon);
     
        xhr.onload = function () {
            
            callback(false,JSON.parse(this.responseText));
          
        },
        xhr.onerror = function (e) {
       
            callback(true,this.responseText); 
    
          };
        xhr.send();

    }
  
    return self;
  }());