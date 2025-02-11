var inAppBrowserMiniApp = null;
$(function() {
    mountLoadingMiniAppEvents();
    initLoadingMiniApp();
});

function mountLoadingMiniAppEvents()
{
    $(`#btnOpenMiniAppTest`).off(`click`);
    $(`#btnOpenMiniAppTest`).on(`click`, function(){
        let typed = $(`#txtOpenMiniAppTest`).val();
        loadMiniAppURL(typed);
    });
}

function initLoadingMiniApp()
{

}

function loadMiniAppURL(url)
{
    // window.open("http://10.0.2.16:8001/index.html", "_self", "location=yes");
    window.open(url, "_self", "location=yes");

    // var target = "_blank";
    // // var options = "location=yes,hidden=yes,beforeload=yes";
    // var options = "location=yes";
    // inAppBrowserMiniApp = cordova.InAppBrowser.open(url, target, options);

    // inAppBrowserMiniApp.addEventListener('loadstart', function(){

    // });

    // inAppBrowserMiniApp.addEventListener('loadstop', function(){
    //     if (inAppBrowserMiniApp != null) 
    //     {
    //         inAppBrowserMiniApp.show();
    //     }
    // });

    // inAppBrowserMiniApp.addEventListener('loaderror', function(params){   
    //     inAppBrowserMiniApp.close();
    
    //     inAppBrowserMiniApp = null;
    // });


    // inAppBrowserMiniApp.addEventListener('beforeload', function(params, callback){

    // });

    // inAppBrowserMiniApp.addEventListener('message', function(params){

    // });

    // inAppBrowserMiniApp.addEventListener('exit', function(params){
    //     if (inAppBrowserMiniApp == null) 
    //     {
    //         return;
    //     }

    //     inAppBrowserMiniApp.close();
    //     inAppBrowserMiniApp = null;
    // });
}