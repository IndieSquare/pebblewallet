function close(){
    $.win.close();
}
function run(){

    var command = $.command.value;
    if(globals.dummyMode == false){
        globals.fullNodeController.sendCommand(command,function(response){
            $.console.value  = response;
        });
    }

}