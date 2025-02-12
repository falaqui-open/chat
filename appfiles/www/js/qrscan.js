const CAMERA_BACK = 0;
const CAMERA_FRONT = 1;
let currentCamera = CAMERA_BACK;

$(function() {
    mountEvents();

    var itvWaitDevice = setInterval(function(){
        if(deviceIsReady == true)
        {
            clearInterval(itvWaitDevice);
            initScreen();
        }
    }, 500);
});

function initScreen()
{
    initCamera();
}

function mountEvents()
{
    $(`#btnQrScanBackButton`).off(`click`);
    $(`#btnQrScanBackButton`).on(`click`, function(){
        let screenToBack = readSessionStorage(`qrscanbackscreen`);
        removeSessionStorage(`qrscanbackscreen`);

        cameraDestroy();

        // writeLocalStorage(`justbackfromqrscan`, `1`);
        redirectToLeft(screenToBack);
    });

    $(`#btnTryAgain`).off(`click`);
    $(`#btnTryAgain`).on(`click`, function(){
        // location.reload();
        // initScreen();
        initCamera();
    });

    $(`#btnSwitchCamera`).off(`click`);
    $(`#btnSwitchCamera`).on(`click`, function(){
        switchCamera();
    });
}

function requestUserToEnableCamera()
{
    QRScanner.getStatus(function(status){
        if(!status.authorized && status.canOpenSettings)
        {
            swalConfirm(`Enable QR code scanning`, `Would you like to enable QR code scanning?`, `warning`, `No`, `Yes`, function(){
                // No Button click
                // QRScanner.cancelScan(function(status){
                //     // console.log(status);
                // });
                cameraDestroy();
            }, function(){
                // Yes Button click
                QRScanner.openSettings();
            });

            $(`html`).css(`background`, ``);
            $(`body`).css(`background`, ``);
            $(`#reloadArea`).removeClass(`hide`);
            $(`#cameraControls`).addClass(`hide`);
            $(`#qrScanAim`).addClass(`hide`);
        }
        else
        {
            if(status.authorized == true)
            {
                initCamera();
            }
        }
    });


}

function initCamera()
{
    QRScanner.prepare(onDone); // show the prompt

    function onDone(err, status){
        if (err) 
        {
            // console.log(`Situation 1`);

            // here we can handle errors and clean up any loose ends.
            // swal(`Unable to scan`, err, `error`);
            const { name, _message } = err;
            if (name === "CAMERA_ACCESS_DENIED") 
            {
                requestUserToEnableCamera();
            }
            else
            {
                swal(`Unable to scan`, _message, `error`);
            }
        }
        if (status.authorized) 
        {
            // console.log(`Situation 2`);

            $(`html`).css(`background`, `transparent`);
            $(`body`).css(`background`, `transparent`);
            $(`#reloadArea`).addClass(`hide`);
            $(`#cameraControls`).removeClass(`hide`);
            $(`#qrScanAim`).removeClass(`hide`);

            // W00t, you have camera access and the scanner is initialized.
            // QRscanner.show() should feel very fast.

            // Start a scan. Scanning will continue until something is detected or
            // `QRScanner.cancelScan()` is called.
            QRScanner.scan(displayContents);

            function displayContents(err, text){
                if(err)
                {
                    // an error occurred, or the scan was canceled (error code `6`)
                    swal(`The scan was canceled`, err, `error`);

                    // QRScanner.cancelScan(function(status){
                    //     // console.log(status);
                    // });
                    cameraDestroy();

                } 
                else 
                {
                    // The scan completed, display the contents of the QR code:
                    // alert(text);
                    cameraDestroy();

                    writeSessionStorage(`lastqrscan`, text);
                    let screenToBack = readSessionStorage(`qrscanbackscreen`);
                    redirectToLeft(screenToBack);
                }
            }

            QRScanner.useCamera(currentCamera, function(err, status){
                // err && console.error(err);
                // console.log(status);
            });

            // Make the webview transparent so the video preview is visible behind it.
            QRScanner.show();
            // Be sure to make any opaque HTML elements transparent here to avoid covering the video.
           
        } 
        else if (status.denied) 
        {
            // console.log(`Situation 3`);

            // The video preview will remain black, and scanning is disabled. We can
            // try to ask the user to change their mind, but we'll have to send them
            // to their device settings with `QRScanner.openSettings()`.
            
            swal(`Unable to scan`, `You denied permission for this application to use your camera.`, `error`).then(() =>{ 
                requestUserToEnableCamera();                 
            });
        } 
        else 
        {
            // console.log(`Situation 4`);

            // we didn't get permission, but we didn't get permanently denied. (On
            // Android, a denial isn't permanent unless the user checks the "Don't
            // ask again" box.) We can ask again at the next relevant opportunity.

            swal(`Unable to scan`, `Your device denied permission for this application to use your camera.`, `error`).then(() =>{ 
                // QRScanner.cancelScan(function(status){
                //     // console.log(status);
                // });
                cameraDestroy();
            });
        }
    }
}

function switchCamera()
{
    if(currentCamera == CAMERA_BACK)
    {
        currentCamera = CAMERA_FRONT
    }
    else
    {
        currentCamera = CAMERA_BACK;
    }

    QRScanner.useCamera(currentCamera, function(err, status){
        // err && console.error(err);
        // console.log(status);
    });
}

function cameraDestroy()
{
    QRScanner.destroy(function(status){
        // console.log(status);
    });

    $(`html`).css(`background`, ``);
    $(`body`).css(`background`, ``);
    $(`#cameraControls`).addClass(`hide`);
    $(`#qrScanAim`).addClass(`hide`);

    let bodyColor = $(`body`).css(`background-color`);
    if(bodyColor.toLowerCase().indexOf(`rgb`) > -1)
    {
        bodyColor = convertRGBToHex(bodyColor);
    }
    window.plugins.webviewcolor.change(bodyColor);
}