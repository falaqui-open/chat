var photoProfileEditHasChanged = false;

$(function() {
    mountModalProfileEditEvents();
});

function mountModalProfileEditEvents()
{
    const modalIsDismissible = true;

    $("#modalProfileEdit").modal({
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
        dismissible: modalIsDismissible, //Allow modal to be dismissed by keyboard or overlay click.
        startingTop: '4%', //Starting top offset
        endingTop: '18%', //Ending top offset
    });

    $(`#btnCloseModalProfileEdit`).off(`click`);
    $(`#btnCloseModalProfileEdit`).on(`click`, function(){
        closeModalProfileEdit();
    });





    $(`#profileEditUserProfileChangePhotoRequest`).off(`click`);
    $(`#profileEditUserProfileChangePhotoRequest`).on(`click`, async function(){
        await initModalTakePhoto(100, 100, 80, false, true, async function(imageSetEvent){
            const imageURI = imageSetEvent.detail.image;
            const imageSource = await getDeviceFileBase64URL(imageURI);
            $(`#imgProfileEditPhoto`).attr(`src`, imageSource);

            $(`#btnProfileEditSave`).attr("data-photouri", imageURI);

            $(`#profileEditUserProfileClearPhoto`).removeClass(`hide`);

            photoProfileEditHasChanged = true;
        });
    });

    $(`#profileEditUserProfileClearPhoto`).off(`click`);
    $(`#profileEditUserProfileClearPhoto`).on(`click`, async function(){
        $(`#imgProfileEditPhoto`).attr(`src`, `images/add-photo-padding.png`);
        $(`#profileEditUserProfileClearPhoto`).addClass(`hide`);
        $(`#btnProfileEditSave`).removeAttr("data-photouri");
        photoProfileEditHasChanged = true;
    });

    $(`#txtProfileEditName`).keypress(async function (e) {
        if (e.which == 13) 
        {
            $(`#btnProfileEditSave`).trigger("click");
        }
    });

    $(`#txtProfileEditName`).off(`input`);
    $(`#txtProfileEditName`).on(`input`, function(){
        const profileName = $(this).val();

        if(profileName.trim().length == 0)
        {
            $(`#btnProfileEditSave`).addClass(`disabled`);
            return;
        }

        $(`#btnProfileEditSave`).removeClass(`disabled`);
    });

    $(`#btnProfileEditSave`).off(`click`);
    $(`#btnProfileEditSave`).on(`click`, async function(){
        await profileEditSave();
    });
}

async function initModalProfileEdit()
{
    $("#modalProfileEdit").modal(`open`);

    $(`#profileEditUserProfileOfflineConnection`).addClass(`hide`);

    let uid = readLocalStorage("uid");
    let photo = await getPhotoProfileURL(uid, null, true);
    $(`#imgProfileEditPhoto`).attr(`src`, photo);
    $(`#profileEditUserProfileClearPhoto`).removeClass(`hide`);

    const userInfo = getLastLoginDataInfo();
    if(userInfo == null)
    {
        $(`#txtProfileEditName`).val(``);
    }
    else
    {
        $(`#txtProfileEditName`).val(userInfo.basicinfo.Name);
    }


    if($(`#txtProfileEditName`).val().trim().length == 0)
    {
        $(`#btnProfileEditSave`).addClass(`disabled`);
    }
    else
    {
        $(`#btnProfileEditSave`).removeClass(`disabled`);
    }
}

function closeModalProfileEdit()
{
    $("#modalProfileEdit").modal(`close`);
    photoProfileEditHasChanged = false;
}

async function profileEditSave()
{
    $(`#btnProfileEditSave`).addClass(`disabled`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#btnProfileEditSave`).removeClass(`disabled`);
        $(`#profileEditUserProfileOfflineConnection`).removeClass(`hide`);
        return;
    }

    $(`#profileEditUserProfileOfflineConnection`).addClass(`hide`);

    showLoadingAnimationInSwal();

    let uid = readLocalStorage("uid");

    if(photoProfileEditHasChanged == true)
    {
        let profilePhoto = $(`#btnProfileEditSave`).attr(`data-photouri`);
        if(profilePhoto == null)
        {
            profilePhoto = "";
        }
    
        // Profile photo upload
        let uploadResponse = null;
        if(profilePhoto.trim().length > 0)
        {
            try
            {
                const UPLOAD_TIMEOUT = 300000;
                uploadResponse = await uploadFileToServer(`/services/changeuserphoto`, profilePhoto, null, null, null, UPLOAD_TIMEOUT);
            }
            catch(uploadException)
            {
    
            }
        }
        else
        {
            try
            {
                uploadResponse = callS(true, `POST`, `/services/setinitialphoto`, null);
            }
            catch(uploadException)
            {
    
            }
        }
    
        if(uploadResponse != null)
        {
            // Download uploaded photo to device
            let localDownloadProfilePhotoFileInfo = await getLocalSavedProfilePhoto(uid);
            const localDownloadedProfilePhotoFilePath = localDownloadProfilePhotoFileInfo.filePath;
            const localProfilePhotoFileName = localDownloadProfilePhotoFileInfo.fileName;
            if(localDownloadProfilePhotoFileInfo.found == true)
            {
                await deleteLocalFile(localDownloadedProfilePhotoFilePath);                
            }
            await downloadFileFromServer(`${endpoint}services/userphotodownload/${uid}`, imagesLocalFolderLocation, localProfilePhotoFileName, null);
    
            // contactPhoto = await getDeviceFileBase64URL(localDownloadedProfilePhotoFilePath);
            // $(`#imgLoggedInUserProfile`).attr(`src`, contactPhoto);
            // $(`#imgLoggedInUserMenuProfile`).attr(`src`, contactPhoto);
        }
    }

    let nameChanged = false;
    const profileName = $(`#txtProfileEditName`).val();
    
    const previousUserInfo = getLastLoginDataInfo();
    if(previousUserInfo != null)
    {
        if(previousUserInfo.basicinfo.Name.trim() != profileName.trim())
        {
            nameChanged = true;
        }
    }
    
    if(nameChanged == true)
    {
        const profileChangeData = {
            "name": profileName
        };
    
        const profileChangeResponse = await callS(true, `POST`, `/services/changeusername`, profileChangeData);
    
        if(profileChangeResponse == null)
        {
            swal(getTranslate(`"error"`));
            return;
        }    
    }

    setTimeout(async function(){

        // Ping (hasServerConnection) to refresh lastlogindatainfo
        await hasServerConnection();

        swal.close();

        $(`#btnProfileEditSave`).removeClass(`disabled`);

        closeModalProfileEdit();
        
        await loadUserProfileInfo();

        console.log(`Changed`);
    }, 200);

}
