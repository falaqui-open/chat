$(function() {
    mountSignupEvents();
    initSignup();
});

function mountSignupEvents()
{
    mountSignupPhoneSlideEvents();
    mountSignupPasswordSetupSlideEvents();
    mountSignupPasswordExistingUserSlideEvents();
    mountSignupUserProfileSlideEvents();
}

function mountSignupPhoneSlideEvents()
{
    $(`#selSignupDialCode`).off(`change`);
    $(`#selSignupDialCode`).on(`change`, function(){
        signupSetSelectedDialCode();

        $(`#txtSignupPhoneNumber`).val("");
        setTimeout(function(){
            $(`#txtSignupPhoneNumber`).focus();
        }, SLIDE_TRANSACTION_TIME_TO_FOCUS);
    });

    $(`#txtSignupPhoneNumber`).keypress(async function (e) {
        if (e.which == 13) 
        {
            $(`#btnSignupPhoneNext`).trigger("click");
        }
    });

    $(`#txtSignupPhoneNumber`).off(`input`);
    $(`#txtSignupPhoneNumber`).on(`input`, function(){
        const typedPhone = $(this).val();

        setTimeout(function(){
            const typedAfterATime = $(`#txtSignupPhoneNumber`).val();

            if(typedAfterATime != typedPhone)
            {
                // Is typing
                return;
            }

            if(strToOnlyNum(typedAfterATime).trim().length == 0)
            {
                // Reset screen
                $(`#btnSignupPhoneNext`).addClass(`disabled`);
                $(`#signupInvalidMobilePhone`).addClass(`hide`);
                return;
            }

            const fullPhone = `${$(`#selSignupDialCode`).val()}${strToOnlyNum(typedAfterATime)}`;

            const vCountryCode = signupGetSelectedCountryCode();
            const isValid = lpnIsValid(fullPhone, vCountryCode);

            if(isValid == false)
            {
                $(`#btnSignupPhoneNext`).addClass(`disabled`);
                $(`#signupInvalidMobilePhone`).removeClass(`hide`);
                return;
            }

            const isMobile = lpnIsMobile(fullPhone, vCountryCode);
            if(isMobile == false)
            {
                $(`#btnSignupPhoneNext`).addClass(`disabled`);
                $(`#signupInvalidMobilePhone`).removeClass(`hide`);
                return;
            }

            $(`#btnSignupPhoneNext`).removeClass(`disabled`);
            $(`#signupInvalidMobilePhone`).addClass(`hide`);

            setTimeout(function(){
                Keyboard.hide();
            }, 500);
        }, 500);
    });

    $(`#btnSignupPhoneNext`).off(`click`);
    $(`#btnSignupPhoneNext`).on(`click`, async function(){
        // await signupPhone(false);
        await signupPhone();
    });

    $(`#btnSignupConnectionSettings`).off(`click`);
    $(`#btnSignupConnectionSettings`).on(`click`, async function(){
        await openSetServerConnection();
    });

    $(`#btnSignupConnectionQRCode`).off(`click`);
    $(`#btnSignupConnectionQRCode`).on(`click`, async function(){
        const selectedConnection = getSelectedAppServerConnection();
        showQRCode(selectedConnection.accessCode, selectedConnection.label);
    });


    $(`#btnSignupTestNativeScreen`).off(`click`);
    $(`#btnSignupTestNativeScreen`).on(`click`, async function(){
        // await initNativeScreen();
        const preselectedContacts = [];
        await initNativeContactListSelectionScreen(preselectedContacts);
    });
    

}

function mountSignupPasswordSetupSlideEvents()
{
    $(`#txtSignupPasswordSetup`).mask(`0#`);

    $(`#txtSignupPasswordSetup`).keypress(async function (e) {
        if (e.which == 13) 
        {
            $(`#btnSignupPasswordNext`).trigger("click");
        }
    });
    
    $(`#txtSignupPasswordSetup`).off(`input`);
    $(`#txtSignupPasswordSetup`).on(`input`, function(){
        const typedPwd = $(this).val();

        setTimeout(function(){
            const typedAfterATime = $(`#txtSignupPasswordSetup`).val();

            if(typedAfterATime != typedPwd)
            {
                // Is typing
                return;
            }

            if(typedAfterATime.trim().length == 0)
            {
                // Reset screen
                $(`#btnSignupPasswordNext`).addClass(`disabled`);
                $(`#signupPasswordSetupTooShort`).addClass(`hide`);
                return;
            }

            if(strToOnlyNum(typedAfterATime).trim().length < 6)
            {
                $(`#btnSignupPasswordNext`).addClass(`disabled`);
                $(`#signupPasswordSetupTooShort`).removeClass(`hide`);
                return;
            }

            // const passwordToSet = typedAfterATime.trim();

            $(`#btnSignupPasswordNext`).removeClass(`disabled`);
            $(`#signupPasswordSetupTooShort`).addClass(`hide`);

            setTimeout(function(){
                Keyboard.hide();
            }, 500);
        }, 500);
    });

    $(`#btnSignupPasswordNext`).off(`click`);
    $(`#btnSignupPasswordNext`).on(`click`, async function(){
        await signupPasswordSetup();
    });

    $(`#btnSignupPasswordPrevious`).off(`click`);
    $(`#btnSignupPasswordPrevious`).on(`click`, async function(){

        $(`#signupAreaPasswordSetup`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
            $(`#signupAreaPhoneNumber`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
                // Animation complete
                setTimeout(function(){
                    $(`#txtSignupPhoneNumber`).focus();
                }, SLIDE_TRANSACTION_TIME_TO_FOCUS);
            });    
        });

    });

    $(`#btnSignupPasswordReset`).off(`click`);
    $(`#btnSignupPasswordReset`).on(`click`, function(){
        const phoneDialCode = $(`#selSignupDialCode`).val();
        const typedPhone = $(`#txtSignupPhoneNumber`).val();
        const fullPhone = `${phoneDialCode}${strToOnlyNum(typedPhone)}`;
        const onlyNumPhone = strToOnlyNum(fullPhone);
        writeLocalStorage("phoneResetPswd",onlyNumPhone);

        redirect("resetpassword.html");

    });
}

function mountSignupPasswordExistingUserSlideEvents()
{
    $(`#txtSignupPasswordExistingUser`).mask(`0#`);

    $(`#txtSignupPasswordExistingUser`).keypress(async function (e) {
        if (e.which == 13) 
        {
            $(`#btnSignupPasswordExistingUserNext`).trigger("click");
        }
    });

    $(`#txtSignupPasswordExistingUser`).off(`input`);
    $(`#txtSignupPasswordExistingUser`).on(`input`, function(){
        const typedPwd = $(this).val();

        setTimeout(function(){
            const typedAfterATime = $(`#txtSignupPasswordExistingUser`).val();

            if(typedAfterATime != typedPwd)
            {
                // Is typing
                return;
            }

            if(typedAfterATime.trim().length == 0)
            {
                // Reset screen
                $(`#btnSignupPasswordExistingUserNext`).addClass(`disabled`);
                return;
            }

            if(strToOnlyNum(typedAfterATime).trim().length < 6)
            {
                $(`#btnSignupPasswordExistingUserNext`).addClass(`disabled`);
                return;
            }

            $(`#btnSignupPasswordExistingUserNext`).removeClass(`disabled`);

            setTimeout(function(){
                Keyboard.hide();
            }, 500);
        }, 500);
    });

    $(`#btnSignupPasswordExistingUserNext`).off(`click`);
    $(`#btnSignupPasswordExistingUserNext`).on(`click`, async function(){
        await signupPasswordExistingUser();
    });

    $(`#btnSignupPasswordExistingUserPrevious`).off(`click`);
    $(`#btnSignupPasswordExistingUserPrevious`).on(`click`, async function(){

        $(`#signupAreaPasswordExistingUser`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
            $(`#signupAreaPhoneNumber`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
                // Animation complete
                setTimeout(function(){
                    $(`#txtSignupPhoneNumber`).focus();
                }, SLIDE_TRANSACTION_TIME_TO_FOCUS);
            });    
        });

    });
}

function mountSignupUserProfileSlideEvents()
{
    $(`#signupUserProfileChangePhotoRequest`).off(`click`);
    $(`#signupUserProfileChangePhotoRequest`).on(`click`, async function(){
        await initModalTakePhoto(100, 100, 80, false, true, async function(imageSetEvent){
            const imageURI = imageSetEvent.detail.image;
            const imageSource = await getDeviceFileBase64URL(imageURI);
            $(`#imgSignupProfilePhoto`).attr(`src`, imageSource);

            $(`#btnSignupUserProfileNext`).attr("data-photouri", imageURI);

            $(`#signupUserProfileClearPhoto`).removeClass(`hide`);
        });
    });

    $(`#signupUserProfileClearPhoto`).off(`click`);
    $(`#signupUserProfileClearPhoto`).on(`click`, async function(){
        $(`#imgSignupProfilePhoto`).attr(`src`, `images/add-photo-padding.png`);
        $(`#signupUserProfileClearPhoto`).addClass(`hide`);
        $(`#btnSignupUserProfileNext`).removeAttr("data-photouri");
    });

    $(`#txtSignupProfileName`).keypress(async function (e) {
        if (e.which == 13) 
        {
            $(`#btnSignupUserProfileNext`).trigger("click");
        }
    });

    $(`#txtSignupProfileName`).off(`input`);
    $(`#txtSignupProfileName`).on(`input`, function(){
        const profileName = $(this).val();

        if(profileName.trim().length == 0)
        {
            $(`#btnSignupUserProfileNext`).addClass(`disabled`);
            return;
        }

        $(`#btnSignupUserProfileNext`).removeClass(`disabled`);
    });

    $(`#btnSignupUserProfileNext`).off(`click`);
    $(`#btnSignupUserProfileNext`).on(`click`, function(){
        signupRegisterNewUser();
    });

    $(`#btnSignupUserProfilePrevious`).off(`click`);
    $(`#btnSignupUserProfilePrevious`).on(`click`, function(){
        $(`#signupUserProfile`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
            $(`#signupAreaPasswordSetup`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
                // Animation complete
                setTimeout(function(){
                    $(`#txtSignupPasswordSetup`).focus();
                }, SLIDE_TRANSACTION_TIME_TO_FOCUS);
            });    
        });
    });
}

async function initSignup()
{
    await waitForDeviceReady();

    $(`#signupAreaPhoneNumber`).fadeIn("slow", function(){
        // Animation complete
    });

    setTimeout(function(){
        $(`#txtSignupPhoneNumber`).focus();
    }, SLIDE_TRANSACTION_TIME_TO_FOCUS);

    for(let ix = 0; ix < phoneCodes.length; ix++)
    {
        const dialCodeItem = phoneCodes[ix];
        const dialCodeValue = dialCodeItem.dial_code;
        const dialCountryCode = dialCodeItem.code.toUpperCase().trim();

        const htmlDialCodeItem = `
        <option value="${dialCodeValue}" data-country="${dialCountryCode}" data-mask="${dialCodeItem.mobile_format_area_code}">
            ${dialCodeItem.emoji} ${dialCodeItem.name}
        </option>
        `
        $(`#selSignupDialCode`).append(htmlDialCodeItem);
    }

    let countryInit = "";

    let lastSelectedCountry = readLocalStorage("lastselectedcountry");
    if(lastSelectedCountry == null)
    {
        lastSelectedCountry = "";
    }

    if(forcedCountryCode == null)
    {

        if(lastSelectedCountry.trim().length > 0)
        {
            countryInit = lastSelectedCountry;
        }
        else
        {
            if(lastLocationInfo != null)
            {
                if(lastLocationInfo.country != null)
                {
                    countryInit = lastLocationInfo.country;
                }
            }            
        }
    }
    else
    {
        countryInit = forcedCountryCode;
    }

    signupChangeDialCodeSelectionByCountry(countryInit);

    signupSetSelectedDialCode();

    setSignupSelectedAppServerConnection();

    checkPresignupPhone();
}

async function checkPresignupPhone()
{
    const preSignuPhone = readLocalStorage(`presignupphone`);
    let usingPresignupPhone = true;

    if(preSignuPhone == null)
    {
        usingPresignupPhone = false;
    }
    else if(preSignuPhone.trim().length == 0)
    {
        usingPresignupPhone = false;
    }

    if(usingPresignupPhone == false)
    {
        return;
    }   

    removeLocalStorage(`presignupphone`);

    $(`#txtSignupPhoneNumber`).val(preSignuPhone);
    $(`#txtSignupPhoneNumber`).trigger('input');
    // await signupPhone(usingPresignupPhone);
    await signupPhone();
}

function signupChangeDialCodeSelectionByCountry(vCountryCode)
{
    if(vCountryCode == null)
    {
        return;
    }

    if(vCountryCode.trim().length == 0)
    {
        return;
    }

    vCountryCode = vCountryCode.toUpperCase().trim();

    // const optionElement = $(`#selSignupDialCode`).find(`option[data-country="${vCountryCode}"]`);
    // const optionValue = optionElement.val();
    // $(`#selSignupDialCode`).val(optionValue);
    $(`#selSignupDialCode option[data-country="${vCountryCode}"]`).attr("selected","selected");
}

function signupGetSelectedCountryCode()
{
    const vCountryCode = $(`#selSignupDialCode`).find("option:selected").attr(`data-country`);
    return vCountryCode;
}

function signupSetSelectedDialCode()
{
    const dialCode = $("#selSignupDialCode").val();
    const newMask = $(`#selSignupDialCode`).find("option:selected").attr(`data-mask`);
    const placeHolder = replaceAll(newMask, "0", "_");

    $(`#signupDialCodeValue`).text(dialCode);

    $(`#txtSignupPhoneNumber`).unmask();

    let masked = false;
    if(newMask != null)
    {
        if(newMask.length > 0)
        {
            $(`#txtSignupPhoneNumber`).mask(newMask, {placeholder: placeHolder});
            masked = true;
        }
    }

    if(masked == false)
    {
        $(`#txtSignupPhoneNumber`).removeAttr("placeholder");
    }

    const vCountryCode = $(`#selSignupDialCode`).find("option:selected").attr(`data-country`);

    // Set system country code
    countryCode = vCountryCode;
    writeLocalStorage("country", countryCode);
    writeLocalStorage("lastselectedcountry", countryCode);

    translate();
}

// async function signupPhone(usingPresignup)
async function signupPhone()
{
    // if(usingPresignup == null)
    // {
    //     usingPresignup = false;
    // }

    // if(usingPresignup == true)
    // {
    //     await waitATime(1000);
    // }

    // Reset no connection message
    $(`#signupOfflineConnection`).addClass(`hide`);

    const typedPhone = $(`#txtSignupPhoneNumber`).val();
    const  fullPhone = `${$(`#selSignupDialCode`).val()}${strToOnlyNum(typedPhone)}`;

    if(strToOnlyNum(typedPhone).trim().length == 0)
    {
        // Reset screen
        $(`#btnSignupPhoneNext`).addClass(`disabled`);
        $(`#signupInvalidMobilePhone`).addClass(`hide`);
        return;
    }

    const vCountryCode = signupGetSelectedCountryCode();
    const isValid = lpnIsValid(fullPhone, vCountryCode);

    if(isValid == false)
    {
        $(`#btnSignupPhoneNext`).addClass(`disabled`);
        $(`#signupInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    const isMobile = lpnIsMobile(fullPhone, vCountryCode);
    if(isMobile == false)
    {
        $(`#btnSignupPhoneNext`).addClass(`disabled`);
        $(`#signupInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    $(`#btnSignupPhoneNext`).addClass(`disabled`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#btnSignupPhoneNext`).removeClass(`disabled`);
        $(`#signupOfflineConnection`).removeClass(`hide`);
        return;
    }


    const onlyNumPhone = strToOnlyNum(fullPhone);

    // For new or existing users check that when the connection is Whitelabel (CWL) or Corporate (COP) the user must to have permission to proceed
    const accessType = await getUserConnectionAccess();

    if(accessType === 'CWL' || accessType === 'COP') 
    {
        const accessPermission = await callS(false, 'GET', `/services/hasuseraccesspermission/${onlyNumPhone}`);

        if(!accessPermission.permission) 
        {
            const message = getTranslate('corporate-registration-denied', 'You do not have permission to access this application')
            swal('', message);
            $(`#btnSignupPhoneNext`).removeClass(`disabled`);
            return;
        }
    }

    const serverHasUser = await callS(false, `GET`, `/services/hasuserbyuid/${onlyNumPhone}`, null);

    if(serverHasUser.found == false)
    {       
        // New user in DB
        $(`#signupAreaPhoneNumber`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
            $(`#btnSignupPhoneNext`).removeClass(`disabled`);
            
            initializePasswordSetupArea();

            $(`#signupAreaPasswordSetup`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
                // Animation complete
                $(`#txtSignupPasswordSetup`).focus();
            });    
        });
    }
    else
    {
        // Existing user in DB
        $(`#signupAreaPhoneNumber`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
            $(`#btnSignupPhoneNext`).removeClass(`disabled`);

            initializePasswordExistingUserArea();

            $(`#signupAreaPasswordExistingUser`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
                // Animation complete
                $(`#txtSignupPasswordExistingUser`).focus();
            });    
        });
    }
}

function initializePasswordSetupArea()
{
    $(`#txtSignupPasswordSetup`).val("");
    $(`#signupPasswordSetupTooShort`).addClass(`hide`);
    $(`#signupPasswordSetupOfflineConnection`).addClass(`hide`);
    $(`#btnSignupPasswordNext`).addClass(`disabled`);
}

function initializePasswordExistingUserArea()
{
    $(`#txtSignupPasswordExistingUser`).val("");
    $(`#signupPasswordExistingUserOfflineConnection`).addClass(`hide`);
}

async function signupPasswordSetup()
{
    // Reset no connection message
    $(`#signupPasswordSetupOfflineConnection`).addClass(`hide`);

    const typedPassword = strToOnlyNum($(`#txtSignupPasswordSetup`).val());

    if(typedPassword.trim().length == 0)
    {
        // Reset screen
        $(`#btnSignupPasswordNext`).addClass(`disabled`);
        $(`#signupPasswordSetupTooShort`).addClass(`hide`);
        return;
    }

    if(typedPassword.trim().length < 6)
    {
        $(`#btnSignupPasswordNext`).addClass(`disabled`);
        $(`#signupPasswordSetupTooShort`).removeClass(`hide`);
        return;
    }


    $(`#btnSignupPasswordNext`).addClass(`disabled`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#btnSignupPasswordNext`).removeClass(`disabled`);
        $(`#signupPasswordSetupOfflineConnection`).removeClass(`hide`);
        return;
    }

    $(`#signupAreaPasswordSetup`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
        $(`#btnSignupPasswordNext`).removeClass(`disabled`);
        
        initializeSignupUserProfile();

        $(`#signupUserProfile`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
            // Animation complete
            $(`#txtSignupProfileName`).focus();
        });    
    });
}

async function signupPasswordExistingUser()
{
    // Reset no connection message
    $(`#signupPasswordExistingUserOfflineConnection`).addClass(`hide`);

    const typedPassword = strToOnlyNum($(`#txtSignupPasswordExistingUser`).val());

    if(typedPassword.trim().length == 0)
    {
        // Reset screen
        $(`#btnSignupPasswordExistingUserNext`).addClass(`disabled`);
        return;
    }

    if(typedPassword.trim().length < 6)
    {
        $(`#btnSignupPasswordExistingUserNext`).addClass(`disabled`);
        return;
    }


    $(`#btnSignupPasswordExistingUserNext`).addClass(`disabled`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#btnSignupPasswordExistingUserNext`).removeClass(`disabled`);
        $(`#signupPasswordExistingUserOfflineConnection`).removeClass(`hide`);
        return;
    }

    const phoneDialCode = $(`#selSignupDialCode`).val();
    const typedPhone = $(`#txtSignupPhoneNumber`).val();
    const fullPhone = `${phoneDialCode}${strToOnlyNum(typedPhone)}`;
    const onlyNumPhone = strToOnlyNum(fullPhone);

    const requestBody = {
        "login": onlyNumPhone,
        "password": typedPassword
    }

    let loginResponse = null;
    try
    {
        loginResponse = await callS(false, `POST`, `/services/login`, requestBody);
    }
    catch(loginException)
    {
        if(loginException.status == 401)
        {
            swal(getTranslate(`invalid-password`, `Invalid Password`));
        }
        else if(loginException.status == 423)
        {
            swal(getTranslate(`locked-account`, `The account is blocked`));
        }
        else
        {
            swal(getTranslate(`login-error`, `Error on Login`));
        }

        return;
    }


    if(loginResponse == null)
    {
        swal(getTranslate(`login-error`, `Error on Login`));

        return;
    }

    if(loginResponse.auth == null)
    {
        swal(getTranslate(`login-error`, `Error on Login`));

        return;
    }

    // User login
    doAppLogin(loginResponse.auth, loginResponse.uid);

    showLoadingAnimationInSwal();

    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        await runDBRestoreCheck();
    }

    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        notificationPermissionOK = await notificationIsEnabled();
    
        if(notificationPermissionOK == false)
        {
            // writeInDebugText(`🟡 Notification not allowed, asking to enable...`);
            let notificationPermissionAsk = await notificationRequestPermission(false);
            notificationPermissionOK = await notificationIsEnabled();
            pushMessagingAllowed = notificationPermissionOK;
        }
    }

    swal.close();

    // Finish login
    redirect(`index.html`);

}

function initializeSignupUserProfile()
{
    $(`#imgSignupProfilePhoto`).attr(`src`, `images/add-photo-padding.png`);
    $(`#signupUserProfileClearPhoto`).addClass(`hide`);
    $(`#txtSignupProfileName`).val("");
    $(`#signupUserProfileOfflineConnection`).addClass(`hide`);
    $(`#signupUserProfileRegisterLoading`).addClass(`hide`);
    $(`#signupUserProfilePhotoUploading`).addClass(`hide`);
    $(`#btnSignupUserProfileNext`).addClass(`disabled`);
    $(`#btnSignupUserProfileNext`).removeAttr("data-photouri");
}

async function signupRegisterNewUser()
{
    $(`#btnSignupUserProfileNext`).addClass(`disabled`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#btnSignupUserProfileNext`).removeClass(`disabled`);
        $(`#signupUserProfileOfflineConnection`).removeClass(`hide`);
        return;
    }

    $(`#signupUserProfileRegisterLoading`).removeClass(`hide`);
    $(`#signupUserProfilePhotoUploading`).addClass(`hide`);

    const phoneDialCode = $(`#selSignupDialCode`).val();
    const typedPhone = $(`#txtSignupPhoneNumber`).val();
    const fullPhone = `${phoneDialCode}${strToOnlyNum(typedPhone)}`;
    const onlyNumPhone = strToOnlyNum(fullPhone);

    const password = strToOnlyNum($(`#txtSignupPasswordSetup`).val());

    const profileName = $(`#txtSignupProfileName`).val();
    let profilePhoto = $(`#btnSignupUserProfileNext`).attr(`data-photouri`);
    if(profilePhoto == null)
    {
        profilePhoto = "";
    }

    // Save user info
    const data = {
        "uid"                   : onlyNumPhone,
        "mobilePhoneDialCode"   : phoneDialCode,
        "mobilePhone"           : fullPhone,
        "password"              : password,
        "name"                  : profileName,
        "countryCode"           : countryCode
    }
    
    try
    {
        signupResponse = await callS(false, `POST`, `/services/register`, data);
    }
    catch(signupException)
    {
        $(`#signupUserProfileRegisterLoading`).addClass(`hide`);
        $(`#btnSignupUserProfileNext`).removeClass(`disabled`);
        swal(getTranslate(`signup-error`, `Sign-up Error`) + ": " + signupException.toString());
        return;
    }

    $(`#signupUserProfileRegisterLoading`).addClass(`hide`);


    // User login
    doAppLogin(signupResponse.auth, signupResponse.uid);

    // Profile photo upload
    if(profilePhoto.trim().length > 0)
    {
        $(`#signupUserProfilePhotoUploading`).removeClass(`hide`);

        let uploadDone = false;
        try
        {
            const UPLOAD_TIMEOUT = 300000;
            const uploadResponse = await uploadFileToServer(`/services/changeuserphoto`, profilePhoto, null, null, null, UPLOAD_TIMEOUT);
    
            uploadDone = true;
        }
        catch(uploadException)
        {

        }

        $(`#signupUserProfilePhotoUploading`).addClass(`hide`);
    }

    showLoadingAnimationInSwal();

    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        await runDBRestoreCheck();
    }

    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        notificationPermissionOK = await notificationIsEnabled();
    
        if(notificationPermissionOK == false)
        {
            // writeInDebugText(`🟡 Notification not allowed, asking to enable...`);
            let notificationPermissionAsk = await notificationRequestPermission(false);
            notificationPermissionOK = await notificationIsEnabled();
            pushMessagingAllowed = notificationPermissionOK;
        }
    }

    swal.close();



    // Finish signup
    redirect(`index.html`);
}

async function setSignupSelectedAppServerConnection()
{
    const selectedConnection = getSelectedAppServerConnection();
    const isDefault = selectedConnection.default;
    const accessCode = selectedConnection.accessCode;
    const connectionId = selectedConnection.id;
    const label = isDefault == false ? selectedConnection.label : getTranslate(`default-connection`, `Default Connection`);
    $(`#signupSelectedConnectionName`).text(label);
    
    $(`#signupSelectedConnectionLogo`).addClass(`hide`);
    $(`#signupSelectedConnectionLogo`).attr(`src`, `images/generic-image.png`);

    if(isDefault == false) //Corporate Connection
    {
        setSelectedAppServerConnection(connectionId);
    }

    if(accessCode != null)
    {
        if(accessCode.trim().length > 0)
        {
            $(`#btnSignupConnectionQRCode`).removeClass(`hide`);
        }
        else
        {
            $(`#btnSignupConnectionQRCode`).addClass(`hide`);
        }
    }
    else
    {
        $(`#btnSignupConnectionQRCode`).addClass(`hide`);
    }


    let lastQRScan = readSessionStorage(`lastqrscan`);
    if(lastQRScan != null)
    {
        removeSessionStorage(`lastqrscan`);

        let lastQRScanRequest = readSessionStorage(`lastqrscanrequest`);
        if(lastQRScanRequest != null)
        {
            removeSessionStorage(`lastqrscanrequest`);

            if(lastQRScanRequest == `appserverconnectioncode`)
            {
                await openSetServerConnection();

                $(`#txtSetAppServerConnectionCodeCheck`).val(lastQRScan)

                await setAppServerConnectionCodeCheck();
            }
        }
    }

    if(connectionId.toString().trim() != `0`)
    {
        const companyLogo = await getCompanyLogo(connectionId);

        if(companyLogo != null)
        {
            $(`#signupSelectedConnectionLogo`).attr(`src`, companyLogo);
        }

        $(`#signupSelectedConnectionLogo`).removeClass(`hide`);
    }

}

async function openSetServerConnection()
{
    await initModalSetServer(() =>{
        setSignupSelectedAppServerConnection();
    });
}
