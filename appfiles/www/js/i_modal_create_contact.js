$(function() {
    mountModalCreateContactEvents();
});

function mountModalCreateContactEvents()
{
    $("#modalCreateContact").modal({
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

    $(`#btnCloseModalCreateContact`).off(`click`);
    $(`#btnCloseModalCreateContact`).on(`click`, function(){
        closeModalCreateContact();
    });

    $(`#selCreateContactDialCode`).off(`change`);
    $(`#selCreateContactDialCode`).on(`change`, function(){
        contactCreateSetSelectedDialCode();

        $(`#txtCreateContactPhoneNumber`).val("");
        setTimeout(function(){
            $(`#txtCreateContactPhoneNumber`).focus();
        }, 500);
    });

    $(`#txtCreateContactName`).off(`input`);
    $(`#txtCreateContactName`).on(`input`, function(){
        const typedName = $(this).val();

        if(typedName.length == 0)
        {
            $(`#btnCreateContactSave`).addClass(`disabled`);
        }
        else
        {
            createContactValidation(typedName);
        }
    });

    $(`#txtCreateContactPhoneNumber`).off(`input`);
    $(`#txtCreateContactPhoneNumber`).on(`input`, function(){
        const typedPhone = $(this).val();

        setTimeout(function(){
            const typedAfterATime = $(`#txtCreateContactPhoneNumber`).val();

            if(typedAfterATime != typedPhone)
            {
                // Is typing
                return;
            }
            createContactValidation(typedAfterATime);

        }, 500);
    });

    $(`#btnCreateContactSave`).off(`click`);
    $(`#btnCreateContactSave`).on(`click`, function(){

        if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
        {
            saveNewContactCreation();
        }
    });
}

function initModalCreateContact()
{
    $("#modalCreateContact").modal(`open`);

    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        $(`#createContactSaveOnlyDeviceMessage`).removeClass(`hide`);
    }
    else
    {
        $(`#createContactSaveOnlyDeviceMessage`).addClass(`hide`);
    }


    $(`#btnCreateContactSave`).addClass(`disabled`);
    $(`#txtCreateContactName`).val(``);
    $(`#txtCreateContactPhoneNumber`).val(``);

    createContactClearScreen();
}

function closeModalCreateContact()
{
    $("#modalCreateContact").modal(`close`);
}

function createContactChangeDialCodeSelectionByCountry(vCountryCode)
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

    $(`#selCreateContactDialCode option[data-country="${vCountryCode}"]`).attr("selected","selected");
}

function contactCreateSetSelectedDialCode()
{
    const dialCode = $("#selCreateContactDialCode").val();
    const newMask = $(`#selCreateContactDialCode`).find("option:selected").attr(`data-mask`);
    const placeHolder = replaceAll(newMask, "0", "_");

    $(`#createContactDialCodeValue`).text(dialCode);

    $(`#txtCreateContactPhoneNumber`).unmask();

    let masked = false;
    if(newMask != null)
    {
        if(newMask.length > 0)
        {
            $(`#txtCreateContactPhoneNumber`).mask(newMask, {placeholder: placeHolder});
            masked = true;
        }
    }

    if(masked == false)
    {
        $(`#txtCreateContactPhoneNumber`).removeAttr("placeholder");
    }
}

function createContactGetSelectedCountryCode()
{
    const vCountryCode = $(`#selCreateContactDialCode`).find("option:selected").attr(`data-country`);
    return vCountryCode;
}

function createContactClearScreen()
{
    $(`#btnCreateContactSave`).addClass(`disabled`);
    $(`#txtCreateContactPhoneNumber`).val(``);


    $(`#selCreateContactDialCode`).empty();

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
        $(`#selCreateContactDialCode`).append(htmlDialCodeItem);
    }


    createContactChangeDialCodeSelectionByCountry(countryCode);

    contactCreateSetSelectedDialCode();
}

function createContactValidation(typedPhoneNum)
{
    if(strToOnlyNum(typedPhoneNum).trim().length == 0)
    {
        // Reset screen
        $(`#btnCreateContactSave`).addClass(`disabled`);
        $(`#createContactInvalidMobilePhone`).addClass(`hide`);
        return;
    }

    const fullPhone = `${$(`#selCreateContactDialCode`).val()}${strToOnlyNum(typedPhoneNum)}`;

    const vCountryCode = createContactGetSelectedCountryCode();
    const isValid = lpnIsValid(fullPhone, vCountryCode);

    if(isValid == false)
    {
        $(`#btnCreateContactSave`).addClass(`disabled`);
        $(`#createContactInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    const isMobile = lpnIsMobile(fullPhone, vCountryCode);
    if(isMobile == false)
    {
        $(`#btnCreateContactSave`).addClass(`disabled`);
        $(`#createContactInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        $(`#btnCreateContactSave`).removeClass(`disabled`);
    }

    $(`#createContactInvalidMobilePhone`).addClass(`hide`);

    setTimeout(function(){
        Keyboard.hide();
    }, 500);
}

async function saveNewContactCreation()
{
    const contactName = $(`#txtCreateContactName`).val().trim();
    if(contactName.length == 0)
    {
        $(`#btnCreateContactSave`).addClass(`disabled`);
        return;        
    }

    const typedPhone = $(`#txtCreateContactPhoneNumber`).val();

    if(strToOnlyNum(typedPhone).trim().length == 0)
    {
        // Reset screen
        $(`#btnCreateContactSave`).addClass(`disabled`);
        $(`#createContactInvalidMobilePhone`).addClass(`hide`);
        return;
    }

    const fullPhone = `${$(`#selCreateContactDialCode`).val()}${strToOnlyNum(typedPhone)}`;

    const vCountryCode = createContactGetSelectedCountryCode();
    const isValid = lpnIsValid(fullPhone, vCountryCode);

    if(isValid == false)
    {
        $(`#btnCreateContactSave`).addClass(`disabled`);
        $(`#createContactInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    const isMobile = lpnIsMobile(fullPhone, vCountryCode);
    if(isMobile == false)
    {
        $(`#btnCreateContactSave`).addClass(`disabled`);
        $(`#createContactInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    $(`#btnCreateContactSave`).addClass(`disabled`);


    // const nameList = contactName.split(' ');

    window.ContactsX.hasPermission(function(permissionInfo) {
        if(permissionInfo.write == false)
        {
            // window.ContactsX.requestPermission(function(permissionSet) {
            //     if(permissionSet.write == true)
            //     {
            //         // Reload action
            //         saveNewContactCreation();
            //     }
            // }, function (error) {
            //     $(`#btnCreateContactSave`).removeClass(`disabled`);
            //     swal(`2001: ${getTranslate(`error`, `Error`)} - ${error}`);
            // });

            cordova.plugins.diagnostic.requestContactsAuthorization(function(status){

                if(status === cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS)
                {
                    swal(getTranslate(`you-need-allow-contact-list-acces-to-proceed`, `You need to allow access to the contact list to continue.`));
                    

                    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
                    {
                        $(`#btnCreateContactSave`).removeClass(`disabled`);
                    }

                    return;
                }

                if(status === cordova.plugins.diagnostic.permissionStatus.GRANTED)
                {
                    console.log("Contacts use is authorized");

                    // Reload action
                    doCreateContactSaveNew(contactName, fullPhone);
                    return;
                }
                else
                {
                    swal(getTranslate(`you-need-allow-contact-list-acces-to-proceed`, `You need to allow access to the contact list to continue.`));
                    
                    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
                    {
                        $(`#btnCreateContactSave`).removeClass(`disabled`);
                    }

                }
            }, function(error){
                

                if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
                {
                    $(`#btnCreateContactSave`).removeClass(`disabled`);
                }

                swal(`2001: ${getTranslate(`error`, `Error`)} - ${error}`);
                // console.error(error);
            });

            return;
        }

        doCreateContactSaveNew(contactName, fullPhone);

    }, function (error) {
        // console.error(error);
        if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
        {
            $(`#btnCreateContactSave`).removeClass(`disabled`);
        }

        swal(`2002: ${getTranslate(`error`, `Error`)} - ${error}`);
    });

}

async function doCreateContactSaveNew(contactName, fullPhone)
{
    let contactRecord = null;

    try
    {
        contactRecord = await createContactSaveDevicePhone(contactName, fullPhone);
    }
    catch(saveContactError)
    {
        swal(`2003: ${getTranslate(`error`, `Error`)} - ${saveContactError}`);

        if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
        {
            $(`#btnCreateContactSave`).removeClass(`disabled`);
        }

        return;
    }

    const onlyNumPhone = strToOnlyNum(fullPhone);
    afterNewContactCreation(contactName, onlyNumPhone, contactRecord);
}

function createContactSaveDevicePhone(contactName, fullPhone)
{
    return new Promise((resolve, reject) =>{
        const nameList = contactName.split(' ');

        // create a new contact object
        var contactRecord = navigator.contacts.create();
        contactRecord.displayName = contactName;
        contactRecord.nickname = contactName;            // specify both to support all devices


        var name = new ContactName();
        name.givenName = nameList[0];
        name.familyName = nameList.length > 1 ? nameList[nameList.length -1] : "";
        contactRecord.name = name;

        var phoneNumbers = [];
        const phoneNumberAsPreferred = true;
        const phoneType = 'mobile';
        phoneNumbers[0] = new ContactField(phoneType, fullPhone, phoneNumberAsPreferred); // preferred number   
        contactRecord.phoneNumbers = phoneNumbers;

        // save to device
        contactRecord.save((contact) => {
            // console.log("Save Success");
            // afterNewContactCreation(onlyNumPhone);



            resolve(contactRecord);

        },(contactError) => {
            // console.log("Error = " + contactError.code);
            
            // $(`#btnCreateContactSave`).removeClass(`disabled`);

            // swal(`${getTranslate(`error`, `Error`)} - ${contactError.code}`);
            reject(contactError);
        });
    })



}

async function afterNewContactCreation(contactName, onlyNumPhone, contactRecord)
{
    createContactClearScreen();
    closeModalCreateContact();

    showLoadingAnimationInSwal();

    // await loadDevicePhoneContactList();
    // saveLocalLoadedContactList();
    await saveNewDeviceContactInternalDB(contactRecord);


    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        // Reload the contact selection list to store cache and other items
        // await mountContactSelectionList();
        
        // Mount in background the main list load
        mountContactList();
    }

    setTimeout(function(){
        swal.close();
        closeModalNewContact();
        openChatWithContact(onlyNumPhone);    
    }, 1000);
}