$(function() {
    mountPhoneValidationEvents();
    initPhoneValidation();
});

function mountPhoneValidationEvents()
{
    $(`#btnPhoneValidationSignout`).off(`click`);
    $(`#btnPhoneValidationSignout`).on(`click`, function(){
        forceDisconnect();
    });

    mountPhoneValidationStartSlideEvents();
    mountPhoneValidationCodeSlideEvents();
}

function mountPhoneValidationStartSlideEvents()
{
    $(`#btnPhoneValidationReceiveCode`).off(`click`);
    $(`#btnPhoneValidationReceiveCode`).on(`click`, async function(){
        await phoneValidationReceiveCode();
    });
}

function mountPhoneValidationCodeSlideEvents()
{
    $(`#txtPhoneValidationCode`).off(`input`);
    $(`#txtPhoneValidationCode`).on(`input`, function(){
        const typedCode = $(this).val();

        setTimeout(function(){
            const typedAfterATime = $(`#txtPhoneValidationCode`).val();

            if(typedAfterATime != typedCode)
            {
                // Is typing
                return;
            }

            const code = strToOnlyNum(typedAfterATime);

            if(code.trim().length != 6)
            {
                // Reset screen
                $(`#btnPhoneValidationValidateCode`).addClass(`disabled`);
                return;
            }

            $(`#btnPhoneValidationValidateCode`).removeClass(`disabled`);
        }, 1500);
    });

    $(`#btnPhoneValidationValidateCode`).off(`click`);
    $(`#btnPhoneValidationValidateCode`).on(`click`, async function(){
        await phoneValidationCodeCheck();
    });
}

async function initPhoneValidation()
{
    await waitForDeviceReady();

    $(`#phoneValidationAreaStart`).fadeIn("slow", function(){
        // Animation complete
    });
}

async function phoneValidationReceiveCode()
{
    // Reset no connection message
    $(`#phoneValidationStartOfflineConnection`).addClass(`hide`);


    $(`#btnPhoneValidationReceiveCode`).addClass(`disabled`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#btnPhoneValidationReceiveCode`).removeClass(`disabled`);
        $(`#phoneValidationStartOfflineConnection`).removeClass(`hide`);
        return;
    }

    // Send SMS Code
    const phoneValidationResponse = await callS(true, `POST`, `/services/sendsmsphonevalidationcode`);

    if(phoneValidationResponse.status != `OK`)
    {
        swal(getTranslate(`unable-to-validate-phone`, `We're unable to validate your phone number. Try again later.`));

        $(`#btnPhoneValidationReceiveCode`).removeClass(`disabled`);
        return;
    }

    $(`#phoneValidationAreaStart`).fadeOut(SLIDE_FADE_OUT_DURATION, function(){
        $(`#btnPhoneValidationReceiveCode`).removeClass(`disabled`);
        
        initializePhoneValidationCode();

        $(`#phoneValidationAreaCode`).fadeIn(SLIDE_FADE_IN_DURATION, function() {
            // Animation complete
            $(`#txtPhoneValidationCode`).focus();
        });    
    });

}

function initializePhoneValidationCode()
{
    $(`#txtPhoneValidationCode`).val("");
    $(`#phoneValidationCodeOfflineConnection`).addClass(`hide`);
    $(`#btnPhoneValidationValidateCode`).addClass(`disabled`);
}

async function phoneValidationCodeCheck()
{
    // Reset no connection message
    $(`#phoneValidationCodeOfflineConnection`).addClass(`hide`);


    $(`#btnPhoneValidationValidateCode`).addClass(`disabled`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == false)
    {
        $(`#btnPhoneValidationReceiveCode`).removeClass(`disabled`);
        $(`#phoneValidationCodeOfflineConnection`).removeClass(`hide`);
        return;
    }

    const code = strToOnlyNum($(`#txtPhoneValidationCode`).val());
    let serverValidCodeResponse = await callS(true, `GET`, `/services/checkphoneverificationcode/${code}`, null);

    if(serverValidCodeResponse.valid == false)
    {
        $(`#btnPhoneValidationValidateCode`).removeClass(`disabled`);
        swal(getTranslate(`invalid-phone-validation-code`, `Invalid Phone Validation Code.`));
        return;
    }

    await callS(true, `POST`, `/services/setphonevalidationok`, null);

    $(`#btnPhoneValidationValidateCode`).removeClass(`disabled`);

    // Finish phone validation
    redirect(`index.html`);
}