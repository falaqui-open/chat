$(`html`).addClass(`signup-html`);
$(`body`).addClass(`signup-body`);

$(function() {
    mountResetPasswordEvents();
    initResetPassword();
    $("#resetPasswordLoading").removeClass(`hide`);
});

function mountResetPasswordEvents()
{
    mountResetPasswordStartSlideEvents();
    mountResetPasswordSetupSlideEvents(); 
    mountResetPasswordCodeSlideEvents(); 

    $(`#btnResetPasswordSignout`).off(`click`);
    $(`#btnResetPasswordSignout`).on(`click`, function(){
        forceDisconnect();
    });
}

function mountResetPasswordStartSlideEvents()
{
    $(`#btnResetPasswordReceiveCode`).off(`click`);
    $(`#btnResetPasswordReceiveCode`).on(`click`, async function(){
        await resetPasswordReceiveCode();
    });
}

function mountResetPasswordSetupSlideEvents() 
{
    $(`#txtResetPasswordSetup`).mask(`0#`);

    $(`#txtResetPasswordSetup`).keypress(async function (e) {
        if (e.which == 13) 
        {
            $(`#btnResetPasswordSave`).trigger("click");
        }
    });
    
    $(`#txtResetPasswordSetup`).off(`input`);
    $(`#txtResetPasswordSetup`).on(`input`, function(){
        const typedPwd = $(this).val();

        setTimeout(function(){
            const typedAfterATime = $(`#txtResetPasswordSetup`).val();

            if(typedAfterATime != typedPwd)
            {
                // Is typing
                return;
            }

            if(typedAfterATime.trim().length == 0)
            {
                // Reset screen
                $(`#btnResetPasswordSave`).addClass(`disabled`);
                $(`#resetPasswordSetupTooShort`).addClass(`hide`);
                return;
            }

            if(strToOnlyNum(typedAfterATime).trim().length < 6)
            {
                $(`#btnResetPasswordSave`).addClass(`disabled`);
                $(`#resetPasswordSetupTooShort`).removeClass(`hide`);
                return;
            }

            $(`#btnResetPasswordSave`).removeClass(`disabled`);
            $(`#resetPasswordSetupTooShort`).addClass(`hide`);

            setTimeout(function(){
                Keyboard.hide();
            }, 500);
        }, 500);
    });

    $(`#btnResetPasswordSave`).off(`click`);
    $(`#btnResetPasswordSave`).on(`click`, async function(){
        await resetPasswordSetup() 
    });

}

function mountResetPasswordCodeSlideEvents()
{   
    $(`#txtResetPasswordCode`).mask(`0#`);

    $(`#txtResetPasswordCode`).keypress(async function (e) {
        if (e.which == 13) 
        {
            $(`#btnResetPasswordValidateCode`).trigger("click");
        }
    });

    $(`#txtResetPasswordCode`).off(`input`);
    $(`#txtResetPasswordCode`).on(`input`, function(){
        const typedPwd = $(this).val();

        setTimeout(function(){
            const typedAfterATime = $(`#txtResetPasswordCode`).val();

            if(typedAfterATime != typedPwd)
            {
                // Is typing
                return;
            }

            if(typedAfterATime.trim().length == 0)
            {
                // Reset screen                
                $(`#btnResetPasswordValidateCode`).addClass(`disabled`);
                return;
            }

            if(strToOnlyNum(typedAfterATime).trim().length < 6)
            {
                $(`#btnResetPasswordValidateCode`).addClass(`disabled`);
                return;
            }

            $(`#btnResetPasswordValidateCode`).removeClass(`disabled`);

            setTimeout(function(){
                Keyboard.hide();
            }, 500);
        }, 500);
    });

    $(`#btnResetPasswordValidateCode`).off(`click`);
    $(`#btnResetPasswordValidateCode`).on(`click`, async function(){
        await resetPasswordCodeCheck(); 
    });
}

async function initResetPassword()
{
    await waitForDeviceReady();
    await checkConnectionAndGetServerData();
    
    $("#resetPasswordLoading").addClass(`hide`);
    $("#btnResetPasswordSignout").removeClass(`hide`);

    $(`#resetPasswordAreaStart`).fadeIn("slow", function(){
        // Animation complete
    });
}

function initializePasswordSetupArea()
{
    $(`#txtSignupPasswordSetup`).val("");
    $(`#signupPasswordSetupTooShort`).addClass(`hide`);
    $(`#signupPasswordSetupOfflineConnection`).addClass(`hide`);
    $(`#btnSignupPasswordNext`).addClass(`disabled`);
}

function initializeResetPasswordCode()
{   
    $(`#txtResetPasswordCode`).val("");
    $(`#resetPasswordCodeOfflineConnection`).addClass(`hide`);
    $(`#btnResetPasswordValidateCode`).addClass(`disabled`);
}

function initializeResetPasswordSetupArea()
{
    $(`#txtResetPasswordSetup`).val("");
    $(`#resetPasswordSetupTooShort`).addClass(`hide`);
    $(`#resetPasswordSetupOfflineConnection`).addClass(`hide`);
    $(`#btnResetPasswordSave`).addClass(`disabled`);
}

function initializePasswordExistingUserArea()
{
    $(`#txtSignupPasswordExistingUser`).val("");
    $(`#signupPasswordExistingUserOfflineConnection`).addClass(`hide`);
}

async function resetPasswordSetup() 
{
    // Reset no connection message
    $(`#resetPasswordSetupOfflineConnection`).addClass(`hide`);

    const typedPassword = strToOnlyNum($(`#txtResetPasswordSetup`).val());
    const txtResetPasswordCode = strToOnlyNum($(`#txtResetPasswordCode`).val());

    if(typedPassword.trim().length == 0)
    {
        // Reset screen
        $(`#btnResetPasswordSave`).addClass(`disabled`);
        $(`#signupPasswordSetupTooShort`).addClass(`hide`);
        return;
    }

    if(typedPassword.trim().length < 6)
    {
        $(`#btnResetPasswordSave`).addClass(`disabled`);
        $(`#signupPasswordSetupTooShort`).removeClass(`hide`);
        return;
    }

    $(`#btnResetPasswordSave`).addClass(`disabled`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#btnResetPasswordSave`).removeClass(`disabled`);
        $(`#resetPasswordSetupOfflineConnection`).removeClass(`hide`);
        return;
    }

    let response = null;
    try
    {
        let data = {
            code: txtResetPasswordCode,
            password: typedPassword
        };

        response = await callS(false, `POST`, `/services/passwordupdate`, data);
    }
    catch(exception)
    {
        swal(getTranslate(`internal-error-on-saving-password`, `⛔️ Internal error on saving password`));
        return;
    }

    const successMessage = getTranslate(`your-password-has-been-changed`, `Your password has been changed, please log in.`);
    await swal(successMessage, "", "success");

    redirect(`signup.html`);
}

async function resetPasswordCodeCheck() 
{
    // Reset no connection message
    $(`#resetPasswordCodeOfflineConnection`).addClass(`hide`); 
    $(`#btnResetPasswordValidateCode`).addClass(`disabled`); 

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false) 
    {        
        $(`#btnResetPasswordReceiveCode`).removeClass(`disabled`);
        $(`#resetPasswordCodeOfflineConnection`).removeClass(`hide`);
        return;
    }

    
    let mobilePhone = readLocalStorage("phoneResetPswd");
    let code = strToOnlyNum($(`#txtResetPasswordCode`).val());

    let response = null;
    try
    {        
        response = await callS(true, `GET`, `/services/validpasswordresetcode/${mobilePhone}/${code}`, null);
    }
    catch(exception)
    {
        swal(getTranslate(`invalid-reset-password-validation-code`, `Invalid Reset Password Validation Code.`));

        return;
    }

    if (response.valid == false) 
    {
        swal(getTranslate(`invalid-reset-password-validation-code`, `Invalid Reset Password Validation Code.`));
    }
    else 
    {
        $(`#resetPasswordAreaCode`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
            $(`#txtResetPasswordSetup`).removeClass(`disabled`);
            
            initializeResetPasswordSetupArea();
    
            $(`#resetAreaPasswordSetup`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
                // Animation complete
                $(`#txtResetPasswordSetup`).focus();
            });    
        });    
    }
}

function initializeResetPasswordSetupArea()
{
    $(`#txtResetPasswordSetup`).val("");
    $(`#resetPasswordSetupTooShort`).addClass(`hide`);
    $(`#resetPasswordSetupOfflineConnection`).addClass(`hide`);
    //$(`#btnResetPasswordSignout`).addClass(`hide`);
    $(`#btnResetPasswordSave`).addClass(`disabled`);
}

async function resetPasswordReceiveCode() 
{
    $(`#resetPasswordStartOfflineConnection`).addClass(`hide`); 

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#resetPasswordStartOfflineConnection`).removeClass(`hide`);
        return;
    }

    let data = { 
        login: readLocalStorage("phoneResetPswd")
    };

    let response = null;
    try
    {
        response = await callS(false, `POST`, `/services/generatepasswordresetcode`, data);
    }
    catch(exception)
    {
        swal(exception.toString());
        return;
    }

    $(`#resetPasswordAreaStart`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
        $(`#btnResetPasswordReceiveCode`).removeClass(`disabled`);
        
        initializeResetPasswordCode();

        $(`#resetPasswordAreaCode`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
            // Animation complete
            $(`#txtResetPasswordCode`).focus();
        });
    });
}
