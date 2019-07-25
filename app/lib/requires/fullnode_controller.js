module.exports = (function () {
  var self = {};
    var CallbackInterfaceAndroidCore = require("com.mandelduck.androidcore.CallbackInterface");

    var androidcore = require("com.mandelduck.androidcore.DownloadCore");
    
    var Activity = require('android.app.Activity');
   
    var activity = new Activity(Ti.Android.currentActivity);
    var contextValue = activity.getApplicationContext();
    
    self.setUp = function(callback){
      androidcore.setUp(contextValue,activity,new CallbackInterfaceAndroidCore({
        eventFired: function (event) {
          var response = JSON.parse(event); 
          callback(response);
   
        }}));
    }

    self.getLogs = function(callback){
      androidcore.getLogs(new CallbackInterfaceAndroidCore({
        eventFired: function (event) {
          var response = JSON.parse(event); 
          callback(response);
   
        }}));
    }

    self.startDownloadCore = function(){
    androidcore.startDownload();

    }

    self.saveConf = function(newConf){
      androidcore.saveConf(newConf);
  
      }
 

      self.getDataDir = function(){
        androidcore.getDataDir();
    
        }
self.stopCore = function(){
  androidcore.stopCore();
}
    self.getBlockchainInfo = function(){
      androidcore.getBlockchainInfo();
  
      }

    self.deleteCore = function(){
      androidcore.deleteCore();
      androidcore.deleteData();
  
    }

    self.isTestnet = function(){
      return androidcore.isTestnet();
      
  
    }

    self.startCore = function(){
      androidcore.startCore();
  
      }

        self.isInstalled = function(){
          return androidcore.checkIfDownloaded();
        }

      self.getProgress = function(){
        androidcore.getProgress();
    
        }


      Ti.Android.currentActivity.onPause = function(e){
        
        androidcore.onPause();
      };
   
  
      Ti.Android.currentActivity.onResume = function(e){ 
        androidcore.onResume();
      };
  
      self.saveConf = function(conf){
        androidcore.saveConf(conf);
      }

      self.readConf = function(callback){
        androidcore.readConf(new CallbackInterfaceAndroidCore({
          eventFired: function (response) { 
            callback(response);
     
          }}));
      }

      self.sendCommand = function(command,callback){
        androidcore.sendCommand(command, new CallbackInterfaceAndroidCore({
          eventFired: function (event) {
            var response = JSON.parse(event); 
            callback(response);
     
          }}));
      }


  return self;
}());