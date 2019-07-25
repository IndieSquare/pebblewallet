
$.win.addEventListener('open', function(e) {
    $.win.activity.actionBar.hide();
});
 
globals.dummyMode = false;
 
var downloaded = false;

var progressInterval = null;

$.progressGreen.hide();

$.stopButton.hide();

$.valueLabel.text = "download core";
$.percentageLabel.text = "";


$.centerButton.top = 20;

if(globals.dummyMode == false){
globals.fullNodeController = require("/requires/fullnode_controller");
 globals.fullNodeController.setUp(function (response) {

    globals.console.log(response);

    if (response.response == "download") {
        var val = (response.bytesDownloaded / response.byteSize) * 100;
        $.progress.setValue(val);
        $.statusLabel.text = "downloading..."
        $.valueLabel.text = parseInt(val) + "";

    } else if (response.response == "uncompressing") {
        $.progress.setValue(99);
        $.valueLabel.text = 99 + "";
        $.statusLabel.text = "uncompressing...";

    } else if (response.response == "downloaded") {
        $.statusLabel.text = "downloaded!";
        $.valueLabel.text = 100 + "";
        $.progress.setValue(100);
        setTimeout(function () {
            finishDownload();
        }, 2000);
    }
    else if (response.response == "already started") {
        $.stopButton.show();
        $.valueLabel.font = { fontSize: 40, fontFamily: Alloy.Globals.lightFont };
        
         globals.console.log("already started")

         if(progressInterval == null){
            progressInterval = setInterval(function () {
                globals.console.log("checking progress"); 
                 globals.fullNodeController.getBlockchainInfo();
             }, 2000);
         }
    }
    else if (response.response == "starting") {
        $.stopButton.show();
        clearInterval(progressInterval);
        progressInterval = null;
       progressInterval = setInterval(function () {
           globals.console.log("checking progress"); 
            globals.fullNodeController.getBlockchainInfo();
        }, 2000);

        $.percentageLabel.text = "";
        $.valueLabel.text = "initiating";
        $.valueLabel.font = { fontSize: 40, fontFamily: Alloy.Globals.lightFont };
        $.statusLabel.text = "this may take a while"

        $.valueLabel.animate({});
        $.valueLabel.animate(Ti.UI.createAnimation({
            opacity: 0.1,
            autoreverse: true,
            repeat: 100000,
            duration: 1000
        }));

        $.percentageLabel.animate(Ti.UI.createAnimation({
            opacity: 0.1,
            autoreverse: true,
            repeat: 100000,
            duration: 1000
        }));
    }
    else if (response.response == "getblockchaininfo") {
        
        if(response.error == true){
            $.statusLabel.text = response.res.toLowerCase()+"...";
            $.percentageLabel.text = "";
            return;
        }


        var response = JSON.parse(response.res);
  

        if (response.blocks == 0) {

             
            $.percentageLabel.text = "%";

   
        var headersMax = globals.blockHeight.mainnet;
        if(globals.fullNodeController.isTestnet()){

                var headersMax = globals.blockHeight.testnet;
        }
                $.statusLabel.text = "1/2: downloading headers...\n\n"+response.headers+"/"+headersMax;
                
                var val = response.headers / headersMax
                $.valueLabel.text = parseInt(val*100);
                $.progressGreen.setValue(val*100);
 

             

        } else { 
            setSync(parseFloat(response.verificationprogress+"")*100,response.blocks);
 


        }
    }
    

});



if (globals.fullNodeController.isInstalled() == true) {
     finishDownload();
}

}


$.background.backgroundColor = $.valueLabel.color

$.backgroundInner.width = globals.display.width - 1;

$.backgroundInner.height = globals.display.height - 1;

function formatPercentage(val) {
    val = val+"";
    if (parseFloat(val) >= 1) {
        return 2;
    }
    val = val.split(".");

    if(val.length > 1){
        val = val[1];
    for (var i = 0; i < val.length; i++) {
        var char = val.charAt(i);
        if (char != "0") {
            return i+1;
        }
    }
}
}

function setSync(val,blocks) {
    
    $.progressGreen.setValue(val);



    var genesis = 1231006505;
    if(globals.fullNodeController.isTestnet()){
        genesis = 1296688602;//testnet
    }

    var nowTS = parseInt(Date.now() / 1000);

    var timeDiff = nowTS - genesis;

    var timeToAdd = parseInt(timeDiff * (val / 100))


    var newTime = genesis + timeToAdd;;



    
    var date = new Date(newTime * 1000);
    // Hours part from the timestamp
    var months = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    var daysEnd = { "1": "st", "2": "nd", "3": "rd", "4": "th" }

    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate() + "";
     
     
    console.log("timetoadd "+timeToAdd+" "+newTime+" val "+val+ " "+date);

    var dayEnd = daysEnd[day.substr(day.length - 1)];

    if(parseInt(day) >10 && parseInt(day) <20){
        dayEnd = "th";
    }
   
    if (dayEnd == undefined) {
        dayEnd = "th";
    }

    var formattedTime = day + dayEnd + " " + months[month] + " " + year;

    $.statusLabel.text = "2/2: validating: " + formattedTime+"\n\nblocks: "+blocks;
    $.percentageLabel.text = "%";
     
    $.valueLabel.text = val.toFixed(formatPercentage(val)) + "";
}

function fakeProgress() {
    var val = 0;
    var pInterval = setInterval(function () {
        $.progress.setValue(++val);
        $.statusLabel.text = "downloading..."
        $.valueLabel.text = val + "";

        if (val >= 100) {
            clearInterval(pInterval);
            finishDownload();
        }
    }, 50);
}

function fakeProgress2() {
    var val = 0;
    var pInterval = setInterval(function () {
        val += 0.1
        setSync(val,2323);
    }, 2000);
}



function startDownload() {



    $.centerButton.top = 0;
    $.valueLabel.font = { fontSize: 50, fontFamily: Alloy.Globals.lightFont };
    $.valueLabel.text = 0 + "";
    $.percentageLabel.text = "%";




    if (globals.dummyMode || downloaded == false) {
        $.statusLabel.text = "downloading..."

        if(globals.dummyMode == false){
        globals.fullNodeController.startDownloadCore();
        }
        else{
            
                fakeProgress();

        }
 
    } else {

        $.statusLabel.text = ""
       
        if(globals.dummyMode == false){
        globals.fullNodeController.startCore();
        }else{
            fakeProgress2(); 
        }
    }

}

function finishDownload() {

 
    downloaded = true;
    $.progress.hide();
    $.progressGreen.show();
    $.centerButton.top = 20;
    $.statusLabel.text = ""
    $.valueLabel.font = { fontSize: 20, fontFamily: Alloy.Globals.lightFont };

    $.valueLabel.color = "#79debc";
    $.percentageLabel.color = $.valueLabel.color;
    $.background.backgroundColor = $.valueLabel.color
    $.valueLabel.text = "start core";
    $.percentageLabel.text = "";

}

function goToPage2(){
    $.page1.hide();
    $.page2.show();
}

function closeIntro(){
    $.page1.hide();
    $.page2.hide();
}

function close(){
    $.win.close();
}

 

 function goToSettings(){
    Alloy.createController("fullnode_settings").getView().open();
 }


 function stopCore(){
      
    globals.fullNodeController.stopCore();
    clearInterval(progressInterval);
    $.stopButton.hide();


    finishDownload();
 }

function saveConf(){ 
    return;
var configString="";
    configString += "listen=1\n";

            
            configString += "disablewallet=1\n";
            //outputStream.write("testnet=0\n".getBytes());
            configString += "testnet=1\n";
            //outputStream.write("addnode=192.168.2.47\n".getBytes());
            configString += "prune=550\n";
            //outputStream.write("regtest=1\n".getBytes());
            configString += "upnp=0\n";
            // don't attempt onion connections by default
            configString += "validatepegin=0\n";
            configString += "listenonion=1\n";
            configString += "blocksonly=1\n";
            
            configString += "datadir="+globals.fullNodeController.getDataDir()+"\n";
                console.log(configString);
            globals.fullNodeController.saveConf(configString);


}