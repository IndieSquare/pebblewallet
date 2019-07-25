 

function close(){
    $.win.close();
}

function refresh(){

    if(globals.dummyMode == false){
        $.logs.value = "";
        globals.fullNodeController.getLogs(function(response){
             
           $.logs.value += response.res;
   
        });
    }else{
       $.logs.value ="dsffasdfasdfasdfasgdkuyilqet7foq7wy"
    }
}
function copy(){
    Ti.UI.Clipboard.setText($.logs.value)
    alert("copied to clipboard");
}

refresh();

 