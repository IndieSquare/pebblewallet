function close(){
    $.win.close();
}

function deleteData(){
    globals.fullNodeController.deleteCore();
    alert("deleted");
}

function goToConfig(){
    if(globals.dummyMode == false){
       globals.fullNodeController.readConf(function(conf){
        Alloy.createController("fullnode_conf",{conf:conf }).getView().open();
       });
    }else{
        var conf = "testnet=1";
        Alloy.createController("fullnode_conf",{conf:conf }).getView().open();
    }
   
}

function viewLogs(){
    Alloy.createController("fullnode_logs").getView().open();
} 

function goToConsole(){
    Alloy.createController("fullnode_console").getView().open();
} 