var thisIsIndex = true;
var itvNotificationDisableCheck = null;
var contactListLoadByIndexDone = false;
const NOTIFICATIONDISABLEDSERVICE_MS_TIME = 1000;

var loadedGroups = [];
var appInDebugMode = false;

var itvContactListLoadingService = null;
var companyInfoIsLoading = false;
var groupListDrawLastData = [];
var groupListDrawCurrentData = [];
var groupListDrawLastPhoto = [];
var groupListDrawCurrentPhoto = [];
var userCanSendGroupMessage = true;

const useLinkedContactListCache = true; // Turn ON/OFF the linked contact list cache
var updateLinkedContactListCacheIsSaving = false;

var updateContactListCoverIsReading = false;
var updateGroupListCoverIsReading = false;
var lastRefreshedLinkedContactList = [];

var svcCheckBackupRestoreMessage = null;

overrideConsole();
checkIsInDebugMode();

$(function() {
    mountIndexEvents();
    initIndex();
});

function mountIndexEvents()
{
    $(`#btnChatContactAddNew`).off(`click`);
    $(`#btnChatContactAddNew`).on(`click`, async function(){
        let okToAddNewContact = await isAddNewContactAllowed();
        if(okToAddNewContact == true)
        {
            await addNewContact();
        }
    });

    $(`#btnUnstableConnection`).off(`click`);
    $(`#btnUnstableConnection`).on(`click`, function(){
        swal(getTranslate(`internet-connection-unstable`, `It seems your internet connection is unstable. Check your connection.`), ``, `warning`);
    });

    $(`#btnEnableNotification`).off(`click`);
    $(`#btnEnableNotification`).on(`click`, async function(){
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            return;
        }

        $(`#btnEnableNotification`).addClass(`disabled`);

        try
        {
            let isEnabled = await notificationIsEnabled();

            if(isEnabled == false)
            {
                // writeInDebugText(`🟡 Notification not allowed, asking for permission...`);
    
                if(cordova.platformId == 'android')
                {
                    cordova.plugins.diagnostic.switchToNotificationSettings();
                }
                else if(cordova.platformId == 'android')
                {
                    await requestNotificationAuthorizationForIOS();
                }
    
                let isEnabled = await notificationIsEnabled();
                if(isEnabled == false)
                {
                    // writeInDebugText(`🟡 Notification still not allowed, opening permission window...`);
                    let notificationPermissionAsk = await notificationRequestPermission(true);    
                }
    
                // writeInDebugText(`🟡 Checking notification permission after set...`);
                isEnabled = await notificationIsEnabled();
                pushMessagingAllowed = isEnabled;
                // writeInDebugText(`🟢 Notification permission: ${isEnabled}`);
    
                if(isEnabled == true)
                {
                    await registerUserDevice();
                }
            }
            else
            {
                await registerUserDevice();
            }
    
        }
        catch(notificationPermissionError)
        {
            // writeInDebugText(`🔴 Notification permission error: ${notificationPermissionError}`);
        }

        $(`#btnEnableNotification`).removeClass(`disabled`);
    });

    $(`#appMenuList`).sidenav({
        "edge": "left",             // Side of screen on which Sidenav appears.
        "draggable": "false",       // Allow swipe gestures to open/close Sidenav.
        "inDuration": 250,          // Length in ms of enter transition.
        "outDuration": 200,         // Length in ms of exit transition.
        "onOpenStart": function(){  // Function called when sidenav starts entering.
            
        },
        "onOpenEnd": function(){    // Function called when sidenav finishes entering.
            
        },
        "onCloseStart": function(){ // Function called when sidenav starts exiting.
            
        },
        "onCloseEnd": function(){   // Function called when sidenav finishes exiting.
            
        },
        "preventScrolling": true    // Prevent page from scrolling while sidenav is open.
    });

    $(`#btnAppMenuClose`).off(`click`);
    $(`#btnAppMenuClose`).on(`click`, function(){
        $(`#appMenuList`).sidenav(`close`);
    });

    $(`#btnLoggedInUserMenuProfileEdit`).off(`click`);
    $(`#btnLoggedInUserMenuProfileEdit`).on(`click`, async function(){
        await initModalProfileEdit();
    });

    $(`#btnAppMenuConnectionQR`).off(`click`);
    $(`#btnAppMenuConnectionQR`).on(`click`, async function(){
        const selectedConnection = getSelectedAppServerConnection();
        showQRCode(selectedConnection.accessCode, selectedConnection.label);
    });

    $(`#btnAppMenuSwitchConnection`).off(`click`);
    $(`#btnAppMenuSwitchConnection`).on(`click`, async function(){
        showSwitchConnectionModal();
    });

    $(`#btnAppMenuSignout`).off(`click`);
    $(`#btnAppMenuSignout`).on(`click`, async function(){
        await forceDisconnect();
    });

    $(`#btnAppMenuRemoveAccount`).off(`click`);
    $(`#btnAppMenuRemoveAccount`).on(`click`, async function(){
        removeAccountRequest();
    });

    $(`#chkDebugMode`).off(`change`);
    $(`#chkDebugMode`).on(`change`, function(){
        const isChecked = $(this).is(":checked");

        if(isChecked == true)
        {
            appInDebugMode = true;
        }
        else
        {
            appInDebugMode = false;
        }

        checkIsInDebugMode();
    });

    $(`#btnDebugModeCopy`).off(`click`);
    $(`#btnDebugModeCopy`).on(`click`, function(){
        const content = $(`#txtDebugModeText`).val();
        // cordova.plugins.clipboard.copy(content);
        CopyTextToClipboard(content);
        showToastWithStyle(getTranslate("copied", `Copied`), 2000, `chat-copied-message-style`);
    });

    $(`#btnAppChatContactAvatar`).off(`click`);
    $(`#btnAppChatContactAvatar`).on(`click`, async function(){
        await initModalProfileEdit();
    });

    $(`#btnImgLoggedInProfileImage`).off(`click`);
    $(`#btnImgLoggedInProfileImage`).on(`click`, async function(){
        await initModalProfileEdit();
    });

    $(`#btnFooterMenuProfile`).off(`click`);
    $(`#btnFooterMenuProfile`).on(`click`, async function(){
        await initModalProfileEdit();
    });

    $(`#btnFooterMenuAdd`).off(`click`);
    $(`#btnFooterMenuAdd`).on(`click`, async function(){
        let okToAddNewContact = await isAddNewContactAllowed();
        if(okToAddNewContact == true)
        {
            await addNewContact();
        }
    });

    $(`#btnFooterMenuCorporate`).off(`click`);
    $(`#btnFooterMenuCorporate`).on(`click`, async function(){
        // showToastWithStyle(getTranslate(`under-construction`, `Under Construction`), 3000, toastDefaultClasses);
        initModalCompany();
    });

    $(`#btnAppBackupRestoreMessageOK`).off(`click`);
    $(`#btnAppBackupRestoreMessageOK`).on(`click`, function(){

        $(`#btnAppBackupRestoreMessageOK`).addClass(`disabled`);
        $(`#btnAppBackupRestoreMessageNo`).addClass(`disabled`);
        approveLastDBBackupRestore();

        setTimeout(function(){
            $(`#btnAppBackupRestoreMessageOK`).removeClass(`disabled`);
            $(`#btnAppBackupRestoreMessageNo`).removeClass(`disabled`);
        }, 1000);

    });

    $(`#btnAppBackupRestoreMessageNo`).off(`click`);
    $(`#btnAppBackupRestoreMessageNo`).on(`click`, async function(){
        $(`#btnAppBackupRestoreMessageOK`).addClass(`disabled`);
        $(`#btnAppBackupRestoreMessageNo`).addClass(`disabled`);

        const restoreResponse = await reproveLastDBBackupRestore();

        if(restoreResponse.error != null)
        {
            swal(getTranslate(`an-error-has-occurred-try-again`, `An error has occurred. Try again.`), ``, `error`);

            console.log(restoreResponse.error);

            $(`#btnAppBackupRestoreMessageOK`).removeClass(`disabled`);
            $(`#btnAppBackupRestoreMessageNo`).removeClass(`disabled`);

            return;
        }

        if(restoreResponse.restored == true)
        {
            swal(getTranslate(`backup-restored-success-message`, `Backup restored!`), ``, `success`);
        }

        $(`#btnAppBackupRestoreMessageOK`).removeClass(`disabled`);
        $(`#btnAppBackupRestoreMessageNo`).removeClass(`disabled`);
    });

    $(`#txtAppChatContactSearch`)[0].addEventListener('onsearch', function(event){
        const contactElements = $(`.app-chat-contact-list-item`);
        const groupElements = $(`.app-chat-group-list-item`);

        contactElements.removeClass(`hide`);
        groupElements.removeClass(`hide`);

        const term = strToSimpleChars(event.detail.text.toLowerCase());

        if(term.trim().length == 0)
        {
            return;
        }

        const allElements = contactElements.toArray().concat(groupElements.toArray());

        // Loop through contact elements
        for(let ix = 0; ix < allElements.length; ix++)
        {
            let readElement = $(allElements[ix]);
            const searchName = strToSimpleChars(readElement.attr(`data-searchname`).toLowerCase());

            if(searchName.indexOf(term) > -1)
            {
                readElement.removeClass(`hide`);
            }
            else
            {
                readElement.addClass(`hide`);
            }
        }
    });
}

async function initIndex()
{
    // console.log(`Start: ${new Date().toISOString()}`);

    // showLoadingAnimationInSwal();

    await waitForDeviceReady();
    await waitForDeviceInfoLoad();

    // console.log(`Device is ready: ${new Date().toISOString()}`);

    // The loggedIn check is made in app.js at first of onDeviceReady
    // const loggedIn = isLoggedIn();
    // if(loggedIn == false)
    // {
    //     redirect(`signup.html`);
    //     return;
    // }
   
    initializeAppServerConnectionInfo();

    // console.log(`Connection info loaded: ${new Date().toISOString()}`);

    // let serverConnectionState = await hasServerConnection();
    const deviceConnectionState = await hasDeviceConnection();

    // if(serverConnectionState == true)
    if(deviceConnectionState == true)
    {
        // console.log(`Loading connection status: ${new Date().toISOString()}`);

        const internalLoginExpDate = getInternalLoginExpDate();
        if(internalLoginExpDate != null)
        {
            loginExpireTimestamp = internalLoginExpDate.exp;
            loginExpireDate = internalLoginExpDate.expDate;

            const menuLoginExpDate = getDateFromTimestampValue(loginExpireTimestamp);
            $(`#menuLoginExpireDate`).text(`${menuLoginExpDate.toLocaleDateString()} ${menuLoginExpDate.toLocaleTimeString()}`);

            // console.log(`Login exp loaded from intenal. ${new Date().toISOString()}`);
        }
        else
        {
            await checkConnectionStatus();
            if(tooSlowConnection == false && almostSlowConnection == false)
            {
                // console.log(`Getting login exp date: ${new Date().toISOString()}`);
    
                const loginExpire = await callS(true, `GET`, `/services/loginexp`, null);
                if(loginExpire != null)
                {
                    setInternalLoginExpDate(loginExpire);

                    loginExpireTimestamp = loginExpire.exp;
                    loginExpireDate = loginExpire.expDate;
        
                    // const menuLoginExpDate = new Date(loginExpireTimestamp * 1000);
                    const menuLoginExpDate = getDateFromTimestampValue(loginExpireTimestamp);
                    $(`#menuLoginExpireDate`).text(`${menuLoginExpDate.toLocaleDateString()} ${menuLoginExpDate.toLocaleTimeString()}`);
                }
                else
                {
                    loginExpireTimestamp = null;
                    loginExpireDate = null;
                    $(`#menuLoginExpireDate`).text(``);
                }
            }
        }

        const loginPhoneIsValidated = getLoginPhoneIsValidated();

        if(loginPhoneIsValidated == false)
        {
            // console.log(`Getting phone validation status: ${new Date().toISOString()}`);

            const validatedPhoneResponse = await callS(true, `GET`, `/services/validatedphone`, null);
            if(validatedPhoneResponse != null)
            {
                const isValid = validatedPhoneResponse.valid;
        
                if(isValid == false)
                {
                    redirect(`phonevalidation.html`);
                    return;
                }
    
                setLoginPhoneIsValidated();
            }
        }
        else
        {
            console.log(`Phone already validated. ${new Date().toISOString()}`);
        }
    }

    // console.log(`DB Restore checking: ${new Date().toISOString()}`);

    // For browser or electron restore DB at index start
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        await runDBRestoreCheck();
    }

    // console.log(`DB Loading Check: ${new Date().toISOString()}`);
    await waitDBReady();
    // console.log(`DB Ready: ${new Date().toISOString()}`);

    // console.log(`Linked Contact List Preload: ${new Date().toISOString()}`);

    // if(serverConnectionState == true)
    if(deviceConnectionState == true)
    {   
        await preloadLinkedContactList();
        // console.log(`Linked Contact List Preload Done: ${new Date().toISOString()}`);
    }

    loadUserProfileInfo();

    // Load local saved linked contact list before start socket services
    await loadLocalSavedLinkedContactList();
    // console.log(`Local Linked Contact Loaded: ${new Date().toISOString()}`);

    if(useInternalSplashScreen == "1")
    {
        await waitSplashFinish();
        // console.log(`Splash finished: ${new Date().toISOString()}`);    
    }

    // initWebsocket();
    rqEncPS();
    startConnectionStatusService();
    startSocketKeepConnectedService();
    initCheckBackupRestoreMessageService();
    startContactListLoadingService();
    startContactListStatusService();
    startOutgoingMessageService();
    startOutgoingGroupStatusService();
    startOutgoingGroupUpdateStatusService();
    startOutgoingContactServedByCompanyService();
    startMessageToInformServerWasReceivedService();
    startMessageGroupToInformServerWasReceivedService();
    startCompanyMemberSyncService();
    startCompanyMemberDataFromDBSync();

    // console.log(`Services Loaded: ${new Date().toISOString()}`);

    await loadServerContactListStatus();
    // console.log(`Contact List Status Loaded: ${new Date().toISOString()}`);

    // Refresh linked contact list on screen after start socket services
    loadedGroups = [];
    await refreshLinkedContactList();
    // updateContactListCover();

    // console.log(`Linked Contact List Refresh OK: ${new Date().toISOString()}`);

    // hideLoadingAnimationInSwal();
    await loadDevicePhoneContactList();
    saveLocalLoadedContactList();
    refreshContactListScreen(); // Set ready the contact list screen

    // console.log(`Device Contact List Loaded: ${new Date().toISOString()}`);

    initNotificationDisabledCheckService();
    // serverConnectionState = await hasServerConnection();
    // if(serverConnectionState == true)
    // {
    //     registerUserDevice();
    // }

    mountPushNotificationEvents();

    loadMenuDefinedCountryList();
    loadMenuSwitchConnection();

    appVersionNewsCheck();
    checkChatWithContactAfterConnection();

    // console.log(`Notification Loaded: ${new Date().toISOString()}`);

    // if(serverConnectionState == true)
    if(deviceConnectionState == true)
    {
        await refreshCompanyInfoFromServer();
        companyMemberDataFromDBServiceRun();
    }

    loadUserCompanyProfileInfo();

    fixEmptyMessages();

    // console.log(`Completed: ${new Date().toISOString()}`);
}

function checkDisabledNotification()
{
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        $(`#btnEnableNotification`).addClass(`hide`);
        return;
    }

    if(pushMessagingAllowed == false)
    {
        $(`#btnEnableNotification`).removeClass(`hide`);
    }
    else
    {
        $(`#btnEnableNotification`).addClass(`hide`);
    }
}

async function initNotificationDisabledCheckService()
{
    // Make a check before initialize service
    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        let notificationPermissionOK = await notificationIsEnabled();
        pushMessagingAllowed = notificationPermissionOK;
    }

    if(itvNotificationDisableCheck != null)
    {
        clearInterval(itvNotificationDisableCheck);
        itvNotificationDisableCheck = null;
    }

    itvNotificationDisableCheck = setInterval(function(){
        checkDisabledNotification();
    }, NOTIFICATIONDISABLEDSERVICE_MS_TIME);
}

async function loadUserProfileInfo()
{
    let uid = readLocalStorage("uid");
    let photo = await getPhotoProfileURL(uid, null, true);
    $(`#imgLoggedInUserProfile`).attr(`src`, photo);
    $(`#imgLoggedInUserMenuProfile`).attr(`src`, photo);

    const userInfo = getLastLoginDataInfo();
    if(userInfo == null)
    {
        $(`#LoggedInUserMenuName`).text(``);
    }
    else
    {
        $(`#LoggedInUserMenuName`).text(userInfo.basicinfo.Name);
    }
}

async function loadUserCompanyProfileInfo()
{
    // Load company logo
    $(`#imgLoggedInCompanyLogo`).addClass(`hide`);
    let currentCompany = readLocalStorage(`company`);

    if(currentCompany == null)
    {
        return;
    }

    const companyLogo = await getCompanyLogo(currentCompany);

    if(companyLogo != null)
    {
        $(`#imgLoggedInCompanyLogo`).attr(`src`, companyLogo);
        $(`#imgLoggedInCompanyLogo`).removeClass(`hide`);
    }
}

async function loadDevicePhoneContactList()
{
    contactListLoadByIndexDone = false;
    
    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        if(typeof newContactLoadingMode != `undefined`)
        {
            newContactLoadingMode(true);
        }
    
        try
        {
            var deviceContactListResult = await listDeviceContacts();

            deviceContactList = deviceContactListResult;

            contactListLoadByIndexDone = true;
        }
        catch(deviceContactListException)
        {
            let loadDeviceContactListError = deviceContactListException.toString();
            // swal(getTranslate(`contact-list`, `Contact List`), loadDeviceContactListError, "error");
        }

        if(typeof newContactLoadingMode != `undefined`)
        {
            newContactLoadingMode(false);
        }
    }
    else
    {
        contactListLoadByIndexDone = true;
    }
}

function waitContactListLoadDoneByIndex()
{
    return new Promise((resolve, reject) =>{
        if(contactListLoadByIndexDone == true)
        {
            resolve();
            return;
        }

        var itvLoadingContactByIndex = setInterval(function(){
            if(contactListLoadByIndexDone == true)
            {
                clearInterval(itvLoadingContactByIndex);
                itvLoadingContactByIndex = null;
                resolve();
            }
        }, 200);
    })
}

async function loadServerContactListStatus()
{
    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == true)
    {
        let phoneList = [];

        for(let ix = 0; ix < deviceContactList.length; ix++)
        {
            let record = deviceContactList[ix];

            if(record == null)
            {
                continue;
            }
    
            const mobilePhoneList = record.phoneNumbers;

            if(mobilePhoneList == null)
            {
                continue;
            }
    
            for(let ixPhone = 0; ixPhone < mobilePhoneList.length; ixPhone++)
            {
                let phoneValue = mobilePhoneList[ixPhone].normalizedNumber != null ? mobilePhoneList[ixPhone].normalizedNumber : mobilePhoneList[ixPhone].number;
    
                if(phoneValue == null)
                {
                    continue;
                }
        
                let phoneDetails = getPhoneFormatsByNumber(phoneValue, mobilePhoneList[ixPhone].type);
        
                if(phoneDetails == null)
                {
                    continue;
                }
        
                if(phoneDetails.isMobile == false)
                {
                    continue;
                }
        
                let login = strToOnlyNum(phoneDetails.full);
                phoneList.push(login);
            }
        }


        if(phoneList.length > 0)
        {
            const data = {"list": JSON.stringify(phoneList)};
            const listStatusResponse = await callS(true, `POST`, `/services/retrivecontactliststatus`, data);
            if(listStatusResponse != null)
            {
                contactStatusList = listStatusResponse.result;
            }
        }
    }
}

async function saveLocalLoadedContactList()
{
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        // Do not save device contact list when browser or electron because it isn't running a device, so there is no local contacts.
        return;
    }

    let insertList = [];
    let insertListValues = [];

    insertList.push(`DELETE FROM DeviceContactList`);
    insertListValues.push(null);

    for(let ix = 0; ix < deviceContactList.length; ix++)
    {
        const item = deviceContactList[ix];

        const id            = item.id;
        const displayName   = item.displayName;
        const firstName     = item.firstName;
        const lastName      = item.lastName;

        const phone1_NormalizedNumber   = item.phoneNumbers.length > 0 ? item.phoneNumbers[0].normalizedNumber : null;
        const phone1_Number             = item.phoneNumbers.length > 0 ? item.phoneNumbers[0].number : null;
        const phone1_Type               = item.phoneNumbers.length > 0 ? item.phoneNumbers[0].type : null;

        const phone2_NormalizedNumber   = item.phoneNumbers.length > 1 ? item.phoneNumbers[1].normalizedNumber : null;
        const phone2_Number             = item.phoneNumbers.length > 1 ? item.phoneNumbers[1].number : null;
        const phone2_Type               = item.phoneNumbers.length > 1 ? item.phoneNumbers[1].type : null;

        const phone3_NormalizedNumber   = item.phoneNumbers.length > 2 ? item.phoneNumbers[2].normalizedNumber : null;
        const phone3_Number             = item.phoneNumbers.length > 2 ? item.phoneNumbers[2].number : null;
        const phone3_Type               = item.phoneNumbers.length > 2 ? item.phoneNumbers[2].type : null;

        const phone4_NormalizedNumber   = item.phoneNumbers.length > 3 ? item.phoneNumbers[3].normalizedNumber : null;
        const phone4_Number             = item.phoneNumbers.length > 3 ? item.phoneNumbers[3].number : null;
        const phone4_Type               = item.phoneNumbers.length > 3 ? item.phoneNumbers[3].type : null;

        const phone5_NormalizedNumber   = item.phoneNumbers.length > 4 ? item.phoneNumbers[4].normalizedNumber : null;
        const phone5_Number             = item.phoneNumbers.length > 4 ? item.phoneNumbers[4].number : null;
        const phone5_Type               = item.phoneNumbers.length > 4 ? item.phoneNumbers[4].type : null;

        const phone6_NormalizedNumber   = item.phoneNumbers.length > 5 ? item.phoneNumbers[5].normalizedNumber : null;
        const phone6_Number             = item.phoneNumbers.length > 5 ? item.phoneNumbers[5].number : null;
        const phone6_Type               = item.phoneNumbers.length > 5 ? item.phoneNumbers[5].type : null;

        const phone7_NormalizedNumber   = item.phoneNumbers.length > 6 ? item.phoneNumbers[6].normalizedNumber : null;
        const phone7_Number             = item.phoneNumbers.length > 6 ? item.phoneNumbers[6].number : null;
        const phone7_Type               = item.phoneNumbers.length > 6 ? item.phoneNumbers[6].type : null;

        const phone8_NormalizedNumber   = item.phoneNumbers.length > 7 ? item.phoneNumbers[7].normalizedNumber : null;
        const phone8_Number             = item.phoneNumbers.length > 7 ? item.phoneNumbers[7].number : null;
        const phone8_Type               = item.phoneNumbers.length > 7 ? item.phoneNumbers[7].type : null;

        const phone9_NormalizedNumber   = item.phoneNumbers.length > 8 ? item.phoneNumbers[8].normalizedNumber : null;
        const phone9_Number             = item.phoneNumbers.length > 8 ? item.phoneNumbers[8].number : null;
        const phone9_Type               = item.phoneNumbers.length > 8 ? item.phoneNumbers[8].type : null;

        const phone10_NormalizedNumber   = item.phoneNumbers.length > 9 ? item.phoneNumbers[9].normalizedNumber : null;
        const phone10_Number             = item.phoneNumbers.length > 9 ? item.phoneNumbers[9].number : null;
        const phone10_Type               = item.phoneNumbers.length > 9 ? item.phoneNumbers[9].type : null;

        if(phone1_Number == null)
        {
            continue;
        }

        if(phone1_Number.toString().length == 0)
        {
            continue;
        }

        insertList.push(`INSERT INTO DeviceContactList 
                            (
                                id, displayName, firstName, lastName, 
                                phone1_NormalizedNumber, phone1_Number, phone1_Type,
                                phone2_NormalizedNumber, phone2_Number, phone2_Type,
                                phone3_NormalizedNumber, phone3_Number, phone3_Type,
                                phone4_NormalizedNumber, phone4_Number, phone4_Type,
                                phone5_NormalizedNumber, phone5_Number, phone5_Type,
                                phone6_NormalizedNumber, phone6_Number, phone6_Type,
                                phone7_NormalizedNumber, phone7_Number, phone7_Type,
                                phone8_NormalizedNumber, phone8_Number, phone8_Type,
                                phone9_NormalizedNumber, phone9_Number, phone9_Type,
                                phone10_NormalizedNumber, phone10_Number, phone10_Type
                            ) 
                        VALUES(
                                ?, ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?,
                                ?, ?, ?
                            )`);
        insertListValues.push([
            id, displayName, firstName, lastName,
            phone1_NormalizedNumber, phone1_Number, phone1_Type,
            phone2_NormalizedNumber, phone2_Number, phone2_Type,
            phone3_NormalizedNumber, phone3_Number, phone3_Type,
            phone4_NormalizedNumber, phone4_Number, phone4_Type,
            phone5_NormalizedNumber, phone5_Number, phone5_Type,
            phone6_NormalizedNumber, phone6_Number, phone6_Type,
            phone7_NormalizedNumber, phone7_Number, phone7_Type,
            phone8_NormalizedNumber, phone8_Number, phone8_Type,
            phone9_NormalizedNumber, phone9_Number, phone9_Type,
            phone10_NormalizedNumber, phone10_Number, phone10_Type
        ]);

    }

    await dbRunManyInSameTransaction(insertList, insertListValues);
}

async function saveNewDeviceContactInternalDB(contactRecord)
{
    if(contactRecord == null)
    {
        return;
    }

    const id            = contactRecord.id;
    const displayName   = contactRecord.displayName;
    const firstName     = contactRecord.firstName;
    const lastName      = contactRecord.lastName;
    const newPhoneType  = "MOBILE";

    const phone1_NormalizedNumber   = contactRecord.phoneNumbers.length > 0 ? contactRecord.phoneNumbers[0].value : null;
    const phone1_Number             = contactRecord.phoneNumbers.length > 0 ? contactRecord.phoneNumbers[0].value : null;
    const phone1_Type               = contactRecord.phoneNumbers.length > 0 ? newPhoneType : null;

    const phone2_NormalizedNumber   = contactRecord.phoneNumbers.length > 1 ? contactRecord.phoneNumbers[1].value : null;
    const phone2_Number             = contactRecord.phoneNumbers.length > 1 ? contactRecord.phoneNumbers[1].value : null;
    const phone2_Type               = contactRecord.phoneNumbers.length > 1 ? newPhoneType : null;

    const phone3_NormalizedNumber   = contactRecord.phoneNumbers.length > 2 ? contactRecord.phoneNumbers[2].value : null;
    const phone3_Number             = contactRecord.phoneNumbers.length > 2 ? contactRecord.phoneNumbers[2].value : null;
    const phone3_Type               = contactRecord.phoneNumbers.length > 2 ? newPhoneType : null;

    const phone4_NormalizedNumber   = contactRecord.phoneNumbers.length > 3 ? contactRecord.phoneNumbers[3].value : null;
    const phone4_Number             = contactRecord.phoneNumbers.length > 3 ? contactRecord.phoneNumbers[3].value : null;
    const phone4_Type               = contactRecord.phoneNumbers.length > 3 ? newPhoneType : null;

    const phone5_NormalizedNumber   = contactRecord.phoneNumbers.length > 4 ? contactRecord.phoneNumbers[4].value : null;
    const phone5_Number             = contactRecord.phoneNumbers.length > 4 ? contactRecord.phoneNumbers[4].value : null;
    const phone5_Type               = contactRecord.phoneNumbers.length > 4 ? newPhoneType : null;

    const phone6_NormalizedNumber   = contactRecord.phoneNumbers.length > 5 ? contactRecord.phoneNumbers[5].value : null;
    const phone6_Number             = contactRecord.phoneNumbers.length > 5 ? contactRecord.phoneNumbers[5].value : null;
    const phone6_Type               = contactRecord.phoneNumbers.length > 5 ? newPhoneType : null;

    const phone7_NormalizedNumber   = contactRecord.phoneNumbers.length > 6 ? contactRecord.phoneNumbers[6].value : null;
    const phone7_Number             = contactRecord.phoneNumbers.length > 6 ? contactRecord.phoneNumbers[6].value : null;
    const phone7_Type               = contactRecord.phoneNumbers.length > 6 ? newPhoneType : null;

    const phone8_NormalizedNumber   = contactRecord.phoneNumbers.length > 7 ? contactRecord.phoneNumbers[7].value : null;
    const phone8_Number             = contactRecord.phoneNumbers.length > 7 ? contactRecord.phoneNumbers[7].value : null;
    const phone8_Type               = contactRecord.phoneNumbers.length > 7 ? newPhoneType : null;

    const phone9_NormalizedNumber   = contactRecord.phoneNumbers.length > 8 ? contactRecord.phoneNumbers[8].value : null;
    const phone9_Number             = contactRecord.phoneNumbers.length > 8 ? contactRecord.phoneNumbers[8].value : null;
    const phone9_Type               = contactRecord.phoneNumbers.length > 8 ? newPhoneType : null;

    const phone10_NormalizedNumber   = contactRecord.phoneNumbers.length > 9 ? contactRecord.phoneNumbers[9].value : null;
    const phone10_Number             = contactRecord.phoneNumbers.length > 9 ? contactRecord.phoneNumbers[9].value : null;
    const phone10_Type               = contactRecord.phoneNumbers.length > 9 ? newPhoneType : null;

    if(phone1_Number == null)
    {
        return;
    }

    if(phone1_Number.toString().length == 0)
    {
        return;
    }

    const insertQuery = `INSERT INTO DeviceContactList 
    (
        id, displayName, firstName, lastName, 
        phone1_NormalizedNumber, phone1_Number, phone1_Type,
        phone2_NormalizedNumber, phone2_Number, phone2_Type,
        phone3_NormalizedNumber, phone3_Number, phone3_Type,
        phone4_NormalizedNumber, phone4_Number, phone4_Type,
        phone5_NormalizedNumber, phone5_Number, phone5_Type,
        phone6_NormalizedNumber, phone6_Number, phone6_Type,
        phone7_NormalizedNumber, phone7_Number, phone7_Type,
        phone8_NormalizedNumber, phone8_Number, phone8_Type,
        phone9_NormalizedNumber, phone9_Number, phone9_Type,
        phone10_NormalizedNumber, phone10_Number, phone10_Type
    ) 
    VALUES(
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?
    )`;

    const insertValues = [
        id, displayName, firstName, lastName,
        phone1_NormalizedNumber, phone1_Number, phone1_Type,
        phone2_NormalizedNumber, phone2_Number, phone2_Type,
        phone3_NormalizedNumber, phone3_Number, phone3_Type,
        phone4_NormalizedNumber, phone4_Number, phone4_Type,
        phone5_NormalizedNumber, phone5_Number, phone5_Type,
        phone6_NormalizedNumber, phone6_Number, phone6_Type,
        phone7_NormalizedNumber, phone7_Number, phone7_Type,
        phone8_NormalizedNumber, phone8_Number, phone8_Type,
        phone9_NormalizedNumber, phone9_Number, phone9_Type,
        phone10_NormalizedNumber, phone10_Number, phone10_Type
    ];

    try
    {
        await dbRun(insertQuery, insertValues);
    }
    catch(dbException)
    {
        console.log(`Error saving in local db: ${dbException}`)
    }

    if(deviceContactList == null)
    {
        deviceContactList = [];
    }

    if(Array.isArray(deviceContactList) == false)
    {
        deviceContactList = [];
    }

    // Update device memory list
    const localRecord = {
        "id": id,
        "firstName": firstName,
        "lastName": lastName,
        "displayName": displayName,
        "phoneNumbers": contactRecord.phoneNumbers
    }

    deviceContactList.push(localRecord);
    localSavedDeviceContactList.push(localRecord);

}

async function isAddNewContactAllowed()
{
    let isContactAuthorized = {
        "allowed": true,
        "denied_always": false
    };

    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        isContactAuthorized = await checkDeviceContactPermission();
    }

    if(isContactAuthorized.allowed == true)
    {
        return true;
    }
    else if(isContactAuthorized.allowed == false)
    {
        let permissionMsg = getTranslate(`you-need-allow-contact-list-acces-to-chat`, `You need to allow access to the contact list to be able to chat with someone from your contact list.`);
        

        if(isContactAuthorized.denied_always == true)
        {
            // swal(permissionMsg).then(function(){
            //     openDeviceSystemSettings();
            // });

            const confirmationTitle = getTranslate(`contact-list-permission-required`, `Contact List Permission Required`);
            const confirmationText = getTranslate(`do-you-want-to-open-device-settings-contact-permission`, `Do you want to open the device permission settings to grant contacts permission?`);
            const cancelButtonText = getTranslate(`no`, `NO`);
            const confirmButtonText = getTranslate(`yes`, `YES`);
            
            swalConfirm(confirmationTitle, confirmationText, `warning`, cancelButtonText, confirmButtonText, ()=>{
                swal(getTranslate(`youll-not-be-allowed-to-access-device-contact-list`, `You'll not be able to access the device contact list while not allowing the necessary permission.`));
            }, async ()=> {
                openDeviceSystemSettings();
            });

        }
        else
        {
            swal(permissionMsg);
        }

        return false;
    }
    else
    {
        swal(getTranslate(`error-to-get-device-contact`, `Error getting device contact.`));

        return false;
    }
}

async function addNewContact()
{
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        await initModalNewContact();
        return;
    }

    let contactListResponse = await initNativeContactListScreen();

    if(contactListResponse == null)
    {
        return;
    }

    if(typeof contactListResponse == `string`)
    {
        contactListResponse = JSON.parse(contactListResponse);
    }

    if(contactListResponse.message == null)
    {
        return;
    }

    if(typeof contactListResponse.message == `string`)
    {
        if(contactListResponse.message == 'Operation canceled or failed')
        {
            contactListResponse.message = null;
        }
        else
        {
            contactListResponse.message = JSON.parse(contactListResponse.message);
        }
    }

    const contactListResult = contactListResponse.message;

    if(contactListResult == null)
    {
        return;
    }


    if(typeof contactListResult.action == `undefined`)
    {
        const phoneNumber = contactListResult.phone;
        const phoneType = contactListResult.type;

        let phoneDetails = getPhoneFormatsByNumber(phoneNumber, null);
        contactId = phoneDetails.fullNumbersOnly;

        // if(cordova.platformId == 'android')
        // {
        //     if(phoneType.toString() != "2") // Not mobile
        //     {
        //         if(phoneDetails.isMobile == false)
        //         {
        //             showToastWithStyle(getTranslate(`contact-must-be-mobile-phone-number`, `The contact must be a cell phone number`), 3000, toastDefaultClasses);
        //             return;
        //         }
        //     }
        // }
        // else if(cordova.platformId == 'ios')
        // {
        //     if(phoneType.toString().toUpperCase() != "MOBILE")
        //     {
        //         if(phoneDetails.isMobile == false)
        //         {
        //             showToastWithStyle(getTranslate(`contact-must-be-mobile-phone-number`, `The contact must be a cell phone number`), 3000, toastDefaultClasses);
        //             return;
        //         }
        //     }
        // }
        
        if(phoneDetails.isMobile == false)
        {
            showToastWithStyle(getTranslate(`contact-must-be-mobile-phone-number`, `The contact must be a cell phone number`), 3000, toastDefaultClasses);
            return;
        }

        openChatWithContact(contactId);

        return;
    }

    if(contactListResult.action.toUpperCase() == `CREATE_NEW`)
    {
        initModalCreateContact();
    }

    if(contactListResult.action.toUpperCase() == `CREATE_GROUP`)
    {
        const emptyArray = [];
        initModalCreateGroup(false, emptyArray, null);
    }
}

async function getContactInfo(contactId, preloadedConnectionState)
{
    let name = "";
    let photo = "images/contact.png";

    let serverConnectionState;

    if(preloadedConnectionState != null)
    {
        serverConnectionState = preloadedConnectionState;
    }
    else
    {
        serverConnectionState = await hasServerConnection();
    }

    const loadedFromStatus = contactStatusList.find((item) =>{
        return item.Login == contactId;
    });

    if(loadedFromStatus != null)
    {
        name = loadedFromStatus.Name;
        // photo = `${endpoint}services/userphotoraw/${contactId}`
        photo = await getPhotoProfileURL(contactId, serverConnectionState, false);
    }
    else
    {
        for(let ix = 0; ix < deviceContactList.length; ix++)
        {
            let record = deviceContactList[ix];

            if(record == null)
            {
                continue;
            }
    
            const mobilePhoneList = record.phoneNumbers;

            if(mobilePhoneList == null)
            {
                continue;
            }
    
            for(let ixPhone = 0; ixPhone < mobilePhoneList.length; ixPhone++)
            {
                let phoneValue = mobilePhoneList[ixPhone].normalizedNumber != null ? mobilePhoneList[ixPhone].normalizedNumber : mobilePhoneList[ixPhone].number;
    
                if(phoneValue == null)
                {
                    continue;
                }
        
                let phoneDetails = getPhoneFormatsByNumber(phoneValue, mobilePhoneList[ixPhone].type);
        
                if(phoneDetails == null)
                {
                    continue;
                }
        
                if(phoneDetails.isMobile == false)
                {
                    continue;
                }
        
                let login = strToOnlyNum(phoneDetails.full);
                
                if(login == contactId)
                {
                    name = record.displayName;
                    if(record.thumbnail != null)
                    {
                        try
                        {
                            photo = await getDeviceFileBase64URL(record.thumbnail);
                        }
                        catch(devicePhotoURLException)
                        {
    
                        }
                    }

                    break;
                }
            }

            if(name.length > 0)
            {
                break;
            }
        }       
    }

    const result = {
        "name": name,
        "photo": photo,
    };

    return result;
}

function waitUpdateListCoverToFinish()
{
    return new Promise((resolve, reject) =>{
        if(updateContactListCoverIsReading == false)
        {
            resolve();
            return;
        }

        var itvLoadingUpdateListCoverRead = setInterval(function(){
            if(updateContactListCoverIsReading == false)
            {
                clearInterval(itvLoadingUpdateListCoverRead);
                itvLoadingUpdateListCoverRead = null;
                resolve();
            }
        });
    })
}

async function updateContactListCover()
{
    // $(`.app-chat-contact-list-item`).each(async function( index ) {
    //     const contactId = $(this).attr(`data-talktoid`);
    //     await updateContactListCoverByContactId(contactId);
    // });

    await waitUpdateListCoverToFinish();

    updateContactListCoverIsReading = true;

    try
    {
        const appChatContactListElements = $(`.app-chat-contact-list-item`);
        for(let ix = 0; ix < appChatContactListElements.length; ix++)
        {
            const el = $(appChatContactListElements.get(ix));
            const contactId = el.attr(`data-talktoid`);
            await updateContactListCoverByContactId(contactId);
        }
    
        await updateOnlyGroupListCover();
    
        await refreshUnreadMessageCounter();
    
    }
    catch(updateException)
    {
        console.log(`Error updating list cover: ${updateException}`);
    }


    updateContactListCoverIsReading = false;
}

function waitUpdateGroupListCoverToFinish()
{
    return new Promise((resolve, reject) =>{
        if(updateGroupListCoverIsReading == false)
        {
            resolve();
            return;
        }

        var itvLoadingUpdateGroupListCoverRead = setInterval(function(){
            if(updateGroupListCoverIsReading == false)
            {
                clearInterval(itvLoadingUpdateGroupListCoverRead);
                itvLoadingUpdateGroupListCoverRead = null;
                resolve();
            }
        });
    })
}

async function updateOnlyGroupListCover()
{
    // $(`.app-chat-group-list-item`).each(async function( index ) {
    //     const contactId = $(this).attr(`data-talktoid`);
    //     await updateContactListCoverByContactId(contactId);
    // });

    await waitUpdateGroupListCoverToFinish();

    updateGroupListCoverIsReading = true;

    try
    {
        const appChatGroupListElements = $(`.app-chat-group-list-item`);
        for(let ix = 0; ix < appChatGroupListElements.length; ix++)
        {
            const el = $(appChatGroupListElements.get(ix));
            const contactId = el.attr(`data-talktoid`);
            await updateContactListCoverByContactId(contactId);
        }
    }
    catch(updateException)
    {
        console.log(`Error updating group list cover: ${updateException}`);
    }

    updateGroupListCoverIsReading = false;

}

async function updateContactListCoverByContactId(contactId)
{
    //const lastMessage = await getLastMessageWithContact(contactId);

    let contactIdIsGroup = false;
    const groupRecord = await getChatAppGroupById(contactId, true);
    if(groupRecord != null)
    {
        contactIdIsGroup = true;
    }
    
    const lastMessage = await getLastMessageWithContact(contactId, contactIdIsGroup);

    const noMessagesText = getTranslate(`no-messages`, `No Messages`);

    if(lastMessage == null)
    {
        if(contactIdIsGroup == false)
        {
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-recent-text`).text(noMessagesText);
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-time`).text(``);    
        }
        else
        {
            $(`.app-chat-group-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-group-list-item-recent-text`).text(noMessagesText);
            $(`.app-chat-group-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-group-list-item-time`).text(``);    
        }
    }
    else
    {
        const msgDate = new Date(lastMessage.messageTime);
        
        const msgDateDay = new Date(lastMessage.messageTime);
        msgDateDay.setHours(0,0,0,0)

        let msgTime = "";
        const todaysDate = new Date();
        todaysDate.setHours(0,0,0,0)

        // call setHours to take the time out of the comparison
        if(msgDateDay.getTime() == todaysDate.getTime())
        {
            // Date equals today's date
            msgTime = getHourAndMinute(msgDate);
        }
        else
        {
            msgTime = msgDate.toLocaleDateString();
        }


        // const messageText = lastMessage.protected == 0 ? lastMessage.content : CHAT_PROTECTED_TEXT;
        let messageText = lastMessage.content;

        if(messageText.trim().length == 0)
        {
            if(lastMessage.mediaType == MEDIA_TYPE_IMAGE)
            {
                messageText = `🖼️`;
            }
            else if(lastMessage.mediaType == MEDIA_TYPE_AUDIO)
            {
                messageText = `🔈`;
            }
            else
            {
                if(lastMessage.mediaType != null)
                {
                    messageText = `📎`;
                }
                else
                {
                    messageText = noMessagesText;
                }
            }
        }

        if(contactIdIsGroup == false)
        {
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-recent-text`).text(messageText);
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-time`).text(msgTime);
        }
        else
        {
            $(`.app-chat-group-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-group-list-item-recent-text`).text(messageText);
            $(`.app-chat-group-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-group-list-item-time`).text(msgTime);
        }
    }
}

function getRecentTextFromLoaded(contactId)
{
    const element = $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-recent-text`);
    if(element.length == 0)
    {
        return "";
    }

    return element.text();
}

function getRecentTextTimeFromLoaded(contactId)
{
    const element = $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-time`);
    if(element.length == 0)
    {
        return "";
    }

    return element.text();
}

function loadMenuDefinedCountryList()
{
    $(`#selectDefinedCountry`).empty();

    for(let ix = 0; ix < COUNTRY_SET.length; ix++)
    {
        const itemCode = COUNTRY_SET[ix];
        const phoneCodeRecord = phoneCodes.find((item)=>{ return item.code.toUpperCase() == itemCode.toUpperCase() })
        $(`#selectDefinedCountry`).append(`<option value="${itemCode}">${phoneCodeRecord.emoji} ${phoneCodeRecord.name}</option>`)
    }

    // Turn off change
    $(`#selectDefinedCountry`).off(`change`);
    
    let forcedLanguage = readLocalStorage("forcedlanguage");
    if(forcedLanguage == null)
    {
        $(`#selectDefinedCountry`).val(countryCode);
    }
    else
    {
        $(`#selectDefinedCountry`).val(forcedLanguage);
    }

    // Turn on change
    $(`#selectDefinedCountry`).on(`change`, function(){
        const newCode = $(this).val();
        writeLocalStorage("forcedlanguage", newCode);
        translate();
    });
}

function loadMenuSwitchConnection()
{
    let nonDefaultConnectionList = getNonDefaultServerConnectionList();
    if(nonDefaultConnectionList == null)
    {
        nonDefaultConnectionList = [];
    }

    if(nonDefaultConnectionList.length == 0)
    {
        $(`#appMenuSwitchConnection`).addClass(`hide`);
    }
    else
    {
        $(`#appMenuSwitchConnection`).removeClass(`hide`);
    }
}

function checkChatWithContactAfterConnection()
{
    const chatContact = readLocalStorage(`chatcontactafterconnection`);

    if(chatContact == null)
    {
        return;
    }

    removeLocalStorage(`chatcontactafterconnection`);

    if(chatContact.trim().length == 0)
    {
        return;
    }

    openChatWithContact(chatContact);
}

async function preloadLinkedContactList()
{
    if(useLinkedContactListCache == false)
    {
        return;
    }

    const cacheValue = await getLinkedContactListCache();
    if(cacheValue == null)
    {
        return;
    }

    if(cacheValue.trim().length == 0)
    {
        return;
    }

    $(`#chatContactListCollection`).html(cacheValue);
    mountFilledLinkedContactListEvents(true);
    mountGroupContactListEvents(true);
}

async function refreshLinkedContactList()
{
    let serverConnectionState = await hasServerConnection();

    let hasListChange = false;
    if(linkedContactList.length != lastRefreshedLinkedContactList.length)
    {
        hasListChange = true;
    }
    else
    {
        for(let ix = 0; ix < linkedContactList.length; ix++)
        {
            const recordCheck = linkedContactList[ix];
            const lastRecordCheck = lastRefreshedLinkedContactList[ix];

            if(
                recordCheck.Contact != lastRecordCheck.Contact ||
                recordCheck.Name != lastRecordCheck.Name ||
                recordCheck.Nickname != lastRecordCheck.Nickname ||
                recordCheck.Pin != lastRecordCheck.Pin
            )
            {
                hasListChange = true;
            }
        }
    }


    lastRefreshedLinkedContactList = linkedContactList;

    // let htmlItems = "";

    for(let ix = 0; ix < linkedContactList.length; ix++)
    {
        const record = linkedContactList[ix];
        const contactId = record.Contact;

        let contactPhoto = `images/contact.png`;
        if(record.Name != null)
        {
            contactPhoto = await getPhotoProfileURL(contactId, serverConnectionState, false);
        }

        let displayName = record.Name;

        if(displayName == null)
        {
            displayName = "";
        }

        if(displayName.trim().length == 0)
        {
            const contactInfo = await getContactInfo(contactId, serverConnectionState);
            displayName = contactInfo.name;

            if(displayName == null)
            {
                displayName = "";
            }

            if(displayName.trim().length == 0)
            {
                let phoneDetails = getPhoneFormatsByNumber(contactId, null);

                if(phoneDetails == null)
                {
                    continue;
                }
        
                let phoneNum = phoneDetails.full;
                displayName = phoneNum;
            }
        }

        let recentTextPreload = getRecentTextFromLoaded(contactId);
        let recentTextTimePreload = getRecentTextTimeFromLoaded(contactId);

        if(recentTextPreload.length == 0)
        {
            recentTextPreload = "...";
        }

        if(recentTextTimePreload.length == 0)
        {
            recentTextTimePreload = "...";
        }

        if(hasListChange == true)
        {
            const htmlIttemElement = `
            <li class="app-chat-contact-list-item collection-item" data-talktoid="${contactId}" data-searchname="${displayName}">
                <a href="#" class="app-chat-contact-list-item-link" data-talktoid="${contactId}">
                    <div class="app-chat-contact-list-item-avatar">
                        <img src="${contactPhoto}" class="app-chat-contact-list-item-avatar-image" />
                    </div>
                    <div class="app-chat-contact-list-item-info">
                        <div class="app-chat-contact-list-item-name">
                            ${displayName}
                        </div>
                        <div class="app-chat-contact-list-item-recent-text">${recentTextPreload}</div>
                    </div>
                    <div class="app-chat-contact-list-item-time">${recentTextTimePreload}</div>
                </a>
            </li>
            `;

            // htmlItems += htmlIttemElement;

            if($(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).length == 0)
            {
                $(`#chatContactListCollection`).append(htmlIttemElement);
            }
            else
            {
                $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).attr(`data-searchname`, displayName);
                $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-avatar-image`).attr(`src`, contactPhoto);
                $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-name`).text(displayName);
                $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-recent-text`).text(recentTextPreload);
                $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-time`).text(recentTextTimePreload);

                updateContactListCoverByContactId(contactId);
            }
        }
        else
        {
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).attr(`data-searchname`, displayName);
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-avatar-image`).attr(`src`, contactPhoto);
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-name`).text(displayName);
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-recent-text`).text(recentTextPreload);
            $(`.app-chat-contact-list-item[data-talktoid="${contactId}"]`).find(`.app-chat-contact-list-item-time`).text(recentTextTimePreload);

            updateContactListCoverByContactId(contactId);
        }
    }

    // Remove non-listed elements
    const listElements = $(`.app-chat-contact-list-item`);
    for(let ix = 0; ix < listElements.length; ix++)
    {
        const elRead = $(listElements.get(ix));
        const elId = elRead.attr(`data-talktoid`);
        const itemInList = linkedContactList.find((item) => {
            return item.Contact == elId
        });

        if(itemInList == null)
        {
            console.log(`Linked Contact Removed from the list: ${elId}`);
            elRead.remove();
        }
    }

    if(linkedContactList.length > 0)
    {
        $(`.start-chat-collection-item`).remove();

        if(hasListChange == true)
        {
            // $(`#chatContactListCollection`).html(htmlItems);
            mountFilledLinkedContactListEvents(false);
        }

        await refreshGroupList();
    }
    else
    {
        $(`#chatContactListTitle`).addClass(`hide`);
        $(`#homeContactSearchBox`).addClass(`hide`);

        await refreshGroupList();

        if(loadedGroups.length == 0)
        {
            $(`#chatContactListCollection`).html(`
                <li class="collection-item start-chat-collection-item center">
                    <a id="btnHomeStartChat" href="#" class="start-chat-button waves-effect waves-light btn-large">
                        <i class="fa-solid fa-user-plus left"></i>
                        <span>${getTranslate(`start-chat`, `Start Chat`)}</span>
                        <img class="button-loading-animation hide" src="images/loading-grey.gif" />
                    </a>
                    <div class="start-chat-home-phrase-area">
                        <i class="fa-solid fa-flag-checkered"></i>
                        <span>${getTranslate(`start-chat-phrase`, `Choose a contact to start a conversation`)}</span>
                    </div>
                </li>
            `);

            $(`#btnHomeStartChat`).off(`click`);
            $(`#btnHomeStartChat`).on(`click`, async function(){

                $(`#btnHomeStartChat`).find(`.button-loading-animation`).removeClass(`hide`);

                let okToAddNewContact = await isAddNewContactAllowed();
                if(okToAddNewContact == true)
                {
                    await addNewContact();
                }
                $(`#btnHomeStartChat`).find(`.button-loading-animation`).addClass(`hide`);              
            });
        }
        else
        {
            $(`.start-chat-collection-item`).remove();
        }
    }

    // Check if linked contact list has changed compared to the local saved, update the local saved
    if(linkedContactList.length > 0)
    {
        const localSavedLinkedContactList = await getLocalSavedLinkedContactList();

        if(linkedContactList.length != localSavedLinkedContactList.length)
        {
            console.log(`Saving local linked contact list by array diff size`);
            overwriteLocalLinkedContactList();
        }
        else
        {
            let localLinkedChange = false;

            for(let ix = 0; ix < linkedContactList.length; ix++)
            {
                const contactRead = linkedContactList[ix];
                const localRead = localSavedLinkedContactList.find((item) =>{
                    return item.Contact == contactRead.Contact;
                });

                if(localRead == null)
                {
                    // console.log(`Saving local linked contact list by new contact identified`);
                    localLinkedChange = true;
                    break;
                }
                else
                {
                    if(
                        localRead.Nickname != contactRead.Nickname ||
                        localRead.Pin != contactRead.Pin ||
                        localRead.Name != contactRead.Name
                    )
                    {
                        // console.log(`Saving local linked contact list by contact update`);
                        localLinkedChange = true;
                        break;
                    }
                }
            }

            if(localLinkedChange == true)
            {
                overwriteLocalLinkedContactList();
            }
        }
    }
    else
    {
        clearLocalLinkedContactList();
    }


    // Wait 10 seconds to update cache while some features is loading
    setTimeout(function(){
        updateLinkedContactListCache();
    }, 10000);
}

async function refreshGroupList()
{
    let uid = readLocalStorage("uid");
    const groupsQuery = `SELECT * FROM AppGroups a, AppGroupMembers m WHERE a.GroupId=m.GroupId AND Login =${uid}`;
    const groupQsueryValues = [];
    const groupsQueryResponse = await dbRun(groupsQuery, groupQsueryValues);

    loadedGroups = [];

    if(groupsQueryResponse.rows.length == 0)
    {
        return;
    }

    for(let ix = 0; ix < groupsQueryResponse.rows.length; ix++)
    {
        const group = groupsQueryResponse.rows.item(ix);
        loadedGroups.push(group);
    }

    groupListDraw();
}

async function groupListDraw()
{
    // Check if the amount of groups is different of the amount of last loaded, 
    // it already indicates the screen must be updated
    let hasDrawCountUpdate = false;
    let hasDrawItemsUpdate = false;

    if(loadedGroups.length != groupListDrawLastData.length)
    {
        hasDrawCountUpdate = true;
        hasDrawItemsUpdate = true;
    }

    let htmlItems = "";

    // Empty the current array
    groupListDrawCurrentData = [];

    for(let ix = 0; ix < loadedGroups.length; ix++)
    {
        const group = loadedGroups[ix];

        const groupId = group.GroupId;
        const groupName = group.Name;
        const description = group.Description;
        // const photo = group.Photo;
        const creatorAdminLogin = group.CreatorAdminLogin;
        const creationDate = group.CreationDate;
        const hasGroupValidity = group.HasGroupValidity;
        const hasGroupValidityFromDate = group.HasGroupValidityFromDate;
        const validityFromDate = group.ValidityFromDate;
        const hasGroupValidityBetween = group.HasGroupValidityBetween;
        const validityBetweenDateStart = group.ValidityBetweenDateStart;
        const validityBetweenDateEnd = group.ValidityBetweenDateEnd;
        const hasGroupAccessHours = group.HasGroupAccessHours;
        const groupAccessHoursStart = group.GroupAccessHoursStart;
        const groupAccessHoursEnd = group.GroupAccessHoursEnd;

        //user validity info
        const hasUserValidity = group.HasUserValidity;
        const hasUserValidityFromDate = group.HasUserValidityFromDate;
        const userValidityFromDate = group.UserValidityFromDate;
        const hasUserValidityBetween = group.HasUserValidityBetween;
        const userValidityBetweenDateStart = group.UserValidityBetweenDateStart;
        const userValidityBetweenDateEnd = group.UserValidityBetweenDateEnd;

        const isUserAdmin = group.IsAdmin;

        groupListDrawCurrentData.push({
            "groupId": groupId,
            "name": groupName,
            "description": description,
            "hasGroupValidity": hasGroupValidity,
            "hasGroupValidityFromDate": hasGroupValidityFromDate,
            "validityFromDate": validityFromDate,
            "hasGroupValidityBetween": hasGroupValidityBetween,
            "validityBetweenDateStart": validityBetweenDateStart,
            "validityBetweenDateEnd": validityBetweenDateEnd,
            "hasGroupAccessHours":hasGroupAccessHours,
            "groupAccessHoursStart": groupAccessHoursStart,
            "groupAccessHoursEnd":groupAccessHoursEnd,
            "isUserAdmin": isUserAdmin,
            "hasUserValidity":hasUserValidity,
            "hasUserValidityFromDate":hasUserValidityFromDate,
            "userValidityFromDate":userValidityFromDate,
            "hasUserValidityBetween":hasUserValidityBetween,
            "userValidityBetweenDateStart":userValidityBetweenDateStart,
            "userValidityBetweenDateEnd":userValidityBetweenDateEnd
        });

        // If there's no update by now, keep 
        // checking from item updated until found any update
        if(hasDrawItemsUpdate == false)
        {
            const lastDrawItem = groupListDrawLastData.find((item) =>{
                return item.groupId == groupId
            });
    
            if(lastDrawItem == null)
            {
                // Has update in item (new item identified)
                hasDrawItemsUpdate = true;
            }
            else
            {
                if(
                    lastDrawItem.name != groupName ||
                    lastDrawItem.description != description ||
                    lastDrawItem.hasGroupValidity != hasGroupValidity ||
                    lastDrawItem.hasGroupValidityFromDate != hasGroupValidityFromDate ||
                    lastDrawItem.validityFromDate != validityFromDate ||
                    lastDrawItem.hasGroupValidityBetween != hasGroupValidityBetween ||
                    lastDrawItem.validityBetweenDateStart != validityBetweenDateStart ||
                    lastDrawItem.validityBetweenDateEnd != validityBetweenDateEnd ||
                    lastDrawItem.hasGroupAccessHours != hasGroupAccessHours ||
                    lastDrawItem.groupAccessHoursStart != groupAccessHoursStart ||
                    lastDrawItem.groupAccessHoursEnd != groupAccessHoursEnd ||
                    lastDrawItem.isUserAdmin != isUserAdmin ||
                    lastDrawItem.hasUserValidity != hasUserValidity ||
                    lastDrawItem.hasUserValidityFromDate != hasUserValidityFromDate ||
                    lastDrawItem.userValidityFromDate != userValidityFromDate ||
                    lastDrawItem.hasUserValidityBetween != hasUserValidityBetween ||
                    lastDrawItem.userValidityBetweenDateStart != userValidityBetweenDateStart ||
                    lastDrawItem.userValidityBetweenDateEnd != userValidityBetweenDateEnd
                )
                {
                    // Has update in item (updated item identified)
                    hasDrawItemsUpdate = true;
                }
            }
    
        }

        //checks group validity data
        let dateFrom = null;
        let dateEnd = null;
        let showGroup = true;
        let canSendMessage = 1;

        if(hasGroupValidity == 1)
        {
            if(hasGroupValidityFromDate == 1)
            {
                dateFrom = validityFromDate;                
            }

            if(hasGroupValidityBetween == 1)
            {
                dateFrom = validityBetweenDateStart;
                dateEnd = validityBetweenDateEnd;

                if(isDateGreaterOrEqualToday(dateEnd) == false)
                {
                    if(isUserAdmin == 0)
                    {
                        // showGroup = "hide";
                        showGroup = false;
                    }
                    else
                    {
                        canSendMessage = 0;
                    }            
                }
            }

            if(isDateLessOrEqualToday(dateFrom) == false)
            {
                if(isUserAdmin == 0)
                {
                    // showGroup = "hide";
                    showGroup = false;
                }
                else
                {
                    canSendMessage = 0;
                }
            }
        }

        //checks user validity data
        let usrDateFrom = null;
        let usrDateEnd = null;
        
        if(hasUserValidity == 1)
        {
            if(hasUserValidityFromDate == 1)
            {
                usrDateFrom = userValidityFromDate;                
            }

            if(hasUserValidityBetween == 1)
            {
                usrDateFrom = userValidityBetweenDateStart;
                usrDateEnd = userValidityBetweenDateEnd;
                
                if(isDateGreaterOrEqualToday(usrDateEnd) == false)
                {
                    if(isUserAdmin == 0)
                    {
                        // showGroup = "hide";
                        showGroup = false;
                    }
                    else
                    {
                        canSendMessage = 0;
                    }            
                }
            }

            if(isDateLessOrEqualToday(usrDateFrom) == false)
            {
                if(isUserAdmin == 0)
                {
                    // showGroup = "hide";
                    showGroup = false;
                }
                else
                {
                    canSendMessage = 0;
                }
            }
        }

        //check access hour
        let accessHourStart = null;
        let accessHourEnd = null;

        if(hasGroupAccessHours == 1)
        {
            accessHourStart = groupAccessHoursStart;
            accessHourEnd = groupAccessHoursEnd;
        }

        let groupNoPhoto = `images/group.png`;

        let showGroupClass = showGroup == true ? '' : 'hidden-group';

        const htmlItemElement = `
            <li class="app-chat-group-list-item collection-item ${showGroupClass}" data-talktoid="${groupId}" data-searchname="${groupName}">
                <a href="#" class="app-chat-group-list-item-link" data-talktoid="${groupId}" data-sendMessage="${canSendMessage}" data-accessStart="${accessHourStart}" data-accessEnd="${accessHourEnd}">
                    <div class="app-chat-group-list-item-avatar">
                        <img onerror="this.src='${groupNoPhoto}'" src="${groupNoPhoto}" class="app-chat-group-list-item-avatar-image" data-photoloading="1" data-id="${groupId}" />
                    </div>
                    <div class="app-chat-group-list-item-info">
                        <div class="app-chat-group-list-item-name">
                            ${groupName}
                        </div>
                        <div class="app-chat-group-list-item-recent-text">
                        </div>
                    </div>
                    <div class="app-chat-group-list-item-time">
                    </div>
                </a>
            </li>
        `;


        if($(`.app-chat-group-list-item[data-talktoid="${groupId}"]`).length == 0)
        {
            $(`#chatContactListCollection`).append(htmlItemElement);
        }
        else
        {
            $(`.app-chat-group-list-item[data-talktoid="${groupId}"]`).attr(`data-searchname`, groupName);
            // $(`.app-chat-group-list-item[data-talktoid="${groupId}"]`).find(`.app-chat-group-list-item-avatar-image`).attr(`src`, groupNoPhoto);
            $(`.app-chat-group-list-item[data-talktoid="${groupId}"]`).find(`.app-chat-group-list-item-name`).text(groupName);
            // $(`.app-chat-group-list-item[data-talktoid="${groupId}"]`).find(`.app-chat-group-list-item-recent-text`).text("");
            // $(`.app-chat-group-list-item[data-talktoid="${groupId}"]`).find(`.app-chat-group-list-item-time`).text("");

            if(showGroup == false)
            {
                $(`.app-chat-group-list-item[data-talktoid="${groupId}"]`).addClass(`hidden-group`);
            }
            else
            {
                $(`.app-chat-group-list-item[data-talktoid="${groupId}"]`).removeClass(`hidden-group`);
            }

            $(`.app-chat-group-list-item-link[data-talktoid="${groupId}"]`).attr(`data-sendMessage`, canSendMessage);
            $(`.app-chat-group-list-item-link[data-talktoid="${groupId}"]`).attr(`data-accessStart`, accessHourStart);
            $(`.app-chat-group-list-item-link[data-talktoid="${groupId}"]`).attr(`data-accessEnd`, accessHourEnd);
        }

        // htmlItems += htmlItemElement;
    }

    groupListDrawLastData = JSON.parse(JSON.stringify(groupListDrawCurrentData));

    // $(`.app-chat-group-list-item`).remove();


    // Remove non-listed elements
    const listElements = $(`.app-chat-group-list-item`);
    for(let ix = 0; ix < listElements.length; ix++)
    {
        const elRead = $(listElements.get(ix));
        const elId = elRead.attr(`data-talktoid`);
        const itemInList = loadedGroups.find((item) => {
            return item.GroupId == elId
        });

        if(itemInList == null)
        {
            console.log(`Group Item Removed from the list: ${elId}`);
            elRead.remove();
        }
    }


    if(loadedGroups.length > 0)
    {
        // if(hasDrawCountUpdate == true || hasDrawItemsUpdate == true)
        // {
        //     $(`#chatContactListCollection`).append(htmlItems);
        // }

        mountGroupContactListEvents(false);
        refreshGroupListPhotos();

        // Wait 10 seconds to update cache while some features is loading
        setTimeout(function(){
            // console.log(`Cache linked contact update after group list draw`);
            updateLinkedContactListCache();
        }, 10000);
    }
}

async function refreshGroupListPhotos()
{

    const elements = $(`.app-chat-group-list-item-avatar-image[data-photoloading="1"]`);

    // Empty the current array
    groupListDrawCurrentPhoto = [];

    for(let ix = 0; ix < elements.length; ix++)
    {
        const el = $(elements.get(ix));
        const groupId = el.attr(`data-id`);
        const photo = await refreshHomeGroupListItemPhotoById(groupId);

        el.attr(`data-photoloading`, `0`);

        groupListDrawCurrentPhoto.push({
            "photo": groupId,
            "groupId": photo
        });
    }

    groupListDrawLastPhoto = JSON.parse(JSON.stringify(groupListDrawCurrentPhoto));
}

async function forceRefreshGroupListPhotos()
{

    const elements = $(`.app-chat-group-list-item-avatar-image`);

    let tmpListDrawPhoto = [];

    for(let ix = 0; ix < elements.length; ix++)
    {
        const el = $(elements.get(ix));
        const groupId = el.attr(`data-id`);
        const photo = await refreshHomeGroupListItemPhotoById(groupId);

        el.attr(`data-photoloading`, `0`);

        tmpListDrawPhoto.push({
            "photo": groupId,
            "groupId": photo
        });
    }

    groupListDrawCurrentPhoto = JSON.parse(JSON.stringify(tmpListDrawPhoto));
    groupListDrawLastPhoto = JSON.parse(JSON.stringify(tmpListDrawPhoto));
}

async function refreshHomeGroupListItemPhotoById(groupId)
{
    const photo = await getPhotoGroupURL(groupId);

    const el = $(`.app-chat-group-list-item-avatar-image[data-id="${groupId}"]`);

    const lastLoadedPhoto = groupListDrawLastPhoto.find((item) =>{
        return item.groupId == groupId;
    })

    let hasDrawPhotoUpdate = false;

    if(lastLoadedPhoto == null)
    {
        // New item photo
        hasDrawPhotoUpdate = true;
    }
    else
    {
        if(lastLoadedPhoto.photo != photo)
        {
            // Update item photo
            hasDrawPhotoUpdate = true;
        }
    }

    if(hasDrawPhotoUpdate == true)
    {
        el.attr(`src`, photo);
    }

    return photo;
}

function mountFilledLinkedContactListEvents(isPreload)
{
    $(`#chatContactListTitle`).removeClass(`hide`);
    $(`#homeContactSearchBox`).removeClass(`hide`);
    
    if(isPreload == false)
    {
        updateContactListCover();
    }

    $(`.app-chat-contact-list-item-link`).off(`click`);
    $(`.app-chat-contact-list-item-link`).on(`click`, function(){
        const contactId = $(this).attr(`data-talktoid`);
        openChatWithContact(contactId);
    });
}

function mountGroupContactListEvents(isPreload)
{
    if(isPreload == false)
    {
        updateOnlyGroupListCover();
    }

    $(`.app-chat-group-list-item-link`).off(`click`);
    $(`.app-chat-group-list-item-link`).on(`click`, function(){
        const contactId = $(this).attr(`data-talktoid`);
        userCanSendGroupMessage = $(this).attr(`data-sendMessage`) == '1' ? true : false;

        const accessHourStart = $(this).attr(`data-accessStart`);
        const accessHourEnd = $(this).attr(`data-accessEnd`);
        
        if(accessHourStart != 'null')
        {
            const groupAccessHourArr = {                
                "groupAccessHoursStart": accessHourStart,
                "groupAccessHoursEnd": accessHourEnd
            };

            const allowedAccess = checkGroupAccessHour(groupAccessHourArr);

            if(allowedAccess == false)
            {
                swal(getTranslate('group-chat-cannot-access-hour', 'Outside of permitted access hours')).then(function (){
                    closeChat();
                });
                
                return;
            }
        }

        openChatWithContact(contactId);        
    });
}


async function getLinkedContactListCache()
{
    let result = "";

    const sqlCache = `SELECT htmlCode FROM LinkedContactListCache`;
    const sqlCacheValues = null;
    const sqlCacheResponse = await dbRun(sqlCache, sqlCacheValues);

    if(sqlCacheResponse != null)
    {
        if(sqlCacheResponse.rows.length > 0)
        {
            const sqlCacheRecord = sqlCacheResponse.rows.item(0);
            result = sqlCacheRecord.htmlCode;
        }
    }

    //This javascript code removes all 3 types of line breaks
    // result = result.replace(/(\r\n|\n|\r)/gm,"");

    result = appReplaceSymbolWithNewlines(result);

    return result;
}

async function updateLinkedContactListCache()
{
    if(useLinkedContactListCache == false)
    {
        return;
    }

    if(updateLinkedContactListCacheIsSaving == true)
    {
        await waitForUpdateLinkedContactListCacheSaveToFinish();
    }

    updateLinkedContactListCacheIsSaving = true;

    // First thing is get new html code (some calls aren't using await, so just take the html code in a very first time)
    let elementClone = $(`#chatContactListCollection`).clone();

    let newHTML = elementClone.html();
    
    //This javascript code removes all 3 types of line breaks
    // newHTML = newHTML.replace(/(\r\n|\n|\r)/gm,"");
    newHTML = appReplaceNewlinesWithSymbol(newHTML);

    const sqlCache = `SELECT htmlCode FROM LinkedContactListCache`;
    const sqlCacheValues = null;
    const sqlCacheResponse = await dbRun(sqlCache, sqlCacheValues);

    let isInsert = false;

    if(sqlCacheResponse == null)
    {
        isInsert = true;
    }

    if(sqlCacheResponse.rows.length == 0)
    {
        isInsert = true;
    }

    let scriptCache = null;
    let scriptCacheValues = null;
    if(isInsert == true)
    {
        if(newHTML.trim().length > 0)
        {
            scriptCache = `INSERT INTO LinkedContactListCache (htmlCode) VALUES (?)`;
            scriptCacheValues = [newHTML];
        }
    }
    else
    {
        const currentRecord = sqlCacheResponse.rows.item(0);
        const currentCode = currentRecord.htmlCode;

        if(currentCode != newHTML)
        {
            if(newHTML.trim().length > 0)
            {
                scriptCache = `UPDATE LinkedContactListCache SET htmlCode = ?`;
                scriptCacheValues = [newHTML];
            }
            else
            {
                scriptCache = `DELETE FROM LinkedContactListCache WHERE 1 = ?`;
                scriptCacheValues = ["1"];
            }
        }
    }

    if(scriptCache != null && scriptCacheValues != null)
    {
        await dbRun(scriptCache, scriptCacheValues);
    }

    updateLinkedContactListCacheIsSaving = false;
}

function waitForUpdateLinkedContactListCacheSaveToFinish()
{
    return new Promise((resolve, reject) =>{
        if(useLinkedContactListCache == false)
        {
            resolve();
            return;            
        }

        if(updateLinkedContactListCacheIsSaving == false)
        {
            resolve();
            return;
        }

        const maxTry = 100;
        var attemptCount = 0;

        var itvWaitForLinkedCacheSave = setInterval(function(){
            if(updateLinkedContactListCacheIsSaving == false)
            {
                clearInterval(itvWaitForLinkedCacheSave);
                itvWaitForLinkedCacheSave = null;
                resolve();
            }

            attemptCount++;

            if(attemptCount >= maxTry)
            {
                clearInterval(itvWaitForLinkedCacheSave);
                itvWaitForLinkedCacheSave = null;
                resolve();
            }
        }, 200);
    })
}

function removeAccountRequest()
{
    const title = getTranslate(`account-delete-confirmation`, `Account Delete Confirmation`);
    const text = getTranslate(`account-delete-text`, `Are you sure you want to delete your account? You can't undo this action. This action will permanently delete all records under account.`);
    const cancelButtonText = getTranslate(`no-cancel-it`, `No, cancel it!`);
    const yesButtonText = getTranslate(`yes-i-am-sure`, `Yes, I am sure!`);

    swal({
        title: title,
        text: text,
        icon: "warning",
        buttons: [
            cancelButtonText,
            yesButtonText
        ],
        dangerMode: true,
    }).then(function(isConfirm) {
        if (isConfirm) 
        {
            // Delete confirmation
            accountRemove();
        } 
        else 
        {
            // Delete cancel
        }
    })
}

async function accountRemove()
{
    showLoadingAnimationInSwal();

    const accountRemoveResponse = await callS(true, `DELETE`, `/services/removeuser`, null);

    if(accountRemoveResponse == null)
    {
        setTimeout(function(){
            swal.close();

            swal(getTranslate("unable-to-remove-account", "Unable to remove account"));
        }, 50);

        return;
    }

    if(accountRemoveResponse.code == null)
    {
        setTimeout(function(){
            swal.close();

            swal(getTranslate("unable-to-remove-account", "Unable to remove account"));
        }, 50);

        return;
    }

    if(accountRemoveResponse.code != `OK`)
    {
        setTimeout(function(){
            swal.close();

            swal(`${accountRemoveResponse.code} - ${getTranslate("unable-to-remove-account", "Unable to remove account")}`);
        }, 50);

        return;
    }


    setTimeout(function(){
        swal.close();
        forceDisconnect();
    }, 50);
}

async function getPhotoGroupURL(groupId)
{
    const noCache = true;

    let groupPhoto = `images/group.png`;

    const serverConnectionState = await hasServerConnection();

    var localDownloadGroupPhotoFileInfo = await getLocalSavedGroupPhoto(groupId);
    var localDownloadedGroupPhotoFilePath = localDownloadGroupPhotoFileInfo.filePath;
    const localGroupPhotoFileName = localDownloadGroupPhotoFileInfo.fileName;

    if(serverConnectionState == true)
    {
        groupPhoto = `${endpoint}services/groupphotoraw/${groupId}`;

        if(noCache == true)
        {
            groupPhoto += `?nocacheid=${makeid(6)}`;
        }
        
        const hasGroupServerPhoto = await hasServerGroupPhoto(groupId);
        if(hasGroupServerPhoto == true)
        {
            await downloadFileFromServer(`${endpoint}services/groupphotoimagedownload/${groupId}`, imagesLocalFolderLocation, localGroupPhotoFileName, null);
        }


        // Get the local photo after download
        await waitTime(1000);
        localDownloadGroupPhotoFileInfo = await getLocalSavedGroupPhoto(groupId);
        localDownloadedGroupPhotoFilePath = localDownloadGroupPhotoFileInfo.filePath;
        if(localDownloadGroupPhotoFileInfo.found == true)
        {
            groupPhoto = await getDeviceFileBase64URL(localDownloadedGroupPhotoFilePath);
        }
    }
    else
    {
        // console.log(`👾 Offline Group Photo read: ${localDownloadGroupPhotoFileInfo}`);

        if(localDownloadGroupPhotoFileInfo.found == true)
        {
            groupPhoto = await getDeviceFileBase64URL(localDownloadedGroupPhotoFilePath);
        }
    }

    return groupPhoto;
}

async function saveGroupPhotoInDefaultDeviceLocal(groupPhoto, groupId)
{
    if(groupPhoto.length > 0)
    {
        const fileName = `group-${groupId}.png`;
        const localDownloadedFilePath = `${imagesLocalFolderLocation}${fileName}`;

        // console.log(`👾 Default group photo path: ${localDownloadedFilePath}`);

        if(groupPhoto.trim().toLowerCase() != localDownloadedFilePath.trim().toLowerCase())
        {
            // console.log(`👾 Copy from : ${groupPhoto} to directory ${imagesLocalFolderLocation} with name ${fileName}`);

            await copyFile(groupPhoto, fileName, imagesLocalFolderLocation);
            groupPhoto = localDownloadedFilePath;

            // console.log(`👾 Changed group photo path: ${groupPhoto}`);
        }
    }
}

async function getLocalSavedGroupPhoto(groupId)
{
    const fileName = `group-${groupId}.png`;
    const localDownloadedFilePath = `${imagesLocalFolderLocation}${fileName}`;
    const localFileDetails = await localFileURLPathResolve(localDownloadedFilePath);

    let result = {
        "fileName": fileName,
        "filePath": localDownloadedFilePath,
        "found": false
    }

    if(localFileDetails.status == true)
    {
        result.found = true;
    }

    return result;
}

async function refreshCompanyInfoFromServer()
{
    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        companyInfoIsLoading = false;
        return;
    }

    if(companyInfoIsLoading == true)
    {
        return;
    }

    companyInfoIsLoading = true;

    let currentCompany = readLocalStorage(`company`);
    let uid = readLocalStorage("uid");

    const companyListResponse = await callS(true, `GET`, `/services/companylist`, null);

    let companyList = [];
    if(companyListResponse != null)
    {
        companyList = companyListResponse.list;
    }

    if(companyList.length == 0)
    {
        const queryDeleteAllCompanies = `DELETE FROM Company`;
        await dbRun(queryDeleteAllCompanies, null);
        if(currentCompany != null)
        {
            clearCompanyId();
            currentCompany = null;
        }
    }
    else
    {
        for(let ix = 0; ix < companyList.length; ix++)
        {
            const company = companyList[ix];
            let isAdmin = 0;

            if(company.IsAdmin == 1 || company.AdminLogin == uid)
            {
                isAdmin = 1;
            }

            const queryLocalCompany = `SELECT * FROM Company WHERE companyId = ?`;
            const queryLocalCompanyValues = [company.CompanyId];
            const localDBCompanyResponse = await dbRun(queryLocalCompany, queryLocalCompanyValues);

            let localDBCompanyRecord = null;
            if(localDBCompanyResponse.rows.length > 0)
            {
                localDBCompanyRecord = localDBCompanyResponse.rows.item(0);
            }

            if(company.Removed.toString() == `1`)
            {
                if(localDBCompanyRecord != null)
                {
                    const queryDeleteCompany = `DELETE FROM Company WHERE companyId = ?`;
                    const queryDeleteCompanyValues = [company.CompanyId];
                    await dbRun(queryDeleteCompany, queryDeleteCompanyValues);

                    if(currentCompany == company.CompanyId)
                    {
                        clearCompanyId();
                        currentCompany = null;
                    }
    
                    continue;
                }
            }

            var localUpdate = false;

            // Set to update when name is changed
            if(localDBCompanyRecord != null)
            {
                if(localDBCompanyRecord.name != company.Name || localDBCompanyRecord.isAdmin != company.IsAdmin)
                {
                    localUpdate = true;
                //     if(company.LocalUpdated.toString() != `1`)
                //     {
                //         company.LocalUpdated = `1`;
                //     }
                }

            }

            // if(company.LocalUpdated.toString() == `1`)
            if(localUpdate == true)
            {
                if(localDBCompanyRecord != null)
                {
                    const queryUpdateCompany = `UPDATE Company SET name = ?, isAdmin = ? WHERE companyId = ?`;
                    const queryUpdateCompanyValues = [company.Name, isAdmin, company.CompanyId];
                    await dbRun(queryUpdateCompany, queryUpdateCompanyValues);

                    if(currentCompany == null)
                    {
                        currentCompany = company.CompanyId;
                        setCompanyId(currentCompany);
                    }

                    continue;
                }
            }

            if(localDBCompanyRecord == null)
            {
                const queryInsertCompany = `INSERT INTO Company (companyId, name, isAdmin) VALUES (?, ?, ?)`;
                const queryInsertCompanyValues = [company.CompanyId, company.Name, isAdmin];
                await dbRun(queryInsertCompany, queryInsertCompanyValues);
            }

            if(currentCompany == null)
            {
                currentCompany = company.CompanyId;
                setCompanyId(currentCompany);
            }
        }
    }

    companyInfoIsLoading = false;
}

function waitForCompanyInfoLoading()
{
    return new Promise((resolve, reject) =>{
        if(companyInfoIsLoading == false)
        {
            resolve();
            return;
        }

        var itvLoadingCompanyInfoCheck = setInterval(function(){
            if(companyInfoIsLoading == false)
            {
                clearInterval(itvLoadingCompanyInfoCheck);
                itvLoadingCompanyInfoCheck = null;
                resolve();
            }
        }, 1000);
    });
}


function initCheckBackupRestoreMessageService()
{
    if(svcCheckBackupRestoreMessage != null)
    {
        clearInterval(svcCheckBackupRestoreMessage);
        svcCheckBackupRestoreMessage = null;
    }

    svcCheckBackupRestoreMessage = setInterval(function(){
        let backupDatabaseRestoreWaitingForApproval = readLocalStorage(`backup-db-restore-waiting-for-approval`);

        if(backupDatabaseRestoreWaitingForApproval == null)
        {
            writeLocalStorage(`backup-db-restore-waiting-for-approval`, `0`);
            backupDatabaseRestoreWaitingForApproval = `0`;
        }

        if(backupDatabaseRestoreWaitingForApproval == `1`)
        {
            $(`#appBackupRestoredMessage`).removeClass(`hide`);
        }
        else
        {
            $(`#appBackupRestoredMessage`).addClass(`hide`);
        }
    }, 1000);
}

function checkGroupAccessHour(groupAccessHourArr)
{
    const accessHourStart = groupAccessHourArr.groupAccessHoursStart;
    const accessHourEnd = groupAccessHourArr.groupAccessHoursEnd;

    const dateNow = new Date();
    const hourNow = `${dateNow.getHours()}:${dateNow.getMinutes()}`;
    const hourNowInMinutes = timeToIntegerInMinutes(hourNow);
    const accessHourStarInt = parseInt(accessHourStart);
    const accessHourEndInt = parseInt(accessHourEnd);

    if(hourNowInMinutes < accessHourStarInt|| hourNowInMinutes >= accessHourEndInt)
    {
        return false;
    }
    
    return true;
}

function checkIsInDebugMode()
{
    const isChecked = $(`#chkDebugMode`).is(":checked");
    const isHide = $(`#txtDebugModeText`).hasClass(`hide`);

    if(appInDebugMode == true)
    {
        if(isChecked == false)
        {
            $(`#chkDebugMode`).prop("checked", true);
        }

        if(isHide == true)
        {
            $(`#txtDebugModeText`).removeClass(`hide`);
            $(`#btnDebugModeCopy`).removeClass(`hide`);
        }
    }
    else
    {
        if(isChecked == true)
        {
            $(`#chkDebugMode`).prop("checked", false);
        }

        if(isHide == false)
        {
            $(`#txtDebugModeText`).addClass(`hide`);
            $(`#btnDebugModeCopy`).addClass(`hide`);
        }
    }
}

function overrideConsole() {
    var cl, ce, cw;

    if (window.console && console.log) {
        cl = console.log;
        console.log = function () {
            MyLogFunction(Array.from(arguments));
            cl.apply(this, arguments);
        }
    }

    if (window.console && console.warn) {
        cw = console.warn;
        console.warn = function () {
            MyWarnFunction(Array.from(arguments));
            cw.apply(this, arguments);
        }
    }

    if (window.console && console.error) {
        ce = console.error;
        console.error = function () {
            MyErrorFunction(Array.from(arguments));
            ce.apply(this, arguments);
        }
    }
}

function MyLogFunction(args) {
    if (appInDebugMode == false) {
        return;
    }

    var txtArea = document.getElementById("txtDebugModeText");
    if (txtArea) {
        txtArea.value += args.join(' ') + '\r\n';
    }
}

function MyWarnFunction(args) {
    if (appInDebugMode == false) {
        return;
    }

    var txtArea = document.getElementById("txtDebugModeText");
    if (txtArea) {
        txtArea.value += '⚠️ ' + args.join(' ') + '\r\n';
    }
}

function MyErrorFunction(args) {
    if (appInDebugMode == false) {
        return;
    }

    var txtArea = document.getElementById("txtDebugModeText");
    if (txtArea) {
        txtArea.value += '⛔️ ' + args.join(' ') + '\r\n';
    }
}

function showSwitchConnectionModal()
{
    const modalId = `switchConnectionScreenModal`;
    const modalSelector = `#${modalId}`;

    if($(modalSelector).length > 0)
    {
        $(modalSelector).modal('close');
        $(modalSelector).modal('destroy');
        $(modalSelector).remove();
    }

    let selectedConnection = getSelectedAppServerConnection();
    const defaultConnectionTokenRecord = getLoginTokenAppServerConnectionByConnectionId("0");

    const html = `
        <div id="${modalId}" class="modal bottom-sheet">
            <div class="modal-content">
                <a id="btnCloseSwitchConnectionScreenModal" href="#!" class="close-buton-float-right default-modal-close-button waves-effect waves-green btn-flat">
                    <i class="fa-solid fa-xmark left"></i>
                </a>

                <div class="row">
                    <div class="col s12">
                        <span data-lang="switch-connection">Switch Connection</span>
                    </div>
                </div>
                <div id="switchConnectionScreenList" class="collection">
                    <a href="#" class="collection-item switch-connection-screen-list-item ${selectedConnection.id == 0 ? "active" : ""}" data-id="0" data-selected="${selectedConnection.id == 0 ? "1" : "0"}">
                        ${selectedConnection.id == 0 ? '<i class="material-icons">check</i>' : ''}
                        ${defaultConnectionTokenRecord != null ? '<i class="material-icons">key</i>' : ''}
                        <span>${getTranslate(`default-connection`, `Default Connection`)}</span>
                    </a>
                </div>
            </div>
        </div>
    `;

    $(`body`).append(html);

    let nonDefaultConnectionList = getNonDefaultServerConnectionList();
    if(nonDefaultConnectionList == null)
    {
        nonDefaultConnectionList = [];
    }

    for(let ix = 0; ix < nonDefaultConnectionList.length; ix++)
    {
        let record = nonDefaultConnectionList[ix];
        const connectionTokenRecord = getLoginTokenAppServerConnectionByConnectionId(record.id);

        $(`#switchConnectionScreenList`).append(`
            <a href="#" class="collection-item switch-connection-screen-list-item ${selectedConnection.id == record.id ? "active" : ""}" data-id="${record.id}" data-selected="${selectedConnection.id == record.id ? "1" : "0"}">
                ${selectedConnection.id == record.id ? '<i class="material-icons">check</i>' : ''}
                ${connectionTokenRecord != null ? '<i class="material-icons">key</i>' : ''}
                <span>${record.label}</span>
            </a>
        `);
    }


    $(modalSelector).modal({
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

    $(`#btnCloseSwitchConnectionScreenModal`).off(`click`);
    $(`#btnCloseSwitchConnectionScreenModal`).on(`click`, function(){
        $(modalSelector).modal('close');    
    });

    $(`.switch-connection-screen-list-item`).off(`click`);
    $(`.switch-connection-screen-list-item`).on(`click`, async function(){
        const connectionId = $(this).attr(`data-id`);

        const newSelection = appServerConnectionList.find((item) =>{
            return item.id == connectionId;
        });
    
        if(newSelection == null)
        {
            return;
        }

        let selectedConnection = getSelectedAppServerConnection();

        if(selectedConnection.id == newSelection.id)
        {
            return;
        }
    
        await requestDoConnectionSwitch(newSelection.id, null);
    });

    $(modalSelector).modal('open');
}

async function backupDataBeforeConnectionSwitch()
{
    swal(getTranslate(`database-backup`, `Database Backup...`), {
        button: false, closeOnClickOutside: false
    });

    // Check if local database backup is needed before connection switch
    await forceDBBackupIfDatabaseHasChanged();

    swal.close();
}

async function restoreDataDuringConnectionSwitch()
{
    swal(getTranslate(`database-restore`, `Database Restore...`), {
        button: false, closeOnClickOutside: false
    });

    await appDBInit();
    await checkDBBackupRestore();

    swal.close();
}

async function reinitIndexDuringConnectionSwitch()
{
    setClientUniqueId();
    fixEndpoint();

    // Translation and General Info Processing Start
    preparePreviousLoadedTranslationInfo();
    checkConnectionAndGetServerData();

    initImagesLocalFolder();
}

async function requestDoConnectionSwitch(connectionId, openChatWithContactAfterConnection)
{
    await backupDataBeforeConnectionSwitch();

    showLoadingAnimationInSwal();

    const loginTokenRecord = getLoginTokenAppServerConnectionByConnectionId(connectionId);

    let loginToken = null;
    if(loginTokenRecord != null)
    {
        loginToken = loginTokenRecord.token;
    }

    setSelectedAppServerConnection(connectionId);

    const uid = readLocalStorage("uid");

    if(loginToken == null)
    {
        // Login request in the new connection
        writeLocalStorage(`lastselectedcountry`, countryCode);

        let phoneWithoutCountryCode = uid;
        let phoneCode = phoneCodes.find((item) =>{ return item.code == countryCode });
        let phoneDialCode;

        if(phoneCode == null)
        {
            phoneDialCode = strToOnlyNum(getCountryCodeFromPhone(uid));
            return;
        }
        else
        {
            phoneDialCode = strToOnlyNum(phoneCode.dial_code);
        }

        if(phoneWithoutCountryCode.startsWith(phoneDialCode) == true)
        {
            phoneWithoutCountryCode = phoneWithoutCountryCode.substring(phoneDialCode.length);
            phoneWithoutCountryCode.trim();
        }
        else
        {
            swal.close();
            showToastWithStyle(`Err`, 1000, null);
            return;
        }

        writeLocalStorage(`presignupphone`, phoneWithoutCountryCode);

        if(openChatWithContactAfterConnection != null)
        {
            writeLocalStorage(`chatcontactafterconnection`, openChatWithContactAfterConnection);
        }
        else
        {
            removeLocalStorage(`chatcontactafterconnection`);
        }

        swal.close();
        await forceDisconnect();
        return;
    }

    // Clear current login data and remove local database
    await prepareDisconnection();

    // Change login to the token
    doAppLogin(loginToken, uid);

    // Database restore
    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        await restoreDataDuringConnectionSwitch();

        showLoadingAnimationInSwal();
    }

    // Some init index calls must be loaded again
    reinitIndexDuringConnectionSwitch();


    if(openChatWithContactAfterConnection != null)
    {
        writeLocalStorage(`chatcontactafterconnection`, openChatWithContactAfterConnection);
    }
    else
    {
        removeLocalStorage(`chatcontactafterconnection`);
    }

    swal.close();
    redirect(`index.html`);
}
