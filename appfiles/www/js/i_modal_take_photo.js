var lastResultTakePhoto = null;
var evtTakePhotoSet = null;

var camTargetWidth = 0;
var camTargetHeight = 0;
var camQuality = 100;
var camFromBack = true;
var camGetAsFileURI = true;

$(function() {
    mountModalTakePhotoEvents();
});

function mountModalTakePhotoEvents()
{
    $("#modalTakePhoto").modal({
        opacity: 0.7, //Opacity of the modal overlay.
        inDuration:	250, //Transition in duration in milliseconds.
        outDuration: 250, //Transition out duration in milliseconds.
        onOpenStart: function(modalElement){ 
            // Callback function called before modal is opened.
        }, 
        onOpenEnd: function(modalElement){ 
            // Callback function called after modal is opened.
            addModalToStack(modalElement);
        }, 
        onCloseStart: function(modalElement){ 
            // Callback function called before modal is closed.
        }, 
        onCloseEnd: function(modalElement){ 
            // Callback function called after modal is closed.
            removeModalFromStack(modalElement)
        }, 
        preventScrolling: true, //Prevent page from scrolling while modal is open.
        dismissible: false, //Allow modal to be dismissed by keyboard or overlay click.
        startingTop: '4%', //Starting top offset
        endingTop: '18%', //Ending top offset
    });

    $(`#btnCloseModalTakePhoto`).off(`click`);
    $(`#btnCloseModalTakePhoto`).on(`click`, function(){
        $("#modalTakePhoto").modal(`close`);
    });

    $(`#btnTakeImageFromPhotoLibrary`).off(`click`);
    $(`#btnTakeImageFromPhotoLibrary`).on(`click`, async function(){
        $("#modalTakePhoto").modal(`close`);

        var image = await startPhotoLibraryToTakePhoto(camTargetWidth, camTargetHeight, camQuality, camFromBack, camGetAsFileURI);
        // const image = await startPhotoLibraryToTakePhoto(0, 0, 100, true, true);

        if(image == null)
        {
            return;
        }

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            const base64Image = `data:image/png;base64,${image}`;
            const imageFileName = `${makeid(8)}.png`;
            const filePath = await saveBase64ImageToBrowserFS(base64Image, imageFileName);
            image = filePath;
        }
        
        // const imageDataURL = `data:image/jpeg;base64,${image}`;
        // console.log(`Image Result: ${image}`);
        // const imageDataURL = await getDeviceFileBase64URL(image);
        // console.log(imageDataURL);
        const imageDataURL = image;
        lastResultTakePhoto = imageDataURL;

        if(evtTakePhotoSet != null)
        {
            evtTakePhotoSet.dispatchEvent(new CustomEvent('imageset', {detail: { image: imageDataURL}}));

            // Remove previous event listener
            evtTakePhotoSet = null;    
        }

    });

    $(`#btnTakeImageFromCamera`).off(`click`);
    $(`#btnTakeImageFromCamera`).on(`click`, async function(){
        $("#modalTakePhoto").modal(`close`);
        
        var image = await startCameraToTakePhoto(camTargetWidth, camTargetHeight, camQuality, camFromBack, camGetAsFileURI);
        // const image = await startCameraToTakePhoto(0, 0, 100, true, true);

        if(image == null)
        {
            return;
        }
        
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            const base64Image = `data:image/png;base64,${image}`;
            const imageFileName = `${makeid(8)}.png`;
            const filePath = await saveBase64ImageToBrowserFS(base64Image, imageFileName);
            image = filePath;
        }

        // const imageDataURL = `data:image/jpeg;base64,${image}`;
        // console.log(`Image Result: ${image}`);
        // const imageDataURL = await getDeviceFileBase64URL(image);
        // console.log(imageDataURL);
        const imageDataURL = image;
        lastResultTakePhoto = imageDataURL;

        if(evtTakePhotoSet != null)
        {
            evtTakePhotoSet.dispatchEvent(new CustomEvent('imageset', {detail: { image: imageDataURL}}));

            // Remove previous event listener
            evtTakePhotoSet = null;    
        }

    });
}

async function initModalTakePhoto(targetWidth, targetHeight, quality, fromBackCamera, getAsFileURI, onImageSet)
{
    lastResultTakePhoto = null;

    if(targetWidth != null)
    {
        camTargetWidth = targetWidth;
    }

    if(targetHeight != null)
    {
        camTargetHeight = targetHeight;
    }

    if(quality != null)
    {
        camQuality = quality;
    }

    if(fromBackCamera != null)
    {
        camFromBack = fromBackCamera;
    }

    if(getAsFileURI != null)
    {
        camGetAsFileURI = getAsFileURI;
    }

    evtTakePhotoSet = new EventTarget();
    evtTakePhotoSet.addEventListener('imageset', onImageSet);

    $("#modalTakePhoto").modal(`open`);
}
