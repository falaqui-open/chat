var deviceIsReady = false;
var lastReadDeviceObject = null;
var lastReadNavigatorObject = null;
var appServerConnectionList = [];
var database = null;
var lastLoadContacts = null;
// var lastLoadSIM = null;
var lastLocationInfo = null;
var baseTexts = null;
var allTexts = [];
var appVersionCheckMessageRequest = false;
var clientUniqueId = null;
var qrCodeInstanceItem = null;
var qrCodeInstanceValue = null;
var qrCodeInstanceTitle = null;
var loginIsExpiredByServer = false;

const NOT_READY_COUNTRY_CODE = `XX`;
var countryCode = NOT_READY_COUNTRY_CODE;
// var forcedCountryCode = `BR`;
var forcedCountryCode = null;
var pushMessagingAllowed = false;
var pushMessagingFCMToken = null;
var localSavedDeviceContactList = [];
var deviceContactList = [];
var contactStatusList = [];
var serverResponseStatusList = [];
var linkedContactList = [];
var loggedInUserDataInfo = null;
var loadedAppInfo = null;

var modalStack = [];

var internetSpeedUnderCheck = false;
var intenetSpeedCheckStartTime = null;
var lastInternetSpeed = null;
var tooSlowConnection = false;
var almostSlowConnection = false;
const SET_OFFLINE_WHEN_CONNECTION_IS_TOO_SLOW = true;

var webSocket = null;
const SOCKET_CONNECTING = 0;
const SOCKET_OPEN = 1;
const SOCKET_CLOSING = 2;
const SOCKET_CLOSED = 3;
const SOCKET_RECONECT_TRY_TIME = [  100, 500, 1000, 
                                    1500, 2000, 3000, 
                                    4000, 5000, 6000
                                ];

const CLOSE_SOCKET_ON_SLOW_CONNECTION = true;
var socketReconnectTimeIndex = -1;
var socketTryingToReconnect = false;
var processingOutgoingMessage = false;
var processingOutgoingGroupStatus = false;
var processingOutgoingGroupUpdateStatus = false;
var processingOutgoingContactServedByCompany = false;
var processingMessageToInformServerWasReceivedService = false;
var processingMessageGroupToInformServerWasReceivedService = false;
var itvSocketKeepConnectedService = null;
var itvConnectionStatusService = null;
var itvContactListStatusService = null;
var itvServiceEncPS = null;
var encPSUnderReq = false;
var itvOutgoingMessageService = null;
var itvOutgoingGroupStatusService = null;
var itvOutgoingGroupUpdateStatusService = null;
var itvOutgoingContactServedByCompanyService = null;
var itvMessageToInformServerWasReceivedService = null;
var itvMessageGroupToInformServerWasReceivedService = null;
var itvCompanyMemberSyncService = null;
var itvCompanyMemberDataFromDBSyncService = null;

var outgoingMessageServiceLastError = "";

const SLIDE_FADE_OUT_DURATION = 300;
const SLIDE_FADE_IN_DURATION = 300;
const SLIDE_TRANSACTION_TIME_TO_FOCUS = 500;

var imagesLocalFolderLocation = "";
var imageLocalFolderDetails = null;

var audioLocalFolderLocation = "";
var audioLocalFolderDetails = null;

const evtDeviceConnectionChanged = new EventTarget();
var evtBackButton = null; // Starts null

var messagesWithUploadError = [];

var loginExpireTimestamp = null;
var loginExpireDate = null;

var browserFs = null;
var browserFsPath = null;
var browserFsInitError = false;

var arrPendingMessageToWriteIntoGroup = [];

const ENABLE_COMPANY_MEMBER_SYNC_SERVICE = true;


function onDeviceLoad() 
{
    document.addEventListener("deviceready", onDeviceReady, false);
}

// Top scope functions call
applyCSSTheme();
preTranslate();

mountPrototypes();

if(useInternalSplashScreen == "1")
{
    if(typeof splashHideWhenReady != `undefined`)
    {
        splashHideWhenReady();
    }        
}

// device APIs are available
function onDeviceReady() 
{
    if(typeof thisIsIndex != `undefined`)
    {
        if(thisIsIndex == true)
        {
            const loggedIn = isLoggedIn();
            if(loggedIn == false)
            {
                redirect(`signup.html`);
                return;
            }
        }
    }

    // Basic events
    document.addEventListener("pause", onDevicePause, false);
    document.addEventListener("resume", onDeviceResume, false);
    document.addEventListener("menubutton", onDeviceMenuKeyDown, false);
    document.addEventListener("backbutton", onBackKeyDown, false);
    document.addEventListener("searchbutton", onSearchKeyDown, false);
 
    // Network events
    document.addEventListener("offline", onDeviceOffline, false);
    document.addEventListener("online", onDeviceOnline, false);   

    // Init Locale info before inform ready to system
    initLocationInfo();

    // Check and Set Login Token Into App Server Connection
    mountLoginTokenForCurrentAppServerConnectionIfNotExists();

    $(`#screenSplashLogo`).fadeIn();

    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        fixBrowserDisplayMargin();
    }

    if(typeof device != `undefined`)
    {
        lastReadDeviceObject = device;
    }

    if(typeof navigator != `undefined`)
    {
        lastReadNavigatorObject = navigator;
    }

    if(typeof window.internal.alliances != `undefined`)
    {
        console.log(`🔋 Activated Alliances`);

        (async() =>{
            const alliancesVersion = await window.internal.alliances.getVersion();
            console.log(`⚡️ Alliances Version: ${JSON.stringify(alliancesVersion)}`);
        }) ();
    }
    else
    {
        console.log(`🪫 No Alliances`);
    }

    setClientUniqueId();
    fixEndpoint();

    // Translation and General Info Processing Start
    preparePreviousLoadedTranslationInfo();
    checkConnectionAndGetServerData();

    // Fix Libs, Functions, etc.
    fixJQueryFocus();

    // Fix iOS Keyboard ShrinkView
    if(cordova.platformId == 'ios')
    {
        if(typeof Keyboard != `undefined`)
        {
            Keyboard.shrinkView(true);
        }
    }

    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        initBrowserFileSystem();
    }

    initImagesLocalFolder();

    appDBInit();

    // initSIMDetails();

    deviceIsReady = true;

    // initNativeScreen();

    mountGeneralEvents();
    // mountPushNotificationEvents();

    onDeviceBackbuttonPressEvent(async function(){
        const appMenuOpened = appMenuIsOpened();
        if(appMenuOpened == true)
        {
            $(`#appMenuList`).sidenav('close');
            return;
        }        

        const currentModalId = getCurrentIdModalFromStack();

        if(currentModalId != null)
        {
            $(`#${currentModalId}`).modal(`close`);
            return;
        }
        
        if(chatStateOpened == true)
        {
            closeChat();
            return;
        }

        if(samsungGalaxyStoreBuild == "1")
        {
            navigator.app.exitApp();
        }

    });
}

function onDevicePause() 
{
    // Handle the pause event
    // console.log(`App pause event`);

    if(samsungGalaxyStoreBuild == "1")
    {
        if(typeof audioPlayerStopAll != `undefined`)
        {
            audioPlayerStopAll();
        }        
    }
}

function onDeviceResume() 
{
    // Handle the resume event
    // console.log(`App resume event`);

    // When called from a resume event handler, interactive functions such as alert() need to be wrapped in a setTimeout() call with a timeout value of zero, or else the app hangs.
    setTimeout(function() {
        clearNotifications();
    }, 0);
}

function onDeviceMenuKeyDown() 
{
    // Handle the menubutton event
}

function onBackKeyDown()
{
    // Handle the back button
    if(evtBackButton == null)
    {
        return;
    }

    evtBackButton.dispatchEvent(
        new Event("onbackbutton")
    );
}

function onSearchKeyDown()
{
    // Handle the search button
}

function onDeviceBackbuttonPressEvent(functionToCall)
{
    if(evtBackButton != null)
    {
        // Destroy previous event
        destroyDeviceBackButtonPressEvent();
    }

    evtBackButton = new EventTarget();
    evtBackButton.addEventListener('onbackbutton', functionToCall);
}

function destroyDeviceBackButtonPressEvent()
{
    evtBackButton = null;
}

function onDeviceOffline() 
{
    // Handle the offline event
    evtDeviceConnectionChanged.dispatchEvent(new Event('offline'));
}

function onDeviceOnline() 
{
    // Handle the online event
    evtDeviceConnectionChanged.dispatchEvent(new Event('online'));
}

function appDBInit()
{
    return new Promise((resolve, reject) =>{
        // Init App Database before inform ready to system
        initDatabase();
        initDatabaseBackupService();

        // Load local saved contact list when DB is ready
        let itvWaitDB = setInterval(async function(){
            if(database != null)
            {
                clearInterval(itvWaitDB);

                // For browser or electron the restore runs on every startup
                if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
                {
                    // Give a time before verfication
                    await waitTime(200);

                    await waitDatabasePreviousBackupCheck();
                    await waitRestoreDatabaseFinish();
                }

                loadLocalLoadedContactList();

                // Pre-mount contact list
                if(deviceContactList.length > 0)
                {
                    mountContactList();
                }

                resolve();
            }
        }, 20);
    });

}

async function checkConnectionAndGetServerData()
{
    let connectionOk = await operationalScreenCheckConnection();
    if(connectionOk == true)
    {
        var success = await downloadTexts();

        if(success == false)
        {
            await useBaseTexts();
        }
    }
    else
    {
        await useBaseTexts();
    }

    translate();
}

async function initImagesLocalFolder()
{
    if(cordova.platformId == 'android')
    {
        imagesLocalFolderLocation = await getStorageDirectory();
        audioLocalFolderLocation = await getStorageDirectory();
        // imagesLocalFolderLocation = cordova.file.dataDirectory;
        // imagesLocalFolderLocation = `${cordova.file.dataDirectory}images/`;
        // imagesLocalFolderLocation = `${cordova.file.applicationStorageDirectory}images/`; // file:///data/user/0/com.br.falaqui/images/
        // imagesLocalFolderLocation = `${cordova.file.externalDataDirectory}images/`; // file:///storage/emulated/0/Android/data/com.br.falaqui/files/images/
        
    }
    else if(cordova.platformId == 'ios')
    {
        imagesLocalFolderLocation = await getStorageDirectory();
        audioLocalFolderLocation = await getStorageDirectory();
        // imagesLocalFolderLocation = cordova.file.dataDirectory;
        // imagesLocalFolderLocation = `${cordova.file.dataDirectory}images/`;
        // imagesLocalFolderLocation = `${cordova.file.applicationStorageDirectory}Library/images/`;
        // imagesLocalFolderLocation = `${cordova.file.syncedDataDirectory}images/`;
    }
    else if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        await waitForBrowserFileSystemInit();
        imagesLocalFolderLocation = browserFs.root.fullPath;
        audioLocalFolderLocation = browserFs.root.fullPath;
    }
   
    // Check when it isn't a browser env
    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        imageLocalFolderDetails = await localFileURLPathResolve(imagesLocalFolderLocation);
        if(imageLocalFolderDetails.status == true)
        {
            // console.log(`Local Images Folder Exists`);
        }
        else
        {
            // console.log(`Local Images Folder Not Yet Exists`);
        }

        audioLocalFolderDetails = await localFileURLPathResolve(audioLocalFolderLocation);
        if(audioLocalFolderDetails.status == true)
        {
            // console.log(`Local Audio Folder Exists`);
        }
        else
        {
            // console.log(`Local Audio Folder Not Yet Exists`);
        }
    }
}

function fixJQueryFocus()
{
    var origFocus = $.fn.focus;
    $.fn.focus = function(){
        if(arguments.length === 0 && !this.is(':visible'))
        {
            return this;
        }
        else
        {
            return origFocus.apply(this, arguments);
       }
    };
}

function mountGeneralEvents()
{
    $(`.search-clear-button`).off(`click`);
    $(`.search-clear-button`).on(`click`, function(){
        const searchInputSelector = $(this).attr(`data-input`);
        $(`${searchInputSelector}`).val("");
        $(`${searchInputSelector}`).trigger('input');
    });

    $(`.search-clear-button`).each(function( index ) {
        const searchClearButton = $(this);
        const searchInputSelector = searchClearButton.attr(`data-input`);

        $(`${searchInputSelector}`).off(`input`);
        $(`${searchInputSelector}`).on(`input`, function(){
            const searchInputText = $(this);

            const nearestClearButton = searchInputText.siblings(`.search-clear-button`);
            if( searchInputText.val().length > 0 )
            {
                nearestClearButton.css(`display`, `inline-block`);
            }
            else
            {
                nearestClearButton.css(`display`, `none`);
            }

            searchInputText[0].dispatchEvent(
                new CustomEvent("onsearch", {
                  bubbles: true,
                  detail: { text: searchInputText.val() }
                })
            );
        });
    });
}

async function prepareDisconnection()
{
    await clearDataForLogOut();
    await removeDatabase();
}

async function forceDisconnect()
{
    disconnectLoginTokenToAppServerConnection();
    await prepareDisconnection();

    redirect("index.html");
}

function clearDataForLogOut()
{
    const uid = readLocalStorage("uid");
    removeLocalStorage(`vlphone-${uid}`);

    removeLocalStorage("loginexp");

    removeLocalStorage("uid");
    removeLocalStorage("login");
    clearCompanyId();
}

function doAppLogin(loginToken, uid)
{
    // User login
    writeLocalStorage("login", loginToken);
    writeLocalStorage("uid", uid);

    saveLoginTokenToAppServerConnection(loginToken);
}

function getLoginTokenAppServerConnectionList()
{
    let loginTokenAppServer = readLocalStorage(`logintkyappsrv`);
    if(loginTokenAppServer == null)
    {
        loginTokenAppServer = [];
    }
    else
    {
        loginTokenAppServer = JSON.parse(loginTokenAppServer);
    }

    return loginTokenAppServer;
}

function getLoginTokenAppServerConnectionByConnectionId(connecitonId)
{
    const loginTokenAppServer = getLoginTokenAppServerConnectionList();
    const record = loginTokenAppServer.find((item) => {
        return item.id == connecitonId;
    });

    if(record == null)
    {
        return null;
    }

    if(record.token == null)
    {
        return null;
    }

    return record;
}

function saveLoginTokenToAppServerConnection(loginToken)
{
    const loginTokenAppServer = getLoginTokenAppServerConnectionList();
    let selectedConnection = getSelectedAppServerConnection();

    const loginTokenAppServerIx = loginTokenAppServer.findIndex((item) =>{
        return item.id == selectedConnection.id;
    });

    if(loginTokenAppServerIx == -1)
    {
        loginTokenAppServer.push({
            "id": selectedConnection.id,
            "token": loginToken
        });
    }
    else
    {
        loginTokenAppServer[loginTokenAppServerIx].token = loginToken;
    }

    const strLoginTokenAppServer = JSON.stringify(loginTokenAppServer);
    writeLocalStorage(`logintkyappsrv`, strLoginTokenAppServer);
}

function disconnectLoginTokenToAppServerConnection()
{
    const loginTokenAppServer = getLoginTokenAppServerConnectionList();
    let selectedConnection = getSelectedAppServerConnection();

    const loginTokenAppServerIx = loginTokenAppServer.findIndex((item) =>{
        return item.id == selectedConnection.id;
    });

    if(loginTokenAppServerIx == -1)
    {
        loginTokenAppServer.push({
            "id": selectedConnection.id,
            "token": null
        });
    }
    else
    {
        loginTokenAppServer[loginTokenAppServerIx].token = null;
    }

    const strLoginTokenAppServer = JSON.stringify(loginTokenAppServer);
    writeLocalStorage(`logintkyappsrv`, strLoginTokenAppServer);
}

function mountLoginTokenForCurrentAppServerConnectionIfNotExists()
{
    let selectedConnection = getSelectedAppServerConnection();
    const connectionId = selectedConnection.id;
    const loginTokenRecord = getLoginTokenAppServerConnectionByConnectionId(connectionId);

    if(loginTokenRecord == null)
    {
        const loginToken = readLocalStorage(`login`);
        saveLoginTokenToAppServerConnection(loginToken);
    }
}

function initWebsocket()
{
    let token = readLocalStorage("login");

    if(token == null)
    {
        token = "";
    }

    const protocol1 = "access_token";
    const protocol2 = encodeURIComponent(token);

    try
    {
        webSocket = new WebSocket(socketEndpoint, [protocol1, protocol2]);
    }
    catch(connectionException)
    {
        webSocket = null;
    }

    if(webSocket == null)
    {
        return;
    }


    webSocket.onopen = (event) => {
        // this function runs if there's input from the keyboard.
        // you need to hit enter to generate this event.
        console.log(`🔺 Socket Opened`);
        // sendSocketText('Hello from client');
        afterSocketOpened();
    };
    
    webSocket.onerror = (event) => {
        console.log(`🔴 Socket Error: Event: ${event}; Endpoint: ${socketEndpoint}; Protocol1: ${protocol1}; Protocol2: ${protocol2}`);
    };
    
    webSocket.onclose = (event) => {
        console.log(`🔻 Socket Close ${event.code}: ${event.reason}`);
    };
    
    webSocket.onmessage = (event) => {
        const data = event.data;
    
        if(data == "__ping__")
        {
            webSocket.send("__pong__");
            return;
        }
    
        // console.log('Server said: ' + data);	// print the message
    
    
        let messageData = getStrAsJson(data);
    
        if(messageData == null)
        {
            return;
        }
    
        if(messageData.messageType == null)
        {
            return;
        }
    
        if(messageData.messageType == `CONTACT_LIST_STATUS_RESPONSE`)
        {
            const statusList = messageData.status;
            // console.log(`Status List`);
            // console.log(statusList);
            serverResponseStatusList = statusList;
            updateViewLayoutContactStatus();
        }
        else if(messageData.messageType == `CHAT_MESSAGE_SEND_TO_DATALAKE_RESPONSE`)
        {
            console.log(`Message datalake store: ${messageData.messageId} - Response: ${messageData.response}`);
        }
        else if(messageData.messageType == `CHAT_MESSAGE_SEND_RESPONSE`)
        {
            const received = messageData.received;
            const messageId = messageData.messageId;

            if(received == true)
            {
                updateChatMessageToReceived(messageId);
            }
        }
        else if(messageData.messageType == `COMPANY_MEMBER_SYNC_RESPONSE`)
        {
            const record = messageData.response;

            if(record == `error`)
            {
                return;
            }

            const companyId = record.CompanyId;
            const companyLogin = record.Login;
            const pendingToRemove = record.PendingToRemove;
            const updatedDate   = messageData.modificationDate;

            let sqlScript = null;
            let sqlScriptValues = null;

            if(pendingToRemove == 0)
            {
                sqlScript = `UPDATE CompanyMembers SET IsServerUpdated = 1, ServerUpdatedDate = ? WHERE CompanyId = ? AND Login = ?`;
                sqlScriptValues = [updatedDate, companyId, companyLogin];
            }
            else
            {
                sqlScript = `DELETE FROM CompanyMembers WHERE CompanyId = ? AND Login = ?`;
                sqlScriptValues = [companyId, companyLogin];
            }

            dbRun(sqlScript,sqlScriptValues);            
        }
        else if(messageData.messageType == `CHAT_RECEIVE_NEW_MESSAGE`)
        {
            const chatMessage = messageData.chatMessage;

            receiveNewChatMessage(chatMessage);
        }
        else if(messageData.messageType == `CHAT_MESSAGE_SEND_DELIVERED`)
        {
            const messageId = messageData.MessageId;
            const fromId = messageData.FromId;
            const toId = messageData.ToId;

            markChatMessageToRead(messageId);
        }
        else if(messageData.messageType == `zyfUuN_RESPONSE`)
        {
            const v = messageData.encVPS;
            writeoWGxd(v);
            encPSUnderReq = false;
        }
        else if(messageData.messageType == `CHAT_LINKED_CONTACT_LIST_UPDATE`)
        {
            const linkedContactListResponse = messageData.list;
            linkedContactList = linkedContactListResponse;
            refreshLinkedContactList();
            // overwriteLocalLinkedContactList();
        }
        else if(messageData.messageType == `GROUP_UPDATE`)
        {
            const groupUpdateList = messageData.groupIdList;

            requestGroupUpdateFromGroupList(groupUpdateList);
        }
        else if(messageData.messageType == `GROUP_REFRESH_LIST`)
        {
            const groupUpdateList = messageData.groupIdList;

            groupRefreshListInDevice(groupUpdateList);
        }
        else if(messageData.messageType == `CONTACT_SERVED_BY_COMPANY_SAVED`)
        {
            const savedContact = messageData.contact;
            const savedCompany = messageData.company;

            setSavedContactServedByCompany(savedContact, savedCompany);
        }
        else if(messageData.messageType == `GROUP_MEMBER_DELETED_UPDATE`)
        {
            const groupId = messageData.groupId;
            const loginDeleted = messageData.loginDeleted;
            requestGroupMemberDelete(groupId, loginDeleted)
        }
        else if(messageData.messageType == `GROUP_MEMBER_DELETED_UPDATE_ON_CONNECT`)
        {
            const groupList = messageData.groupList;
            //const updatedGroupIds = [];

            requestGroupMemberDeleteOnConnect(groupList);
            /*
            for(let ix = 0; ix < groupList.length; ix++){
                const groupId = groupList[ix];
                requestGroupMemberDeleteOnConnect(groupId);
                updatedGroupIds.push(groupId);
            }*/
        }
        else if(messageData.messageType == `GROUP_DELETED_ASMEMBER_UPDATE`)
        {
            //const groupId = messageData.groupId;
            const groupList = messageData.groupList;

            // if(groupId)
            // {
            //     requestGroupDeletedAsMember(groupId);
            // }
            
            if(groupList) 
            {
                requestGroupDeletedAsMember(groupList);
            }
        }
        else if(messageData.messageType == `GROUP_EXITED_MEMBER_UPDATE`)
        {
            const groupId = messageData.groupId;
            const exitedMemberId = messageData.exitedMemberId;

            if(groupId && exitedMemberId) 
            {
                requestGroupExitedMemberDelete(groupId, exitedMemberId);
            }
        }
        else if(messageData.messageType == `GROUP_EXITED_MEMBER_UPDATE_ON_CONNECT`)
        {
            const groupIdList = messageData.groupIdList;

            if(groupIdList) 
            {
                requestGroupExitedMemberOnConnect(groupIdList)
            }
        }
        else if(messageData.messageType == `GROUP_DELETED_UPDATE`){
            const groupId = messageData.groupId;

            if(groupId) 
            {
                requestGroupDelete(groupId)
            }
        }
        else if(messageData.messageType == `GROUP_DELETED_UPDATE_ON_CONNECT`){
            const groupList = messageData.groupIdList;

            if(groupList) 
            {
                requestGroupDeletedOnConnect(groupList)
            }
        }
        else if(messageData.messageType == `MESSAGES_GET_CONTENT_RESPONSE`)
        {
            const messageContentResult = messageData.result;

            if(messageContentResult != null)
            {
                updateMessageContentInLocalDB(messageContentResult);
            }
        }
    };
}

async function afterSocketOpened()
{
    // Update Firebase and Push Notification events after socket connect/re-connect
    serverConnectionState = await hasServerConnection();
    if(serverConnectionState == true)
    {
        registerUserDevice();
    }

    mountPushNotificationEvents();
}

function startConnectionStatusService()
{
    if(itvConnectionStatusService != null)
    {
        clearInterval(itvConnectionStatusService);
        itvConnectionStatusService = null;
    }

    checkConnectionStatus();

    itvConnectionStatusService = setInterval(function(){
        checkConnectionStatus();
    }, 9000);
}

function startSocketKeepConnectedService()
{
    if(itvSocketKeepConnectedService != null)
    {
        clearInterval(itvSocketKeepConnectedService);
        itvSocketKeepConnectedService = null;
    }

    itvSocketKeepConnectedService = setInterval(function(){
        if(socketTryingToReconnect == true)
        {
            return;
        }

        socketTryingToReconnect = true;


        let mustRetryToConnect = false;

        if(webSocket == null)
        {
            mustRetryToConnect = true;
        }
        else
        {
            const connectionState = webSocket.readyState;

            if(tooSlowConnection == true)
            {
                if(CLOSE_SOCKET_ON_SLOW_CONNECTION == true)
                {
                    if(connectionState == SOCKET_OPEN)
                    {
                        console.log(`${new Date().toISOString()} 🟡 Closing socket on too slow connection!`);
                        webSocket.close();
                    }
                }
            }

            if(connectionState == SOCKET_CLOSED)
            {
                mustRetryToConnect = true;
            }
        }
        
        if(mustRetryToConnect == false)
        {
            socketReconnectTimeIndex = -1;
            socketTryingToReconnect = false;
            // checkConnectionStatus();
            return;
        }

        if(socketReconnectTimeIndex < SOCKET_RECONECT_TRY_TIME.length -1)
        {
            socketReconnectTimeIndex++;
        }

        const timeToTry = SOCKET_RECONECT_TRY_TIME[socketReconnectTimeIndex];

        // checkConnectionStatus();
        setTimeout(function(){
            if(tooSlowConnection == true)
            {
                if(CLOSE_SOCKET_ON_SLOW_CONNECTION == true)
                {
                    console.log(`${new Date().toISOString()} 🔴 Connection is too slow to reconect socket!`);
                    socketTryingToReconnect = false;
                    return;
                }
            }

            console.log(`${new Date().toISOString()} Trying to connect socket server...`);
            // checkConnectionStatus();
            initWebsocket();
            socketTryingToReconnect = false;
        }, timeToTry);


    }, 1000);
}

function startContactListStatusService()
{
    if(itvContactListStatusService != null)
    {
        clearInterval(itvContactListStatusService);
        itvContactListStatusService = null;
    }

    itvContactListStatusService = setInterval(function(){
        if(webSocket == null)
        {
            serverResponseStatusList = [];
            updateViewLayoutContactStatus();
            return;
        }

        const connectionState = webSocket.readyState;

        if(connectionState != SOCKET_OPEN)
        {
            serverResponseStatusList = [];
            updateViewLayoutContactStatus();
            return;
        }

        const contactUIDList = getUIDListFromContactStatusList();

        if(contactUIDList.length == 0)
        {
            serverResponseStatusList = [];
            updateViewLayoutContactStatus();
            return;
        }

        const data = {
            "request": "CONTACT_LIST_STATUS",
            "params": [
                contactUIDList
            ]
        }

        sendSocketText(JSON.stringify(data));
    }, 5000);
}





function startOutgoingMessageService()
{
    if(itvOutgoingMessageService != null)
    {
        clearInterval(itvOutgoingMessageService);
        itvOutgoingMessageService = null;
    }

    itvOutgoingMessageService = setInterval(async function(){
        if(processingOutgoingMessage == true)
        {
            return;
        }

        if(restoreDatabaseProcessing == true)
        {
            return;
        }

        if(afterRestoreDatabaseProcessing == true)
        {
            return;
        }

        if(webSocket == null)
        {
            return;
        }

        const uid = readLocalStorage("uid");
        const unsentStatus = `0`;
        const myUnsentMessagesQuery = `SELECT * FROM Messages WHERE fromId = ? AND statusSent = ?`;
        const myUnsentMessagesValues = [uid, unsentStatus];

        const myUnsentMessages = await dbRun(myUnsentMessagesQuery, myUnsentMessagesValues);

        if(myUnsentMessages == null)
        {
            return;
        }

        if(myUnsentMessages.rows.length == 0)
        {
            clearAudioTranscriptionCache();
        }

        const connectionState = webSocket.readyState;

        if(connectionState != SOCKET_OPEN)
        {
            return;
        }

        processingOutgoingMessage = true;

   
        for(let ix = 0; ix < myUnsentMessages.rows.length; ix++)
        {
            const messageToSend = myUnsentMessages.rows.item(ix);
            console.log(`CHATMSG: Trying to send message ${messageToSend.id} ...`);

            if(messageToSend.fromId == messageToSend.toId)
            {
                outgoingMessageServiceLastError = "BLOCKED: Trying to send message with same from and to";

                console.log(`🔴 BLOCKED: Trying to send message with same from and to`);
                continue;
            }

            let privateKey = null;

            try
            {
                if(messageToSend.toIsGroup == 0)
                {
                    const privateKeyQuery = `SELECT privatekey FROM LinkedContacts WHERE contact = ?`;
                    const privateKeyQueryValues = [messageToSend.toId];
                    const privareKeyQueryResponse = await dbRun(privateKeyQuery, privateKeyQueryValues);
        
                    if(privareKeyQueryResponse.rows.length > 0)
                    {
                        const privateKeyRecord = privareKeyQueryResponse.rows.item(0);
                        if(privateKeyRecord.privatekey != null)
                        {
                            privateKey = privateKeyRecord.privatekey;
                        }
                    }
    
                    if(privateKey == null)
                    {
                        const privateKeyServerResponse = await callS(true, `GET`, `/services/contactprivatekey/${messageToSend.toId}`);
                        if(privateKeyServerResponse.linkedContactList != null)
                        {
                            if(privateKeyServerResponse.linkedContactList.length > 0)
                            {
                                linkedContactList = privateKeyServerResponse.linkedContactList;
                                refreshLinkedContactList();
                                // await overwriteLocalLinkedContactList();
                            }
                        }
                        privateKey = privateKeyServerResponse.privateKey;                
                    }        
                }
                else
                {
                    const privateKeyQuery = `SELECT PrivateKey FROM AppGroups WHERE GroupId = ?`;
                    const privateKeyQueryValues = [messageToSend.toId];
                    const privareKeyQueryResponse = await dbRun(privateKeyQuery, privateKeyQueryValues);
    
    
                    if(privareKeyQueryResponse.rows.length > 0)
                    {
                        const privateKeyRecord = privareKeyQueryResponse.rows.item(0);
                        if(privateKeyRecord.PrivateKey != null)
                        {
                            privateKey = privateKeyRecord.PrivateKey;
                        }
                    }
        
                    if(privateKey == null)
                    {
                        const privateKeyServerResponse = await callS(true, `GET`, `/services/groupprivatekey/${messageToSend.toId}`);
                        if(privateKeyServerResponse.value != null)
                        {
                            privateKey = privateKeyServerResponse.value;
    
                            const privateKeyUpdateQuery = `UPDATE AppGroups SET PrivateKey = ? WHERE GroupId = ?`;
                            const privateKeyUpdateQueryValues = [privateKey, messageToSend.toId];
                            await dbRun(privateKeyUpdateQuery, privateKeyUpdateQueryValues);
                        }
                    }
                }
            }
            catch(privateKeyException)
            {
                outgoingMessageServiceLastError = `Error getting message pk: ${privateKeyException}`;
            }




    

            if(messageToSend.media != null && messageToSend.mediaType != null)
            {
                if(messageToSend.mediaType == MEDIA_TYPE_IMAGE)
                {
                    if(messageToSend.media.toLowerCase().trim().startsWith("file://") == true || messageToSend.media.toLowerCase().trim().startsWith("filesystem:") == true)
                    {
            
                        // swal(getTranslate(`uploading`, `Uploading...`), {
                        //     button: false, closeOnClickOutside: false
                        // });
            
                        console.log(`Uploading...`);
    
                        let serverConnectionState = await hasServerConnection();
                        
                        if(serverConnectionState == false)
                        {
                            // swal.close();
                            // swal(getTranslate("unable-to-send-file", "You cannot send file without internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again."));
                            console.log(`You cannot send file without internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again.`);
                            continue;
                        }
            
                        let fileName = messageToSend.media.replace(/^.*[\\/]/, '').split('?')[0];
                        let uniqueFileName = fileName.replace(/(\.[\w\d_-]+)$/i, `-${new Date().getTime()}$1`);
            
                        let uploadResponse = null;
            
                        try
                        {
                            const UPLOAD_TIMEOUT = 600000;
                            uploadResponse = await uploadFileToServer(`/fs/sendimage`, messageToSend.media, uniqueFileName, null, null, UPLOAD_TIMEOUT);
                        }
                        catch(uploadException)
                        {
                            // swal.close();
                            // swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
                            outgoingMessageServiceLastError = `Error saving data: ${uploadException}`;
                            console.log(`Error saving data`);
                            await processMessageWithUploadError(messageToSend, false);
                            continue;
                        }
            
                        // swal.close();
            
                        if(uploadResponse == null)
                        {
                            // swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
                            outgoingMessageServiceLastError = `Error saving data: no upload response`;
                            console.log(`Error saving data`);
                            await processMessageWithUploadError(messageToSend, false);
                            continue;
                        }
            
            
                        if(typeof uploadResponse.code != 'undefined')
                        {
                            if(uploadResponse.code == "OK")
                            {
                                // Remove local file after upload
                                await deleteLocalFile(messageToSend.media);

                                // let uid = readLocalStorage("uid");
                                // const fileMedia = `${uid}|${uniqueFileName}`;
                                // pendingMediaToSend = fileMedia;
                                messageToSend.media = uploadResponse.fileId;
    
                                const sqlUpdateMessageMedia = `UPDATE Messages SET media = ? WHERE messageId = ?`;
                                const sqlUpdateMessageMediaValues = [messageToSend.media, messageToSend.messageId];
                                await dbRun(sqlUpdateMessageMedia, sqlUpdateMessageMediaValues);
    
                                if($(`.card-image-waiting-for-upload[data-message="${messageToSend.messageId}"]`).length > 0)
                                {       
                                    $(`.card-image-waiting-for-upload[data-message="${messageToSend.messageId}"]`).find(`.media-image-waiting-for-upload`).attr(`data-id`, messageToSend.media);
                                    $(`.card-image-waiting-for-upload[data-message="${messageToSend.messageId}"]`).find(`.media-image-waiting-for-upload`).addClass(`media-image-source-loading`);
                                    $(`.card-image-waiting-for-upload[data-message="${messageToSend.messageId}"]`).find(`.media-image-waiting-for-upload`).attr(`src`, `/images/picture.png`);
                                    $(`.card-image-waiting-for-upload[data-message="${messageToSend.messageId}"]`).find(`.media-image-waiting-for-upload`).removeClass(`media-image-waiting-for-upload`);

                                    $(`.card-image-waiting-for-upload[data-message="${messageToSend.messageId}"]`).attr(`data-id`, messageToSend.media);
                                    $(`.card-image-waiting-for-upload[data-message="${messageToSend.messageId}"]`).removeClass(`card-image-waiting-for-upload`);
                                }
                            }
                            else
                            {
                                // swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
                                outgoingMessageServiceLastError = `Error saving data: no upload code OK`;
                                console.log(`Error saving data`);
                                await processMessageWithUploadError(messageToSend, false);
                                continue;
                            }
                        }
                    }
                }
                else if(messageToSend.mediaType == MEDIA_TYPE_AUDIO)
                {
                    if(messageToSend.media.toLowerCase().trim().startsWith("file://") == true || messageToSend.media.toLowerCase().trim().startsWith("filesystem:") == true)
                    {
                        console.log(`Preparing audio...`);

                        const mediaFile = messageToSend.media;
                        // const mediaFile = messageToSend.media.split(`|`)[0];
                        // const mediaDuration = messageToSend.media.split(`|`).length > 0 ? messageToSend.media.split(`|`)[1] : 0;
                        var audioLocalTranscription = "";
                        var audioLocalDurationInSeconds = 0;

                        const cachedTranscription = await getAudioTranscriptionCache(mediaFile);                       
                        audioLocalTranscription = cachedTranscription.transcription;
                        audioLocalDurationInSeconds = cachedTranscription.duration

                        let serverConnectionState = await hasServerConnection();
                        
                        if(serverConnectionState == false)
                        {
                            // swal.close();
                            // swal(getTranslate("unable-to-send-file", "You cannot send file without internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again."));
                            outgoingMessageServiceLastError = `You cannot send file without internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again.`;
                            console.log(`You cannot send file without internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again.`);
                            continue;
                        }
            
                        let fileName = mediaFile.replace(/^.*[\\/]/, '').split('?')[0];
                        let uniqueFileName = fileName.replace(/(\.[\w\d_-]+)$/i, `-${new Date().getTime()}$1`);

            
                        let uploadResponse = null;
                        let uploadSendFileData = null
                        let uploadHeaders = null;
                        // let uploadHeaders = [
                        //     {"key": "audio_duration", "value": mediaDuration}
                        // ]
                        const UPLOAD_TIMEOUT = 600000;            

                        console.log(`Uploading Audio File...`);

                        const localFileDetails = await localFileURLPathResolve(mediaFile);

                        if(localFileDetails.status == false)
                        {
                            outgoingMessageServiceLastError = `Panic: Local audio not found!`;
                            console.log(`Panic: Local audio not found!`);
                            await processMessageWithUploadError(messageToSend, true);
                            continue;
                        }

                        let mp3Path = "";
                        let isMP3 = false;
                        try
                        {
                            console.log(`Converting Wav to MP3: ${mediaFile} ...`);
                            let wav2MP3Resposne = await window.internal.alliances.wav2MP3(mediaFile);
                            mp3Path = wav2MP3Resposne.result;
                            console.log(`Wav to MP3 file converted`);
                        }
                        catch(mp3ConvertException)
                        {
                            outgoingMessageServiceLastError = `Unable to convert to MP3 from device`;
                            console.log(`Unable to convert to MP3 from device`);
                        }

                        console.log(`MP3 result file: ${mp3Path}`);

                        if(mp3Path == null)
                        {
                            console.log(`MP3 is null`);
                            mp3Path = "";
                        }

                        if(mp3Path.trim().length > 0)
                        {
                            const localMP3FileDetails = await localFileURLPathResolve(mp3Path);
                            if(localMP3FileDetails.status == true)
                            {
                                console.log(`Converted MP3 file to upload`);
                                isMP3 = true;
                            }
                        }
                        else
                        {
                            console.log(`MP3 is empty`);
                        }


                        let audioFileToUpload = isMP3 == true ? mp3Path : mediaFile;

                        try
                        {
                            // uploadResponse = await uploadFileToServer(`/fs/sendaudio`, mediaFile, uniqueFileName, uploadHeaders, null, UPLOAD_TIMEOUT);
                            const uploadSendResponse = await uploadFileToServer(`/fs/sendaudioonly`, audioFileToUpload, uniqueFileName, uploadHeaders, null, UPLOAD_TIMEOUT);

                            if(uploadSendResponse == null)
                            {
                                console.log(`Error sending file`);
                                await processMessageWithUploadError(messageToSend, false);
                                continue;
                            }
                            console.log(`Uploading Audio Done!`);
                            uploadSendFileData = uploadSendResponse.data;
                        }
                        catch(uploadException)
                        {
                            // swal.close();
                            // swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
                            outgoingMessageServiceLastError = `Error sending audio file ${uploadException}`;
                            console.log(`Error sending audio file`);
                            await processMessageWithUploadError(messageToSend, false);
                            continue;
                        }
            
                        if(uploadSendFileData == null)
                        {
                            console.log(`Error sending file`);
                            await processMessageWithUploadError(messageToSend, false);
                            continue;
                        }

                        console.log(`Processing...`);

                        try
                        {
                            const processAudioData = {
                                "data": uploadSendFileData,
                                "localTranscription": audioLocalTranscription,
                                "localPlayingTimeInSeconds": audioLocalDurationInSeconds,
                                "uploadIsMP3": isMP3,
                                "reduceAudioSize": false
                            }

                            // console.log(`Audio Processing Request: ${JSON.stringify(processAudioData)}`);

                            uploadResponse = await callS(true, `POST`, `/fs/processaudio`, processAudioData);
                        }
                        catch(uploadException)
                        {
                            outgoingMessageServiceLastError = `Error uploading audio data ${uploadException}`;
                            console.log(`Error uploading audio data`);
                            await processMessageWithUploadError(messageToSend, false);
                            continue;
                        }

                        // swal.close();
            
                        if(uploadResponse == null)
                        {
                            // swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
                            outgoingMessageServiceLastError = `Error saving data: Empty upload response`;
                            console.log(`Error saving data`);
                            await processMessageWithUploadError(messageToSend, false);
                            continue;
                        }
            
                        console.log(`Processed`);
            
                        if(typeof uploadResponse.code != 'undefined')
                        {
                            if(uploadResponse.code == "OK")
                            {
                                const audioTranscription = audioLocalTranscription.trim().length > 0 ? audioLocalTranscription : uploadResponse.transcript;
                                
                                messageToSend.content = audioTranscription;

                                // Remove local file after upload
                                await deleteLocalFile(mediaFile);

                                // let uid = readLocalStorage("uid");
                                // const fileMedia = `${uid}|${uniqueFileName}`;
                                // pendingMediaToSend = fileMedia;
                                messageToSend.media = uploadResponse.fileId;
    
                                const sqlUpdateMessageMedia = `UPDATE Messages SET media = ?, content = ? WHERE messageId = ?`;
                                const sqlUpdateMessageMediaValues = [messageToSend.media, audioTranscription, messageToSend.messageId];
                                await dbRun(sqlUpdateMessageMedia, sqlUpdateMessageMediaValues);
    
                                if($(`.card-audio-waiting-for-upload[data-message="${messageToSend.messageId}"]`).length > 0)
                                {   
                                    switchAudioWaitingForUploadToAudioSourceLoading(messageToSend.messageId, messageToSend.media, audioTranscription);
                                }

                                await removeAudioTranscriptionCache(mediaFile);
                            }
                            else
                            {
                                // swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
                                outgoingMessageServiceLastError = `Error saving data: Upload response code not OK`;
                                console.log(`Error saving data`);
                                continue;
                            }
                        }
                    }
                }

            }

            // const readyPS = readyForPS();
            // if(readyPS == false)
            // {
            //     outgoingMessageServiceLastError = `PS not ready for message ${messageToSend.messageId}`;
            //     console.log(`PS not ready for message ${messageToSend.messageId}`);
            //     continue;
            // }

            var encryptedContent;

            try
            {
                // encryptedContent = await encryptMessageText(privateKey, messageToSend.content);
                encryptedContent = cv2EncryptMessageText(privateKey, messageToSend.content);
            }
            catch(encryptException)
            {
                outgoingMessageServiceLastError = `Encrypt error for message ${messageToSend.messageId}: ${encryptException}`;
                console.log(`Encrypt error for message ${messageToSend.messageId}: ${encryptException}`);
                continue;
            }

            let messageCompany = await getCompanyToSendMessage(messageToSend.toId);
            const messageTimestampValue = getTimestampValueFromDate(messageToSend.messageTime);

            let selectedConnection = getSelectedAppServerConnection();
            if(selectedConnection == null)
            {
                // Set default connection if null
                selectedConnection = {
                    "id": 0
                }
            }

            const messageCarrierBody = {
                "messageId": messageToSend.messageId,
                "fromId": messageToSend.fromId,
                "toId": messageToSend.toId,
                "content": encryptedContent,
                "protected": messageToSend.protected,
                "messageTime": messageTimestampValue,
                "media": messageToSend.media,
                "mediaType": messageToSend.mediaType,
                "inReplyToMessageId": messageToSend.InReplyToMessageId,
                "toIsGroup": messageToSend.toIsGroup,
                "company": messageCompany,
                "connection": selectedConnection.id
            }

            const socketData = {
                "request": "CHAT_MESSAGE_SEND",
                "params": [
                    messageCarrierBody
                ]
            }

            try
            {
                sendSocketText(JSON.stringify(socketData));
            }
            catch(socketSendError)
            {
                outgoingMessageServiceLastError = `Error sending message to server ${socketSendError}`;
                console.log(`Error sending message to server ${socketSendError}`);
            }


            try
            {
                updateChatMessageToSent(messageToSend.messageId);
            }
            catch(setMessageToSentError)
            {
                outgoingMessageServiceLastError = `Error to set message to sent ${setMessageToSentError}`;
                console.log(`Error to set message to sent ${setMessageToSentError}`);
            }
        }
       
        processingOutgoingMessage = false;

    }, 1000);
}

function startOutgoingGroupStatusService()
{
    if(itvOutgoingGroupStatusService != null)
    {
        clearInterval(itvOutgoingGroupStatusService);
        itvOutgoingGroupStatusService = null;
    }

    itvOutgoingGroupStatusService = setInterval(async function(){
        if(processingOutgoingGroupStatus == true)
        {
            return;
        }

        if(restoreDatabaseProcessing == true)
        {
            return;
        }

        if(afterRestoreDatabaseProcessing == true)
        {
            return;
        }

        if(webSocket == null)
        {
            return;
        }

        const connectionState = webSocket.readyState;

        if(connectionState != SOCKET_OPEN)
        {
            return;
        }

        processingOutgoingGroupStatus = true;

        const myUnsentGroupStatusQuery = `SELECT * FROM AppGroupWaitingForServerStatusUpdate WHERE StatusTag = ?`;
        const myUnsentGroupStatusQueryValues = [SERVER_STATUS_TAG_CREATE];
        const myUnsentGroupStatus = await dbRun(myUnsentGroupStatusQuery, myUnsentGroupStatusQueryValues);

        if(myUnsentGroupStatus == null)
        {
            processingOutgoingGroupStatus = false;
            return;
        }

        for(let ix = 0; ix < myUnsentGroupStatus.rows.length; ix++)
        {
            const groupStatusToSend = myUnsentGroupStatus.rows.item(ix);
            const groupId = groupStatusToSend.GroupId;

            console.log(`GROUPMSG: Trying to send group status ${groupId} ...`);

            const groupQuery = `SELECT * FROM AppGroups WHERE GroupId = ?`;
            const groupQueryValues = [groupId];
            const groupQueryResponse = await dbRun(groupQuery, groupQueryValues);

            if(groupQueryResponse.rows.length == 0)
            {
                console.log(`GROUPMSG: No group records found for ${groupId} ...`);
                continue;
            }

            const groupRecord =  groupQueryResponse.rows.item(0);

            
            const groupMembersQuery = `SELECT Login, IsAdmin, MessagePermission, CreationDate, HasUserValidity, 
                HasUserValidityFromDate, UserValidityFromDate, HasUserValidityBetween, UserValidityBetweenDateStart, UserValidityBetweenDateEnd
                FROM AppGroupMembers WHERE GroupId = ?`;
            const groupMembersQueryValues = [groupId];
            const groupMembersQueryResponse = await dbRun(groupMembersQuery, groupMembersQueryValues);

            if(groupMembersQueryResponse.rows.length == 0)
            {
                console.log(`GROUPMSG: No group members for ${groupId} ...`);
                continue;
            }

            let members = [];
            for(let ixMember = 0; ixMember < groupMembersQueryResponse.rows.length; ixMember++)
            {
                let memberRecord = groupMembersQueryResponse.rows.item(ixMember);
                const memberRecordTimestampValue = getTimestampValueFromDate(memberRecord.CreationDate);
                memberRecord.CreationDate = memberRecordTimestampValue;
                members.push(memberRecord);
            }

            const creationDateTimestamp = getTimestampValueFromDate(groupRecord.CreationDate);

            let saveGroupResponse = null;

            // Create Group Record
            const saveData = {
                "groupId"                   : groupRecord.GroupId,
                "name"                      : groupRecord.Name,
                "description"               : groupRecord.Description,
                "creatorAdminLogin"         : groupRecord.CreatorAdminLogin,
                "creationDate"              : creationDateTimestamp,
                "members"                   : JSON.stringify(members),
                "updateMembers"             : true,
                "hasGroupValidity"          : groupRecord.HasGroupValidity,
                "hasGroupValidityFromDate"  : groupRecord.HasGroupValidityFromDate,
                "validityFromDate"          : groupRecord.ValidityFromDate,
                "hasGroupValidityBetween"   : groupRecord.HasGroupValidityBetween,
                "validityBetweenDateStart"  : groupRecord.ValidityBetweenDateStart,
                "validityBetweenDateEnd"    : groupRecord.ValidityBetweenDateEnd,
                "hasGroupAccessHours"       : groupRecord.HasGroupAccessHours,
                "groupAccessHoursStart"     : groupRecord.GroupAccessHoursStart,
                "groupAccessHoursEnd"       : groupRecord.GroupAccessHoursEnd
            }
            
            try
            {
                saveGroupResponse = await callS(true, `POST`, `/services/savegroup`, saveData);
            }
            catch(groupSaveException)
            {
                console.log(`Error on save group: ${groupSaveException}`);
                continue;
            }

            if(saveGroupResponse == null)
            {
                console.log(`Error on save group: ${groupSaveException}`);
                continue;
            }

            if(saveGroupResponse.code != "OK")
            {
                console.log(`Error on save group: ${groupSaveException}`);
                continue;
            }

            if(saveGroupResponse.privatekey != null)
            {
                if(saveGroupResponse.privatekey.trim().length > 0)
                {
                    console.log(`Saving group key...`);

                    const groupPrivateKeyUpdate = `UPDATE AppGroups SET PrivateKey = ? WHERE GroupId = ?`;
                    const groupPrivateKeyUpdateValues = [saveGroupResponse.privatekey, groupId];
                    await dbRun(groupPrivateKeyUpdate, groupPrivateKeyUpdateValues);

                    console.log(`Group key generated`);
                }
            }

            // Upload group photo
            if(groupRecord.Photo.trim().length > 0)
            {
                console.log(`Uploading group photo...`);


                let uploadGroupPhotoFromData = [
                    {"key": "groupid", "value": groupRecord.GroupId}
                ]

                let groupPhotoUploadResponse = null;

                try
                {
                    const UPLOAD_TIMEOUT = 600000;
                    groupPhotoUploadResponse = await uploadFileToServer(`/services/setgroupphoto`, groupRecord.Photo, null, null, uploadGroupPhotoFromData, UPLOAD_TIMEOUT);
                }
                catch(uploadGroupPhotoException)
                {
                    console.log(`Error uploading group photo: ${uploadGroupPhotoException}`);
                }

                // if(groupPhotoUploadResponse == null)
                // {
                //     console.log(`Error uploading group photo`);
                //     continue;
                // }

                if(groupPhotoUploadResponse != null)
                {
                    if(typeof groupPhotoUploadResponse.code != 'undefined')
                    {
                        if(groupPhotoUploadResponse.code == "OK")
                        {
                            // const groupPhotoURL = `${endpoint}fs/groupphotoraw/${groupId}`;
                    
                            const localDownloadGroupPhotoFileInfo = await getLocalSavedGroupPhoto(groupId);
                            const localGroupPhotoFilPath = localDownloadGroupPhotoFileInfo.filePath;
                            const localGroupPhotoFileName = localDownloadGroupPhotoFileInfo.fileName;
    
                            let groupPhotoDownloaded = false;
    
                            if(localDownloadGroupPhotoFileInfo.found == true)
                            {
                                // console.log(`Local group photo file already downloaded`);
                                groupPhotoDownloaded = true;
                            }
                            else
                            {
                                let serverConnectionState = await hasServerConnection();
                    
                                if(serverConnectionState == true)
                                {
                                    // console.log(`Downloading local group photo file`);

                                    const hasGroupServerPhoto = await hasServerGroupPhoto(groupId);
                                    if(hasGroupServerPhoto == true)
                                    {
                                        await downloadFileFromServer(`${endpoint}services/groupphotoimagedownload/${groupId}`, imagesLocalFolderLocation, localGroupPhotoFileName, null);
                                        groupPhotoDownloaded = true;
                                    }

                                }
                                else
                                {
                                    console.log(`Unable to download group photo file - offline`);
                                }
                            }
                        
                            if(groupPhotoDownloaded == true)
                            {
                                console.log(`Group photo loaded`);
                                const groupPhotoLocalUpdate = `UPDATE AppGroups SET Photo = ? WHERE GroupId = ?`;
                                const groupPhotoLocalUpdateValues = [localGroupPhotoFilPath, groupId];
                                const groupPhotoLocalUpdateResponse = await dbRun(groupPhotoLocalUpdate, groupPhotoLocalUpdateValues);
                                await deleteLocalFile(groupRecord.Photo);
                            }
    
                        }
                        else
                        {
                            console.log(`Error uploading group photo`);
                        }
                    }
                    else
                    {
                        console.log(`Error uploading group photo`);
                    }
                }

            }

            //Saves Server Updated Date for Group
            let serverUpdateDate = null;
            if(saveGroupResponse.serverUpdateDate != null)
            {
                serverUpdateDate = saveGroupResponse.serverUpdateDate;
            }
            const groupAppUpdateTime = new Date().getTime();
            const groupPrivateKeyUpdate = `UPDATE AppGroups SET ServerUpdateDate = ? WHERE GroupId = ?`;
            const groupPrivateKeyUpdateValues = [serverUpdateDate, groupId];
            await dbRun(groupPrivateKeyUpdate, groupPrivateKeyUpdateValues);

            // Remove AppGroupWaitingForServerStatusUpdate record
            const queryRemoveWaiting = `DELETE FROM AppGroupWaitingForServerStatusUpdate WHERE GroupId = ? AND StatusTag = ?`;
            const queryRemoveWaitingValues = [groupId, SERVER_STATUS_TAG_CREATE];
            const queryRemoveWaitingResponse = await dbRun(queryRemoveWaiting, queryRemoveWaitingValues);


            console.log(`Inform all online members about group creation`);
            const messageGroupUpdate = {
                "groupId": groupId,
                "action": "create"
            }

            const socketData = {
                "request": "GROUP_UPDATED",
                "params": [
                    messageGroupUpdate
                ]
            }

            sendSocketText(JSON.stringify(socketData));

            refreshGroupList();

        }

        processingOutgoingGroupStatus = false;

    }, 1000);
}

function startOutgoingGroupUpdateStatusService()
{
    if(itvOutgoingGroupUpdateStatusService != null)
    {
        clearInterval(itvOutgoingGroupUpdateStatusService);
        itvOutgoingGroupUpdateStatusService = null;
    }

    itvOutgoingGroupUpdateStatusService = setInterval(async function(){
        if(processingOutgoingGroupUpdateStatus == true)
        {
            return;
        }

        if(restoreDatabaseProcessing == true)
        {
            return;
        }

        if(afterRestoreDatabaseProcessing == true)
        {
            return;
        }

        if(webSocket == null)
        {
            return;
        }

        const connectionState = webSocket.readyState;

        if(connectionState != SOCKET_OPEN)
        {
            return;
        }

        processingOutgoingGroupUpdateStatus = true;

        const myUnsentGroupUpdateStatusQuery = `SELECT * FROM AppGroupWaitingForServerStatusUpdate WHERE StatusTag = ? OR StatusTag = ?`;
        const myUnsentGroupUpdateStatusQueryValues = [SERVER_STATUS_TAG_UPDATE, SERVER_STATUS_TAG_UPDATE_WITH_PHOTO];
        const myUnsentGroupUpdateStatus = await dbRun(myUnsentGroupUpdateStatusQuery, myUnsentGroupUpdateStatusQueryValues);

        if(myUnsentGroupUpdateStatus == null)
        {
            processingOutgoingGroupUpdateStatus = false;
            return;
        }

        for(let ix = 0; ix < myUnsentGroupUpdateStatus.rows.length; ix++)
        {
            const groupStatusToSend = myUnsentGroupUpdateStatus.rows.item(ix);
            const groupId = groupStatusToSend.GroupId;
            const groupStatusTag = groupStatusToSend.StatusTag;

            console.log(`GROUPMSGUPD: Trying to send group update status ${groupId} ...`);

            const groupQuery = `SELECT * FROM AppGroups WHERE GroupId = ?`;
            const groupQueryValues = [groupId];
            const groupQueryResponse = await dbRun(groupQuery, groupQueryValues);

            if(groupQueryResponse.rows.length == 0)
            {
                console.log(`GROUPMSG: No group records found for ${groupId} ...`);
                continue;
            }

            const groupRecord =  groupQueryResponse.rows.item(0);

            
            const groupMembersQuery = `SELECT * FROM AppGroupMembers WHERE GroupId = ?`;
            const groupMembersQueryValues = [groupId];
            const groupMembersQueryResponse = await dbRun(groupMembersQuery, groupMembersQueryValues);

            if(groupMembersQueryResponse.rows.length == 0)
            {
                console.log(`GROUPMSG: No group members for ${groupId} ...`);
                continue;
            }

            let members = [];
            for(let ixMember = 0; ixMember < groupMembersQueryResponse.rows.length; ixMember++)
            {
                let memberRecord = groupMembersQueryResponse.rows.item(ixMember);
                const memberRecordTimestamp = getTimestampValueFromDate(memberRecord.CreationDate);
                memberRecord.CreationDate = memberRecordTimestamp;
                members.push(memberRecord);
            }

            let saveUpdateGroupResponse = null;

            const groupCreationDate = getTimestampValueFromDate(groupRecord.CreationDate);
            //const groupValidityFromDate = groupRecord.ValidityFromDate == null ? groupRecord.ValidityFromDate: parseInt(parseInt(groupRecord.ValidityFromDate)/1000);
            //const groupValidityBetweenDateStart =  groupRecord.ValidityBetweenDateStart == null ? groupRecord.ValidityBetweenDateStart : parseInt(parseInt(groupRecord.ValidityBetweenDateStart)/1000);
            //const groupValidityBetweenDateEnd =  groupRecord.ValidityBetweenDateEnd == null ? groupRecord.ValidityBetweenDateEnd : parseInt(parseInt(groupRecord.ValidityBetweenDateEnd)/1000);
            const groupEditTimestamp = getTimestampValueFromDate(groupRecord.EditDate);
            const groupeditDate = groupRecord.EditDate == null ? null : groupEditTimestamp;
                
            // Create Group Record
            const saveData = {
                "groupId"                 : groupRecord.GroupId,
                "name"                    : groupRecord.Name,
                "description"             : groupRecord.Description,
                "creatorAdminLogin"       : groupRecord.CreatorAdminLogin,
                "creationDate"            : groupCreationDate,
                "hasGroupValidity"        : groupRecord.HasGroupValidity,
                "hasGroupValidityFromDate": groupRecord.HasGroupValidityFromDate,
                "validityFromDate"        : groupRecord.ValidityFromDate,
                "hasGroupValidityBetween" : groupRecord.HasGroupValidityBetween,
                "validityBetweenDateStart": groupRecord.ValidityBetweenDateStart,
                "validityBetweenDateEnd"  : groupRecord.ValidityBetweenDateEnd,
                "hasGroupAccessHours"     : groupRecord.HasGroupAccessHours,
                "groupAccessHoursStart"   : groupRecord.GroupAccessHoursStart,
                "groupAccessHoursEnd"     : groupRecord.GroupAccessHoursEnd,
                "editDate"                : groupeditDate,
                "members"                 : JSON.stringify(members),
                "updateMembers"           : true
            }
            
            try
            {
                saveUpdateGroupResponse = await callS(true, `POST`, `/services/savegroup`, saveData);
            }
            catch(groupSaveException)
            {
                console.log(`Error on save group: ${groupSaveException}`);
                continue;
            }

            if(saveUpdateGroupResponse == null)
            {
                console.log(`Error on save group: ${groupSaveException}`);
                continue;
            }

            if(saveUpdateGroupResponse.code != "OK")
            {
                console.log(`Error on save group: ${groupSaveException}`);
                continue;
            }

            // Upload group photo
            if(groupStatusTag == SERVER_STATUS_TAG_UPDATE_WITH_PHOTO)
            {
                if(groupRecord.Photo.trim().length > 0)
                {
                    console.log(`Uploading group photo...`);
    
    
                    let uploadGroupPhotoFromData = [
                        {"key": "groupid", "value": groupRecord.GroupId}
                    ]
    
                    let groupPhotoUploadResponse = null;
    
                    try
                    {
                        const UPLOAD_TIMEOUT = 600000;
                        groupPhotoUploadResponse = await uploadFileToServer(`/services/setgroupphoto`, groupRecord.Photo, null, null, uploadGroupPhotoFromData, UPLOAD_TIMEOUT);
                    }
                    catch(uploadGroupPhotoException)
                    {
                        // console.log(`Error uploading group photo`);
                    }
    
                    if(groupPhotoUploadResponse == null)
                    {
                        console.log(`Error uploading group photo`);
                        continue;
                    }
    
                    if(typeof groupPhotoUploadResponse.code != 'undefined')
                    {
                        if(groupPhotoUploadResponse.code == "OK")
                        {
                            // const groupPhotoURL = `${endpoint}fs/groupphotoraw/${groupId}`;
                    
                            const localDownloadGroupPhotoFileInfo = await getLocalSavedGroupPhoto(groupId);
                            const localGroupPhotoFilPath = localDownloadGroupPhotoFileInfo.filePath;
                            const localGroupPhotoFileName = localDownloadGroupPhotoFileInfo.fileName;
    
                            let groupPhotoDownloaded = false;
    
                            if(localDownloadGroupPhotoFileInfo.found == true)
                            {
                                // console.log(`Local group photo file already downloaded`);
                                groupPhotoDownloaded = true;
                            }
                            else
                            {
                                let serverConnectionState = await hasServerConnection();
                    
                                if(serverConnectionState == true)
                                {
                                    // console.log(`Downloading local group photo file`);
                                    const hasGroupServerPhoto = await hasServerGroupPhoto(groupId);
                                    if(hasGroupServerPhoto == true)
                                    {
                                        await downloadFileFromServer(`${endpoint}services/groupphotoimagedownload/${groupId}`, imagesLocalFolderLocation, localGroupPhotoFileName, null);
                                        groupPhotoDownloaded = true;
                                    }
                                }
                                else
                                {
                                    console.log(`Unable to download group photo file - offline`);
                                }
                            }
                        
                            if(groupPhotoDownloaded == true)
                            {
                                console.log(`Group photo loaded`);
                                const groupPhotoLocalUpdate = `UPDATE AppGroups SET Photo = ? WHERE GroupId = ?`;
                                const groupPhotoLocalUpdateValues = [localGroupPhotoFilPath, groupId];
                                const groupPhotoLocalUpdateResponse = await dbRun(groupPhotoLocalUpdate, groupPhotoLocalUpdateValues);
                                await deleteLocalFile(groupRecord.Photo);
                            }
    
                        }
                        else
                        {
                            console.log(`Error uploading group photo`);
                        }
                    }
                    else
                    {
                        console.log(`Error uploading group photo`);
                    }
                }
                else
                {
                    // Photo Group removed
                    const clearPhotoData = {
                        "groupid": groupId
                    };

                    const clearPhotoResponse = await callS(true, 'POST', `/services/cleargroupphoto`, clearPhotoData);

                    if(clearPhotoResponse.code == `OK`)
                    {
                        console.log(`Group Photo Clear OK`);
                    }
                    else
                    {
                        console.log(`Group Photo Clear Error`);
                    }
                    
                }
            }

            //Saves Server Updated Date for Group
            let serverUpdateDate = null;
            if(saveUpdateGroupResponse.serverUpdateDate != null)
            {
                serverUpdateDate = saveUpdateGroupResponse.serverUpdateDate;
            }

            const groupAppUpdateTime = new Date().getTime();
            const groupPrivateKeyUpdate = `UPDATE AppGroups SET AppUpdateDate = ?, ServerUpdateDate = ? WHERE GroupId = ?`;
            const groupPrivateKeyUpdateValues = [groupAppUpdateTime, serverUpdateDate, groupId];
            await dbRun(groupPrivateKeyUpdate, groupPrivateKeyUpdateValues);

            // Remove AppGroupWaitingForServerStatusUpdate record
            const queryRemoveWaiting = `DELETE FROM AppGroupWaitingForServerStatusUpdate WHERE GroupId = ? AND (StatusTag = ? OR StatusTag = ?)`;
            const queryRemoveWaitingValues = [groupId, SERVER_STATUS_TAG_UPDATE, SERVER_STATUS_TAG_UPDATE_WITH_PHOTO];
            const queryRemoveWaitingResponse = await dbRun(queryRemoveWaiting, queryRemoveWaitingValues);


            console.log(`Inform all online members about group creation`);
            const messageGroupUpdate = {
                "groupId": groupId,
                "action": "update"
            }

            const socketData = {
                "request": "GROUP_UPDATED",
                "params": [
                    messageGroupUpdate
                ]
            }

            sendSocketText(JSON.stringify(socketData));

            if(talkToAGroup == true)
            {
                if(talkToId == groupId)
                {
                    chatLoadRoomContactProfile();
                }
            }

        }

        processingOutgoingGroupUpdateStatus = false;

    }, 1000);
}


function startMessageGroupToInformServerWasReceivedService()
{
    if(itvMessageGroupToInformServerWasReceivedService != null)
    {
        clearInterval(itvMessageGroupToInformServerWasReceivedService);
        itvMessageGroupToInformServerWasReceivedService = null;
    }

    const serviceFrequencyTime = 5000;

    itvMessageGroupToInformServerWasReceivedService = setInterval(async function(){
        if(processingMessageGroupToInformServerWasReceivedService == true)
        {
            return;
        }

        if(restoreDatabaseProcessing == true)
        {
            return;
        }

        if(afterRestoreDatabaseProcessing == true)
        {
            return;
        }

        if(webSocket == null)
        {
            return;
        }

        const connectionState = webSocket.readyState;

        if(connectionState != SOCKET_OPEN)
        {
            return;
        }

        processingMessageGroupToInformServerWasReceivedService = true;



        const unsentStatusQuery = `SELECT * FROM PendingMsgGroupToInformServerReceived`;
        const unsentStatusQueryValues = [];
        const unsertStatusResponse = await dbRun(unsentStatusQuery, unsentStatusQueryValues);

        if(unsertStatusResponse == null)
        {
            processingMessageGroupToInformServerWasReceivedService = false;
            return;
        }

        for(let ix = 0; ix < unsertStatusResponse.rows.length; ix++)
        {
            const recordToInformServer = unsertStatusResponse.rows.item(ix);
            const messageIdToInformServer = recordToInformServer.messageId;

            const socketData = {
                "request": "CHAT_MESSAGE_GROUP_WAS_RECEIVED_AND_RECORDED",
                "params": [
                    messageIdToInformServer
                ]
            }

            sendSocketText(JSON.stringify(socketData));
        }

        processingMessageGroupToInformServerWasReceivedService = false;
    }, serviceFrequencyTime);
}

function startMessageToInformServerWasReceivedService()
{
    if(itvMessageToInformServerWasReceivedService != null)
    {
        clearInterval(itvMessageToInformServerWasReceivedService);
        itvMessageToInformServerWasReceivedService = null;
    }

    const serviceFrequencyTime = 5000;

    itvMessageToInformServerWasReceivedService = setInterval(async function(){
        if(processingMessageToInformServerWasReceivedService == true)
        {
            return;
        }

        if(restoreDatabaseProcessing == true)
        {
            return;
        }

        if(afterRestoreDatabaseProcessing == true)
        {
            return;
        }

        if(webSocket == null)
        {
            return;
        }

        const connectionState = webSocket.readyState;

        if(connectionState != SOCKET_OPEN)
        {
            return;
        }

        processingMessageToInformServerWasReceivedService = true;



        const unsentStatusQuery = `SELECT * FROM PendingMsgToInformServerReceived`;
        const unsentStatusQueryValues = [];
        const unsertStatusResponse = await dbRun(unsentStatusQuery, unsentStatusQueryValues);

        if(unsertStatusResponse == null)
        {
            processingMessageToInformServerWasReceivedService = false;
            return;
        }

        for(let ix = 0; ix < unsertStatusResponse.rows.length; ix++)
        {
            const recordToInformServer = unsertStatusResponse.rows.item(ix);
            const messageIdToInformServer = recordToInformServer.messageId;

            const socketData = {
                "request": "CHAT_MESSAGE_WAS_RECEIVED_AND_RECORDED",
                "params": [
                    messageIdToInformServer
                ]
            }

            sendSocketText(JSON.stringify(socketData));
        }

        processingMessageToInformServerWasReceivedService = false;
    }, serviceFrequencyTime);
}

function startOutgoingContactServedByCompanyService()
{
    if(itvOutgoingContactServedByCompanyService != null)
    {
        clearInterval(itvOutgoingContactServedByCompanyService);
        itvOutgoingContactServedByCompanyService = null;
    }

    itvOutgoingContactServedByCompanyService = setInterval(async function(){
        if(processingOutgoingContactServedByCompany == true)
        {
            return;
        }

        if(restoreDatabaseProcessing == true)
        {
            return;
        }

        if(afterRestoreDatabaseProcessing == true)
        {
            return;
        }

        if(webSocket == null)
        {
            return;
        }

        const connectionState = webSocket.readyState;

        if(connectionState != SOCKET_OPEN)
        {
            return;
        }

        processingOutgoingContactServedByCompany = true;

        const UNSENT_TAG = 0;
        const myUnsentContactServedByCompanyQuery = `SELECT * FROM ContactServedByCompany WHERE savedOnTheServer = ?`;
        const myUnsentContactServedByCompanyQueryValues = [UNSENT_TAG];
        const myContactServedByCompanyResponse = await dbRun(myUnsentContactServedByCompanyQuery, myUnsentContactServedByCompanyQueryValues);

        if(myContactServedByCompanyResponse == null)
        {
            processingOutgoingContactServedByCompany = false;
            return;
        }

        for(let ix = 0; ix < myContactServedByCompanyResponse.rows.length; ix++)
        {
            const contactServedByCompanyToSend = myContactServedByCompanyResponse.rows.item(ix);
            const contactId = contactServedByCompanyToSend.contact;
            const companyId = contactServedByCompanyToSend.company;

            console.log(`CONTSRVDBYCMPNYMSG: Trying to send contact served by company ${contactId} x ${companyId} ...`);

            const messageContactServedByCompanyUpdate = {
                "contact": contactId,
                "company": companyId
            }

            const socketData = {
                "request": "CONTACT_SERVED_BY_COMPANY_UPDATE",
                "params": [
                    messageContactServedByCompanyUpdate
                ]
            }

            sendSocketText(JSON.stringify(socketData));
        }

        processingOutgoingContactServedByCompany = false;

    }, 1000);
}

async function startCompanyMemberSyncService()
{
    await companyMemberServiceRun();
    
    if(itvCompanyMemberSyncService != null)
    {
        clearInterval(itvCompanyMemberSyncService);
        itvCompanyMemberSyncService = null;
    }

    const intervalTime = 10000;

    itvCompanyMemberSyncService = setInterval(async function(){

        companyMemberServiceRun();

    },intervalTime);
}

async function companyMemberServiceRun()
{
    if(webSocket == null)
    {
        return;
    }

    const connectionState = webSocket.readyState;

    if(connectionState != SOCKET_OPEN)
    {
        return;
    }

    const sqlQuery = `SELECT * FROM CompanyMembers WHERE IsServerUpdated = 0`;
    const sqlQueryValues = [];

    const dbResponse = await dbRun(sqlQuery,sqlQueryValues);

    if(dbResponse == null)
    {
        return;
    }

    let list = [];

    for(let ix=0; ix < dbResponse.rows.length; ix++)
    {
        const record = dbResponse.rows.item(ix);

        list.push(record);
    }

    const socketRequest = {
        "request": "COMPANY_MEMBER_SYNC",
        "params": [
            list
        ]
    };

    sendSocketText(JSON.stringify(socketRequest));
}

function sendSocketText(messageContent) 
{
    let uid = readLocalStorage("uid");

    // Construct a msg object containing the data the server needs to process the message from the chat client.
    const msg = {
        type: "message",
        text: messageContent,
        id: uid,
        date: Date.now(),
    };
  
    // Send the msg object as a JSON-formatted string.
    webSocket.send(JSON.stringify(msg));
}

function mountPushNotificationEvents()
{
    // Check when the firebase token is updated
    if(typeof cordova.plugins.firebase != `undefined`)
    {
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            // writeInDebugText(`🚨 Browser mode skip firebase`);
            return;
        }

        try
        {
            cordova.plugins.firebase.messaging.onTokenRefresh(function() {
                console.log("Device token updated");
                
                // Update token register
                registerUserDevice();
            });
    
            cordova.plugins.firebase.messaging.onMessage(function(payload) {
                console.log("New foreground FCM message: ", payload);
                receiveForegroundNotificationPayload(payload);
            });
    
            cordova.plugins.firebase.messaging.onBackgroundMessage(function(payload) {
                console.log("New background FCM message: ", payload);
                receiveBackgroundNotificationPayload(payload);
            });
        }
        catch(firebaseEventsException)
        {
            // writeInDebugText(`🔴 Firebase event error: ${firebaseEventsException}`);
        }
    }
    else
    {
        // writeInDebugText(`🚨 The cordova.plugins.firebase is undefined`);
    }
}

async function registerUserDevice() 
{
    // writeInDebugText(`🛠️ Register user device called`);

    if(isLoggedIn() == false)
    {
        // writeInDebugText(`🔴 User not logged in cannot register device`);
        return;
    }

    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        // writeInDebugText(`🔴 Browser mode cannot register device`);
        return;
    }

    if(loginIsExpiredByServer == true)
    {
        return;
    }

    try
    {
        let fcmToken = "";
        let notificationPermissionOK = false;
        if(typeof cordova.plugins.firebase != `undefined`)
        {
            // writeInDebugText(`🟡 Checking notification enabled...`);
            notificationPermissionOK = await notificationIsEnabled();
    
            if(notificationPermissionOK == false)
            {
                // writeInDebugText(`🟡 Notification not allowed, asking to enable...`);
                let notificationPermissionAsk = await notificationRequestPermission(false);
                notificationPermissionOK = await notificationIsEnabled();
                pushMessagingAllowed = notificationPermissionOK;
            }
    
            // writeInDebugText(`🟢 Notification allowance: ${notificationPermissionOK}`);
    
            // writeInDebugText(`🟡 Retrieving firebase token...`);
            fcmToken = await cordova.plugins.firebase.messaging.getToken();
            // writeInDebugText(`🟢 Firebase Token: ${fcmToken}`);
    
            cordova.plugins.firebase.messaging.subscribe("falaqui-news");
            // writeInDebugText(`🛠️ Token subscribed to news`);
        }
        else
        {
            // writeInDebugText(`🚨 The cordova.plugins.firebase is undefined`);
        }
    
        // writeInDebugText(`🟡 Sending registration to server...`);
    
        const platformId = cordova.platformId;
    
        pushMessagingFCMToken = fcmToken;
        pushMessagingAllowed = notificationPermissionOK;
    
        const callData = {
            "platform": platformId,
            "fcmdevicetoken": fcmToken
        };
    
        callS(true, `POST`, `/services/registeruserdevice`, callData);
    
        // writeInDebugText(`🟢 Device registration done.`);
    }
    catch(deviceRegistrationError)
    {
        // writeInDebugText(`🔴 Device registration error: ${deviceRegistrationError}`);
    }
}

function notificationRequestPermission(forceShow)
{
    return new Promise(async (resolve, reject) =>{
        if(forceShow == null)
        {
            forceShow = true;
        }

        let permissionResponse = null;
        try
        {
            permissionResponse = await cordova.plugins.firebase.messaging.requestPermission({"forceShow": forceShow});
        }
        catch(permissionException)
        {

        }

        resolve(permissionResponse);
    })
}

function requestNotificationAuthorizationForIOS()
{
    return new Promise((reolve, reject) =>{
        cordova.plugins.diagnostic.requestRemoteNotificationsAuthorization({
            successCallback: function(){
                resolve();
            },
            errorCallback: function(err){
               console.error("Error requesting remote notifications authorization: " + err);
               resolve();
            },
            types: [
                cordova.plugins.diagnostic.remoteNotificationType.ALERT,
                cordova.plugins.diagnostic.remoteNotificationType.SOUND,
                cordova.plugins.diagnostic.remoteNotificationType.BADGE
            ],
            omitRegistration: false
        });
    })
}



async function receiveBackgroundNotificationPayload(payload)
{
    const badgeNumber = payload.badge != null ? parseInt(payload.badge) : 0;
    if(badgeNumber > 0)
    {
        // cordova.plugins.firebase.messaging.setBadge(badgeNumber);
        setDeviceBadge(badgeNumber);
    }
    else
    {
        cordova.plugins.firebase.messaging.clearNotifications();

        if(cordova.platformId != 'ios')
        {
            setBadgeToZero();

        }
    }

    if(payload == null)
    {
        return;
    }

    const loggedIn = isLoggedIn();
    if(loggedIn == false)
    {
        return;
    }

    let company = typeof payload.company != `undefined` ? payload.company : "";
    let connectionBody = typeof payload.connection != `undefined` ? payload.connection : "0";
    if(connectionBody.trim().length == 0)
    {
        connectionBody = "0"; // Default connection
    }

    let selectedConnection = getSelectedAppServerConnection();


    if(typeof payload.source != `undefined`)
    {
        if(payload.source != `E-M-P-T-Y`)
        {
            const fromLogin = payload.source;
            let messageId = null;
    
            if(typeof payload.messageid != `undefined`)
            {
                messageId = payload.messageid;
            }
    
            if(payload.isGroup == null)
            {
                payload.isGroup = "false";
            }
            
            if(payload.isGroup.toString() == "true")
            {
                const groupId = payload.groupId;

                if(connectionBody != selectedConnection.id)
                {
                    // Switch connection to continue
                    await requestDoConnectionSwitch(connectionBody, groupId);
                }
                else
                {
                    openChatWithContact(groupId);
                }
            }
            else
            {
                if(connectionBody != selectedConnection.id)
                {
                    // Switch connection to continue
                    await requestDoConnectionSwitch(connectionBody, fromLogin);
                }
                else
                {
                    openChatWithContact(fromLogin);                    
                }
            }

        }
    }
}

async function receiveForegroundNotificationPayload(payload)
{
    const badgeNumber = payload.badge != null ? parseInt(payload.badge) : 0;
    if(badgeNumber > 0)
    {
        // cordova.plugins.firebase.messaging.setBadge(badgeNumber);
        setDeviceBadge(badgeNumber);
    }
    else
    {
        cordova.plugins.firebase.messaging.clearNotifications();

        if(cordova.platformId != 'ios')
        {
            setBadgeToZero();
        }
    }

    showInternalNotification(payload);
}

async function showInternalNotification(payload)
{

    if($(`#chatInternalNotificationList`).length == 0)
    {
        return;
    }

    const MAX_NOTIFICATIONS = 3;

    const notificationTitle = payload.title;
    const notificationBody = payload.body;
    const notificationFromLogin = payload.source;
    const defaultNotificationPhoto = `/images/notification-bell.png`
    const isGroup = typeof payload.isGroup != `undefined` ? payload.isGroup == "true" : false;
    const groupId = typeof payload.groupId != `undefined` ? payload.groupId : "";
    let company = typeof payload.company != `undefined` ? payload.company : "";
    let connectionBody = typeof payload.connection != `undefined` ? payload.connection : "0";
    if(connectionBody.trim().length == 0)
    {
        connectionBody = "0"; // Default connection
    }

    const isTalkingToMessageSource = isGroup == false ? (talkToId == notificationFromLogin) : (talkToId == groupId)

    if(isTalkingToMessageSource == true)
    {
        return;
    }

    let notificationPhoto = defaultNotificationPhoto;
    
    if(notificationFromLogin.trim().length > 0)
    {
        if(notificationFromLogin != `E-M-P-T-Y`)
        {
            notificationPhoto = `${endpoint}services/userphotoraw/${notificationFromLogin}`
        }
    }

    var internalNotificationId = `in_${makeid(10)}`;
    const htmlNotificationItem = `
    <a id="${internalNotificationId}" href="#!" class="internal-notification-item collection-item" style="" data-fromlogin="${notificationFromLogin}" data-groupid="${groupId}" data-company="${company}" data-connection="${connectionBody}">
        <img src="${notificationPhoto}" onerror="this.src = '${defaultNotificationPhoto}'" class="internal-notification-photo" />
        <span class="internal-notification-title">${notificationTitle}</span>
        <div>
            <span class="internal-notification-text">${notificationBody}</span>
        </div>
    </a>
    `;

    $(`#audioChatNotification`)[0].play();

    const NOTIFICATION_SHOW_TIMEOUT = 5000;

    $(`#chatInternalNotificationList`).removeClass(`hide`);
    $(`#chatInternalNotificationList`).append(htmlNotificationItem);

    $(`#${internalNotificationId}`).fadeIn(1000, function() {
        // Animation complete

        setTimeout(function(){
            $(`#${internalNotificationId}`).fadeOut(2000, function() {
                // Animation complete
                $(`#${internalNotificationId}`).remove();
    
                if($(`.internal-notification-item`).length == 0)
                {
                    $(`#chatInternalNotificationList`).addClass(`hide`);
                }    
            });
            
        }, NOTIFICATION_SHOW_TIMEOUT);
    });

    $(`.internal-notification-item`).off(`click`);
    $(`.internal-notification-item`).on(`click`, async function(){
        const contactFrom = $(this).attr(`data-fromlogin`);
        const groupId = $(this).attr(`data-groupid`);
        const company = $(this).attr(`data-company`);
        const connection = $(this).attr(`data-connection`);

        let selectedConnection = getSelectedAppServerConnection();

        if(groupId.trim().length > 0)
        {
            if(connection != selectedConnection.id)
            {
                // Switch connection to continue
                await requestDoConnectionSwitch(connection, groupId);
            }
            else
            {
                openChatWithContact(groupId);
            }


            return;
        }

        if(contactFrom.trim().length == 0)
        {
            return;
        }

        if(contactFrom == `E-M-P-T-Y`)
        {
            return;
        }

        if(connection != selectedConnection.id)
        {
            // Switch connection to continue
            await requestDoConnectionSwitch(connection, contactFrom);
        }
        else
        {
            openChatWithContact(contactFrom);
        }
    });

    if($(`.internal-notification-item`).length > MAX_NOTIFICATIONS)
    {
        $(`#chatInternalNotificationList`).find(">:first-child").remove();
    }
}



function notificationIsEnabled()
{
    return new Promise((resolve, reject) =>{
        if(typeof cordova.plugins.diagnostic != `undefined`)
        {
            cordova.plugins.diagnostic.isRemoteNotificationsEnabled(function(isEnabled){
                // console.log("Push notifications are " + (isEnabled ? "enabled" : "disabled"));
                resolve(isEnabled);
            }, function(error){
                console.error("Push notifications enabled check error: " + error);
                resolve(false);
            });    
        }
        else
        {
            console.error("Plugin not installed");
            resolve(false);
        }
    });
}

function cameraIsAuthorized()
{
    return new Promise((resolve, reject) =>{
        if(typeof cordova.plugins.diagnostic != `undefined`)
        {
            cordova.plugins.diagnostic.isCameraAuthorized(function(isEnabled){
                resolve(isEnabled);
            }, function(error){
                resolve(false);
            });    
        }
        else
        {
            resolve(false);
        }
    });    
}

function cameraRollIsEnabled()
{
    return new Promise((resolve, reject) =>{
        if(typeof cordova.plugins.diagnostic != `undefined`)
        {
            cordova.plugins.diagnostic.isCameraRollAuthorized(function(isEnabled){
                resolve(isEnabled);
            }, function(error){
                resolve(false);
            });    
        }
        else
        {
            resolve(false);
        }
    });    
}

function microphoneIsEnabled()
{
    return new Promise((resolve, reject) =>{
        if(typeof cordova.plugins.diagnostic != `undefined`)
        {
            cordova.plugins.diagnostic.isMicrophoneAuthorized(function(isEnabled){
                resolve(isEnabled);
            }, function(error){
                resolve(false);
            });    
        }
        else
        {
            resolve(false);
        }
    });
}

function requestMicrophoneAuthorization()
{
    return new Promise((resolve, reject) =>{
        cordova.plugins.diagnostic.requestMicrophoneAuthorization(function(status){
            if(status === cordova.plugins.diagnostic.permissionStatus.GRANTED)
            {
                resolve(true);
            }
            else
            {
                resolve(false);
            }
         }, function(error){
            resolve(false);
            console.log(`Unable to authorize mic: ${error}`);
         });
    })
}

// function externalStorageIsAuthorized()
// {
//     return new Promise((resolve, reject) =>{
//         if(typeof cordova.plugins.diagnostic != `undefined`)
//         {
//             cordova.plugins.diagnostic.isExternalStorageAuthorized(function(isAuhtorized){
//                 resolve(isAuhtorized);
//             }, function(error){
//                 resolve(false);
//             });    
//         }
//         else
//         {
//             resolve(false);
//         }
//     });
// }

// function requestExternalStorageAuthorization()
// {
//     return new Promise((resolve, reject) =>{
//         cordova.plugins.diagnostic.requestExternalStorageAuthorization(function(status){
//             if(status === cordova.plugins.diagnostic.permissionStatus.GRANTED)
//             {
//                 resolve(true);
//             }
//             else
//             {
//                 resolve(false);
//             }
//          }, function(error){
//             resolve(false);
//             console.log(`Unable to authorize external storage: ${error}`);
//          });
//     })
// }

async function clearNotifications()
{
    if(typeof cordova.plugins.firebase != `undefined`)
    {
        if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
        {
            cordova.plugins.firebase.messaging.clearNotifications();

            if(cordova.platformId != 'ios')
            {
                setBadgeToZero();
            }
        }
    }

    if(isLoggedIn() == true)
    {
        await callS(true, `POST`, `/services/clearbackendnotifications`, null);
    }
}

async function preTranslate()
{
    const textResponse = await fetch("./js/apptexts.json");
    // const textResponse = await fetch("https://localhost/js/apptexts.json");
    
    baseTexts = await textResponse.json();
    // listVisibleUnderTranslation = $("[data-lang]:visible");
    // listVisibleUnderTranslation.css("visibility", "hidden");
}

function mountPrototypes()
{
    Number.prototype.countDecimals = function () {
        if(Math.floor(this.valueOf()) === this.valueOf()) return 0;
        return this.toString().split(".")[1].length || 0; 
    }
}

function isLoggedIn()
{
    let loginToken = readLocalStorage("login");
    let uid = readLocalStorage("uid");

    if(uid == null || loginToken == null)
    {
        return false;
    }

    return true;
}

function redirect(page)
{
    window.location = page;
}

function redirectToRight(page)
{
    let animationTime = 400;
    $(".wrap-app").css(`position`, `relative`);
    $(".wrap-app").animate({left: window.screen.width * -1, opacity: 0.0}, animationTime, function(){
        window.location = page;
    });

    return true;
}

function redirectToLeft(page)
{
    let animationTime = 400;
    $(".wrap-app").css(`position`, `relative`);
    $(".wrap-app").animate({left: window.screen.width, opacity: 0.0}, animationTime, function(){
        window.location = page;
    });

    return true;
}

function  openInAppBrowser(url, closeSwalWhenReady)
{
    var target = "_blank";
    var options = "location=yes,hidden=yes,beforeload=yes";

    inAppBrowserRef = cordova.InAppBrowser.open(url, target, options);

    inAppBrowserRef.addEventListener('loadstart', function(){
        // $('#status-message').text("loading please wait ...");

        if(closeSwalWhenReady != null)
        {
            if(closeSwalWhenReady == true)
            {
                swal.close();
            }
        }
    });

    inAppBrowserRef.addEventListener('loadstop', function(){
        if (inAppBrowserRef != undefined) 
        {

        //     inAppBrowserRef.insertCSS({ code: "body{font-size: 25px;}" });
    
        //     inAppBrowserRef.executeScript({ code: "\
        //         var message = 'this is the message';\
        //         var messageObj = {my_message: message};\
        //         var stringifiedMessageObj = JSON.stringify(messageObj);\
        //         webkit.messageHandlers.cordova_iab.postMessage(stringifiedMessageObj);"
        //     });
    
        //     $('#status-message').text("");
    
            inAppBrowserRef.show();
        }
    });

    inAppBrowserRef.addEventListener('loaderror', function(params){
        // $('#status-message').text("");

        // var scriptErrorMesssage =
        //    "alert('Sorry we cannot open that page. Message from the server is : "
        //    + params.message + "');"
    
        // inAppBrowserRef.executeScript({ code: scriptErrorMesssage }, function(paramsExec){
        //     if (paramsExec[0] == null) {

        //         $('#status-message').text(
        //            "Sorry we couldn't open that page. Message from the server is : '"
        //            + paramsExec.message + "'");
        //     }
        // });
    
        inAppBrowserRef.close();
    
        inAppBrowserRef = undefined;
    });

    inAppBrowserRef.addEventListener('beforeload', function(params, callback){
        // if (params.url.startsWith("http://www.example.com/")) {

        // // Load this URL in the inAppBrowser.
        // callback(params.url);
        // } else {

        //     // The callback is not invoked, so the page will not be loaded.
        //     $('#status-message').text("This browser only opens pages on http://www.example.com/");
        // }
    });

    inAppBrowserRef.addEventListener('message', function(params){
        // $('#status-message').text("message received: "+params.data.my_message);
    });

    inAppBrowserRef.addEventListener('exit', function(params){
        if(typeof inAppBrowserRef == `undefined`)
        {
            return;
        }

        inAppBrowserRef.close();
        inAppBrowserRef = undefined;
    });
}

/**
 * Method which will take care of opening a given URL in a new tab. For Cordova based applications, the link can
 * open in the system's default browser. While for normal browser, it will open a new tab.
 */
function openInNewTab(url) 
{
    // If WebKit message handler is available, send the message through it to Cordova application
    if (window.webkit && webkit.messageHandlers && webkit.messageHandlers.cordova_iab) 
    {
        // This means we are in a Cordova WebView
        
        const data = {
            // Custom event name
            eventName: 'open-external-url-in-new-tab',
            url: url
        }

        // Send message to InAppBrowser event listener so that Cordova app can handle it.
        webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(data))
    } 
    else 
    {

        // Otherwise we are in normal browser so directly open in the new tab
        window.open(url, '_blank');
    }

    return false;
}

function preparePreviousLoadedTranslationInfo()
{
    if(forcedCountryCode == null)
    {
        if(readLocalStorage("country") != null)
        {
            countryCode = readLocalStorage("country");
        }    
    }
    else
    {
        countryCode = forcedCountryCode;
    }

    if(readLocalStorage("texts") != null)
    {
        if(readLocalStorage("country") != null || readLocalStorage("forcedlanguage") != null)
        {
            // translate();
            return true;
        }
    }

    return false;
}

function translate()
{
    //Get most updated texts from storage
    var strTexts = readLocalStorage("texts");
    if(strTexts == null)
    {
        translateDone = true;
        return;
    }

    try
    {
        allTexts = JSON.parse(strTexts);
    }
    catch(jsonParserError)
    {
        translateDone = true;
        return;
    }

    $('[data-lang]').each(function() {
        var key = $(this).attr('data-lang');
        var text = getTranslate(key, null);

        if(text != null)
        {
            $(this).text(text);
            if(typeof M !== "undefined")
            {
                setTimeout(function(){
                    M.updateTextFields();
                }, 1000);
                
            }
        }
    });

    $('[data-langurl]').each(function() {
        var key = $(this).attr('data-langurl');
        var url = getTranslate(key, null);

        if(url != null)
        {
            $(this).attr('href', url);
            if(typeof M !== "undefined")
            {
                setTimeout(function(){
                    M.updateTextFields();
                }, 1000);
            }
        }
    });

    $('[data-langplaceholder]').each(function() {
        var key = $(this).attr('data-langplaceholder');
        var placeholder = getTranslate(key, null);

        if(placeholder != null)
        {
            $(this).attr('placeholder', placeholder);

            if(typeof Materialize !== "undefined")
            {
                setTimeout(function(){
                    M.updateTextFields();
                }, 1000);
            }
        }
    });

    // if(listVisibleUnderTranslation != null)
    // {
    //     listVisibleUnderTranslation.css("visibility", "");
    //     listVisibleUnderTranslation = null;
    // }

    translateDone = true;
}

function getTranslate(key, fallbackText)
{
    var defaultCountryCode = forcedCountryCode == null ? countryCode : forcedCountryCode;
    if(defaultCountryCode == null)
    {
        defaultCountryCode = "GB";
    }

    var userCountry = readLocalStorage("country");
    if(userCountry == null)
    {
        userCountry = defaultCountryCode;
    }

    let forcedLanguage = readLocalStorage("forcedlanguage");
    if(forcedLanguage != null)
    {
        userCountry = forcedLanguage;
    }

    if(allTexts.length == 0)
    {
        if(baseTexts != null)
        {
            allTexts = baseTexts;
        }
    }

    var filtered = allTexts.filter(function (el) {
        return el.id == key
    });

    var text = fallbackText;
    if(filtered.length > 0)
    {
        text = filtered[0][userCountry];
        if(text == null)
        {
            text = filtered[0]["default"];
        }

        if(text == null)
        {
            text = fallbackText;
        }
    }

    return text;
}

async function downloadTexts()
{
    let forcedLanguage = readLocalStorage("forcedlanguage");
    // if(forcedLanguage == null)
    // {
    //     forcedLanguage = "GB";
    // }

    let response = null;


    try
    {
        response = await callS(false, `GET`, `/services/texts`, null);
    }
    catch(downloadException)
    {
        let errText = downloadException.responseText != null ? downloadException.responseText : downloadException.toString();
        console.log(`Unable to download texts ${errText}`);
    }

    if(response == null)
    {
        return false;
    }

    var strTexts = JSON.stringify(response.texts);

    

    writeLocalStorage("texts", strTexts);

    var country = forcedLanguage == null ? readLocalStorage("country") : forcedLanguage;
    if(response.language_list != null)
    {
        var strLanguageList = JSON.stringify(response.langList);
        writeLocalStorage("languagelist", strLanguageList);

        let langIndex = response.language_list.findIndex((item) =>{
            return item.country.toLowerCase().trim() == country.toLowerCase().trim();
        });

        if(langIndex == -1)
        {
            if(country != `GB`)
            {
                country = `GB`;
            }
        }
    }

    if(country == null)
    {
        country = `GB`;
    }

    writeLocalStorage("country", country);
}

async function useBaseTexts()
{
    await waitBaseTextsLoad();
    var strTexts = JSON.stringify(baseTexts);
    writeLocalStorage("texts", strTexts);
}

function waitBaseTextsLoad()
{
    return new Promise((resolve, reject) =>{
        if(baseTexts != null)
        {
            resolve(baseTexts);
            return;
        }

        var itvLoadBaseTexts = setInterval(function(){
            if(baseTexts != null)
            {
                clearInterval(itvLoadBaseTexts);
                resolve(baseTexts);
            }
        }, 20);
    })
}

function isResponseWithForbiddenCode(response)
{
    if(response == null)
    {
        return false;
    }

    if(typeof response.responseJSON == `undefined`)
    {
        return false;
    }

    if(response.responseJSON == null)
    {
        return false;
    }
     
    if(typeof response.responseJSON != `object`)
    {
        return false;
    }

    if(typeof response.responseJSON.code == `undefined`)
    {
        return false;
    }

    if(response.responseJSON.code == null)
    {
        return false;
    }

    if(response.responseJSON.code != `FBD`)
    {
        return false;
    }

    return true;
}

function callS(authHeader, callType, callURL, callData)
{
    return callSPromise(endpoint, authHeader, callType, callURL, callData);
}

function callSDefaultServer(authHeader, callType, callURL, callData)
{
    return callSPromise(defaultServerEndpoint, authHeader, callType, callURL, callData);
}

function callSPromise(serverEndpoint, authHeader, callType, callURL, callData)
{
    return new Promise((resolve, reject) =>{
        callSFunction(serverEndpoint, authHeader, callType, callURL, callData, (response) =>{
            resolve(response);
        }, (response) =>{
            reject(response);

            if(authHeader == true)
            {
                const isForbidden = isResponseWithForbiddenCode(response);
                if(isForbidden == true)
                {
                    var tokenValue = readLocalStorage("login");

                    console.log(`Forbidden to use login token ${tokenValue}`);
                    forceDisconnect();
                }
            }
        }, (response) =>{
            //Empty
        })
    });
}

function callSFunction(serverEndpoint, authHeader, callType, callURL, callData, onSuccess, onFail, onFinish)
{
    if(device == null)
    {
        if(lastReadDeviceObject != null)
        {
            device = lastReadDeviceObject;
        }
    }



    let DEVICE_UUID = typeof device != `undefined` ? (device.uuid != null ? device.uuid : "") : "";
    if(DEVICE_UUID.length == 0)
    {
        if(clientUniqueId != null)
        {
            DEVICE_UUID = clientUniqueId;
        }
    }

    if(callURL.startsWith(serverEndpoint) == false)
    {
        if(serverEndpoint.endsWith('/') && callURL.startsWith('/'))
        {
            callURL = callURL.substring(1);
        }
        callURL = serverEndpoint + callURL;
    }

    if(callData == null)
    {
        if(authHeader)
        {
            var token = readLocalStorage("login");

            if(token == null)
            {
                token = "";
            }

            var request = $.ajax({
                type: callType,
                url: callURL,
                timeout: DEFAULT_AJAX_RESPONSE_TIMEOUT,
                beforeSend: function (xhr) {
                    /* Authorization header */
                    xhr.setRequestHeader("Authorization", "Bearer " + token);
                    xhr.setRequestHeader("x-uuid", DEVICE_UUID);
                    xhr.setRequestHeader("x-fcc", forcedCountryCode != null ? forcedCountryCode : '');
                }
            }).done(function( response ) {
                onSuccess(response);    
                onFinish(response);
            }).fail(function(xhr, status, error) {
                onFail(xhr, status, error);    
                onFinish(xhr);
            });           
        }
        else
        {
            var request = $.ajax({
                type: callType,
                url: callURL,
                timeout: DEFAULT_AJAX_RESPONSE_TIMEOUT,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("x-uuid", DEVICE_UUID);
                    xhr.setRequestHeader("x-fcc", forcedCountryCode != null ? forcedCountryCode : '');
                }
            }).done(function( response ) {
                onSuccess(response);    
                onFinish(response);
            }).fail(function(xhr, status, error) {
                onFail(xhr, status, error);    
                onFinish(xhr);
            });
        }
    }
    else
    {
        if(authHeader)
        {
            var token = readLocalStorage("login");

            if(token == null)
            {
                token = "";
            }

            var request = $.ajax({
                type: callType,
                data: callData,
                url: callURL,
                timeout: DEFAULT_AJAX_RESPONSE_TIMEOUT,
                dataType: 'JSON',
                beforeSend: function (xhr) {
                    /* Authorization header */
                    xhr.setRequestHeader("Authorization", "Bearer " + token);
                    xhr.setRequestHeader("x-uuid", DEVICE_UUID);
                    xhr.setRequestHeader("x-fcc", forcedCountryCode != null ? forcedCountryCode : '');
                }
            }).done(function( response ) {
                onSuccess(response);    
                onFinish(response);
            }).fail(function(xhr, status, error) {
                onFail(xhr, status, error);
                onFinish(xhr);
            });

        }
        else
        {
            var request = $.ajax({
                type: callType,
                data: callData,
                url: callURL,
                timeout: DEFAULT_AJAX_RESPONSE_TIMEOUT,
                dataType: 'JSON',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("x-uuid", DEVICE_UUID);
                    xhr.setRequestHeader("x-fcc", forcedCountryCode != null ? forcedCountryCode : '');
                }
            }).done(function( response ) {
                onSuccess(response);    
                onFinish(response);
            }).fail(function(xhr, status, error) {
                onFail(xhr, status, error);    
                onFinish(xhr);
            });
        }
    }
    
}

function uploadFileToServer(callURL, fileUri, customFileName, arrCustomHeaders, arrCustomFormData, customTimeout) 
{
    return new Promise((resolve, reject) =>{
        const TIMEOUT_MS = customTimeout == null ? 30000 : customTimeout;
        var uploadTimedout = false;
        var finished = false;

        setTimeout(function(){
            if(finished == false)
            {
                uploadTimedout = true;
                reject(`Upload timeout`);
            }
        }, TIMEOUT_MS);


        var fileName = fileUri.replace(/^.*[\\/]/, '').split('?')[0];

        if(customFileName != null)
        {
            if(customFileName.trim().length > 0)
            {
                fileName = customFileName.trim();
            }
        }

        var DEVICE_UUID = typeof device != `undefined` ? (device.uuid != null ? device.uuid : "") : "";
        if(DEVICE_UUID.length == 0)
        {
            if(clientUniqueId != null)
            {
                DEVICE_UUID = clientUniqueId;
            }
        }

        var token = readLocalStorage("login");

        if(token == null)
        {
            token = "";
        }

        if(callURL.startsWith(endpoint) == false)
        {
            if(endpoint.endsWith('/') && callURL.startsWith('/'))
            {
                callURL = callURL.substring(1);
            }
            callURL = endpoint + callURL;
        }

        //window.resolveLocalFileSystemURL(fileUri, function (fileEntry) {
        getFileEntry(fileUri, false, false, function(fileEntry, getFileEntryErr) {

            if(fileEntry == null)
            {
                reject(getFileEntryErr);
                return;
            }

            fileEntry.file(function (file) {
                var reader = new FileReader()
                reader.onloadend = function () {
                    var blob = new Blob([new Uint8Array(this.result)], { type: 'application/octet-stream' })
                    var fd = new FormData()
            
                    fd.append('file', blob, fileName);

                    if(arrCustomFormData != null)
                    {
                        for(let ixFD = 0; ixFD < arrCustomFormData.length; ixFD++)
                        {
                            const customFormItem = arrCustomFormData[ixFD];
                            fd.append(customFormItem.key, customFormItem.value);
                        }
                    }
            
                    var xhr = new XMLHttpRequest()

                    xhr.open('POST', callURL, true);

                    xhr.setRequestHeader("Authorization", "Bearer " + token);
                    xhr.setRequestHeader("x-uuid", DEVICE_UUID);
                    xhr.setRequestHeader("x-fcc", forcedCountryCode != null ? forcedCountryCode : '');

                    if(arrCustomHeaders != null)
                    {
                        for(let ixH = 0; ixH < arrCustomHeaders.length; ixH++)
                        {
                            const customHeaderItem = arrCustomHeaders[ixH];
                            xhr.setRequestHeader(customHeaderItem.key, customHeaderItem.value);
                        }
                    }

                    xhr.onload = function () {
                        if (xhr.status === 200) 
                        {
                            let resultResponse = xhr.responseText;
                            try
                            {
                                resultResponse = JSON.parse(resultResponse);
                            }
                            catch(parseException)
                            {

                            }

                            if(uploadTimedout == true)
                            {
                                return;
                            }

                            resolve(resultResponse);
                            finished = true;
                        } 
                        else
                        {
                            if(uploadTimedout == true)
                            {
                                return;
                            }
                            
                            reject(xhr.status);
                            finished = true;
                        }
                    }

                    xhr.onerror = function (err) {
                        if(uploadTimedout == true)
                        {
                            return;
                        }

                        reject(err);
                        finished = true;
                    }
                    
                    xhr.send(fd)
                }
                reader.readAsArrayBuffer(file)
            }, function (err) {
                if(uploadTimedout == true)
                {
                    return;
                }

                reject(err);
                finished = true;
            })
        }, function(err){
            console.log(`FileSystem Error reading ${fileUri}`);
            console.log(err);
            reject(err);
            finished = true;
        });
    });
}

function downloadFileFromServer(downloadURL, directoryPath, fileName, timeoutValue)
{
    return new Promise((resolve, reject) =>{
        var DEVICE_UUID = typeof device != `undefined` ? (device.uuid != null ? device.uuid : "") : "";
        if(DEVICE_UUID.length == 0)
        {
            if(clientUniqueId != null)
            {
                DEVICE_UUID = clientUniqueId;
            }
        }

        var token = readLocalStorage("login");

        if(token == null)
        {
            token = "";
        }

        var xhr = new XMLHttpRequest();
        // Make sure you add the domain name to the Content-Security-Policy <meta> element.
        xhr.open("GET", downloadURL, true);

        xhr.setRequestHeader("Authorization", "Bearer " + token);
        xhr.setRequestHeader("x-uuid", DEVICE_UUID);
        xhr.setRequestHeader("x-fcc", forcedCountryCode != null ? forcedCountryCode : '');

        if(timeoutValue != null)
        {
            xhr.timeout = timeoutValue;
        }

        // Define how you want the XHR data to come back
        xhr.responseType = "blob";

        var fileEntry = null;

        const loadReadyFunction = (oEvent) => {
            if (xhr.status === 200)
            {
                var blob = xhr.response; // Note: not oReq.responseText

                fileEntry.createWriter(function (fileWriter) {

                    var resolveEnd = false;

                    fileWriter.onwriteend = function() {

                        // console.log(`Written path: ${fileEntry.fullPath}: ${fileEntry.toURL()} | ${fileEntry.toInternalURL()}`);

                        resolveEnd = true;
                        resolve();
                    };
            
                    fileWriter.onerror = function(e) {
                        console.log("Failed file write: " + e.toString());

                        setTimeout(function(){
                            if(resolveEnd == false)
                            {
                                reject(e);
                            }
                        }, 10000);
                        // reject("Failed file write: " + e.toString());
                    };
            
                    fileWriter.write(blob);
                });
            }
            else
            {
                reject(xhr.status);
            }
        }

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            browserFs.root.getFile(fileName, { create: true, exclusive: false }, function(fileEntryFs) {
                fileEntry = fileEntryFs;
                xhr.onload = loadReadyFunction;
                if(timeoutValue != null)
                {
                    xhr.ontimeout = function () { 
                        reject("[Timed out]");
                    }    
                }
                xhr.send(null);
            }, function(err){
                reject(err);
            });
        }
        else
        {
            window.resolveLocalFileSystemURL(directoryPath, function (dirEntry) {
                dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntryFs) {
                    fileEntry = fileEntryFs;
                    xhr.onload = loadReadyFunction;
                    if(timeoutValue != null)
                    {
                        xhr.ontimeout = function () { 
                            reject("[Timed out]");
                        }    
                    }
                    xhr.send(null);
                }, function (err) { 
                    reject(err);
                });
            }, function(err){
                reject(err);
            })            
        }


    });
    // return new Promise(async (resolve, reject) =>{
    //     let fileTransfer = new window.FileTransfer()

    //     var DEVICE_UUID = typeof device != `undefined` ? (device.uuid != null ? device.uuid : "") : "";
    //     if(DEVICE_UUID.length == 0)
    //     {
    //         if(clientUniqueId != null)
    //         {
    //             DEVICE_UUID = clientUniqueId;
    //         }
    //     }

    //     var token = readLocalStorage("login");

    //     if(token == null)
    //     {
    //         token = "";
    //     }

    //     const options = {
    //         headers: {
    //             "Authorization": "Bearer " + token,
    //             "x-uuid": DEVICE_UUID,
    //             "x-fcc": forcedCountryCode != null ? forcedCountryCode : ''
    //         }
    //     }
      
    //     // Downloading the file
    //     fileTransfer.download(downloadURL, filePath, function (entry) {
    //         resolve(entry);
    //     }, function (error) {
    //         // console.log(error)
    //         reject(error);
    //     }, false, options);
    // });
}

function getRootSystem(fileSystem)
{
    return new Promise((resolve, reject) =>{
        window.requestFileSystem(fileSystem, 0, function (systemEntry) {
            const documentsEntry = systemEntry.root;
            const documentsPath = documentsEntry.nativeURL
            resolve(documentsPath);
        });
    });
}

function localFileURLPathResolve(fileURLPath)
{
    return new Promise((resolve, reject) =>{

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            browserFs.root.getFile(fileURLPath, {}, function(fileEntry) {
                resolve({
                    "status": true,
                    "fileEntry": fileEntry,
                    "error": null
                });
            }, function(err) {
                resolve({
                    "status": false,
                    "fileEntry": null,
                    "error": err
                });
            });
        }
        else
        {
            // console.log(`👾 Try to load file path: ${fileURLPath}`);

            window.resolveLocalFileSystemURL(fileURLPath, function(fileEntry){
                resolve({
                    "status": true,
                    "fileEntry": fileEntry,
                    "error": null
                });
            },function(err){
                resolve({
                    "status": false,
                    "fileEntry": null,
                    "error": err
                });
            })
        }
    });
}

function localDirectoryURLPathResolve(dirURLPath)
{
    return new Promise((resolve, reject) =>{

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            browserFs.root.getDirectory(dirURLPath, {}, function(fileEntry) {
                resolve({
                    "status": true,
                    "fileEntry": fileEntry,
                    "error": null
                });
            }, function(err) {
                resolve({
                    "status": false,
                    "fileEntry": null,
                    "error": err
                });
            });
        }
        else
        {
            window.resolveLocalFileSystemURL(dirURLPath, function(fileEntry){
                resolve({
                    "status": true,
                    "fileEntry": fileEntry,
                    "error": null
                });
            },function(err){
                resolve({
                    "status": false,
                    "fileEntry": null,
                    "error": err
                });
            })
        }
    });
}

function getFullFileSystemPath(relativePath) 
{
    return new Promise((resolve, reject) =>{
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
            {
                if (browserFsInitError || !browserFs) 
                {
                    console.error('Browser file system is not initialized or an error occurred.');
                    resolve(null);
                    return;
                }
                
                // Ensure the relative path does not start with a '/'
                if (relativePath.startsWith('/')) 
                {
                    relativePath = relativePath.substring(1);
                }
            
                // Combine the browser file system root path with the relative path
                const fullPath = `${browserFs.root.toURL()}${relativePath}`;
                resolve(fullPath);
            }
            else
            {
                window.resolveLocalFileSystemURL(relativePath, function(fileEntry){
                    const fullPath = fileEntry.toURL();
                    resolve(fullPath);
                },function(err){
                    resolve(null);
                })
            }
    });
}

function rootSystemFileResolve(fileName, fileSystem)
{
    return new Promise((resolve, reject) =>{
        window.requestFileSystem(fileSystem, 0, function (systemEntry) {
            (async() =>{
                const documentsEntry = systemEntry.root;
                const documentsPath = documentsEntry.nativeURL
                const filePath = `${documentsPath}${fileName}`;
                const result = await localFileURLPathResolve(filePath);
                resolve(result);   
            }) ();
        });
    });
}

function deleteLocalFile(filePath)
{
    return new Promise((resolve, reject) =>{
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            if(filePath.toLowerCase().trim().startsWith("filesystem:") == true)
            {
                const fileName = getFileNameFromPath(filePath);
                filePath = `${imagesLocalFolderLocation}${fileName}`;
            }

            browserFs.root.getFile(filePath, {}, function(file) {
                file.remove(function(res){                        
                    resolve();
                }, function(err){
                    reject(err);
                });
            }, function(err) {
                reject(err);
            });
        }
        else
        {
            window.resolveLocalFileSystemURL(filePath, function(file){        
                file.remove(function(res){                        
                    resolve();
                }, function(err){
                    reject(err);
                });
            
            }, function(){
                // console.log('failure! file was not found')
                reject();
            });
        }
    });    
}

function deleteLocalDirectory(dirPath)
{
    return new Promise((resolve, reject) => {
        if (cordova.platformId === 'browser' || cordova.platformId === 'electron') {
            // For browser platform
            browserFs.root.getDirectory(dirPath, {}, function(dirEntry) {
                dirEntry.remove(function(res) {
                    resolve();
                }, function(error) {
                    reject(error);
                });
            }, function(error) {
                reject(error);
            });
        } else {
            // For other platforms (like Android or iOS)
            window.resolveLocalFileSystemURL(dirPath, function(dirEntry) {
                dirEntry.remove(function(res) {
                    resolve();
                }, function(error) {
                    reject(error);
                });
            }, function(error) {
                reject(error);
            });
        }
    });
}


function copyFile(baseFileURI, newName, destinationDir)
{
    return new Promise((resolve, reject) =>{
        window.resolveLocalFileSystemURL(baseFileURI, function(file){        
            window.resolveLocalFileSystemURL(destinationDir, function (destinationEntry) {
                file.copyTo(destinationEntry, newName, function(res){                        
                    // console.log('copying was successful to: ' + res.nativeURL)
                    resolve();
                }, function(err){
                    reject(err);
                });
            });
        }, function(){
            // console.log('failure! file was not found')
            reject();
        });
    });
}

function copyFileToFileSystemDirectory(baseFileURI, newName, fileSystem)
{
    return new Promise((resolve, reject) =>{
        window.resolveLocalFileSystemURL(baseFileURI, function(file){        
            window.requestFileSystem(fileSystem, 0, function (destinationEntry) {
                const documentsPath = destinationEntry.root;
                // console.log(documentsPath);
                file.copyTo(documentsPath, newName, function(res){                        
                    // console.log('copying was successful to: ' + res.nativeURL)
                    resolve();
                }, function(err){
                    reject(err);
                });
            });
        }, function(){
            // console.log('failure! file was not found')
            reject();
        });
    });
}

function getStorageDirectory()
{
    return new Promise((resolve, reject) =>{
        let sdStorage = null;

        if(cordova.platformId == 'android')
        {
            sdStorage = cordova.file.externalDataDirectory;
        }
        else if(cordova.platformId == 'ios')
        {
            sdStorage = cordova.file.syncedDataDirectory;
        }
        else if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            sdStorage = cordova.file.dataDirectory;
        }

        const internalStorage = cordova.file.dataDirectory;
   
        window.resolveLocalFileSystemURL(sdStorage, function (dirEntry) {
            resolve(sdStorage);
        }, function(err){
            resolve(internalStorage);
        })
    })

}

function base64toBlob(base64Data, contentType) 
{
    // Remove the base64 header (data:[<mediatype>][;base64],)
    const base64WithoutPrefix = base64Data.split(',')[1];
    
    // Convert base64 string to raw binary data held in a string
    const byteCharacters = atob(base64WithoutPrefix);
    
    // Create an array for storing the byte values
    const byteNumbers = new Array(byteCharacters.length);
    
    // Convert each character to its UTF-8 byte representation
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    // Convert byte numbers array to a typed array (Uint8Array)
    const byteArray = new Uint8Array(byteNumbers);
    
    // Create and return a new Blob object using the byte array
    return new Blob([byteArray], { type: contentType });

    // contentType = contentType || '';
    // var sliceSize = 1024;
    // var byteCharacters = atob(base64Data);
    // var bytesLength = byteCharacters.length;
    // var slicesCount = Math.ceil(bytesLength / sliceSize);
    // var byteArrays = new Array(slicesCount);
  
    // for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) 
    // {
    //     var begin = sliceIndex * sliceSize;
    //     var end = Math.min(begin + sliceSize, bytesLength);
    
    //     var bytes = new Array(end - begin);
    //     for (var offset = begin, i = 0 ; offset < end; ++i, ++offset) 
    //     {
    //         bytes[i] = byteCharacters[offset].charCodeAt(0);
    //     }
    //     byteArrays[sliceIndex] = new Uint8Array(bytes);
    // }
    // return new Blob(byteArrays, { type: contentType });
}

async function saveBase64ToFile(base64Data, mimeType, fileName)
{
    var base64Blob = base64toBlob(base64Data, mimeType) // mimeType example: 'image/jpeg'
    let fileEntry = await writeBlobFile(fileName, base64Blob);
    return fileEntry;
}

function writeFile(fileName, fileContent, mimeType)
{
    return new Promise((resolve, reject) =>{

        if(mimeType == null)
        {
            mimeType = 'text/plain';
        }

        const dataObj = new Blob([fileContent], { type: mimeType });

        let writeFileDirectory = null;
        if(cordova.platformId == 'android')
        {
            writeFileDirectory = cordova.file.externalDataDirectory;
        }
        else if(cordova.platformId == 'ios')
        {
            writeFileDirectory = cordova.file.syncedDataDirectory;
        }
        else if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            writeFileDirectory = cordova.file.dataDirectory;
        }

        window.resolveLocalFileSystemURL(writeFileDirectory, function(dir) {
            dir.getFile(fileName, { create: true }, function(fileEntry) {
                fileEntry.createWriter(function (fileWriter) {

                    fileWriter.onwriteend = function() {
                        resolve(fileEntry);
                    };
        
                    fileWriter.onerror = function (e) {
                        // console.log("Failed file write: " + e.toString());
                        let errorObject = e;
                        try
                        {
                            errorObject = JSON.stringify(errorObject);
                        }
                        catch
                        {
                            errorObject = e.toString();
                        }
                        reject("Failed file write: " + errorObject);
                    };
        
                    fileWriter.write(dataObj);
                });                
            });
        }, function(err){
            console.log(`FileSystem Error reading directory ${writeFileDirectory}`);
            console.log(err);
            reject(err);

        });
    });
}

function writeBlobFile(fileName, blobDataObj)
{
    return new Promise((resolve, reject) =>{

        var writeBlobToFileEntryFn = function(fileEntry, blob) {
            fileEntry.createWriter(function (fileWriter) {

                var resolveEnd = false;

                fileWriter.onwriteend = function() {

                    // console.log(`Written path: ${fileEntry.fullPath}: ${fileEntry.toURL()} | ${fileEntry.toInternalURL()}`);

                    resolveEnd = true;
                    resolve(fileEntry);
                };
        
                fileWriter.onerror = function(e) {
                    console.log("Failed blob to file write: " + e.toString());

                    setTimeout(function(){
                        if(resolveEnd == false)
                        {
                            reject(e);
                        }
                    }, 10000);
                    // reject("Failed file write: " + e.toString());
                };
        
                fileWriter.write(blob);
            });
        };

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            browserFs.root.getFile(fileName, { create: true, exclusive: false }, function(fileEntryFs) {
                writeBlobToFileEntryFn(fileEntryFs, blobDataObj);
            }, function(err){
                reject(err);
            });
        }
        else
        {
            const directoryPath = imagesLocalFolderLocation; // Set the images folder as directory path

            window.resolveLocalFileSystemURL(directoryPath, function (dirEntry) {
                dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntryFs) {
                    writeBlobToFileEntryFn(fileEntryFs, blobDataObj);
                }, function (err) { 
                    reject(err);
                });
            }, function(err){
                reject(err);
            })            
        }

    });
}

function createNewFileInDirectory(writeFileDirectory, fileName) {
    return new Promise((resolve, reject) => {
        if (cordova.platformId === 'browser' || cordova.platformId == 'electron') {
            // For browser platform, resolve the directory and then create the file
            browserFs.root.getDirectory(writeFileDirectory, {}, function(dirEntry) {
                dirEntry.getFile(fileName, { create: true }, function(fileEntry) {
                    const startContent = new Blob([""], { type: 'text/plain' });
        
                    fileEntry.createWriter(function (fileWriter) {
        
                        fileWriter.onwriteend = function() {
                            resolve(fileEntry);
                        };
            
                        fileWriter.onerror = function (e) {
                            let errorObject = e;
                            try {
                                errorObject = JSON.stringify(errorObject);
                            } catch {
                                errorObject = e.toString();
                            }
                            reject("Failed file write: " + errorObject);
                        };
            
                        fileWriter.write(startContent);
                    });
                }, reject);
            }, reject);
        } else {
            // For other platforms (like Android or iOS)
            window.resolveLocalFileSystemURL(writeFileDirectory, function(dirEntry) {
                dirEntry.getFile(fileName, { create: true }, function(fileEntry) {
                    const startContent = new Blob([""], { type: 'text/plain' });
        
                    fileEntry.createWriter(function (fileWriter) {
        
                        fileWriter.onwriteend = function() {
                            resolve(fileEntry);
                        };
            
                        fileWriter.onerror = function (e) {
                            let errorObject = e;
                            try {
                                errorObject = JSON.stringify(errorObject);
                            } catch {
                                errorObject = e.toString();
                            }
                            reject("Failed file write: " + errorObject);
                        };
            
                        fileWriter.write(startContent);
                    });
                }, reject);
            }, reject);
        }
    });
}

function createNewFolderInDirectory(parentDirectory, folderName) 
{
    return new Promise((resolve, reject) => {
        if (cordova.platformId === 'browser' || cordova.platformId === 'electron') {
            // For browser platform
            browserFs.root.getDirectory(parentDirectory, {}, function(dirEntry) {
                dirEntry.getDirectory(folderName, { create: true }, function(folderEntry) {
                    resolve(folderEntry);
                }, function(error) {
                    reject(`Failed to create folder in browser: ${error.message}`);
                });
            }, function(error) {
                reject(`Failed to resolve parent directory in browser: ${error.message}`);
            });
        } else {
            // For other platforms (like Android or iOS)
            window.resolveLocalFileSystemURL(parentDirectory, function(dirEntry) {
                dirEntry.getDirectory(folderName, { create: true }, function(folderEntry) {
                    resolve(folderEntry);
                }, function(error) {
                    reject(`Failed to create folder: ${error.message}`);
                });
            }, function(error) {
                reject(`Failed to resolve parent directory: ${error.message}`);
            });
        }
    });
}

function hasDeviceConnection()
{
    // For iOS emulator return always connected
    if(typeof device == `undefined`)
    {
        if(lastReadDeviceObject != null)
        {
            device = lastReadDeviceObject;
        }
        else
        {
            return true;
        }
    }

    if(device.isVirtual == true)
    {
        if(cordova.platformId == 'ios')
        {
            return true;
        }
    }

    if(typeof navigator == `undefined`)
    {
        if(lastReadNavigatorObject != null)
        {
            navigator = lastReadNavigatorObject;
        }
    }
    
    var networkState = navigator.connection.type;

    var result = false;

    switch(networkState)
    {
        case Connection.UNKNOWN:
            result = true;
            break;
        case Connection.ETHERNET:
            result = true;
            break;
        case Connection.WIFI:
            result = true;
            break;
        case Connection.CELL_2G:
            result = true;
            break;
        case Connection.CELL_3G:
            result = true;
            break;
        case Connection.CELL_4G:
            result = true;
            break;
        case Connection.CELL:
            result = true;
            break;
        case Connection.NONE:
            result = false;
            break;
        default:
            result = false;
            break;
    }

    return result;
}

async function hasServerConnection()
{
    if(tooSlowConnection == true)
    {
        if(SET_OFFLINE_WHEN_CONNECTION_IS_TOO_SLOW == true)
        {
            return false;
        }
    }

    const deviceConnectionState = await hasDeviceConnection();
    if(deviceConnectionState == false)
    {
        return false;
    }

    let loginToken = readLocalStorage("login");
    let uid = readLocalStorage("uid");

    var pingData = {
        "code": "M-WV",
        "logintoken": loginToken != null ? loginToken : "",
        "uid"       : uid != null ? uid : ""
    }

    var response = null;
    try
    {
        response = await callS(false, `POST`, `/services/ping`, pingData);
    }
    catch(pingException)
    {
        loggedInUserDataInfo = null;
        return false;
    }


    if(response != null)
    {
        loadedAppInfo = response.ainfo;

        if(response.status == 'ok')
        {
            // evtPing.dispatchEvent(new CustomEvent('ping', {detail: { success: true, error: null, uinfo: response.uinfo, ainfo: response.ainfo, dup: response.dup }}));
            if(response.dup == true)
            {
                showToastWithStyle(getTranslate("login-opened-in-another-device", `Your account is already opened in another device.`), 3000, toastDefaultClasses);
    
                setTimeout(function(){
                    forceDisconnect();
                }, 3000);
    
                loggedInUserDataInfo = null;
                return false;
            }

            // console.log(`👾 Writing user info ${JSON.stringify(loggedInUserDataInfo)}`);
    
            loggedInUserDataInfo = response.uinfo;

            writeLocalStorage("lastlogindatainfo", JSON.stringify(loggedInUserDataInfo));

            appVersionCheck();

            let forceLogoutByServer = false;

            if(isLoggedIn() == true)
            {
                if(loggedInUserDataInfo != null)
                {
                    if(loggedInUserDataInfo.basicinfo != null)
                    {
                        if(typeof loggedInUserDataInfo.basicinfo.ForceLogout != undefined)
                        {
                            if(loggedInUserDataInfo.basicinfo.ForceLogout != null)
                            {
                                if(loggedInUserDataInfo.basicinfo.ForceLogout.toString().trim() == `1`)
                                {
                                    forceLogoutByServer = true;
                                }
                            }
                        }
                    }
                }
            }

            if(forceLogoutByServer == true)
            {
                loginIsExpiredByServer = true;

                swal(getTranslate(`your-session-has-expired`, `Your session has expired. Please log in again.`)).then(async () =>{ 
                    showLoadingAnimationInSwal()
    
                    await callS(true, `POST`, `/services/resetuserforcelogout`, null);
    
                    await hideLoadingAnimationInSwal();

                    forceDisconnect();
                });

                loggedInUserDataInfo = null;
            }
            else
            {
                loginIsExpiredByServer = false;
            }

            return true;
        }
        else
        {
            loggedInUserDataInfo = null;
            return false;
        }
    }
    else
    {
        loadedAppInfo = null;
        loggedInUserDataInfo = null;
        return false;
    }    
}

function getLastLoginDataInfo()
{
    const strData = readLocalStorage("lastlogindatainfo");
    if(strData == null)
    {
        return null;
    }

    // console.log(`👾 Reading user info ${strData}`);

    const info = JSON.parse(strData);
    return info;
}

async function waitForDeviceConnection()
{
    return new Promise((resolve, reject) =>{
        const COUNT_TIMEOUT = 60;
        var countConnectionTry = 0;
    
        let itvDeviceConnectionWait = setInterval(function(){
            if(hasDeviceConnection() == true)
            {
                clearInterval(itvDeviceConnectionWait);
                countConnectionTry = 0;
                resolve(true);
            }

            countConnectionTry++;

            if(countConnectionTry > COUNT_TIMEOUT)
            {
                clearInterval(itvDeviceConnectionWait);
                countConnectionTry = 0;
                resolve(false);
            }
        }, 500);
    });
}

async function waitForDeviceAndServerConnectionWithAttempts(nextAttemptMilisecToWait, maxAttempt)
{
    return new Promise((resolve, reject) =>{
        var countConnectionTry = 0;
        var checkingServerConnectionState = false;
    
        let itvDeviceConnectionWait = setInterval(async function(){

            if(checkingServerConnectionState == true)
            {
                // Already has an inteval waiting server connection check
                return;
            }

            if(hasDeviceConnection() == true)
            {
                checkingServerConnectionState = true;
                let serverConnectionState = await hasServerConnection();
                checkingServerConnectionState = false;

                if(serverConnectionState == true)
                {
                    clearInterval(itvDeviceConnectionWait);
                    countConnectionTry = 0;
                    resolve(true);
    
                }
            }

            countConnectionTry++;

            if(countConnectionTry > maxAttempt)
            {
                clearInterval(itvDeviceConnectionWait);
                countConnectionTry = 0;
                resolve(false);
            }
        }, nextAttemptMilisecToWait);
    });
}

async function waitForTranslateDone()
{
    return new Promise((resolve, reject) =>{

        if(translateDone == true)
        {
            resolve();
            return;
        }

        let itvTranslateWait = setInterval(function(){
            if(translateDone == true)
            {
                clearInterval(itvTranslateWait);
                resolve();
                return;
            }
        }, 500);
    });
}

function showToastWithStyle(text, time, classes)
{
    if(time == null)
    {
        time = 8000;
    }

    M.toast({html: text, displayLength: time, classes: classes});
}

function swalConfirm(title, text, icon, cancelButtonText, yesButtonText, cancelCallback, yesCallback)
{
    swal({
        title: title,
        text: text,
        icon: icon,
        buttons: [
            cancelButtonText,
            yesButtonText
        ],
        dangerMode: true,
    }).then(function(isConfirm) {
        if (isConfirm) 
        {
            yesCallback();
        } 
        else 
        {
            cancelCallback();
        }
    });
}

function makeid(size) 
{
    var text = "";
    var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVXWYZabcdefghijklmnopqrstuvxwyz";
  
    for (var i = 0; i < size; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

function makeidnum(size) 
{
    var text = "";
    var possible = "0123456789";
  
    for (var i = 0; i < size; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

function CopyTextToClipboard(copyText)
{
    cordova.plugins.clipboard.copy(copyText);
}

async function copyImageToClipboard(imageUrl) 
{
    try 
    {
        // Fetch the image from a URL or path
        const response = await fetch(imageUrl);
        const blob = await response.blob();
  
        // Check if the browser supports clipboard and ClipboardItem
        if (navigator.clipboard && window.ClipboardItem) 
        {
            // Create a new ClipboardItem with the image blob
            const clipboardItem = new ClipboardItem({
                [blob.type]: blob
            });
  
            // Write the image to the clipboard
            await navigator.clipboard.write([clipboardItem]);
  
            console.log('Image copied to clipboard!');
        } 
        else 
        {
            console.error('Clipboard API or ClipboardItem is not supported.');
        }
    } 
    catch (error) 
    {
        console.error('Failed to copy image:', error);
    }
}

async function copyImageBlobToClipboard(blob) 
{
    try 
    {
        // Check if the browser supports clipboard and ClipboardItem
        if (navigator.clipboard && window.ClipboardItem) 
        {
            // Create a new ClipboardItem with the image blob
            const clipboardItem = new ClipboardItem({
                [blob.type]: blob
            });
  
            // Write the image to the clipboard
            await navigator.clipboard.write([clipboardItem]);
  
            console.log('Image copied to clipboard!');
        } 
        else 
        {
            console.error('Clipboard API or ClipboardItem is not supported.');
        }
    } 
    catch (error) 
    {
        console.error('Failed to copy image:', error);
    }
}

function CopyToClipboard(containerid) 
{
    // var copyText = document.getElementById(containerid);
    // var textArea = document.createElement("textarea");
    // textArea.value = copyText.textContent;
    // document.body.appendChild(textArea);
    // textArea.select();
    // document.execCommand("Copy");
    // textArea.remove();

    var copyText = document.getElementById(containerid);
    copyText = copyText.textContent;
    cordova.plugins.clipboard.copy(copyText);
}

function CopyAttributeToClipboard(containerid, attribute) 
{
    // var copyText = document.getElementById(containerid);
    // var textArea = document.createElement("textarea");
    // textArea.value = copyText.getAttribute(attribute);
    // document.body.appendChild(textArea);
    // textArea.select();
    // document.execCommand("Copy");
    // textArea.remove();
    var copyText = document.getElementById(containerid);
    copyText = copyText.getAttribute(attribute);
    cordova.plugins.clipboard.copy(copyText);
}

function escapeRegExp(string) 
{
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
  

function replaceAll(str, find, replace) 
{
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function getAppVersionNumber()
{
    return new Promise((resolve, reject) =>{
        cordova.getAppVersion.getVersionNumber().then(function (version) {
            resolve(version);
        });
    })
}

function getAppVersionCode()
{
    return new Promise((resolve, reject) =>{
        cordova.getAppVersion.getVersionCode().then(function (version) {
            if(cordova.platformId == 'ios')
            {
                version = getVersionCodeByVersionValue(version)
            }
            resolve(version);
        });
    })
}

function getVersionCodeByVersionValue(version) 
{
    // Split the version string by dots
    const parts = version.split('.');

    // Parse each part as an integer
    const major = parseInt(parts[0], 10) || 0;
    const minor = parseInt(parts[1], 10) || 0;
    const patch = parseInt(parts[2], 10) || 0;

    // Calculate the version code
    const versionCode = major * 10000 + minor * 100 + patch;

    return versionCode;
}

function getAppPackageName()
{
    return new Promise((resolve, reject) =>{
        cordova.getAppVersion.getPackageName().then(function (packName) {
            resolve(packName);
        });
    })
}

async function appVersionCheck()
{
    if(appVersionCheckMessageRequest == true)
    {
        return;
    }

    if(loadedAppInfo == null)
    {
        return;
    }

    if(loadedAppInfo.MinVersionNumber == null)
    {
        return;
    }

    const globalMinVersion = loadedAppInfo.MinVersionNumber;
    const androidMinVersion = loadedAppInfo.MinVersionNumberANDROID;
    const iosMinVersion = loadedAppInfo.MinVersionNumberIOS;

    if(typeof modebrowser != `undefined`)
    {
        if(modebrowser == true)
        {
            return;
        }
    }

    const versionCode = await getAppVersionCode();
    let minVersionNumber = globalMinVersion;

    if(cordova.platformId == 'android')
    {
        if(androidMinVersion != null)
        {
            if(parseInt(androidMinVersion) > globalMinVersion)
            {
                minVersionNumber = androidMinVersion;
            }    
        }
    }
    else if(cordova.platformId == 'ios')
    {
        if(iosMinVersion != null)
        {
            if(parseInt(iosMinVersion) > globalMinVersion)
            {
                minVersionNumber = iosMinVersion;
            }    
        }
    }
    else
    {
        minVersionNumber = globalMinVersion;
    }

    if(minVersionNumber == 0)
    {
        return;
    }

    console.log(`📱 Current Version: ${versionCode} | Min Version: ${minVersionNumber}`);

    if(versionCode < minVersionNumber)
    {
        appVersionCheckMessageRequest = true;
        
        let urlOpen = loadedAppInfo.Website;

        if(cordova.platformId == 'android')
        {
            if(loadedAppInfo.GooglePlayURL != null)
            {
                if(loadedAppInfo.GooglePlayURL.trim().length > 0)
                {
                    urlOpen = loadedAppInfo.GooglePlayURL;
                }
            }
        }
        else if(cordova.platformId == 'ios')
        {
            if(loadedAppInfo.AppleStoreURL != null)
            {
                if(loadedAppInfo.AppleStoreURL.trim().length > 0)
                {
                    urlOpen = loadedAppInfo.AppleStoreURL;
                }
            }
        }
        else
        {
            return;
        }

        swal(getTranslate(`new-version-message`, `There is a newer version of this app available`)).then(() =>{ 
            openInNewTab(urlOpen);

            setTimeout(function(){
                navigator.app.exitApp();
            }, 1000);
        });
    }

}

function waitTime(ms)
{
    return new Promise((resolve, reject) =>{
        setTimeout(function(){
            resolve();
        }, ms);
    });
}

function listDeviceContacts()
{
    return new Promise(async (resolve, reject) =>{

        if(cordova.platformId == 'android')
        {
            try
            {
                console.log(`🟡 Android Device Contact List Read Start: ${new Date().toLocaleString()}`);
                lastLoadContacts = await window.internal.activecontacts.list();
                console.log(`🟢 Android Device Contact List Read Finished: ${new Date().toLocaleString()}`);
                resolve(lastLoadContacts.contacts);
            }
            catch(contactListException)
            {
                console.log(`🔴 Android Device Contact List Read Error: ${new Date().toLocaleString()}`);
                resolve([]);
            }
        }
        else
        {
            navigator.contactsPhoneNumbers.list(function(contacts) {
                lastLoadContacts = contacts;
                resolve(contacts);
                
                // console.log(contacts.length + ' contacts found');
                // for(var i = 0; i < contacts.length; i++) 
                // {
                //    console.log(contacts[i].id + " - " + contacts[i].displayName);
                //    for(var j = 0; j < contacts[i].phoneNumbers.length; j++) {
                //       var phone = contacts[i].phoneNumbers[j];
                //       console.log("===> " + phone.type + "  " + phone.number + " (" + phone.normalizedNumber+ ")");
                //    }
                // }
            }, function(contactError) {
                // console.error(contactError);
                reject(contactError);
            });
        }


        // (async()=>{
        //     lastLoadContacts = await window.internal.activecontacts.list();
        // }) ();


        // if(typeof ContactFindOptions == 'undefined')
        // {
        //     resolve([]);
        //     return;
        // }
        
        // var options = new ContactFindOptions();
        // options.filter = "";
        // options.multiple = true;
        // options.hasPhoneNumber = true;
        // options.desiredFields = [
        //     navigator.contacts.fieldType.id,
        //     // navigator.contacts.fieldType.nickname,
        //     navigator.contacts.fieldType.name,
        //     // navigator.contacts.fieldType.middleName,
        //     // navigator.contacts.fieldType.displayName, 
        //     // navigator.contacts.fieldType.familyName,
        //     // navigator.contacts.fieldType.givenName,
        //     navigator.contacts.fieldType.phoneNumbers,
        //     navigator.contacts.fieldType.photos
        // ];
        // var filter = ["displayName", "addresses"];
        // navigator.contacts.find(filter, (contacts) =>{            
        //     resolve(contacts);
        // }, (contactError) =>{
        //     reject(contactError);
        // }, options);
    });
}

function getDeviceFileBase64URL(url)
{
    return new Promise((resolve, reject) =>{
        // var img = new Image();
        // img.onload = function() {
        //     //Image is ok
        //     resolve(url);
        // };
        // img.onerror = function(err) {
        //     //Returning a default image for users without photo 
        //     reject(err);
        // }
        // img.src = url;

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            // browserFs.root.getFile(url, {}, (fileEntry) => {
            getFileEntry(url, false, false, function(fileEntry, getFileEntryErr) {

                if(fileEntry == null)
                {
                    reject(getFileEntryErr);
                    return;
                }

                fileEntry.file(function (file) {
                    const reader = new FileReader();
          
                    reader.onloadend = function() {
                        // el.attr('src', this.result);
                        resolve(this.result);
                    };
          
                    reader.readAsDataURL(file);
                });
            },(err) =>{
                // Eg.: File err: NotFoundError: A requested file or directory could not be found at the time an operation was processed.
                console.log(`File err: ${err}`);
                reject(err);
            });
        }
        else
        {
            window.resolveLocalFileSystemURL(url, (fileEntry) => {
                // console.log("got file: " + fileEntry.fullPath);
                // console.log('cdvfile URI: ' + fileEntry.toInternalURL());
                // $('#imgPreview').attr("src", fileEntry.toInternalURL());
                
                // resolve(fileEntry.toInternalURL());
    
                fileEntry.file(function (file) {
                    const reader = new FileReader();
          
                    reader.onloadend = function() {
                        // el.attr('src', this.result);
                        resolve(this.result);
                    };
          
                    reader.readAsDataURL(file);
                });
            }, function(err){
                console.log(`FileSystem Error reading ${url}`);
                console.log(err);
                reject(err);
            });
        }
    });

};

function getDeviceFileBase64URLOrLocalURL(url)
{
    return new Promise((resolve, reject) =>{
        // var img = new Image();
        // img.onload = function() {
        //     //Image is ok
        //     resolve(url);
        // };
        // img.onerror = function(err) {
        //     //Returning a default image for users without photo 
        //     reject(err);
        // }
        // img.src = url;

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            browserFs.root.getFile(url, {}, (fileEntry) => {
    
                fileEntry.file(function (file) {
                    const reader = new FileReader();
          
                    reader.onloadend = function() {
                        // el.attr('src', this.result);
                        if(this.result != null)
                        {
                            resolve(this.result);
                            return;
                        }
                        
                        resolve(this._localURL);
                    };
          
                    reader.readAsDataURL(file);
                });
            });
        }
        else
        {
            window.resolveLocalFileSystemURL(url, (fileEntry) => {
                // console.log("got file: " + fileEntry.fullPath);
                // console.log('cdvfile URI: ' + fileEntry.toInternalURL());
                // $('#imgPreview').attr("src", fileEntry.toInternalURL());
                
                // resolve(fileEntry.toInternalURL());
    
                fileEntry.file(function (file) {
                    const reader = new FileReader();
          
                    reader.onloadend = function() {
                        // el.attr('src', this.result);
                        if(this.result != null)
                        {
                            resolve(this.result);
                            return;
                        }
                        
                        resolve(this._localURL);
                    };
          
                    reader.readAsDataURL(file);
                });
            }, function(err){
                console.log(`FileSystem Error reading ${url}`);
                console.log(err);
                reject(err);
            });
        }
    });

};


function sortContactList(listSelector, itemsSelector)
{
    var $people = $(listSelector),
	$peopleli = $people.children(itemsSelector);
 
    $peopleli.sort(function(a,b){
        var an = a.getAttribute('data-q').toLowerCase(),
            bn = b.getAttribute('data-q').toLowerCase();
    
        if(an > bn) {
            return 1;
        }
        if(an < bn) {
            return -1;
        }
        return 0;
    });
    
    $peopleli.detach().appendTo($people);
}

function startCameraToTakePhoto(numTargetWidth, 
                                numTargetHeight, 
                                numQuality, 
                                boolFromCameraBack, 
                                boolGetAsFileURIOtherWiseBase64)
{

    return new Promise((resolve, reject) =>{

        // Browser mode clear
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            $(`.cordova-camera-capture`).remove();
        }

        //Prepare camera options
        var cameraOptions = {
            "quality": numQuality,
            "destinationType": boolGetAsFileURIOtherWiseBase64 ? Camera.DestinationType.FILE_URI : Camera.DestinationType.DATA_URL,
            "sourceType": Camera.PictureSourceType.CAMERA,
            "allowEdit": false,
            "encodingType": Camera.EncodingType.JPEG,
            "targetWidth": numTargetWidth,
            "targetHeight": numTargetHeight,
            "mediaType": Camera.MediaType.PICTURE,
            "correctOrientation": true,
            "saveToPhotoAlbum": false,
            "popoverOptions": new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY),
            "cameraDirection": boolFromCameraBack ? Camera.Direction.BACK : Camera.Direction.FRONT
        };

        navigator.camera.getPicture(function(cameraImageInfo){
            //On camera get picture success

            //****************************************************/
            //boolGetAsFileURIOtherWiseBase64 == true
            //  var image = document.getElementById('myImage');
            //  image.src = cameraImageInfo;

            //boolGetAsFileURIOtherWiseBase64 == false
            //  var image = document.getElementById('myImage');
            //  image.src = "data:image/jpeg;base64," + cameraImageInfo;
            //****************************************************/
            /*
            navigator.camera.cleanup(function(){
                //On cleanup camera success

            }, function(message){
                //On cleanup camera failed
                alert('Falha ao limpar o temporário da câmera: ' + message);
            });    
            */

            resolve(cameraImageInfo);

        }, function(message){
            //On camera get picture error
            // alert('Falha ao capturar imagem da câmera: ' + message);

            (async() => {
                if(message == null)
                {
                    message = "";
                }
    
                message = message.toString();
                
                if(cordova.platformId == 'android')
                {
                    const cameraAuthorized = await cameraIsAuthorized();
    
                    if(cameraAuthorized == false)
                    {
                        swal(getTranslate("you-must-authorize-camera-photos-permission-to-proceed", "You must allow camera/photos permission to proceed."));
                        resolve(null);
                        return;
                    }
                    else if(message == "20")
                    {
                        swal(getTranslate("you-must-authorize-camera-photos-permission-to-proceed", "You must allow camera/photos permission to proceed."));
                        resolve(null);
                        return;
                    }
                }
           
                if(message.toLowerCase() == "no image selected")
                {
                    resolve(null);
                    return;
                }
    
                if(message.toLowerCase() == "has no access to camera")
                {
                    resolve(null);
                    return;
                }
    
                if(message.toLowerCase() == "no camera available")
                {
                    resolve(null);
                    return;
                }
    
                if(message.toLowerCase() == "one or more files failed to be deleted.")
                {
                    resolve(null);
                    return;
                }
    
                swal(`${getTranslate("error-on-get-image", "Error on get image")} - ${message}`);
                resolve(null);
            }) ();


        }, cameraOptions);

        // Browser after initialize auto-click in input element
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            setTimeout(function(){
                if($(`.cordova-camera-capture`).length == 0)
                {
                    return;
                }

                $(`.cordova-camera-capture`).find(`video`).attr(`width`, `100%`);
                $(`.cordova-camera-capture`).find(`video`).attr(`height`, `auto`);
                $(`.cordova-camera-capture`).css(`text-align`, `center`);
                $(`.cordova-camera-capture`).find(`button`).css(`display`, `none`);

                const htmlConfirmCamera = `
                <a href="#" class="btn-floating btn-camera-capture-confirm">
                    <i class="fa-solid fa-check"></i>
                </a>
                `;

                $(`.cordova-camera-capture`).append(htmlConfirmCamera);

                $(`.btn-camera-capture-confirm`).off(`click`);
                $(`.btn-camera-capture-confirm`).on(`click`, async function(){
                    // $(`.cordova-camera-capture`).find(`button`).click();

                    const videoElement = $(`.cordova-camera-capture`).find(`video`).get(0);
                    let resultImageFromWebCamera = await captureImageFromVideoTag(videoElement);
                    // resolve(resultImageFromWebCamera);
                    $(`.cordova-camera-capture`).remove();

                    resolve(resultImageFromWebCamera);

                });

                if($(`.cordova-camera-capture`).length > 1)
                {
                    return;
                }
            }, 600);
        }

    });

}

function startPhotoLibraryToTakePhoto(numTargetWidth, 
    numTargetHeight, 
    numQuality, 
    boolFromCameraBack, 
    boolGetAsFileURIOtherWiseBase64)
{
    return new Promise((resolve, reject) =>{

        // Browser mode clear
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            $(`.cordova-camera-select`).remove();
        }

        //Prepare camera options
        var cameraOptions = {
                "quality": numQuality,
                "destinationType": boolGetAsFileURIOtherWiseBase64 ? Camera.DestinationType.FILE_URI : Camera.DestinationType.DATA_URL,
                "sourceType": Camera.PictureSourceType.PHOTOLIBRARY,
                "allowEdit": false,
                "encodingType": Camera.EncodingType.JPEG,
                "targetWidth": numTargetWidth,
                "targetHeight": numTargetHeight,
                "mediaType": Camera.MediaType.PICTURE,
                "correctOrientation": true,
                "saveToPhotoAlbum": false,
                "popoverOptions": new CameraPopoverOptions(300, 300, 100, 100, Camera.PopoverArrowDirection.ARROW_ANY),
                "cameraDirection": boolFromCameraBack ? Camera.Direction.BACK : Camera.Direction.FRONT
        };

        navigator.camera.getPicture(function(cameraImageInfo){
            //On camera get picture success

            //****************************************************/
            //boolGetAsFileURIOtherWiseBase64 == true
            //  var image = document.getElementById('myImage');
            //  image.src = cameraImageInfo;

            //boolGetAsFileURIOtherWiseBase64 == false
            //  var image = document.getElementById('myImage');
            //  image.src = "data:image/jpeg;base64," + cameraImageInfo;
            //****************************************************/
            /*
            navigator.camera.cleanup(function(){
            //On cleanup camera success

            }, function(message){
            //On cleanup camera failed
            alert('Falha ao limpar o temporário da câmera: ' + message);
            });    
            */
            resolve(cameraImageInfo);

        }, function(message){
            //On camera get picture error
            // alert('Falha ao capturar imagem da câmera: ' + message);

            (async() => {
                if(message == null)
                {
                    message = "";
                }
    
                message = message.toString();
    
                if(cordova.platformId == 'android')
                {
                    const cameraAuthorized = await cameraIsAuthorized();
    
                    if(cameraAuthorized == false)
                    {
                        swal(getTranslate("you-must-authorize-camera-photos-permission-to-proceed", "You must allow camera/photos permission to proceed."));
                        resolve(null);
                        return;
                    }
                    else if(message == "20")
                    {
                        swal(getTranslate("you-must-authorize-camera-photos-permission-to-proceed", "You must allow camera/photos permission to proceed."));
                        resolve(null);
                        return;
                    }
                }
           
                if(message.toLowerCase() == "no image selected")
                {
                    resolve(null);
                    return;
                }
    
                if(message.toLowerCase() == "has no access to camera")
                {
                    resolve(null);
                    return;
                }
    
                if(message.toLowerCase() == "no camera available")
                {
                    resolve(null);
                    return;
                }
    
                if(message.toLowerCase() == "one or more files failed to be deleted.")
                {
                    resolve(null);
                    return;
                }
    
                swal(`${getTranslate("error-on-get-image", "Error on get image")} - ${message}`);
                resolve(null);
            }) ();


        }, cameraOptions);

        // Browser after initialize auto-click in input element
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            setTimeout(function(){
                if($(`.cordova-camera-select`).length == 0)
                {
                    return;
                }

                $(`.cordova-camera-select`).css(`display`, `none`);

                if($(`.cordova-camera-select`).length > 1)
                {
                    return;
                }

                $(`.cordova-camera-select`).click();
            }, 600);
        }
    });
}

function waitForDeviceReady()
{
    return new Promise((resolve, reject) =>{
        if(deviceIsReady == true)
        {
            resolve();
            return;
        }

        var itvWaitDeviceReady = setInterval(function(){
            if(deviceIsReady == true)
            {
                clearInterval(itvWaitDeviceReady);
                resolve();
            }
        }, 200);
    })
}

// async function initSIMDetails()
// {
//     lastLoadSIM = await window.internal.simnumber.get();
// }

async function initLocationInfo()
{
    // lastLocationInfo = navigator.globalization;
    lastLocationInfo = await window.internal.devicelocale.get();
}

async function initNativeScreen()
{
    const nativeTest = await window.internal.nativescreen.showNativeScreen("Test");
    console.log(`Native Screen Test ${JSON.stringify(nativeTest)}`);
}

async function initNativeContactListScreen()
{
    const screenTitle = getTranslate(`your-phone-s-contact-list`, `Your Phone's Contact List`);
    const searchBoxText = getTranslate(`search-dots`, `Search...`);
    const onlyMobileText = getTranslate(`only-mobile-phone-number`, `Only mobile phone numbers`);
    const contactsText = getTranslate(`contacts`, `Contacts`);
    const createNewButtonText = getTranslate(`create-new`, `Create New`);
    const createGroupButtonText = getTranslate(`create-group`, `Create Group`);

    const nativeResult = await window.internal.nativescreen.showNativeContactList(screenTitle, searchBoxText, onlyMobileText, contactsText, createNewButtonText, createGroupButtonText);
    console.log(`Native Screen Result ${JSON.stringify(nativeResult)}`);

    return nativeResult;
}

async function initNativeContactListSelectionScreen(preSelectedContactList) 
{
    if(preSelectedContactList == null)
    {
        preSelectedContactList = [];
    }

    if(Array.isArray(preSelectedContactList) == false)
    {
        preSelectedContactList = [];
    }

    // Translate the screen and button texts
    const screenTitle = getTranslate('your-phone-s-contact-list', "Your Phone's Contact List");
    const searchBoxText = getTranslate('search-dots', 'Search...');
    const onlyMobileText = getTranslate('only-mobile-phone-number', 'Only mobile phone numbers');
    const addButtonText = getTranslate('add', 'Add');
    const contactsText = getTranslate('contacts', 'Contacts');

    // Preselected contacts (if any)
    const preselected = preSelectedContactList; // Populate this array with phone numbers if needed

    try {
        // Call the native screen and wait for the result
        let nativeResult = await window.internal.nativescreen.showNativeContactListSelection(preselected, screenTitle, searchBoxText, onlyMobileText, addButtonText, contactsText);
        
        // Log the result from the native screen
        // console.log(`Native Screen Result: ${JSON.stringify(nativeResult)}`);

        if(nativeResult == null)
        {
            return null;
        }
    
        if(typeof nativeResult == `string`)
        {
            nativeResult = JSON.parse(nativeResult);
        }
    
        if(nativeResult.message == null)
        {
            return null;
        }
    
        if(typeof nativeResult.message == `string`)
        {
            if(nativeResult.message == 'Operation canceled or failed')
            {
                return null;
                // nativeResult.message = null;
            }
            else
            {
                nativeResult.message = JSON.parse(nativeResult.message);
            }
        }
    
        let contactListResult = nativeResult.message;
    
        if(contactListResult == null)
        {
            return [];
        }

        let contactIdList = [];
        for(let ix = 0; ix < contactListResult.length; ix++)
        {
            let phoneNumber = contactListResult[ix].toString();
            let phoneDetails = getPhoneFormatsByNumber(phoneNumber, null);
            let contactId = phoneDetails.fullNumbersOnly;
            contactIdList.push(contactId);
        }

        return contactIdList;
    } catch (error) {
        console.error("Error showing native contact list screen:", error);
        return []; // or handle the error as appropriate
    }
}

function strToOnlyNum(value)
{
    let result = String(value).replace(/[^\d]/g, '');
    return result;
}

function strToSimpleChars(value)
{
    let result = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return result;
}

function lpnParseNumber(phoneNumber, countryCode)
{
    const processedPhoneNumber = libphonenumber.parsePhoneNumber(phoneNumber, countryCode);
    return processedPhoneNumber;
}

function lpnValidateNumberLength(phoneNumber, countryCode)
{
    const validationResult = libphonenumber.validatePhoneNumberLength(phoneNumber, countryCode);
    return validationResult;
}

function lpnIsMobile(phoneNumber, countryCode)
{
    const processedPhoneNumber = lpnParseNumber(phoneNumber, countryCode);
    const isMobile = processedPhoneNumber.getType() === 'MOBILE' || processedPhoneNumber.getType() === 'FIXED_LINE_OR_MOBILE';
    return isMobile;
}

function lpnIsValid(phoneNumber, countryCode)
{
    const lengthValidation = lpnValidateNumberLength(phoneNumber, countryCode);

    if(lengthValidation == 'TOO_SHORT' || lengthValidation == 'TOO_LONG')
    {
        return false;
    }

    const processedPhoneNumber = lpnParseNumber(phoneNumber, countryCode);
    const isValid = processedPhoneNumber.isValid();
    return isValid;
}

function switchColorTheme()
{
    let applied = readLocalStorage("themecolor");
    if(applied == null)
    {
        applied = SYS_INITIAL_THEME;
    }

    let newColor = SYS_INITIAL_THEME;

    if(applied == "light")
    {
        newColor = "dark";
    }
    else
    {
        newColor = "light";
    }

    writeLocalStorage("themecolor", newColor);
    applyCSSTheme();
}

function applyCSSTheme()
{  
    let applied = readLocalStorage("themecolor");

    if(applied == null)
    {
        applied = SYS_INITIAL_THEME;
    }

    if(applied == "light")
    {
        document.getElementById('colorLink').href=`css/colors/light.css`;
    }
    else
    {
        document.getElementById('colorLink').href=`css/colors/dark.css`;
    }

}

async function operationalScreenCheckConnection()
{
    if(hasDeviceConnection() == true)
    {
        let loginToken = readLocalStorage("login");
        let uid = readLocalStorage("uid");

        var pingData = {
            "code": "M-WV",
            "logintoken": loginToken != null ? loginToken : "",
            "uid"       : uid != null ? uid : ""
        }

        initializeAppServerConnectionInfo();

        var response = null;
        try
        {
            response = await callS(false, `POST`, `/services/ping`, pingData);
        }
        catch(pingException)
        {
            return false;
        }


        if(response != null)
        {
            if(response.status == 'ok')
            {
                return true;
            }
            else
            {
                return false;
            }
        }
        else
        {
            return false;
        }
    }
    else
    {
        return false;
    }
}

function showLoadingAnimationInSwal()
{
    swal(`...`, {
        button: false, closeOnClickOutside: false
    });

    // const preloaderCode = `
    // <div class="progress">
    //     <div class="indeterminate"></div>
    // </div>
    // `;

    const preloaderCode = `
    <div class="preloader-wrapper active">
        <div class="spinner-layer spinner-red-only">
            <div class="circle-clipper left">
                <div class="circle"></div>
                </div><div class="gap-patch">
                <div class="circle"></div>
                </div><div class="circle-clipper right">
                <div class="circle"></div>
            </div>
        </div>
    </div>
    `;

    $(`.swal-text`).html(preloaderCode)
    // $(`.swal-text`).html(`<img class="loading-animation-in-swal-image" src="/images/loading-grey.gif" />`)
}



function hideLoadingAnimationInSwal()
{
    return new Promise((resolve, reject) =>{
        setTimeout(function(){
            if($(`.loading-animation-in-swal-image`).length > 0)
            {
                swal.close();
            }

            resolve();
        }, 1000);
    })

}

function addModalToStack(modalElement)
{
    // Remove if already added
    removeModalFromStack(modalElement);

    // Put on top of stack
    modalStack.push(modalElement);
}

function removeModalFromStack(modalElement)
{
    let modalIndex = modalStack.findIndex((item) =>{
        return $(item).attr(`id`) == $(modalElement).attr(`id`)
    });

    if(modalIndex > -1)
    {
        modalStack.splice(modalIndex, 1);
    }
}

function getCurrentModalFromStack()
{
    if(modalStack.length == 0)
    {
        return null;
    }

    return modalStack[modalStack.length -1];
}

function getCurrentIdModalFromStack()
{
    const currentModal = getCurrentModalFromStack();
    if(currentModal == null)
    {
        return null;
    }

    return $(currentModal).attr(`id`);
}

function appMenuIsOpened()
{
    const instance = M.Sidenav.getInstance(document.getElementById(`appMenuList`));
    const result = instance.isOpen;
    return result;
}

function getPhoneFormatsByNumber(phoneNumber, predefinedType)
{
    if(phoneNumber == null)
    {
        console.log(`(getPhoneFormatsByNumber) Number was probably reset by user`);
        return null;
    }

    let queryCountryCode = countryCode;

    const parsedPhoneNumCheck = internalParsePhoneNumber(phoneNumber);

    if(parsedPhoneNumCheck != null)
    {
        phoneNumber = parsedPhoneNumCheck.formatInternational();
    }

    if(phoneNumber.startsWith(`+`) == true)
    {

        const phoneCheck = libphonenumber.parsePhoneNumberFromString(phoneNumber, ``);

        if(phoneCheck != null)
        {
            if(phoneCheck.country != null)
            {
                if(phoneCheck.country.length > 0)
                {
                    queryCountryCode = phoneCheck.country;
                    // console.log(`Phone ${phoneNumber} identified as ${queryCountryCode}`);
                }
            }
        }
    }

    if(phoneNumber == null)
    {
        return null;
    }

    const phoneNumbersOnly = strToOnlyNum(phoneNumber);
        
    const countryPhoneRecord = phoneCodes.find((item) =>{
        return item.code.toUpperCase().trim() == queryCountryCode.toUpperCase().trim();
    });


    let result = {
        "query": phoneNumber,
        "numbersOnly": phoneNumbersOnly,
        "dialCode": "",
        "emoji": "",
        "countryCode": "",
        "maskFull": "",
        "maskAreaCode": "",
        "maskShort": "",
        "full": "",
        "withAreaCode": "",
        "fullNumbersOnly": "",
        "withAreaCodeNumbersOnly": "",
        "isMobile": false,
        "phoneType": "",
        "phoneTypeLabel": "",
    }

    if(countryPhoneRecord == null || phoneNumbersOnly.length == 0)
    {
        return result;
    }

    let processedPhoneNumber = null;

    try
    {
        processedPhoneNumber = libphonenumber.parsePhoneNumber(phoneNumber, queryCountryCode);
    }
    catch(processException)
    {

    }

    if(processedPhoneNumber == null)
    {
        return null;
    }

    // if(processedPhoneNumber.isValid() == false)
    // {
    //     const processedNationalNumber = processedPhoneNumber.nationalNumber;

    //     let tryToAddAreaCode = true;

    //     // For Brazilian and UK mobile numbers check the size of mobile
    //     if(processedPhoneNumber.country == `BR` || processedPhoneNumber.country == `GB`)
    //     {
    //         const shortMobileBRDigits = strToOnlyNum(countryPhoneRecord.mobile_format_short);
    //         if(shortMobileBRDigits.length > processedNationalNumber.length)
    //         {
    //             tryToAddAreaCode = false;
    //         }
    //     }

    //     if(tryToAddAreaCode == true)
    //     {
    //         let uid = readLocalStorage("uid");
    //         const userPhone = libphonenumber.parsePhoneNumber(uid, countryCode)
    //         const userNationalNumber = userPhone.nationalNumber;
    
    //         if(userNationalNumber.length > processedNationalNumber.length)
    //         {
    //             const diffSize = userNationalNumber.length - processedNationalNumber.length;
    //             const areaCode = userNationalNumber.substring(0, diffSize);
    //             const newProcessing = libphonenumber.parsePhoneNumber(`${areaCode}${processedNationalNumber}`, queryCountryCode);
    //             if(newProcessing.isValid() == true)
    //             {
    //                 processedPhoneNumber = newProcessing;
    //             }
    //         }
    //     }
    // }

    let full = processedPhoneNumber.formatInternational();

    if(full == null)
    {
        full = "";
    }

    let withAreaCode = processedPhoneNumber.formatNational();

    if(withAreaCode == null)
    {
        withAreaCode = "";
    }

    let phoneType = processedPhoneNumber.getType();

    if(phoneType == null)
    {
        phoneType = "";
    }

    const phoneTypeLabel = getPhoneTypeLabel(phoneType);

    let isMobile = false;
    if(phoneType == 'MOBILE')
    {
        isMobile = true;
    }
    else
    {
        // Check device contact list if is marked as mobile
        if(predefinedType != null)
        {
            if(predefinedType == "MOBILE")
            {
                isMobile = true;
            }        
        }
        // for(let ixDCL = 0; ixDCL < deviceContactList.length; ixDCL++)
        // {
        //     const deviceContactRecord = deviceContactList[ixDCL];
        //     for(let ixDCP = 0; ixDCP < deviceContactRecord.phoneNumbers.length; ixDCP++)
        //     {
        //         const devicePhoneRecord = deviceContactRecord.phoneNumbers[ixDCP];

        //         if(devicePhoneRecord.type == "MOBILE")
        //         {
        //             const devicePhoneRecordOnlyNUm = strToOnlyNum(devicePhoneRecord.normalizedNumber);
        //             const deviceProcessedPhoneNumber = libphonenumber.parsePhoneNumber(devicePhoneRecordOnlyNUm, queryCountryCode);
        //             const deviceFullPhoneNumber = deviceProcessedPhoneNumber.formatInternational();
        //             if(strToOnlyNum(deviceFullPhoneNumber) == strToOnlyNum(full))
        //             {
        //                 isMobile = true;
        //                 break;
        //             }
        //         }

        //     }
        // }
    }

    const fullOnlyNum = strToOnlyNum(full);

    if(isMobile == true)
    {
        // Brazilian numbers mobile phone must contains at least 13 digits
        if(countryPhoneRecord.code == `BR`)
        {
            if(fullOnlyNum.length < 13)
            {
                isMobile = false;
            }
        }        
    }


    // result.dialCode = dialCode;
    result.dialCode = processedPhoneNumber.countryCallingCode;
    result.emoji = countryPhoneRecord.emoji;
    result.countryCode = countryPhoneRecord.code;
    result.maskFull = countryPhoneRecord.mobile_format_full;
    result.maskAreaCode = countryPhoneRecord.mobile_format_area_code;
    result.maskShort = countryPhoneRecord.mobile_format_short;
    result.full = full;
    result.withAreaCode = withAreaCode;
    result.fullNumbersOnly = fullOnlyNum;
    result.withAreaCodeNumbersOnly = strToOnlyNum(withAreaCode);
    result.isMobile = isMobile;
    result.phoneType = phoneType;
    result.phoneTypeLabel = phoneTypeLabel;

    return result;
}

function getPhoneTypeLabel(phoneType)
{
    // ["FIXED_LINE","MOBILE","PREMIUM_RATE","TOLL_FREE","SHARED_COST","VOIP","PERSONAL_NUMBER","PAGER","UAN","VOICEMAIL"]

    var result = getTranslate(`phone-type-fixed-line`, `Fixed Line`);

    if(phoneType == `FIXED_LINE`)
    {
        result = getTranslate(`phone-type-fixed-line`, `Fixed Line`);
    }
    else if(phoneType == `MOBILE` || phoneType == `FIXED_LINE_OR_MOBILE`)
    {
        result = getTranslate(`phone-type-mobile`, `Mobile`);
    }
    else if(phoneType == `PREMIUM_RATE`)
    {
        result = getTranslate(`phone-type-premium-rate`, `Premium Rate`);
    }
    else if(phoneType == `TOLL_FREE`)
    {
        result = getTranslate(`phone-type-toll-free`, `Toll Free`);
    }
    else if(phoneType == `SHARED_COST`)
    {
        result = getTranslate(`phone-type-shared-cost`, `Shared Cost`);
    }
    else if(phoneType == `VOIP`)
    {
        result = getTranslate(`phone-type-voip`, `VoIP`);
    }
    else if(phoneType == `PERSONAL_NUMBER`)
    {
        result = getTranslate(`phone-type-personal-number`, `Personal Number`);
    }
    else if(phoneType == `PAGER`)
    {
        result = getTranslate(`phone-type-pager`, `Pager`);
    }
    else if(phoneType == `UAN`)
    {
        result = getTranslate(`phone-type-uan`, `UAN`);
    }
    else if(phoneType == `VOICEMAIL`)
    {
        result = getTranslate(`phone-type-voice-mail`, `Voicemail`);
    }

    return result;
}

async function loadLocalLoadedContactList()
{
    const localSaved = await dbRun(`SELECT * FROM DeviceContactList`);

    if(localSaved == null)
    {
        return;
    }

    localSavedDeviceContactList = [];
    for(let ix = 0; ix < localSaved.rows.length; ix++)
    {
        const record = localSaved.rows.item(ix);

        const id            = record.id;
        const displayName   = record.displayName;
        const firstName     = record.firstName;
        const lastName      = record.lastName;

        const phone1_NormalizedNumber   = record.phone1_NormalizedNumber;
        const phone1_Number             = record.phone1_Number;
        const phone1_Type               = record.phone1_Type;
        const phone2_NormalizedNumber   = record.phone2_NormalizedNumber;
        const phone2_Number             = record.phone2_Number;
        const phone2_Type               = record.phone2_Type;
        const phone3_NormalizedNumber   = record.phone3_NormalizedNumber;
        const phone3_Number             = record.phone3_Number;
        const phone3_Type               = record.phone3_Type;
        const phone4_NormalizedNumber   = record.phone4_NormalizedNumber;
        const phone4_Number             = record.phone4_Number;
        const phone4_Type               = record.phone4_Type;
        const phone5_NormalizedNumber   = record.phone5_NormalizedNumber;
        const phone5_Number             = record.phone5_Number;
        const phone5_Type               = record.phone5_Type;
        const phone6_NormalizedNumber   = record.phone6_NormalizedNumber;
        const phone6_Number             = record.phone6_Number;
        const phone6_Type               = record.phone6_Type;
        const phone7_NormalizedNumber   = record.phone7_NormalizedNumber;
        const phone7_Number             = record.phone7_Number;
        const phone7_Type               = record.phone7_Type;
        const phone8_NormalizedNumber   = record.phone8_NormalizedNumber;
        const phone8_Number             = record.phone8_Number;
        const phone8_Type               = record.phone8_Type;
        const phone9_NormalizedNumber   = record.phone9_NormalizedNumber;
        const phone9_Number             = record.phone9_Number;
        const phone9_Type               = record.phone9_Type;
        const phone10_NormalizedNumber   = record.phone10_NormalizedNumber;
        const phone10_Number             = record.phone10_Number;
        const phone10_Type               = record.phone10_Type;

        const itemRecordPhoneNumbers = [];

        if(phone1_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone1_NormalizedNumber,
                "number"            : phone1_Number,
                "type"              : phone1_Type
            });
        }

        if(phone2_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone2_NormalizedNumber,
                "number"            : phone2_Number,
                "type"              : phone2_Type
            });
        }

        if(phone3_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone3_NormalizedNumber,
                "number"            : phone3_Number,
                "type"              : phone3_Type
            });
        }

        if(phone4_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone4_NormalizedNumber,
                "number"            : phone4_Number,
                "type"              : phone4_Type
            });
        }

        if(phone5_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone5_NormalizedNumber,
                "number"            : phone5_Number,
                "type"              : phone5_Type
            });
        }

        if(phone6_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone6_NormalizedNumber,
                "number"            : phone6_Number,
                "type"              : phone6_Type
            });
        }

        if(phone7_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone7_NormalizedNumber,
                "number"            : phone7_Number,
                "type"              : phone7_Type
            });
        }

        if(phone8_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone8_NormalizedNumber,
                "number"            : phone8_Number,
                "type"              : phone8_Type
            });
        }

        if(phone9_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone9_NormalizedNumber,
                "number"            : phone9_Number,
                "type"              : phone9_Type
            });
        }

        if(phone10_Number != null)
        {
            itemRecordPhoneNumbers.push({
                "normalizedNumber"  : phone10_NormalizedNumber,
                "number"            : phone10_Number,
                "type"              : phone10_Type
            });
        }

        const itemRecord = {
            "id": id,
            "displayName": displayName,
            "firstName": firstName,
            "lastName": lastName,
            "phoneNumbers": itemRecordPhoneNumbers
        };

        localSavedDeviceContactList.push(itemRecord);
    }

    deviceContactList = localSavedDeviceContactList;
}

function getStrAsJson(str) 
{
    let result = null;
    try 
    {
        result = JSON.parse(str);
    } 
    catch (e) 
    {
        result = null;
    }
    return result;
}

function getUIDListFromContactStatusList()
{
    let result = [];

    for(let ix = 0; ix < contactStatusList.length; ix++)
    {
        const record = contactStatusList[ix];
        result.push(record.Login);
    }

    for(let ix = 0; ix < linkedContactList.length; ix++)
    {
        const record = linkedContactList[ix];
        const number = record.Contact;

        const added = result.find((item) =>{
            return item == number;
        });

        if(added == null)
        {
            result.push(number);
        }
    }
    
    return result;
}

function updateViewLayoutContactStatus()
{
    // for(let ix = 0; ix < serverResponseStatusList.length; ix++)
    // {
    //     const record = serverResponseStatusList[ix];
    //     const uidToSet = record.uid;
    //     const isConnected = record.connected;
    // }

    if(talkToId != null)
    {
        const recordStatus = serverResponseStatusList.find((item) =>{
            return item.uid == talkToId;
        });

        if(recordStatus == null)
        {
            $(`#chatTalkToOnlineStatus`).addClass(`hide`);
            return;
        }

        if(recordStatus.connected == true)
        {
            $(`#chatTalkToOnlineStatus`).removeClass(`hide`);
        }
        else
        {
            $(`#chatTalkToOnlineStatus`).addClass(`hide`);
        }
    }
}

async function updateChatMessageToSent(messageId)
{
    const updateMessageToSentQuery = `UPDATE Messages SET statusSent = 1 WHERE messageId = ?`
    const updateMessageToSentValues = [messageId];
    await dbRun(updateMessageToSentQuery, updateMessageToSentValues);

    console.log(`CHATMSG: Message ${messageId} sent to server`);

}

async function updateChatMessageToReceived(messageId)
{
    const updateMessageToReceivedQuery = `UPDATE Messages SET statusReceived = 1 WHERE messageId = ?`
    const updateMessageToReceivedValues = [messageId];
    await dbRun(updateMessageToReceivedQuery, updateMessageToReceivedValues);

    console.log(`CHATMSG: Message ${messageId} received by server`);
}

async function receiveNewChatMessage(messageBody)
{
    const readyPS = readyForPS();
    if(readyPS == false)
    {
        console.log(`PS not ready, waiting for PS init...`);
        await waitForPSInit();
        console.log(`PS is now ready!`);
    }

    if(messageBody.FromId == messageBody.ToId)
    {
        console.log(`🔴 BLOCKED: Unable to receive message with same from and to`);
        await informServerMessageWasReceived(messageBody.MessageId);

        return;
    }

    if(typeof messageBody.ToIsGroup == `undefined`)
    {
        messageBody.ToIsGroup = 0;
    }

    if(messageBody.ToIsGroup == null)
    {
        messageBody.ToIsGroup = 0;
    }



    const encryptedMessage = messageBody.Content;

    let privateKey = null;

    if(messageBody.ToIsGroup == 0)
    {
        const privateKeyQuery = `SELECT privatekey FROM LinkedContacts WHERE contact = ?`;
        const privateKeyQueryValues = [messageBody.FromId];
        const privareKeyQueryResponse = await dbRun(privateKeyQuery, privateKeyQueryValues);
    
        if(privareKeyQueryResponse.rows.length > 0)
        {
            const privateKeyRecord = privareKeyQueryResponse.rows.item(0);
            if(privateKeyRecord.privatekey != null)
            {
                privateKey = privateKeyRecord.privatekey;
            }
        }
    
        if(privateKey == null)
        {
            const privateKeyServerResponse = await callS(true, `GET`, `/services/contactprivatekey/${messageBody.FromId}`);
            if(privateKeyServerResponse.linkedContactList != null)
            {
                if(privateKeyServerResponse.linkedContactList.length > 0)
                {
                    linkedContactList = privateKeyServerResponse.linkedContactList;
                    refreshLinkedContactList();
                    // await overwriteLocalLinkedContactList();
                }
            }
            privateKey = privateKeyServerResponse.privateKey;
        }    
    }
    else
    {
        const privateKeyQuery = `SELECT PrivateKey FROM AppGroups WHERE GroupId = ?`;
        const privateKeyQueryValues = [messageBody.groupId];
        const privareKeyQueryResponse = await dbRun(privateKeyQuery, privateKeyQueryValues);


        if(privareKeyQueryResponse.rows.length > 0)
        {
            const privateKeyRecord = privareKeyQueryResponse.rows.item(0);
            if(privateKeyRecord.PrivateKey != null)
            {
                privateKey = privateKeyRecord.PrivateKey;
            }
        }
        else
        {
            // This group doesnt exists yet
            arrPendingMessageToWriteIntoGroup.push(messageBody);
            return;
        }

        if(privateKey == null)
        {
            const privateKeyServerResponse = await callS(true, `GET`, `/services/groupprivatekey/${messageBody.groupId}`);
            if(privateKeyServerResponse.value != null)
            {
                privateKey = privateKeyServerResponse.value;

                const privateKeyUpdateQuery = `UPDATE AppGroups SET PrivateKey = ? WHERE GroupId = ?`;
                const privateKeyUpdateQueryValues = [privateKey, messageBody.groupId];
                await dbRun(privateKeyUpdateQuery, privateKeyUpdateQueryValues);
            }
        }
    }

    var decryptedMessage;
    try
    {
        // decryptedMessage = await decryptMessageText(privateKey, encryptedMessage);
        decryptedMessage = cv2DecryptMessageText(privateKey, encryptedMessage);
    }
    catch(decryptException)
    {
        console.log(`Decrypt error for message ${messageBody.MessageId}: ${decryptException}`);
        return;
    }


    messageBody.Content = decryptedMessage;



    const queryCheck = `SELECT id FROM Messages WHERE messageId = ?`;
    const queryCheckValues = [messageBody.MessageId];
    const resultCheck = await dbRun(queryCheck, queryCheckValues);

    let messageAlreadyInserted = false;
    if(resultCheck.rows.length > 0)
    {
        // Already added, skip it (continue) - It happens when from and to users are the same login
        messageAlreadyInserted = true;
    }

    let messsageRead = 0;
    if(talkToId != null)
    {
        if(talkToId == messageBody.FromId)
        {
            messsageRead = 1;
        }    
    }

    const messageTimeValue = getAdjustInternalTime(messageBody.MessageTime);

    const toIdMessage = messageBody.ToIsGroup == 0 ? messageBody.ToId : messageBody.groupId;

    if(messageAlreadyInserted == false)
    {
        if(messageBody.Content == null)
        {
            messageBody.Content = "";
        }

        const sqlNewMessage = `INSERT INTO Messages (messageId, fromId, toId, content, protected, messageTime, media, mediaType, InReplyToMessageId, toIsGroup, statusSent, statusReceived, statusRead) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const sqlNewMessageValues = [
            messageBody.MessageId,
            messageBody.FromId,
            toIdMessage,
            messageBody.Content,
            messageBody.Protected,
            messageTimeValue,
            messageBody.Media,
            messageBody.MediaType,
            messageBody.InReplyToMessageId,
            messageBody.ToIsGroup,
            1,
            1,
            messsageRead
        ];
        await dbRun(sqlNewMessage, sqlNewMessageValues);    
    }

    // Update contact list cover for this contact id
    await updateContactListCoverByContactId(toIdMessage);

    // If chat with this user is opened for this contact add message to current chat
    let isChatWithOpenedContact = false;
    if(messageBody.ToIsGroup == 0)
    {
        isChatWithOpenedContact = talkToId == messageBody.FromId ? true : false;
    }
    else
    {
        isChatWithOpenedContact = talkToId == messageBody.groupId ? true : false;
    }

    if(isChatWithOpenedContact == true)
    {
        chatRoomIsReceiving = true;

        // const chatText = messageBody.Protected == 0 ? messageBody.Content : CHAT_PROTECTED_TEXT;
        const chatText = messageBody.Content;
        const messageDateTime = new Date(messageBody.MessageTime)
        const media = messageBody.Media != null ? messageBody.Media : "";
        const mediaType = messageBody.MediaType != null ? messageBody.MediaType : "";
        const inReplyToMessageId = messageBody.InReplyToMessageId != null ? messageBody.InReplyToMessageId : "";

        if(media.length == 0 || mediaType.length == 0)
        {
            appendReceiveMessage(messageBody.MessageId, chatText, messageDateTime, inReplyToMessageId, null);
        }
        else
        {
            appendReceiveMessageWithMedia(messageBody.MessageId, chatText, mediaType, media, messageDateTime, inReplyToMessageId, null);
        }

        $(`#audioChatMessageReceive`)[0].play();

        // Scroll to bottom
        scrollChatToBottom(false, false);

        chatRoomIsReceiving = false;
    }

    refreshUnreadMessageCounter();

    if(messageBody.ToIsGroup == 0)
    {
        await informServerMessageWasReceived(messageBody.MessageId);
    }
    else
    {
        await informServerMessageGroupWasReceived(messageBody.MessageId);
    }
}

async function markChatMessageToRead(messageId)
{
    const updateMessageToReadQuery = `UPDATE Messages SET statusRead = 1 WHERE messageId = ?`
    const updateMessageToReadValues = [messageId];
    await dbRun(updateMessageToReadQuery, updateMessageToReadValues);

    console.log(`CHATMSG: Message ${messageId} delivered`);
}

async function getLocalSavedLinkedContactList()
{
    const listtQuery = `SELECT contact, nickname, pin, name FROM LinkedContacts`;
    const result = await dbRun(listtQuery, null);

    let tmpLoadList = [];
    for(let ix = 0; ix < result.rows.length; ix++)
    {
        const record = result.rows.item(ix);
        tmpLoadList.push({
            "Contact": record.contact,
            "Nickname": record.nickname,
            "Pin": record.contact,
            "Name": record.name
        });
    }

    return tmpLoadList;
}

async function loadLocalSavedLinkedContactList()
{
    let tmpLoadList = await getLocalSavedLinkedContactList();
    linkedContactList = tmpLoadList;
}

async function requestGroupUpdateFromGroupList(groupUpdateList)
{
    // console.log(`Received group update information for group list ${groupUpdateList}`);

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        return;
    }

    if(groupUpdateList.length == 0)
    {
        return;
    }

    // console.log(`Request group list information of ${groupUpdateList}`);

    // Comma Separated List 
    const requestGroupListCommaSep = groupUpdateList.join();

    // console.log(`Request list ${requestGroupListCommaSep}`);

    const groupListRequestData = {
        "grouplist": requestGroupListCommaSep
    };

    // Download updated information and members from groupId list
    const groupListResponse = await callS(true, `POST`, `/services/groups`, groupListRequestData);

    const serverGroupList = groupListResponse.groups;
    const serverGroupMembers = groupListResponse.members;

    let scriptList = [];
    let scriptListValues = [];

    let uniqueGroupCheck = [];
    let uniqueGroupMembersCheck = [];

    for(let ix = 0; ix < groupUpdateList.length; ix++)
    {
        const groupId = groupUpdateList[ix];
        const serverGroupRecord = serverGroupList.find((item) => {
            return item.GroupId == groupId;
        });

        // console.log(`Checking group ${groupId}...`);

        if(serverGroupRecord == null)
        {
            continue;
        }

        // console.log(`Retrieving group record of ${groupId}...`);

        if(serverGroupRecord.DeleteDate != null)
        {
            continue;
        }

        const serverGroupMembersRecord = serverGroupMembers.filter((item) =>{
            return item.GroupId == groupId;
        });

        if(serverGroupMembersRecord == null)
        {
            continue;
        }

        if(serverGroupMembersRecord.length == 0)
        {
            continue;
        }

        // console.log(`Checking previous existing group ${groupId}...`);

        const addedGroupQuery = `SELECT * FROM AppGroups WHERE GroupId = ?`;
        const addedGroupQueryValues = [groupId];
        const addedGroupResponse = await dbRun(addedGroupQuery, addedGroupQueryValues);

        let isNew = true;
        let existingGroup = null;
        if(addedGroupResponse.rows.length > 0)
        {
            isNew = false;
            existingGroup = addedGroupResponse.rows.item(0);
        }

        const groupName = serverGroupRecord.Name;
        const groupDescription = serverGroupRecord.Description;
        const groupPrivateKey = serverGroupRecord.PrivateKey;

        const groupHasGroupValidity = serverGroupRecord.HasGroupValidity;
        const groupHasGroupValidityFromDate = serverGroupRecord.HasGroupValidityFromDate;
        const groupValidityFromDate = serverGroupRecord.ValidityFromDate != null ? serverGroupRecord.ValidityFromDate*1000 : null;
        const groupHasGroupValidityBetween = serverGroupRecord.HasGroupValidityBetween;
        const groupValidityBetweenDateStart = serverGroupRecord.ValidityBetweenDateStart != null ? serverGroupRecord.ValidityBetweenDateStart*1000 : null;
        const groupValidityBetweenDateEnd = serverGroupRecord.ValidityBetweenDateEnd != null ? serverGroupRecord.ValidityBetweenDateEnd*1000 : null;
        const groupHasGroupAccessHours = serverGroupRecord.HasGroupAccessHours;
        const groupGroupAccessHoursStart = serverGroupRecord.GroupAccessHoursStart
        const groupGroupAccessHoursEnd = serverGroupRecord.GroupAccessHoursEnd;

        let groupPhoto = `images/group.png`;

        // groupPhoto = `${endpoint}services/groupphotoraw/${groupId}`;

        // // No cache
        // groupPhoto += `?nocacheid=${makeid(6)}`;


        // console.log(`Retrieving group image ${groupId}...`);

        const localDownloadGroupPhotoFileInfo = await getLocalSavedGroupPhoto(groupId);
        const localDownloadedGroupPhotoFilePath = localDownloadGroupPhotoFileInfo.filePath;
        const localGroupPhotoFileName = localDownloadGroupPhotoFileInfo.fileName;
    
        let groupPhotoDownloaded = false;

        if(localDownloadGroupPhotoFileInfo.found == true)
        {
            // console.log(`Local group photo file already downloaded`);
            groupPhotoDownloaded = true;
        }
        else
        {
            // Download updated profile image (no await to keep it fast)

            const hasGroupServerPhoto = await hasServerGroupPhoto(groupId);
            if(hasGroupServerPhoto == true)
            {
                await downloadFileFromServer(`${endpoint}services/groupphotoimagedownload/${groupId}`, imagesLocalFolderLocation, localGroupPhotoFileName, null);
                groupPhotoDownloaded = true;    
            }
        }

        if(groupPhotoDownloaded == true)
        {
            groupPhoto = localDownloadedGroupPhotoFilePath;
        }
       

        const groupAdmin = serverGroupRecord.CreatorAdminLogin;
        const creationDate = serverGroupRecord.CreationDate;
        
        // console.log(`Saving group to internal DB ${groupId}...`);
      
        // Update/Insert local database AppGroups and AppGroupMembers

        const dtNow = new Date();
        const lastActionDate = dtNow.getTime();

        
        if(isNew == true)
        {
            // Insert
            const insertAction = 'Imported';   

            // Protect against unique constraint failure (GroupId)
            const existsUniqueGroup = uniqueGroupCheck.find((item) =>{
                return item.groupId == groupId
            });


            if(existsUniqueGroup == null)
            {
                uniqueGroupCheck.push({
                    "groupId": groupId
                })

                const scriptInsertGroup = `INSERT INTO AppGroups (GroupId, Name, Description, Photo, CreatorAdminLogin, PrivateKey, 
                HasGroupValidity, HasGroupValidityFromDate, ValidityFromDate, HasGroupValidityBetween, ValidityBetweenDateStart,
                ValidityBetweenDateEnd, HasGroupAccessHours, GroupAccessHoursStart, GroupAccessHoursEnd, CreationDate, InsertAction, LastAction, LastActionDate) 
                VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                const scriptInsertGroupValues = [groupId, groupName, groupDescription, groupPhoto, groupAdmin, groupPrivateKey, 
                    groupHasGroupValidity, groupHasGroupValidityFromDate, groupValidityFromDate, groupHasGroupValidityBetween, groupValidityBetweenDateStart,
                    groupValidityBetweenDateEnd, groupHasGroupAccessHours, groupGroupAccessHoursStart, groupGroupAccessHoursEnd, creationDate, insertAction, insertAction, lastActionDate
    
                ];
                scriptList.push(scriptInsertGroup);
                scriptListValues.push(scriptInsertGroupValues);   

                // console.log(`Insert of group ${groupId} (scriptLen: ${scriptListValues.length})`);
            }

        }
        else
        {
            // Update
            const scriptUpdateGroup = `
            UPDATE AppGroups SET 
                Name = ?,
                Description = ?,
                Photo = ?,
                HasGroupValidity = ?,
                HasGroupValidityFromDate = ?,
                ValidityFromDate = ?,
                HasGroupValidityBetween = ?,
                ValidityBetweenDateStart = ?,
                ValidityBetweenDateEnd = ?,
                HasGroupAccessHours = ?,
                GroupAccessHoursStart = ?,
                GroupAccessHoursEnd = ?,
                CreatorAdminLogin = ?,
                PrivateKey = ?,
                LastAction = 'Group_Update' ,
                LastActionDate = ?
            WHERE 
                GroupId = ?
            `;
            const scriptUpdateGroupValues = [groupName, groupDescription, groupPhoto, groupHasGroupValidity, groupHasGroupValidityFromDate,
                groupValidityFromDate, groupHasGroupValidityBetween, groupValidityBetweenDateStart, groupValidityBetweenDateEnd, 
                groupHasGroupAccessHours, groupGroupAccessHoursStart, groupGroupAccessHoursEnd, groupAdmin, groupPrivateKey, lastActionDate, groupId];
           
            scriptList.push(scriptUpdateGroup);
            scriptListValues.push(scriptUpdateGroupValues);
        }

        // console.log(`Saving group members to internal DB ${groupId}...`);

        // Delete all members to insert updated members
        const scriptDeleteAllMembers = `DELETE FROM AppGroupMembers WHERE GroupId = ?`;
        const scriptDeleteAllMembersValues = [groupId];
        scriptList.push(scriptDeleteAllMembers);
        scriptListValues.push(scriptDeleteAllMembersValues);

        
        // Insert all members
        for(let ixMember = 0; ixMember < serverGroupMembersRecord.length; ixMember++)
        {
            const memberRecord = serverGroupMembersRecord[ixMember];
            const memberContactId = memberRecord.Login;
            const memberIsAdmin = memberRecord.IsAdmin;
            const memberMessagePermission = memberRecord.MessagePermission;
            const memberWaitingForApproval = memberRecord.WaitingLoginApproval;
            const memberLoginApproved = memberRecord.LoginApproved;
            const memberStatusDelivered = memberRecord.StatusDelivered;
            const memberRemoved = memberRecord.Removed;

            const memberCreationDate = memberRecord.CreationDate;

            const memberHasUserValidity = memberRecord.HasUserValidity;
            const memberHasUserValidityFromDate = memberRecord.HasUserValidityFromDate;
            
            const memberUserValidityFromDate = memberRecord.UserValidityFromDate != null ? memberRecord.UserValidityFromDate*1000 : null;;
            const memberHasUserValidityBetween = memberRecord.HasUserValidityBetween;
            
            const memberUserValidityBetweenDateStart = memberRecord.UserValidityBetweenDateStart != null ? memberRecord.UserValidityBetweenDateStart*1000 : null;
            const memberUserValidityBetweenDateEnd = memberRecord.UserValidityBetweenDateEnd != null ? memberRecord.UserValidityBetweenDateEnd*1000 : null;;

            const scriptInsertMember = `INSERT INTO AppGroupMembers (GroupId, Login, IsAdmin, MessagePermission, HasUserValidity,
            HasUserValidityFromDate, UserValidityFromDate, HasUserValidityBetween, UserValidityBetweenDateStart, UserValidityBetweenDateEnd, WaitingLoginApproval, 
            LoginApproved, StatusDelivered, Removed, CreationDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const scriptInsertMemberValues = [groupId, memberContactId, memberIsAdmin, memberMessagePermission, memberHasUserValidity,
            memberHasUserValidityFromDate, memberUserValidityFromDate, memberHasUserValidityBetween, memberUserValidityBetweenDateStart, memberUserValidityBetweenDateEnd,  memberWaitingForApproval, 
            memberLoginApproved, memberStatusDelivered, memberRemoved, memberCreationDate];

            // Protect against unique constraint failure (GroupId, Login)
            const existsUniqueGroupMember = uniqueGroupMembersCheck.find((item) =>{
                return item.groupId == groupId && item.login == memberContactId
            });

            if(existsUniqueGroupMember != null)
            {
                continue;
            }

            uniqueGroupMembersCheck.push({
                "groupId": groupId,
                "login": memberContactId
            })

            scriptList.push(scriptInsertMember);
            scriptListValues.push(scriptInsertMemberValues);

            // console.log(`Insert of group member ${groupId} | ${memberContactId}`);
        }

    }

    if(scriptList.length == 0)
    {
        return;
    }

    // console.log(`Closing internal DB transaction...`);

    await dbRunManyInSameTransaction(scriptList, scriptListValues);

    // console.log(`Sending message to server as delivered group list...`);

    const setDeliveredMessageBody = {
        "groupUpdateList": groupUpdateList
    };

    const socketData = {
        "request": "SET_UPDATED_GROUP_DELIVERED",
        "params": [
            setDeliveredMessageBody
        ]
    }

    sendSocketText(JSON.stringify(socketData));

    // Check for pending message to write after group creation
    let indexesToRemoveFromMessageToWriteInGroup = [];

    for(let ix = 0; ix < groupUpdateList.length; ix++)
    {
        const groupId = groupUpdateList[ix];

        const messagesForGroup = arrPendingMessageToWriteIntoGroup.filter((item) =>{
            if(typeof item.groupId == 'undefined')
            {
                return false;
            }

            return item.groupId == groupId;
        });

        if(messagesForGroup == null)
        {
            continue;
        }

        if(messagesForGroup.length == 0)
        {
            continue;
        }

        for(let ixMsg = 0; ixMsg < messagesForGroup.length; ixMsg++)
        {
            const messageToReceive = messagesForGroup[ixMsg];
            receiveNewChatMessage(messageToReceive);

            const indexValue = arrPendingMessageToWriteIntoGroup.findIndex((item) =>{
                return item.MessageId == messageToReceive.MessageId;
            });
            indexesToRemoveFromMessageToWriteInGroup.push(indexValue);

        }

    }

    for(let ix = indexesToRemoveFromMessageToWriteInGroup.length -1; ix >= 0; ix--)
    {
        indexesToRemoveFromMessageToWriteInGroup.splice(ix, 1);
    }


    refreshGroupList();

    // console.log(`Group update finished`);
}

async function groupRefreshListInDevice(groupUpdateList)
{
    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        return;
    }

    if(groupUpdateList.length == 0)
    {
        return;
    }

    // Comma Separated List 
    const requestGroupListCommaSep = groupUpdateList.join();

    // console.log(`Request list ${requestGroupListCommaSep}`);

    const groupListRequestData = {
        "grouplist": requestGroupListCommaSep
    };

    // Download updated information and members from groupId list
    const groupListResponse = await callS(true, `POST`, `/services/groups`, groupListRequestData);

    const serverGroupList = groupListResponse.groups;
    const serverGroupMembers = groupListResponse.members;

    let updateRequestList = [];


    for(let ix = 0; ix < groupUpdateList.length; ix++)
    {
        const groupId = groupUpdateList[ix];
        const serverGroupRecord = serverGroupList.find((item) => {
            return item.GroupId == groupId;
        });

        if(serverGroupRecord == null)
        {
            continue;
        }

        if(serverGroupRecord.DeleteDate != null)
        {
            continue;
        }

        const serverGroupMembersRecord = serverGroupMembers.filter((item) =>{
            return item.GroupId == groupId;
        });

        if(serverGroupMembersRecord == null)
        {
            continue;
        }

        if(serverGroupMembersRecord.length == 0)
        {
            continue;
        }
    
        const addedGroupQuery = `SELECT * FROM AppGroups WHERE GroupId = ?`;
        const addedGroupQueryValues = [groupId];
        const addedGroupResponse = await dbRun(addedGroupQuery, addedGroupQueryValues);

        let isNew = true;
        let existingGroup = null;
        if(addedGroupResponse.rows.length > 0)
        {
            isNew = false;
            existingGroup = addedGroupResponse.rows.item(0);
        }

        if(isNew == true)
        {
            updateRequestList.push(groupId);
            continue;
        }

        // Check for pending group messages
        const messagesForGroup = arrPendingMessageToWriteIntoGroup.filter((item) =>{
            if(typeof item.groupId == 'undefined')
            {
                return false;
            }

            return item.groupId == groupId;
        });

        if(messagesForGroup == null)
        {
            continue;
        }

        if(messagesForGroup.length == 0)
        {
            continue;
        }

        for(let ixMsg = 0; ixMsg < messagesForGroup.length; ixMsg++)
        {
            const messageToReceive = messagesForGroup[ixMsg];
            receiveNewChatMessage(messageToReceive);
        }

    }

    if(updateRequestList.length > 0)
    {
        await requestGroupUpdateFromGroupList(updateRequestList);
    }

    // Wait 7 sec. and force group photo refresh for all groups
    // console.log(`Wait 7 sec. to refresh all group photos after device refresh list`)
    setTimeout(async function(){
        // console.log(`Refreshing all group photos after device refresh list`)
        await forceRefreshGroupListPhotos();
        updateLinkedContactListCache();
    }, 7000)

}

async function requestGroupMemberDelete(groupId, loginDeleted)
{
    const query = 'DELETE FROM AppGroupMembers WHERE GroupId = ? AND Login = ?';
    const values = [groupId, loginDeleted];
    await dbRun(query, values);

    const setDeliveredMessageBody = {
        "groupMemberDeleteList": [groupId]
    };

    const socketData = {
        request: "SET_UPDATED_GROUP_MEMBER_DELETE_DELIVERED",
        params: [ 
            setDeliveredMessageBody
        ]
    }

    sendSocketText(JSON.stringify(socketData));

}

//async function requestGroupMemberDeleteOnConnect (groupId)
async function requestGroupMemberDeleteOnConnect (groupMemberDeleteList)
{
    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        return;
    }

    if(groupMemberDeleteList.length == 0)
    {
        return;
    }

    const requestGroupListCommaSep = groupMemberDeleteList.join();

    const groupListRequestData = {
        "grouplist": requestGroupListCommaSep
    };

    //const group = await callS(true, 'POST', '/services/groups', { groupList: groupId });
    const groupResponse = await callS(true, 'POST', '/services/groups', groupListRequestData);

    const serverGroupsList = groupResponse.groups;
    const serverMembersList = groupResponse.members;

    let scriptList = [];
    let scriptListValues = [];

    let dataToDelete = 0;

    for(let ix = 0; ix < groupMemberDeleteList.length; ix++)
    {
        const groupId = groupMemberDeleteList[ix];
        const serverGroupRecord = serverGroupsList.find((item) => {
            return item.GroupId == groupId;
        });

        if(serverGroupRecord == null)
        {
            continue;
        }

        if(serverGroupRecord.DeleteDate != null)
        {
            continue;
        }

        const serverGroupMembersRecord = serverMembersList.filter((item) =>{
            return item.GroupId == groupId;
        });

        if(serverGroupMembersRecord == null)
        {
            continue;
        }

        if(serverGroupMembersRecord.length == 0)
        {
            continue;
        }

        //check if there is serverGroupMembers as Removed = 1

        const serverGroupRemoved = serverGroupMembersRecord.filter((member) =>{
            return member.Removed == 1;
        });        

        // check if there is members for Group locally 
        // on server DeleteStatusDeliverd = 0

        const serverLogins = serverGroupMembersRecord.map(m => m.Login);

        const queryLocal = 'SELECT * FROM AppGroupMembers WHERE GroupId = ?';
        const localMembers = await dbRun(queryLocal, [groupId]);

        if(localMembers.rows.length > 0) 
        {            
            let localLogins = [];

            for(ixLocal = 0; ixLocal < localMembers.rows.length; ixLocal ++)
            {
                localLogins.push(localMembers.rows.item(ixLocal).Login);
            }
    
            //members that exists locally but not in server
            let toDelete = localLogins.filter(login => !serverLogins.includes(login));

            //add members that exists locally and on server is Removed
            if(serverGroupRemoved.length >0)
            {
                for(ixServ = 0; ixServ < serverGroupRemoved.length; ixServ++)
                {
                    toDelete.push(serverGroupRemoved[ixServ].Login);
                }
            }
            
            for(let ix = 0; ix < toDelete.length; ix++)
            {
                dataToDelete = 1;
                const login = toDelete[ix];
                const deleteQuery = 'DELETE FROM AppGroupMembers WHERE GroupId = ? AND Login = ?';
                const deleteQueryValues =  [groupId, login];

                scriptList.push(deleteQuery);
                scriptListValues.push(deleteQueryValues);
            }
            
        }
    }

    // even when there is no script to Run locally on Server there is data do Update DeleteStatusDelivered must be updated to 1 
    // if(scriptList.length == 0) 
    // {
    //     return;
    // }

    // console.log(`Closing internal DB transaction...`);

    if(dataToDelete == 1) 
    {
        await dbRunManyInSameTransaction(scriptList, scriptListValues);
    }
    
    //const logins = members?.map(m => m.Login);

    // if(localMembers.rows.length > 0) 
    // {
    //     const localMembersArr = localMembers.rows;
    //     const localLogins = localMembersArr?.map(m => m.Login)

    //     const toDelete = localLogins.filter(login => !logins.includes(login));
        
    //     for(let ix = 0; ix < toDelete.length; ix++){
    //         const login = toDelete[ix];
    //         const deleteQuery = 'DELETE FROM AppGroupMembers WHERE GroupId = ? AND Login = ?';
    //         await dbRun(deleteQuery, [groupId, login]);
    //     }
    // }
    
    // const data = {
    //     messageType: 'SET_UPDATED_GROUP_MEMBER_DELETE_DELIVERED',
    //     params: [{"groupId": groupId}]
    // };

    // sends message to update appGroups DeleteStatusDelivered to 1 on server
    
    const setDeliveredMessageBody = {
        "groupMemberDeleteList": groupMemberDeleteList
    };

    const socketData = {
        "request": "SET_UPDATED_GROUP_MEMBER_DELETE_DELIVERED",
        "params": [
            setDeliveredMessageBody
        ]
    }

    sendSocketText(JSON.stringify(socketData));
}

async function requestGroupDeletedAsMember(groupIdListDeleteAsMember)
{
    let scriptList = [];
    let scriptListValues = [];

    for(ix = 0; ix < groupIdListDeleteAsMember.length; ix ++)
    {
        const groupId = groupIdListDeleteAsMember[ix];

        //checks if group exists locally
        const queryLocal = 'SELECT * FROM AppGroups WHERE GroupId = ?';
        const groupLocal = await dbRun(queryLocal, [groupId]);

        if(groupLocal.rows.length > 0)
        {
            //delete appgroups data
            const deleteGroup = 'DELETE FROM AppGroups WHERE GroupId = ?';
            const deleteGroupValues = [groupId];

            scriptList.push(deleteGroup);
            scriptListValues.push(deleteGroupValues);

            const deleteGroupMembers = 'DELETE FROM AppGroupMembers WHERE GroupId = ?';
            const deleteGroupMembersValues = [groupId];

            scriptList.push(deleteGroupMembers);
            scriptListValues.push(deleteGroupMembersValues);
        }

        //checks if group exists locally
        const queryTalkGroupMemberCache = 'SELECT * FROM AppTalkGroupMembersCache WHERE GroupId = ?';
        const talkGroupCache = await dbRun(queryTalkGroupMemberCache, [groupId]);

        if(talkGroupCache.rows.length > 0)
        {
            //delete appgroups data
            const deleteGroupMemberCache = 'DELETE FROM AppTalkGroupMembersCache WHERE GroupId = ?';
            const deleteGroupMemberCacheValues = [groupId];

            scriptList.push(deleteGroupMemberCache);
            scriptListValues.push(deleteGroupMemberCacheValues);
        }
    }

    if(scriptList.length > 0)
    {
        await dbRunManyInSameTransaction(scriptList, scriptListValues);
    }

    refreshGroupList();
    /*
    const data = {
        messageType: 'SET_UPDATED_GROUP_DELETED_ASMEMBER_DELIVERED',
        params: [{ groupId }]
    };*/

    const setDeliveredMessageBody = {
        "groupListDeletedAsMember": groupIdListDeleteAsMember
    };

    const socketData = {
        "request": "SET_UPDATED_GROUP_DELETED_ASMEMBER_DELIVERED",
        "params": [
            setDeliveredMessageBody
        ]
    }

    sendSocketText(JSON.stringify(socketData));
}


async function requestGroupExitedMemberDelete(groupId, exitedMemberId)
{
    const query = 'DELETE FROM AppGroupMembers WHERE GroupId = ? AND Login = ?';
    const values = [groupId, exitedMemberId];
    await dbRun(query, values);

    const setDeliveredMessageBody = {
        "groupIds": [groupId]
    };

    const socketData = {
        request: "SET_GROUP_EXITED_MEMBER_DELIVERED",
        params: [ 
            setDeliveredMessageBody
        ]
    }

    sendSocketText(JSON.stringify(socketData));
}

async function requestGroupExitedMemberOnConnect(groupIdList)
{
    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        return;
    }

    if(groupIdList.length == 0)
    {
        return;
    }

    const requestGroupListCommaSep = groupIdList.join();

    const groupListRequestData = {
        "grouplist": requestGroupListCommaSep
    };

    //const group = await callS(true, 'POST', '/services/groups', { groupList: groupId });
    const groupResponse = await callS(true, 'POST', '/services/groups', groupListRequestData);

    const serverGroupsList = groupResponse.groups;
    const serverMembersList = groupResponse.members;

    let scriptList = [];
    let scriptListValues = [];

    let dataToDelete = 0;

    for(let ix = 0; ix < groupIdList.length; ix++)
    {
        const groupId = groupIdList[ix];
        const serverGroupRecord = serverGroupsList.find((item) => {
            return item.GroupId == groupId;
        });

        if(serverGroupRecord == null)
        {
            continue;
        }

        if(serverGroupRecord.DeleteDate != null)
        {
            continue;
        }

        const serverGroupMembersRecord = serverMembersList.filter((item) =>{
            return item.GroupId == groupId;
        });

        if(serverGroupMembersRecord == null)
        {
            continue;
        }

        if(serverGroupMembersRecord.length == 0)
        {
            continue;
        }

        //check if there is serverGroupMembers as Removed = 1

        const serverGroupRemoved = serverGroupMembersRecord.filter((member) =>{
            return member.GroupExited == 1;
        });        

        // check if there is members for Group locally 
        // on server DeleteStatusDeliverd = 0

        const serverLogins = serverGroupMembersRecord.map(m => m.Login);

        const queryLocal = 'SELECT * FROM AppGroupMembers WHERE GroupId = ?';
        const localMembers = await dbRun(queryLocal, [groupId]);

        if(localMembers.rows.length > 0) 
        {            
            let localLogins = [];

            for(ixLocal = 0; ixLocal < localMembers.rows.length; ixLocal ++)
            {
                localLogins.push(localMembers.rows.item(ixLocal).Login);
            }
    
            //members that exists locally but not in server
            let toDelete = localLogins.filter(login => !serverLogins.includes(login));

            //add members that exists locally and on server is Removed
            if(serverGroupRemoved.length >0)
            {
                for(ixServ = 0; ixServ < serverGroupRemoved.length; ixServ++)
                {
                    toDelete.push(serverGroupRemoved[ixServ].Login);
                }
            }
            
            for(let ix = 0; ix < toDelete.length; ix++)
            {
                dataToDelete = 1;
                const login = toDelete[ix];
                const deleteQuery = 'DELETE FROM AppGroupMembers WHERE GroupId = ? AND Login = ?';
                const deleteQueryValues =  [groupId, login];

                scriptList.push(deleteQuery);
                scriptListValues.push(deleteQueryValues);
            }
            
        }
    }

    if(dataToDelete == 1) 
    {
        await dbRunManyInSameTransaction(scriptList, scriptListValues);
    }
    
    const setDeliveredMessageBody = {
        "groupIds": groupIdList
    };

    const socketData = {
        "request": "SET_GROUP_EXITED_MEMBER_DELIVERED",
        "params": [
            setDeliveredMessageBody
        ]
    }

    sendSocketText(JSON.stringify(socketData));
}

async function requestGroupDelete(groupId) 
{
    const membersDel = 'DELETE FROM AppGroupMembers WHERE GroupId = ?';
    const membersDelValues = [groupId];
    await dbRun(membersDel, membersDelValues);

    const groupDel = 'DELETE FROM AppGroups WHERE GroupId = ?';
    const groupDelValues = [groupId];
    await dbRun(groupDel, groupDelValues);

    refreshGroupList();

    const setDeliveredMessageBody = {
        "groupIds": [groupId]
    };

    const socketData = {
        request: "SET_GROUP_DELETED_DELIVERED",
        params: [ 
            setDeliveredMessageBody
        ]
    }

    sendSocketText(JSON.stringify(socketData));
}

async function requestGroupDeletedOnConnect(groupIds) 
{
    const groupListValue = `'${groupIds.join("', '")}'`;
    
    if(groupListValue.trim().length == 0)
    {
        return;
    }
    
    const membersDel = `DELETE FROM AppGroupMembers WHERE GroupId IN(${groupListValue})`;
    const membersDelValues = [];
    await dbRun(membersDel, membersDelValues);

    const groupDel = `DELETE FROM AppGroups WHERE GroupId IN(${groupListValue})`;
    const groupDelValues = [];
    await dbRun(groupDel, groupDelValues);

    refreshGroupList();

    const setDeliveredMessageBody = {
        "groupIds": groupIds
    };

    const socketData = {
        request: "SET_GROUP_DELETED_DELIVERED",
        params: [ 
            setDeliveredMessageBody
        ]
    }
    sendSocketText(JSON.stringify(socketData));
}

async function overwriteLocalLinkedContactList()
{
    let queryList = [
        `DELETE FROM LinkedContacts;`
    ];

    let queryValues = [
        null
    ];


    var contactsToBeSaved = [];

    for(let ix = 0; ix < linkedContactList.length; ix++)
    {
        const record = linkedContactList[ix];

        const alreadySaved = contactsToBeSaved.find((item) =>{
            return item == record.Contact;
        });

        if(alreadySaved != null)
        {
            continue;
        }

        contactsToBeSaved.push(record.Contact);

        const queryInsert = `INSERT INTO LinkedContacts(contact, nickname, pin, name, privatekey) VALUES(?, ?, ?, ?, ?)`;
        const valuesInsert = [record.Contact, record.Nickname, record.Pin, record.Name, record.PrivateKey];

        queryList.push(queryInsert);
        queryValues.push(valuesInsert);


        // const sqCheck = `SELECT * FROM LinkedContacts WHERE contact = ?`;
        // const sqlCheckValues = [record.Contact];
        // const sqlCheckResponse = await dbRun(sqCheck, sqlCheckValues);
    
        // let existingLocalRecord = null;
    
        // if(sqlCheckResponse == null)
        // {
        //     existingLocalRecord = null;
        // }
        // else if(sqlCheckResponse.rows.length == 0)
        // {
        //     existingLocalRecord = null;
        // }
        // else
        // {
        //     existingLocalRecord = sqlCheckResponse.rows.item(0);
        // }    
    

        // if(existingLocalRecord == null)
        // {
        //     const queryInsert = `INSERT INTO LinkedContacts(contact, nickname, pin, name, privatekey) VALUES(?, ?, ?, ?, ?)`;
        //     const valuesInsert = [record.Contact, record.Nickname, record.Pin, record.Name, record.PrivateKey];

        //     queryList.push(queryInsert);
        //     queryValues.push(valuesInsert);
        // }
        // else
        // {
        //     const queryUpdate = `UPDATE LinkedContacts SET privatekey = ?, pin = ? WHERE contact = ?`;
        //     const valuesUpdate = [record.PrivateKey, record.Pin, record.Contact];

        //     queryList.push(queryUpdate);
        //     queryValues.push(valuesUpdate);
        // }
    }
    await dbRunManyInSameTransaction(queryList, queryValues);
}

async function clearLocalLinkedContactList()
{
    const queryInsert = `DELETE FROM LinkedContacts`;
    await dbRun(queryInsert, null);
}

async function informServerMessageWasReceived(messageId)
{
    const queryInsert = `INSERT INTO PendingMsgToInformServerReceived(messageId) VALUES (?)`;
    const queryInsertValues = [messageId];
    await dbRun(queryInsert, queryInsertValues);
}

async function informServerMessageGroupWasReceived(messageId)
{
    const queryInsert = `INSERT INTO PendingMsgGroupToInformServerReceived(messageId) VALUES (?)`;
    const queryInsertValues = [messageId];
    await dbRun(queryInsert, queryInsertValues);
}

async function getPhotoProfileURL(contactId, preloadedConnectionState, noCache)
{
    let serverConnectionState;

    if(preloadedConnectionState != null)
    {
        serverConnectionState = preloadedConnectionState;
    }
    else
    {
        serverConnectionState = await hasServerConnection();
    }

    if(noCache == null)
    {
        noCache = false;
    }

    let contactPhoto = `images/contact.png`;

    const localDownloadProfilePhotoFileInfo = await getLocalSavedProfilePhoto(contactId);
    const localDownloadedProfilePhotoFilePath = localDownloadProfilePhotoFileInfo.filePath;
    const localProfilePhotoFileName = localDownloadProfilePhotoFileInfo.fileName;

    if(serverConnectionState == true)
    {
        contactPhoto = `${endpoint}services/userphotoraw/${contactId}`;

        if(noCache == true)
        {
            contactPhoto += `?nocacheid=${makeid(6)}`;
        }
        
        // Download updated profile image (no await to keep it fast)
        const serverHasUser = await callS(false, `GET`, `/services/hasuserbyuid/${contactId}`, null);

        if(serverHasUser.found == true)
        {
            downloadFileFromServer(`${endpoint}services/userphotodownload/${contactId}`, imagesLocalFolderLocation, localProfilePhotoFileName, null);
        }
    }
    else
    {
        if(localDownloadProfilePhotoFileInfo.found == true)
        {
            contactPhoto = await getDeviceFileBase64URL(localDownloadedProfilePhotoFilePath);
        }
    }

    return contactPhoto;
}

async function getLocalSavedProfilePhoto(contactId)
{
    const fileName = `profile-${contactId}.png`;
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

async function getLocalSavedGroupPhoto(groupId)
{
    const fileName = `group-${groupId}.png`;
    const localDownloadedFilePath = `${imagesLocalFolderLocation}${fileName}`;

    // console.log(`👾 Try to load photo by path: ${localDownloadedFilePath}`);

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

async function hasServerGroupPhoto(groupId)
{
    const checkURL = `/services/hasgroupphotoimagetodownload/${groupId}`;

    const response = await callS(false, `GET`, checkURL, null);

    if(response == null)
    {
        return false;
    }

    if(response.result == null)
    {
        return false;
    }

    return response.result;
}

function toHHMMSS(value) 
{
    var sec_num = parseInt(value, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;

   //return new Date(value * 1000).toISOString().substr(11, 8)
}

function toMMSS(value) 
{
    var sec_num = parseInt(value, 10); // don't forget the second param
    var minutes = Math.floor(sec_num / 60);
    var seconds = sec_num - (minutes * 60);

    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
}

function diffInSeconds(startDate, endDate)
{
    var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
    return seconds;
}

// function urlify(text) 
// {
//     var urlRegex = /(https?:\/\/[^\s]+)/g;
//     const result = text.replace(urlRegex, function(url) {
//         return '<a href="' + url + '">' + url + '</a>';
//     });

//     // or alternatively
//     // result = text.replace(urlRegex, '<a href="$1">$1</a>')

//     return result
// }

function urlify(text) 
{
    var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
    //var urlRegex = /(https?:\/\/[^\s]+)/g;
    const result = text.replace(urlRegex, function(url,b,c) {
        let appliedURL = url;
        let endsWithSymbol = false;

        const lastSymbol = url.substr(url.length - 1);
        if(
            lastSymbol == `.` ||
            lastSymbol == `,` ||
            lastSymbol == `:` ||
            lastSymbol == `;` ||
            lastSymbol == `?` ||
            lastSymbol == `!`
        )
        {
            // Remove last character
            appliedURL = url.substring(0, url.length - 1);

            endsWithSymbol = true;
        }

        const url2 = (c.toLowerCase() == 'www.') ? `http://${appliedURL}` : appliedURL;
        let tagResult = `<a href="${url2}" target="_blank">${appliedURL}</a>`;
        if(endsWithSymbol == true)
        {
            tagResult += lastSymbol;
        }
        return tagResult;
    });

    return result;
}

function highlight(itemSelector, miliseconds)
{
    $(itemSelector).addClass("highlight");

    setTimeout(function () {
          $(itemSelector).removeClass('highlight');
    }, miliseconds);
}

async function pgpGetKeys(uidList)
{
    // const loggedIn = isLoggedIn();

    // if(loggedIn == false)
    // {
    //     return null;
    // }

    const uidsObjectList = [];

    for(let ix = 0; ix < uidList.length; ix++)
    {
        const uid = uidList[ix];

        uidsObjectList.push({
            "uid": uid
        })
    }

    // let uid = readLocalStorage("uid");

    const encPS = getEncPS();

    var options = {
        userIDs: uidsObjectList,
        type: 'ecc',
        curve: 'curve25519',
        passphrase: encPS, // protects the private key
        format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
    }

    const generatedKeys = await openpgp.generateKey(options);

    const privateKey = generatedKeys.privateKey;
    const publicKey = generatedKeys.publicKey;
    const revocationCertificate = generatedKeys.revocationCertificate;


    const extractedPublicKey = await getPublicKeyFromPrivateKey(privateKey);

    const result = {
        "privateKey": privateKey,
        "publicKey": publicKey,
        "revocationCertificate": revocationCertificate,
        "extractedPublicKey": extractedPublicKey,
        "validPublicKey": (publicKey == extractedPublicKey)
    }

    // console.log(result);

    return result;
}

async function getPublicKeyFromPrivateKey(privateKeyArmored) 
{
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const publicKey = privateKey.toPublic();

    // console.log('Extracted Public Key:', publicKey.armor());
    return publicKey.armor();
}

async function encryptMessageText(privateKey, content)
{
    const publicKeyValue = await getPublicKeyFromPrivateKey(privateKey);
    const publicKeyInstance = await openpgp.readKey({ armoredKey: publicKeyValue });

    const encPS = getEncPS();

    const privateKeyInstance = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: encPS
    });

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: content }), // input as Message object
        encryptionKeys: publicKeyInstance,
        signingKeys: privateKeyInstance // optional
    });

    return encrypted;
}

async function decryptMessageText(privateKey, encryptedContent)
{
    const BEGIN_ENCRYPTED_MESSAGE = `-----BEGIN PGP MESSAGE-----`;
    const END_ENCRYPTED_MESSAGE = `-----END PGP MESSAGE-----`;

    if(encryptedContent.trim().startsWith(BEGIN_ENCRYPTED_MESSAGE) == false || encryptedContent.trim().endsWith(END_ENCRYPTED_MESSAGE) == false)
    {
        // Not encrypted
        return encryptedContent;
    }

    const message = await openpgp.readMessage({
        armoredMessage: encryptedContent // parse armored message
    });

    const publicKeyValue = await getPublicKeyFromPrivateKey(privateKey);
    const publicKeyInstance = await openpgp.readKey({ armoredKey: publicKeyValue });

    const encPS = getEncPS();

    const privateKeyInstance = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: encPS
    });

    const decrypted = await openpgp.decrypt({
        message,
        config: {
            allowInsecureDecryptionWithSigningKeys: true, // To avoid error Session key decryption failed.
        },
        verificationKeys: publicKeyInstance, // optional
        decryptionKeys: privateKeyInstance
    });

    const chunks = [];
    for await (const chunk of decrypted.data) 
    {
        chunks.push(chunk);
    }

    const plaintext = chunks.join('');

    return plaintext;
}












function cv2GetKeys() {
    const encryptor = new JSEncrypt();
    const privateKey = encryptor.getPrivateKey();
    const publicKey = encryptor.getPublicKey();

    return {
        privateKey,
        publicKey,
    };
}

// Encrypt message
function cv2EncryptMessageText(privateKey, content) {
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(cv2GetPublicKeyFromPrivateKey(privateKey));
    return encryptor.encrypt(content);
}

// Decrypt message
function cv2DecryptMessageText(privateKey, encryptedContent) {
    const decryptor = new JSEncrypt();
    decryptor.setPrivateKey(privateKey);
    return decryptor.decrypt(encryptedContent);
}

// Extract public key from private key
function cv2GetPublicKeyFromPrivateKey(privateKey) {
    const encryptor = new JSEncrypt();
    encryptor.setPrivateKey(privateKey);
    return encryptor.getPublicKey();
}


// Optional: Test function to demonstrate usage
async function testEncryption() 
{
    const { privateKey, publicKey } = cv2GetKeys();
    const encryptedMessage = cv2EncryptMessageText(privateKey, "Hello, Browser!");
    const decryptedMessage = cv2DecryptMessageText(privateKey, encryptedMessage);

    console.log('Private Key:', privateKey);
    console.log('Public Key:', publicKey);       


    console.log("Encrypted Message:", encryptedMessage);
    console.log("Decrypted Message:", decryptedMessage);
}

async function testEncryptionFromNodeJSGeneration()
{
    const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCrvyzZQlKMhvbn
fiu1ne+CBiuETmkjMdehmKCj3Nwt0InaN3uO7cpt69jo1p4LAwgho9ZeId017Q2V
7800lVePBSRVlbjJ8XwDg0Dthfn+HeeZL40DemMIqr6dXqMVZJwcUMPpORiTSTjP
NgMz319ylNQvmbVwKEH6p9L0t7qaLRa+hyW7qq2Iyjv+Gy+Xdx7H6+1uD3ez2MrV
POtrDvovkZ1RZwBajHIjjLDKteyhZU5AvP+qSc8gAbfvunPj1LaxSuH1RfnQOMIp
m8popDiXonfGW/UHvDSxbLSDssJqBK+IlvaMK+h/ge/xVElsngbIJUw46VxK17oa
8G2+klInAgMBAAECggEAARXgbhZJ0hK/frxAzhE+3hIbgxn0kI3HfU4rCoriM8JT
DLdrDX7NPh9oEiV0TEEec2/6PxAOh0FSfUJNu4MlUYV7zE3gJBtlm3QTgsZk/q+O
5ikmkzRz0C5o4MyKhVKxQrCNlgZcjgAmRSqXOWQanob4RfC+J9GC6tc8SxWm+6oP
CRrLgNQbO7/M1SCvJ4iwTT1MewkX/RdXwkMo9YzgVWyqngBh6jf+hSuGeOXcEQR0
As8Oq72spz2QYX7f/s6iKPrwLznPoyaEosyELKJdy04DsdIG8WlM6Hids2mLiEMW
AXgyE3s2Y+jM9TeiDM6e3u52bPbgI1igir/JFHTIOQKBgQDaAApFpeRSbKp8djTS
uGrC6KXM0R1xF4azlycmcuCZuNAPU7R2dQbw5DkPHEx0f8MaNGMen3YJvsTMuQ3k
xgaV3Z2y8F1jfL82frljgGStaxPwjbDPlozydPF8LIxaWBkz8z+6xSCZEA3IGwM9
d97dTih2abbvYdQ10y69c8n+WwKBgQDJryQeAANhwCLZiLFn/DGq544+EsNoxIlw
Hb+46TPDicrMvmiL/0n2NMqkwdxzQ05A3ZVpI9Sjz12KBJOoKKpNEklzZhH1SJ/f
prYKuTBSZGyJDdLZJl9kvdN/B2Rey3MqpSmH3/WCqLEN/cEe96t1pqcTOk5MYwpC
x9z9JyTdJQKBgADnnyNK3Pe6m7qIgw+c1FSawpVnCMg/YL++ENuH/oakzbhCkK0t
LyowyEvXwjl5jkW9keu+na7Mq+RtoDEi4UQd91mWxcxz6BdBz2MqVUCjASIudF1o
Mo2PDrGFPc/iLbiZedo8lzYLawM5mXnX1YT1nhVfuvKjZU4T4k3G/T+hAoGAegs7
xdOoODy2WgC3qf8YZx0cHD/qc7mKmYfG/rRPmKIHUIJgbWcccJpdjfmp1y4Baosr
4KXIBSB0sBI47+c7tsu8GtLHRzCdXg9Z1X9e2FzguMbesnzf+OxN0W69tAdVN5ce
XJSP0nMWQSsu8/hXjyg7rgz4WI0OJn8fISnQyukCgYA+5bcM+n+C6AViypdvPR7w
vRFdmJODV1Auu93TA2SIu/j/juWKL8pkd6Jz9lHdeTg0BsXr/qdJ72P7/5oJ1I9X
0dG0MhyNhykpMxfqBNrX2uYYlkFCQozR6ibGtibTYeR5R01c6/GTNrGzwcTd0NNg
WubDUlAd9jyS3Otpxtfupg==
-----END PRIVATE KEY-----`;
    const encryptedMessage = `nnr86/ML/QpazsIG2E2wA/zzCvFBbFFCXe2NUfRw1MZnSwObC1jkMnDpL1hwHyqTjlQ/yLdSiMFx3mCHwf9O/lB6cNkmb2I4Iq81qSeoYAc7jkqmA1fJaQNkcCbSJTuGZyeMtjwOLKqxsFb++4tNLexuOxaU1dh6SQshQK7pYJGoPFewMn35bdk6xf1X3Osc2oAWgpUMA0X9k8bSyubQmXYeQKXIIhe7LNdghdQxXLXiA50jE6X9Jr6InMZut3cLupDPqzAy4xA8UNtukdYVVGjUHaRwasCoonw+vUaV6gTrbjs07IwQa2J40BOmI/r4FSrHrp3hLvP2Mgb9F3yVHg==`;

    const decryptedMessage = cv2DecryptMessageText(privateKey, encryptedMessage);

    console.log("Encrypted Message:", encryptedMessage);
    console.log("Decrypted Message:", decryptedMessage);
}

// Run the test
// testEncryption();

















function getAdjustInternalTime(timeValue)
{
    // const LOW_VALUE_TIME = 9999999999;

    // if(parseInt(timeValue) < LOW_VALUE_TIME)
    // {
    //     timeValue = parseInt(timeValue) * 1000
    // }

    // return timeValue;

    const dateFromTimeValue = getDateFromTimestampValue(timeValue);
    const timeValueFromDate = dateFromTimeValue.getTime();
    return timeValueFromDate;
}


function chunkString(str, length) 
{
    // return str.match(new RegExp('.{1,' + length + '}', 'g'));

    const arr = [];
    let i = 0;
    
    //iterate the string
    while (i < str.length) 
    {
        //slice the characters of given length
        //and push them in output array
        arr.push(str.slice(i, i + length));
        i = i + length;
    }
  
    return arr;
}



function stringCompress(value)
{

    const compressed = stringCompressPako(value);
    return compressed;

    // // const compressed = LZString.compress(value);
    // const compressed = LZUTF8.compress(value, {outputEncoding: "Base64"});
    // return compressed;
}

function stringDecompress(value)
{
    var decompressed = "";
    try
    {
        decompressed = stringDecompressPako(value);
    }
    catch(decompressException)
    {
        console.log(`Unable to decompress using PAKO: ${decompressException}. Maybe it is an old compression, trying by LZString...`);

        try
        {
            decompressed = stringDecompressLZString(value);
        }
        catch(decompressLZStringException)
        {
            console.log(`Unable to decompress using LZString: ${decompressLZStringException}`);
        }
    }

    return decompressed;

    // // const decompressed = LZString.decompress(value);
    // const decompressed =LZUTF8.decompress(value, {inputEncoding: "Base64", outputEncoding: "String"});
    // return decompressed;
}



// Helper function to convert an ArrayBuffer to a base64 string
function arrayBufferToBase64(buffer) 
{
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}


function stringCompressLZString(value)
{
    // const compressed = LZString.compress(value);
    const compressed = LZUTF8.compress(value, {outputEncoding: "Base64"});
    return compressed;
}

function stringDecompressLZString(value)
{
    // const decompressed = LZString.decompress(value);
    const decompressed =LZUTF8.decompress(value, {inputEncoding: "Base64", outputEncoding: "String"});
    return decompressed;
}



function stringCompressPako(input) 
{
    // // Convert the input string to a Uint8Array
    // const binaryString = new TextEncoder().encode(input);
    // // Compress the binary data using pako
    // const compressedData = pako.deflate(binaryString);
    // // Convert the compressed data to a base64 string
    // const base64Compressed = btoa(String.fromCharCode(...compressedData));
    // return base64Compressed;


    // Convert the input string to a Uint8Array
    const binaryString = new TextEncoder().encode(input);
    // Compress the binary data using pako
    const compressedData = pako.deflate(binaryString);

    // Convert the compressed data to a base64 string
    const base64Compressed = arrayBufferToBase64(compressedData);
    return base64Compressed;
}

function stringDecompressPako(input) 
{
    // // Decode the base64 string to binary data
    // const compressedData = new Uint8Array(atob(input).split("").map(char => char.charCodeAt(0)));
    // // Decompress the binary data using pako
    // const decompressedData = pako.inflate(compressedData);
    // // Convert the decompressed data back to a string
    // const output = new TextDecoder().decode(decompressedData);
    // return output;

    // Decode the base64 string to binary data
    const compressedData = new Uint8Array(atob(input).split("").map(char => char.charCodeAt(0)));
    // Decompress the binary data using pako
    const decompressedData = pako.inflate(compressedData);
    // Convert the decompressed data back to a string
    const output = new TextDecoder().decode(decompressedData);
    return output;
}





async function processMessageWithUploadError(messageRecord, critical)
{
    const MAX_ATTEMPTS = 5;

    if(critical == null)
    {
        critical = false;
    }

    let previousErrorRecordIndex = messagesWithUploadError.findIndex((item) =>{
        return item.messageId == messageRecord.messageId
    });

    if(previousErrorRecordIndex == -1)
    {
        messagesWithUploadError.push({
            "messageId": messageRecord.messageId,
            "count": 1
        });

        previousErrorRecordIndex = 0;
    }
    else
    {
        messagesWithUploadError[previousErrorRecordIndex].count = messagesWithUploadError[previousErrorRecordIndex].count + 1;
    }

    console.log(`Upload Error for message ${messageRecord.messageId} - ${messagesWithUploadError[previousErrorRecordIndex].count} of ${MAX_ATTEMPTS}`);

    if(critical == true || messagesWithUploadError[previousErrorRecordIndex].count > MAX_ATTEMPTS)
    {
        const MessagesDel = `DELETE FROM Messages WHERE messageId = ?`;
        const MessagesDelValues = [messageRecord.messageId];

        await dbRun(MessagesDel, MessagesDelValues);

        if(talkToId != null)
        {
            // Remove message from any opened chat
            $(`.chat-message-block[data-id="${messageRecord.messageId}"]`).remove();

            await updateChatRoomCache();
        }

        // Remove array element by index
        messagesWithUploadError.splice(previousErrorRecordIndex, 1);
    }

}

function setDeviceBadge(badgeNumber)
{
    if(isNaN(badgeNumber) == true)
    {
        badgeNumber = parseInt(badgeNumber);
        if(isNaN(badgeNumber) == true)
        {
            clearDeviceBadge();
            return;
        }
    }

    badgeNumber = parseInt(badgeNumber);

    if(badgeNumber < 0)
    {
        clearDeviceBadge();
        return;
    }

    if(typeof cordova.plugins != `undefined`)
    {
        if(typeof cordova.plugins.notification != `undefined`)
        {
            if(typeof cordova.plugins.notification.badge != `undefined`)
            {
                try
                {
                    cordova.plugins.notification.badge.set(badgeNumber);
                }
                catch(badgeErr)
                {
                    console.log(`⛑️ 0 - Err Notification Badge: ${badgeErr}`);
                }

            }
            else
            {
                console.log(`⛑️ 1 - Notification Badge Plugin Not Found!`);
            }
        }
        else
        {
            console.log(`⛑️ 2 - Notification Badge Plugin Not Found!`);
        }
    }
    else
    {
        console.log(`⛑️ 3 - Notification Badge Plugin Not Found!`);
    }


    if(typeof cordova.plugins != `undefined`)
    {
        if(typeof cordova.plugins.firebase != `undefined`)
        {
            if(typeof cordova.plugins.firebase.messaging != `undefined`)
            {
                if(typeof cordova.plugins.firebase.messaging.setBadge != `undefined`)
                {
                    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
                    {
                        return;
                    }

                    try
                    {
                        cordova.plugins.firebase.messaging.setBadge(badgeNumber);
                    }
                    catch(badgeErr)
                    {
                        console.log(`⛑️ a0 - Err Notification Badge: ${badgeErr}`);
                    }

                }
                else
                {
                    console.log(`⛑️ a1 - Notification Badge Plugin Not Found!`);
                }
            }
            else
            {
                console.log(`⛑️ a2 - Notification Badge Plugin Not Found!`);
            }
        }
        else
        {
            console.log(`⛑️ a3 - Notification Badge Plugin Not Found!`);
        }
    }
    else
    {
        console.log(`⛑️ a4 - Notification Badge Plugin Not Found!`);
    }
}

function setBadgeToZero()
{
    try
    {
        setDeviceBadge(0);
    }
    catch(setBadgeException)
    {
        console.log(`Unable to set badge to zero`);
    }

    clearDeviceBadge();
}

function clearDeviceBadge()
{
    if(typeof cordova.plugins != `undefined`)
    {
        if(typeof cordova.plugins.notification != `undefined`)
        {
            if(typeof cordova.plugins.notification.badge != `undefined`)
            {
                try
                {
                    cordova.plugins.notification.badge.clear();
                }
                catch(badgeErr)
                {
                    console.log(`⛑️ 0 - Notification Badge Err: ${badgeErr}`);
                }
            }
            else
            {
                console.log(`⛑️ 1 - Notification Badge Plugin Not Found!`);
            }
        }
        else
        {
            console.log(`⛑️ 2 - Notification Badge Plugin Not Found!`);
        }
    }
    else
    {
        console.log(`⛑️ 3 - Notification Badge Plugin Not Found!`);
    }
}

function setCompanyId(newCompanyId)
{
    writeLocalStorage(`company`, newCompanyId);
    sendCompanyIdToServer(newCompanyId);
}

function clearCompanyId()
{
    removeLocalStorage(`company`);
    sendCompanyIdToServer("");
}

function sendCompanyIdToServer(newCompanyId)
{
    if(webSocket == null)
    {
        return;
    }

    const connectionState = webSocket.readyState;

    if(connectionState != SOCKET_OPEN)
    {
        return;
    }

    if(newCompanyId == null)
    {
        newCompanyId = "";
    }

    const companyBody = {
        "company": newCompanyId
    }

    const socketData = {
        "request": "SET_USER_COMPANY",
        "params": [
            companyBody
        ]
    }

    sendSocketText(JSON.stringify(socketData));
}

async function setContactServedByCompany(contactId, companyId)
{
    if(contactId == null)
    {
        console.log(`(setContactServedByCompany) contactId was probably reset by user`);
        return;
    }

    const sqlServedByCompany = `SELECT * FROM ContactServedByCompany WHERE contact = ?`;
    const sqlServedByCompanyValues = [contactId];
    const sqlServedByCompanyResponse = await dbRun(sqlServedByCompany, sqlServedByCompanyValues);

    let existingLocalRecord = null;

    if(sqlServedByCompanyResponse == null)
    {
        existingLocalRecord = null;
    }
    else if(sqlServedByCompanyResponse.rows.length == 0)
    {
        existingLocalRecord = null;
    }
    else
    {
        existingLocalRecord = sqlServedByCompanyResponse.rows.item(0);
    }    

    if(existingLocalRecord == null)
    {
        const sqlInsert = `INSERT INTO ContactServedByCompany (contact, company, savedOnTheServer) VALUES (?, ?, ?)`;
        const sqlInsertValues = [contactId, companyId, 0];
        await dbRun(sqlInsert, sqlInsertValues);
    }
    else
    {
        const sqlUpdate = `UPDATE ContactServedByCompany SET company = ?, savedOnTheServer = ? WHERE contact = ?`;
        const sqlUpdateValues = [companyId, 0, contactId];
        await dbRun(sqlUpdate, sqlUpdateValues);
    }
}

async function setSavedContactServedByCompany(contactId, companyId)
{
    const SAVED_TAG = 1;
    const sqlUpdate = `UPDATE ContactServedByCompany SET savedOnTheServer = ? WHERE contact = ? AND company = ?`;
    const sqlUpdateValues = [SAVED_TAG, contactId, companyId];
    await dbRun(sqlUpdate, sqlUpdateValues);
}

async function getCompanyToSendMessage(toId)
{
    let currentCompany = readLocalStorage(`company`);

    if(currentCompany == null)
    {
        // Not using company mode
        return null;
    }

    const sqlServedByCompany = `SELECT company FROM ContactServedByCompany WHERE contact = ?`;
    const sqlServedByCompanyValues = [toId];
    const sqlServedByCompanyResponse = await dbRun(sqlServedByCompany, sqlServedByCompanyValues);

    let existingLocalRecord = null;

    if(sqlServedByCompanyResponse == null)
    {
        existingLocalRecord = null;
    }
    else if(sqlServedByCompanyResponse.rows.length == 0)
    {
        existingLocalRecord = null;
    }
    else
    {
        existingLocalRecord = sqlServedByCompanyResponse.rows.item(0);
    }

    if(existingLocalRecord == null)
    {
        return currentCompany;
    }

    const servedByCompanyId = existingLocalRecord.company;
    return servedByCompanyId;
}

function getWhisperLanguage()
{
    const fallbackLang = "en";
    const countryQuery = countryCode;
    const countryLangSet = COUNTRY_LANG_SET.find((item) => { return item.code.toUpperCase() == countryQuery.toUpperCase() });

    if(countryLangSet == null)
    {
        console.log(`Unable to get country lang set. Using fallback Whisper Language`);
        return fallbackLang;
    }

    const countryLocale = countryLangSet.locale;
    const langOfLocale = countryLocale.split("_")[0];

    if(langOfLocale == null)
    {
        console.log(`Unable to get language of locale. Using fallback Whisper Language`);
        return fallbackLang;
    }

    if(langOfLocale.length == 0)
    {
        console.log(`Empty language of locale. Using fallback Whisper Language`);
        return fallbackLang;
    }

    const whisperLang = WHISPER_LANG_LIST.find((item) =>{ return item.language.toUpperCase() == langOfLocale.toUpperCase()});
    if(whisperLang == null)
    {
        console.log(`Unable to get Whisper language. Using fallback Whisper Language`);
        return fallbackLang;
    }

    return whisperLang.language.toLowerCase();
}

function getFileURI(fileName)
{
    return new Promise((resolve, reject) =>{
        browserFs.root.getFile(fileName, {}, function(fileEntry) {
            // Get the file URL
            const fileURI = fileEntry.toURL(); // You can also use toInternalURL() if needed
            // const fileURI = fileEntry.toInternalURL();
            resolve(fileURI)
        }, (err) =>{
            if (err.name === 'NotFoundError') 
            {
                const fileURL = `${browserFsPath}${fileName}`;
                resolve(fileURL);
                return;
            }

            reject(err);
        });   
    })
}

function getWhisperTranscriptMaxDuration()
{
    const value = 15000; // In miliseconds
    return value;
}

function initBrowserFileSystem()
{
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    window.requestFileSystem(window.TEMPORARY, 1024*1024, function(fs) {
        browserFsInitError = false;
        browserFs = fs;
        browserFsPath = browserFs.root.toURL();
        console.log('🌎 📱 📁 Opened browser file system: ', browserFs.name);
    }, function(err){
        browserFsInitError = true;
        console.log('🌎 ⛑️ 📁 Error on browser file system: ', err);
    });
}

function waitForBrowserFileSystemInit()
{
    return new Promise((resolve, reject) =>{
        if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
        {
            resolve();
            return;
        }
        
        if(browserFs != null)
        {
            resolve();
            return;
        }

        if(browserFsInitError == true)
        {
            resolve();
            return;
        }

        let itvBrowserFsInit = setInterval(function(){
            if(browserFs != null || browserFsInitError == true)
            {
                clearInterval(itvBrowserFsInit);
                itvBrowserFsInit = null;
                resolve();
                return;
            }  
        }, 500);
    })
}

function saveBase64ImageToBrowserFS(base64String, fileName) 
{
    return new Promise((resolve, reject) => {
        const blob = base64ToBlob(base64String, 'image/png');
        
        window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024, function(fs) {
            fs.root.getFile(fileName, { create: true, exclusive: false }, function(fileEntry) {
                fileEntry.createWriter(function(fileWriter) {
                    
                    fileWriter.onwriteend = function() {
                        // File written successfully, resolve with the file path (filesystem URL)
                        resolve(fileEntry.toURL());
                    };
                    
                    fileWriter.onerror = function(e) {
                        reject(`Failed to write file: ${e.toString()}`);
                    };

                    // Write the Blob data
                    fileWriter.write(blob);

                }, function(err) {
                    reject(`Error creating file writer: ${err.toString()}`);
                });
            }, function(err) {
                reject(`Error accessing file system: ${err.toString()}`);
            });
        }, function(err) {
            reject(`Error requesting file system: ${err.toString()}`);
        });
    });
}

// Helper function to convert base64 string to Blob
function base64ToBlob(base64Data, contentType) 
{
    contentType = contentType || '';
    const sliceSize = 512;
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) 
    {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) 
        {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
}

function captureImageFromVideoTag(videoElement) 
{
    return new Promise((resolve, reject) => {
        if (!videoElement) {
            reject("No video element provided.");
            return;
        }

        // Create a canvas element to capture the image
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        // Set canvas dimensions to match the video dimensions
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        // Draw the current frame from the video onto the canvas
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert the canvas content to a Base64 image (data URL)
        const imageDataURL = canvas.toDataURL('image/png');

        // Resolve the promise with the Base64 string
        resolve(imageDataURL);
    });
}

function getEncPS()
{
    const v = getoWGxd();
    return v;
}

async function rqEncPS()
{  
    if(itvServiceEncPS != null)
    {
        clearInterval(itvServiceEncPS);
        itvServiceEncPS = null;
    }

    itvServiceEncPS = setInterval(function(){

        if(encPSUnderReq == true)
        {
            return;
        }

        const loginToken = readLocalStorage("login");
        const uid = readLocalStorage("uid");
    
        if(uid == null || loginToken == null)
        {
            return;
        }

        let v = getoWGxd();
        if(v.length > 0)
        {
            return;
        }

        if(webSocket == null)
        {
            return;
        }

        const connectionState = webSocket.readyState;

        if(connectionState != SOCKET_OPEN)
        {
            return;
        }

        const data = {
            "request": "OWBGXD",
            "params": [
                {"uid": uid}
            ]
        }

        sendSocketText(JSON.stringify(data));

        encPSUnderReq = true;
    }, 1000);
}

function readyForPS()
{
    const encPS = getEncPS();
    if(encPS == null)
    {
        return false;
    }

    if(encPS.trim().length == 0)
    {
        return false;
    }

    return true;
}

function waitForPSInit()
{
    return new Promise((resolve, reject) =>{
        var readyPS = readyForPS();

        if(readyPS == true)
        {
            resolve();
            return;
        }

        var itvPSWait = setInterval(function(){
            readyPS = readyForPS();

            if(readyPS == true)
            {
                clearInterval(itvPSWait);
                itvPSWait = null;
                resolve();
            }
        }, 1000);
    })
}

function getFileEntry(uri, flagCreate, flagExclusive, callback)
{
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        if(uri.toLowerCase().trim().startsWith("filesystem:") == true)
        {
            const fileName = getFileNameFromPath(uri);
            uri = `${imagesLocalFolderLocation}${fileName}`;
        }

        browserFs.root.getFile(uri, { create: flagCreate, exclusive: flagExclusive }, function(fileEntry) {
            callback(fileEntry, null);
        }, function(err){
            console.log(`File system error: ${err}`);
            callback(null, err);
        })
    }
    else
    {
        window.resolveLocalFileSystemURL(uri, function (fileEntry){
            callback(fileEntry, null);
        }, function(err){
            console.log(`File system error: ${err}`);
            callback(null, err);
        });
    }
}

function getFileNameFromPath(filePath)
{
    const parts = filePath.split(`/`);
    const fileName = parts[parts.length -1];
    return fileName;
}

async function setAudioTranscriptionMessage(messageId)
{
    if(pendingMediaTypeToSend == null)
    {
        return;
    }
    
    if(pendingMediaTypeToSend != MEDIA_TYPE_AUDIO)
    {
        return;
    }
   
    const mediaFile = pendingMediaToSend;

    const loadingAudioProcessingText = getTranslate(`wait-for-audio-processing`, `Please wait for audio processing`);
    swal(loadingAudioProcessingText, {
        button: false, closeOnClickOutside: false
    });

    await waitTime(2000);

    const transcriptionResult = await runAudioTranscription(mediaFile);
    
    const audioLocalTranscription = transcriptionResult.audioLocalTranscription;
    const audioLocalDurationInSeconds = transcriptionResult.audioLocalDurationInSeconds;

    await waitTime(200);
    swal.close();

    await setAudioTranscriptionCache(mediaFile, audioLocalTranscription, audioLocalDurationInSeconds);

    if($(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).length > 0)
    {   
        $(`.chat-message-block[data-id="${messageId}"]`).find(`.message-text`).html(`${audioLocalTranscription}`);
    }
}

async function runAudioTranscription(mediaFile)
{
    const audioLang = getWhisperLanguage();
    const audioTranscriptMaxDuration = getWhisperTranscriptMaxDuration();
    const mediaInConvertionIsMP3 = false;

    let audioLocalTranscription = "";
    let audioLocalDurationInSeconds = 0;

    const audioLocalTranscriptionResponse = await window.internal.alliances.transcribeAudio(mediaFile, audioLang, audioTranscriptMaxDuration, mediaInConvertionIsMP3);
    audioLocalTranscription = audioLocalTranscriptionResponse.result;
    audioLocalDurationInSeconds = audioLocalTranscriptionResponse.audioDurationSec;

    const result = {
        "audioLocalTranscription": audioLocalTranscription,
        "audioLocalDurationInSeconds": audioLocalDurationInSeconds
    }

    return result;
}

async function setAudioTranscriptionCache(mediaFile, transcription, duration)
{
    const scriptCache = `INSERT INTO AudioTranscriptionCache (mediaFile, transcription, duration) VALUES (?, ?, ?)`;
    const scriptCacheValues = [mediaFile, transcription, duration];
    await dbRun(scriptCache, scriptCacheValues);
}

async function getAudioTranscriptionCache(mediaFile)
{
    let result = {
        "transcription": "",
        "duration": 0
    };

    const sqlCache = `SELECT transcription, duration FROM AudioTranscriptionCache WHERE mediaFile = ?`;
    const sqlCacheValues = [mediaFile];
    const sqlCacheResponse = await dbRun(sqlCache, sqlCacheValues);

    if(sqlCacheResponse != null)
    {
        if(sqlCacheResponse.rows.length > 0)
        {
            const sqlCacheRecord = sqlCacheResponse.rows.item(0);
            result.transcription = sqlCacheRecord.transcription;
            result.duration = sqlCacheRecord.duration;
        }
    }

    if(result.transcription == null)
    {
        result.transcription = "";
    }

    if(result.duration == null)
    {
        result.duration = 0;
    }

    return result;
}

async function removeAudioTranscriptionCache(mediaFile)
{
    const scriptCache = `DELETE FROM AudioTranscriptionCache WHERE mediaFile = ?`;
    const scriptCacheValues = [mediaFile];
    await dbRun(scriptCache, scriptCacheValues);
}

async function clearAudioTranscriptionCache()
{
    const sqlCache = `SELECT transcription FROM AudioTranscriptionCache`;
    const sqlCacheValues = null;

    const sqlCacheResponse = await dbRun(sqlCache, sqlCacheValues);

    if(sqlCacheResponse != null)
    {
        if(sqlCacheResponse.rows.length > 0)
        {
            const scriptCache = `DELETE FROM AudioTranscriptionCache`;
            const scriptCacheValues = null;
            await dbRun(scriptCache, scriptCacheValues);        
        }
    }
}

function createDefaultAppServerConnection(asSelected)
{
    appServerConnectionList.push({
        "id": 0,
        "accessCode": "",
        "label": "",
        "default": true,
        "selected": asSelected,
        "endpoint": endpoint,
        "socketEndpoint": socketEndpoint
    });
}

function getNonDefaultServerConnectionList()
{
    const result = appServerConnectionList.filter((item) =>{ return item.default == false });
    return JSON.parse(JSON.stringify(result));
}

function addAppServerConnection(id, accessCode, label, selected, vEndpoint, vSocketEndpoint)
{
    // Skip if already exists
    let existingRecords = appServerConnectionList.filter((item) =>{
        return item.endpoint == vEndpoint || item.socketEndpoint == vSocketEndpoint
    });

    if(existingRecords != null)
    {
        if(existingRecords.length > 0)
        {
            return;
        }
    }

    if(selected == true)
    {
        let selectedIndex = appServerConnectionList.findIndex((item) =>{
            return item.selected == true;
        })

        if(selectedIndex > -1)
        {
            appServerConnectionList[selectedIndex].selected = false;
        }
    }

    appServerConnectionList.push({
        "id": id,
        "accessCode": accessCode,
        "label": label,
        "default": false,
        "selected": selected,
        "endpoint": vEndpoint,
        "socketEndpoint": vSocketEndpoint
    });

    writeAppServerConnectionInfo();

    defineEndpoints(vEndpoint, vSocketEndpoint);
}

function initializeAppServerConnectionInfo()
{
    const strServerConnectionList = readLocalStorage(`srvCnList`);

    if(strServerConnectionList != null)
    {
        try
        {
            appServerConnectionList = JSON.parse(strServerConnectionList);
        }
        catch(parseException)
        {

        }
    }
    
    if(Array.isArray(appServerConnectionList) == false)
    {
        appServerConnectionList = [];
    }      

    if(appServerConnectionList.length == 0)
    {
        createDefaultAppServerConnection(true);
    }
    

    if(strServerConnectionList == null)
    {
        writeAppServerConnectionInfo();
    }

    const selectedConnection = getSelectedAppServerConnection();
    const connectionId = selectedConnection.id;
    const isDefault = selectedConnection.default;
    
    if(isDefault == false) // Corporate Connection
    {
        setSelectedAppServerConnection(connectionId);
        $(`#btnAppMenuConnectionQR`).removeClass(`hide`);
    }
    else
    {
        $(`#btnAppMenuConnectionQR`).addClass(`hide`);
    }
}

function writeAppServerConnectionInfo()
{
    writeLocalStorage(`srvCnList`, JSON.stringify(appServerConnectionList));
}


function getSelectedAppServerConnection()
{
    if(appServerConnectionList == null)
    {
        initializeAppServerConnectionInfo();
    }

    if(appServerConnectionList.length == 0)
    {
        initializeAppServerConnectionInfo();
    }

    const selected = appServerConnectionList.find((item) =>{
        return item.selected == true;
    });

    if(selected == null)
    {
        selected = appServerConnectionList[0];
    }

    return selected;
}

function setSelectedAppServerConnection(id)
{
    if(appServerConnectionList == null)
    {
        initializeAppServerConnectionInfo();
    }

    if(appServerConnectionList.length == 0)
    {
        initializeAppServerConnectionInfo();
    }

    const recordIx = appServerConnectionList.findIndex((item) =>{
        return item.id == id;
    });

    if(recordIx == -1)
    {
        return;
    }

    const selectedIx = appServerConnectionList.findIndex((item) =>{
        return item.selected == true;
    });

    if(selectedIx > -1)
    {
        appServerConnectionList[selectedIx].selected = false;
    }

    appServerConnectionList[recordIx].selected = true;
    
    defineEndpoints(appServerConnectionList[recordIx].endpoint, appServerConnectionList[recordIx].socketEndpoint);

    // After set the the connection write into local storage
    writeAppServerConnectionInfo();
}

function defineEndpoints(newEndpoint, newSocketEndpoint)
{
    endpoint        = newEndpoint;
    socketEndpoint  = newSocketEndpoint;
}

async function waitForDeviceInfoLoad()
{
    return new Promise((resolve, reject) =>{
        if(device != null)
        {
            if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
            {
                resolve();
                return;
            }

            if(typeof device.uuid != `undefined`)
            {
                if(device.uuid != null)
                {
                    if(device.uuid.length > 0)
                    {
                        resolve();
                        return;
                    }
                }
            }
        }

        var itvLoadingDeviceInfo = setInterval(function(){
            if(device != null)
                {
                    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
                    {
                        clearInterval(itvLoadingDeviceInfo);
                        itvLoadingDeviceInfo = null;
                        resolve();
                    }

                    if(typeof device.uuid != `undefined`)
                    {
                        if(device.uuid != null)
                        {
                            if(device.uuid.length > 0)
                            {
                                clearInterval(itvLoadingDeviceInfo);
                                itvLoadingDeviceInfo = null;
                                resolve();
                            }
                        }
                    }
                }
        }, 500);
    })
}

// function setClientUniqueId()
// {
//     var navigator_info = window.navigator;
//     var screen_info = window.screen;
//     var uid = navigator_info.mimeTypes.length;
    
//     uid += navigator_info.userAgent.replace(/\D+/g, '');
//     uid += navigator_info.plugins.length;
//     uid += navigator_info.deviceMemory || '';
//     uid += navigator_info.hardwareConcurrency || '';
    
//     uid += screen_info.height || '';
//     uid += screen_info.width || '';
//     uid += screen_info.pixelDepth || '';

//     // console.log(uid);
//     clientUniqueId = uid;
// }

async function setClientUniqueId()
{
    var navigator_info = window.navigator;
    var screen_info = window.screen;

    var uid = navigator_info.mimeTypes.length;
    uid += navigator_info.userAgent.replace(/\D+/g, '');
    // uid += stringToNumberSequence(navigator_info.userAgent) || '';
    uid += navigator_info.plugins.length;
    uid += navigator_info.deviceMemory || '';
    uid += navigator_info.hardwareConcurrency || '';
    // uid += stringToNumberSequence(navigator_info.language) || '';
    uid += stringToNumberSequence(navigator_info.languages.join('')) || '';
    uid += stringToNumberSequence(navigator_info.platform) || '';
    // uid += stringToNumberSequence(navigator_info.appVersion) || '';
    uid += stringToNumberSequence(navigator_info.appName) || '';
    uid += stringToNumberSequence(navigator_info.appCodeName) || '';
    uid += stringToNumberSequence(navigator_info.product) || '';
    // uid += navigator_info.productSub || '';


    uid += screen_info.height || '';
    uid += screen_info.width || '';
    uid += screen_info.pixelDepth || '';

    // const lanInfo = await getLANInfo();
    // uid += `-${lanInfo.address}-` || '';
    // uid += stringToNumberSequence(lanInfo.component) || '';
    // uid += stringToNumberSequence(lanInfo.protocol) || '';
    // uid += stringToNumberSequence(lanInfo.type) || '';

    // console.log(uid);


    // Hash the generated UID for consistency
    // const hashedUid = await hashString(uid);

    // // Optionally store the UID in local storage to persist it
    // if (!localStorage.getItem('clientUniqueId')) {
    //     localStorage.setItem('clientUniqueId', hashedUid);
    // }

    // const clientUniqueId = localStorage.getItem('clientUniqueId');
    clientUniqueId = uid;
}

function getLANInfo()
{
    return new Promise((resolve, reject) => {
        window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection; //compatibility for Firefox and chrome
    
        var pc = new RTCPeerConnection({iceServers:[]});
        var noop = function(){};      
        pc.createDataChannel('');//create a bogus data channel
        pc.createOffer(pc.setLocalDescription.bind(pc), noop);// create offer and set local description
        pc.onicecandidate = function(ice)
        {
            if (ice && ice.candidate && ice.candidate.candidate)
            {
                // let myIp = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
                // console.log('my IP: ', myIP);
                pc.onicecandidate = noop;

                resolve(ice.candidate);
            }
        };
    })

}

function stringToNumberSequence(inputString) {
    return inputString.split('').map(char => {
        // Check if the character is a digit (0-9)
        return /\d/.test(char) ? char : char.charCodeAt(0);
    }).join('');
}

// Helper function to hash the UID using SHA-256
async function hashString(str) 
{
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function showQRCode(qrValue, title)
{
    qrCodeInstanceItem = null;
    qrCodeInstanceValue = qrValue;
    qrCodeInstanceTitle = title;

    swal(`...`, {
        button: false, closeOnClickOutside: false
    });

    const qrElementCode = `
    <div>
        <div class="center mb10">
            <a id="btnQRCloseElement" href="#!" class="close-buton-media-float-right waves-effect waves-light btn-flat">
                <i class="fa-solid fa-xmark left"></i>
            </a>
        </div>

        <div id="qrTitleElement" class="qr-title-element">
            ${title}
        </div>

        <div class="center">
            <canvas id="qrCanvasElement"></canvas>
        </div>

        <div class="center-align mt10">
            <a id="btnQRShareElement" href="#!" class="waves-effect waves-light btn-flat btn-flat-with-box">
                <i class="fa-solid fa-copy"></i>
                <span data-lang="copy">${getTranslate("copy", "Copy")}</span>
            </a>
        </div>
    </div>
    `;

    $(`.swal-text`).html(qrElementCode);

    qrCodeInstanceItem = new QRious({
        element: document.getElementById('qrCanvasElement'),
        background: '#FFFFFF',
        backgroundAlpha: 0.9,
        foreground: '#202020',
        foregroundAlpha: 0.9,
        level: 'H',
        padding: 25,
        size: 200,
        value: qrValue
    });

    $(`#btnQRCloseElement`).off(`click`);
    $(`#btnQRCloseElement`).on(`click`, function(){
        qrCodeInstanceItem = null;
        qrCodeInstanceValue = null;
        qrCodeInstanceTitle = null;
        swal.close();
    });

    $(`#btnQRShareElement`).off(`click`);
    $(`#btnQRShareElement`).on(`click`, async function(){
        if(qrCodeInstanceItem == null)
        {
            return;
        }

        // let qrImage = qrCodeInstanceItem.toDataURL('image/png');
        // const qrImageFileBlob = base64toBlob(qrImage, 'image/png');
        // const qrImageFileEntry = await saveBase64ToFile(qrImage, 'image/jpeg', 'connection.jpeg');
        // const qrImagePath = qrImageFileEntry.toURL();

        // await copyImageBlobToClipboard(qrImageFileBlob);
        CopyTextToClipboard(qrCodeInstanceValue);

        showToastWithStyle(getTranslate("copied", `Copied`), 2000, `chat-copied-message-style`);

        // navigator.share(qrImagePath, qrCodeInstanceTitle, 'image/jpeg');

        // navigator.share({
        //     title: qrCodeInstanceTitle,
        //     text:   qrCodeInstanceTitle,
        //     files: [File([qrImageFileBlob], 'connection.jpg', { type: 'image/jpeg' })]
        // }).then(() => {
        //     console.log('Sharing succeeded');
        // }).catch(error => {
        //     console.error('Sharing failed', error);
        // });

        // window.plugins.share.show({
        //     subject: qrCodeInstanceTitle, // Optional: set the share subject
        //     text: qrCodeInstanceTitle,        // Optional: set some share text
        //     // files: [File([qrImageFileBlob], 'connection.jpg', { type: 'image/jpeg' })]               // Pass the file URI for the image
        //     files: [qrImagePath]               // Pass the file URI for the image
        // }, function() {
        //     console.log('Share success');
        // }, function(error) {
        //     console.error('Share failed', error);
        // });

    });

}

function convertRGBToHex(rgb) 
{
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  
    function hexCode(i) {
        return ("0" + parseInt(i).toString(16)).slice(-2);
    }

    return "#" + hexCode(rgb[1]) + hexCode(rgb[2]) + hexCode(rgb[3]);
}

function startCompanyMemberDataFromDBSync() 
{
    if(ENABLE_COMPANY_MEMBER_SYNC_SERVICE == false)
    {
        return;
    }

    //const INTERVAL = 10 * 1000;
    // const INTERVAL = 600 * 1000; // Run every 10 min.
    const INTERVAL = 60 * 1000; // Run every 1 min.

    if(itvCompanyMemberDataFromDBSyncService != null)
    {
        clearInterval(itvCompanyMemberDataFromDBSyncService);
        itvCompanyMemberDataFromDBSyncService = null;
    }

    itvCompanyMemberDataFromDBSyncService = setInterval(() => {
        companyMemberDataFromDBServiceRun()
    }, INTERVAL);
}

async function companyMemberDataFromDBServiceRun() 
{
    const serverConnectionState = await hasServerConnection();

    if(!serverConnectionState)
    {
        return;
    }

    const query = 'SELECT CompanyId FROM Company WHERE isAdmin = 1';
    const companyIds = await dbRun(query);

    const ids = [];
    for(let i = 0; i < companyIds.rows.length; i++) 
    {
        ids.push(companyIds.rows.item(i).companyId);
    }

    if(ids.length) 
    {
        try
        {
            const members = await callS(true, `GET`, `/services/companymembers`, { ids });

            for(let i = 0; i < ids.length; i++) 
            {
                const companyMembers = members.filter(m => m.CompanyId === ids[i]);
    
                if(companyMembers.length) 
                {
                    for(let j = 0; j < companyMembers.length; j++) 
                    {
                        const companyMember = companyMembers[j];
                        //const { IsAdmin, UpdatedDate, Login, CompanyId } = companyMember;
                        const IsAdmin = companyMember.IsAdmin;
                        const UpdatedDate = companyMember.ModificationDate;
                        const Login = companyMember.Login;
                        const CompanyId  = companyMember.CompanyId;
                        const IsExternal = companyMember.IsExternal;     
                        const MemberCompanyName = companyMember.MemberCompanyName;
                        const Position = companyMember.Position;
                        const Department = companyMember.Department;
    
                        const queryLocal = 'SELECT * FROM CompanyMembers WHERE Login = ? AND CompanyId = ?';
                        const localMember = await dbRun(queryLocal, [Login, CompanyId]);
                        
                        if(localMember.rows.length) //Member exist for Company
                        {
                            if(companyMember.Removed == 1) //Updated at server as Removed
                            {
                                const delQuery = 'DELETE FROM  CompanyMembers WHERE  Login=? AND CompanyId=? AND ServerUpdatedDate < ? AND IsServerUpdated = 1 AND PendingToRemove = 0';
                                const queryValues = [Login, CompanyId, UpdatedDate];
                                await dbRun(delQuery, queryValues);
                            }
                            else 
                            {
                                const lastAction = 'Update Server';

                                const readCurrent = `SELECT IsAdmin, IsExternal, MemberCompanyName, ServerUpdatedDate, LastAction FROM CompanyMembers WHERE Login=? AND CompanyId=? AND ServerUpdatedDate < ? AND IsServerUpdated = 1 AND PendingToRemove = 0`;
                                const readCurrentValues = [Login, CompanyId, UpdatedDate];
                                const responseDBCurrent = await dbRun(readCurrent, readCurrentValues);

                                let mustUpdateLocal = false;

                                if(responseDBCurrent == null)
                                {
                                    mustUpdateLocal = true;
                                }
                                else
                                {
                                    if(responseDBCurrent.rows.length > 0)
                                    {
                                        const readCurrentRecord = responseDBCurrent.rows.item(ix);
                                        if(
                                            readCurrentRecord.IsAdmin != IsAdmin || 
                                            readCurrentRecord.ServerUpdatedDate != UpdatedDate || 
                                            readCurrentRecord.LastAction != lastAction ||
                                            readCurrentRecord.IsExternal != IsExternal ||
                                            readCurrentRecord.MemberCompanyName != MemberCompanyName ||
                                            readCurrentRecord.Position != Position ||
                                            readCurrentRecord.Department != Department
                                        )
                                        {
                                            mustUpdateLocal = true;
                                        }
                                    }
                                }

                                if(mustUpdateLocal == true)
                                {
                                    console.log(`Update local company members`);

                                    const updtQuery = `UPDATE CompanyMembers SET IsAdmin = ?, IsExternal = ?, MemberCompanyName = ?, Department = ?, Position = ?, ServerUpdatedDate = ?, LastAction = ? 
                                    WHERE Login = ? AND CompanyId = ? AND ServerUpdatedDate < ? AND IsServerUpdated = 1 AND PendingToRemove = 0`;

                                    const queryValues = [IsAdmin, IsExternal, MemberCompanyName, Department, Position, UpdatedDate, lastAction, Login, CompanyId, UpdatedDate];

                                    await dbRun(updtQuery, queryValues);
                                }
                            }
                        } 
                        else 
                        {
                            if(companyMember.Removed != 1) //Removed == 1 Updated at server as Removed, not imported in SQLite
                            {
                                const insertedAction = 'Imported';
                                const lastAction = 'Insert';
                                const insQuery = `INSERT INTO CompanyMembers (CompanyId, Login, IsAdmin, IsExternal, MemberCompanyName, Department, Position, IsServerUpdated, PendingToRemove, ServerUpdatedDate, InsertAction, LastAction) 
                                                 VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)`;
                                const queryValues = [CompanyId, Login, IsAdmin, IsExternal, MemberCompanyName, Department, Position, UpdatedDate, insertedAction, lastAction];
                                await dbRun(insQuery, queryValues);
                            }
                            
                        }
                    }
                }
            }
        }
        catch(companyMembersException)
        {
            return;
        }
    }
}

function timeToIntegerInMinutes(timeString)
{
    const arrTime = timeString.split(':');
    const hours = parseInt(arrTime[0]);
    const minutes = parseInt(arrTime[1]);

    const totalMinutes = (hours * 60) + minutes;

    return totalMinutes;
}

function timeInMinutesToTimeString(timeInMinutes)
{
    const hoursStr = String(Math.floor(timeInMinutes / 60)); 
    const hours = hoursStr.padStart(2,'0');
    const minutesStr = String(timeInMinutes % 60);
    const minutes = minutesStr.padStart(2,'0');

    return `${hours}:${minutes}`;
}

async function getUserConnectionAccess() 
{
    let accessType;
    const connType = getSelectedAppServerConnection();
    
    if(connType.default) 
    {
        const pack = await getAppPackageName();

        if(pack === 'com.world.falaqui' || pack == 'com.br.falaqui') 
        {
            accessType = 'FLQ';
        } 
        else 
        {
            accessType = 'CWL';
        }
    } 
    else 
    {
        accessType = 'COP';
    }

    return accessType;
}


function fixEndpoint()
{
    if(endpoint.endsWith("/") == true)
    {
        return;
    }

    endpoint = `${endpoint}/`;
}

function fixBrowserDisplayMargin()
{
    const BROWSER_MAX_WIDTH = 560;

    $(`html`).css(`max-width`, `${BROWSER_MAX_WIDTH}px`);
    $(`html`).css(`margin`, `0 auto`);
    $(`html`).css(`border-right`, `1px solid #444444`);
    $(`html`).css(`border-left`, `1px solid #444444`);

    $(`.screen-splash`).css(`max-width`, `${BROWSER_MAX_WIDTH}px`);
    $(`.screen-splash`).css(`margin`, `0 auto`);
    $(`.screen-splash`).css(`left`, `unset`);

    $(`.app-chat-contacts-header`).css(`max-width`, `${BROWSER_MAX_WIDTH}px`);
    $(`.app-screen-footer`).css(`max-width`, `${BROWSER_MAX_WIDTH}px`);
    $(`.chat-container`).css(`max-width`, `${BROWSER_MAX_WIDTH}px`);
    $(`.chat-container`).css(`left`, `unset`);

    $(`head`).append(`
        <style>
            .modal.bottom-sheet{
                max-width: ${BROWSER_MAX_WIDTH}px;
                margin: 0 auto;
            }
        </style>
    `);
}

function getContactName(contactPhoneId)
{
    var contactName = '';

    let chatReadList = JSON.parse(JSON.stringify(contactStatusList));
    for(let ix = 0; ix < linkedContactList.length; ix++)
    {
        const linkedRecord = linkedContactList[ix];

        let contactIndex = chatReadList.findIndex((item) =>{
            return item.Login == linkedRecord.Contact;
        });

        if(contactIndex == -1)
        {
            chatReadList.push({
                "Login": linkedRecord.Contact,
                "Name": linkedRecord.Name
            });
        }
    }

    const chatRecord = chatReadList.find((item) =>{
        return item.Login == contactPhoneId
    });

    const record = deviceContactList.find((item) =>{
        const phonesIntoRecord = item.phoneNumbers;
        const contactPhoneIndex = phonesIntoRecord.findIndex((phoneItem) =>{
            let phoneValue = phoneItem.normalizedNumber != null ? phoneItem.normalizedNumber : phoneItem.number;
            // let phoneDetails = getPhoneFormatsByNumber(phoneValue, phoneItem.type);
            // let phoneNum = phoneDetails.full;
            const formats = getPhoneFormatsByNumber(phoneValue, phoneItem.type);

            if(formats == null)
            {
                return false;
            }

            if(formats.fullNumbersOnly == null)
            {
                return false;
            }

            const phoneNumOnlyNumbers = strToOnlyNum(formats.fullNumbersOnly);
            return phoneNumOnlyNumbers == contactPhoneId
        });

        if(contactPhoneIndex >= 0)
        {
            return true;
        }
        else
        {
            return false;
        }
    });

    let hasChatRecordName = false;
    if(chatRecord != null)
    {
        if(chatRecord.Name != null)
        {
            hasChatRecordName = true;
        }
    }

    if(hasChatRecordName == false)
    {
        if(record != null)
        {
            contactName = record.displayName != null ? record.displayName : `${record.firstName} ${record.lastName}`;
        }
        else
        {
            let phoneDetails = getPhoneFormatsByNumber(contactPhoneId, null);
            let phoneNum = phoneDetails.full;
            //contactName = phoneNum.full;
            contactName = phoneNum;
        }
    }
    else
    {
        contactName = chatRecord.Name;
    }

    return contactName;
}

function writeoWGxd(v)
{
    const currentConnection = getSelectedAppServerConnection();
    const cnId = currentConnection.id;
    const stk = `oWbGxd_${cnId}`;
    writeLocalStorage(stk, v);
}

function getoWGxd()
{
    const currentConnection = getSelectedAppServerConnection();
    const cnId = currentConnection.id;
    const stk = `oWbGxd_${cnId}`;

    let v = readLocalStorage(stk);
    if(v == null)
    {
        v = "";
    }
    return v;
}



function getCountryCodeFromPhone(phoneNumber) 
{
    if(phoneNumber == null)
    {
        console.log(`(getCountryCodeFromPhone) Number was probably reset by user`);
        return null;
    }

    // Remove spaces, hyphens, and parentheses for easier matching
    const sanitizedPhone = phoneNumber.replace(/[\s()-]/g, "");

    // Iterate through phoneCodes to check if the phone number matches any dial code pattern
    for (let country of phoneCodes) {
        // Remove the plus sign from the dial code for easier comparison
        const dialCodeWithoutPlus = country.dial_code.replace("+", "");

        // Check if the sanitized phone number starts with the dial code
        if (sanitizedPhone.startsWith(dialCodeWithoutPlus)) {
            // If a match is found, return the dial code for libphonenumber
            return country.dial_code;
        }
    }

    // If no international format is detected, return null for further processing as a local number
    return null;
}

// Usage with libphonenumber
function internalParsePhoneNumber(phoneNumber) 
{
    if(phoneNumber == null)
    {
        console.log(`(internalParsePhoneNumber) Number was probably reset by user`);
        return null;
    }

    // Check if the phone number might be in an international format without the plus sign
    const countryDialCode = getCountryCodeFromPhone(phoneNumber);

    let parsedNumber;

    if (countryDialCode) {
        // Use the detected dial code to parse the number as an international format
        parsedNumber = libphonenumber.parsePhoneNumberFromString(`+${phoneNumber}`, "");
    } else {
        // Fallback to handle local numbers, which may need a default country code
        // Here, set your default country code, e.g., "countryCode" variable
        parsedNumber = libphonenumber.parsePhoneNumberFromString(phoneNumber, countryCode);
    }

    // Return parsed result or handle null if parsing fails
    return parsedNumber || null;
}

function getDateFromTimestampValue(timeValue) 
{
    const today = new Date(); // Reference for the current/today date

    if (timeValue === null || timeValue <= 0) 
    {
        return today;
    }

    if (timeValue instanceof Date) 
    {
        return isNaN(timeValue.getTime()) ? today : timeValue;
    }

    if (typeof timeValue !== 'number') 
    {
        timeValue = Number(timeValue);
        if (isNaN(timeValue)) 
        {
            return today; // Handle non-numeric conversion failure
        }
    }

    timeValue = Math.round(timeValue);

    if (timeValue < 0) 
    {
        return today;
    }

    // Adjust timestamp for Unix format without milliseconds
    if (timeValue < 100000000000) // Rough check for Unix format
    { 
        timeValue *= 1000;
    }

    const resultDate = new Date(timeValue);

    if (isNaN(resultDate.getTime()) || resultDate.getFullYear() > 2999) 
    {
        return today;
    }

    return resultDate; // Valid date
}

function getTimestampValueFromDate(dateValue)
{
    // Check: If dateValue is null, return the current Unix timestamp.
    if (dateValue === null) 
    {
        return Math.floor(Date.now() / 1000);
    }

    // Check: If dateValue is a number, handle Unix Timestamp or JavaScript Date time number.
    if (typeof dateValue === 'number') 
    {
        // If it's a Unix timestamp (value less than 99999999999), use it directly
        if (dateValue <= 99999999999) 
        {
            // It's already a valid Unix timestamp, return it directly
            if (dateValue >= -5364662400 && dateValue <= 32503679999) 
            {
                return Math.floor(dateValue);  // Return it as integer
            }
        } 
        else 
        {
            // It's a JavaScript Date time number, convert to Unix timestamp by dividing by 1000
            const unixTimestamp = Math.floor(dateValue / 1000);
            if (unixTimestamp >= -5364662400 && unixTimestamp <= 32503679999) 
            {
                return unixTimestamp;
            }
        }
    }

    // Check: If dateValue is a Date object, convert it to timestamp and apply checks.
    if (dateValue instanceof Date) 
    {
        const timeValue = dateValue.getTime();  // Get milliseconds
        if (isNaN(timeValue)) 
        {
            return Math.floor(Date.now() / 1000);  // Invalid Date, return current timestamp
        }

        // Convert milliseconds to Unix timestamp (seconds)
        const unixTimestamp = Math.floor(timeValue / 1000);

        // Apply range checks for valid Unix timestamp
        if (unixTimestamp >= -5364662400 && unixTimestamp <= 32503679999) 
        {
            return unixTimestamp;
        }
    }

    // Check: If dateValue is a string representing a valid number, convert it to number
    if (typeof dateValue === 'string' && !isNaN(Number(dateValue))) 
    {
        return getTimestampValueFromDate(Number(dateValue));
    }

    // For any other invalid inputs, return current timestamp
    return Math.floor(Date.now() / 1000);
}

function showUnstableConnectionIndicator()
{
    $(`#btnUnstableConnection`).removeClass(`hide`);
    $(`#btnConnectionSpeed`).addClass(`hide`);
}

function hideUnstableConnectionIndicator()
{
    $(`#btnUnstableConnection`).addClass(`hide`);
    $(`#btnConnectionSpeed`).removeClass(`hide`);
}

async function checkConnectionStatus()
{
    let connectionOk = hasDeviceConnection();
    if(connectionOk == false)
    {
        showUnstableConnectionIndicator();
        return;
    }

    if(internetSpeedUnderCheck == true && lastInternetSpeed == null)
    {
        // Is already running the first check, keep and wait (just return)
        return;
    }

    let internetSpeed = null;
    try
    {
        internetSpeed = await getInternetSpeed();
    }
    catch(checkInternetErr)
    {

    }

    if(internetSpeed == null)
    {
        showUnstableConnectionIndicator();
        return;
    }

    if(internetSpeed.isTimedout == true)
    {
        console.log(`Internet speed < 100 Kbps`);
        $(`#btnConnectionSpeed`).find(`span`).text(`< 100 Kbps`);
        showUnstableConnectionIndicator();
        tooSlowConnection = true;
        almostSlowConnection = false;
        return;
    }

    // console.log(`Internet speed: ${internetSpeed.speedMbps} Mbps | ${internetSpeed.speedKbps} Kbps | ${internetSpeed.speedBps} bps`);

    $(`.button-connection-speed-signal-icon`).addClass(`hide`);


    if(internetSpeed.speedMbps >= 20)
    {
        $(`#btnConnectionSpeedIconSignal4`).removeClass(`hide`);
    }
    else if(internetSpeed.speedMbps >= 15)
    {
        $(`#btnConnectionSpeedIconSignal3`).removeClass(`hide`);
    }
    else if(internetSpeed.speedMbps >= 10)
    {
        $(`#btnConnectionSpeedIconSignal2`).removeClass(`hide`);
    }
    else if(internetSpeed.speedMbps >= 5)
    {
        $(`#btnConnectionSpeedIconSignal1`).removeClass(`hide`);
    }
    else if(internetSpeed.speedMbps >= 1)
    {
        almostSlowConnection = true;
        $(`#btnConnectionSpeedIconSignal0`).removeClass(`hide`);
    }

    if(internetSpeed.speedMbps < 1)
    {
        showUnstableConnectionIndicator();
    }
    else
    {
        hideUnstableConnectionIndicator();
    }

    if(internetSpeed.speedKbps < 500)
    {
        tooSlowConnection = true;
        almostSlowConnection = false;
    }
    else
    {
        tooSlowConnection = false;
    }

    $(`#btnConnectionSpeed`).find(`span`).text(`${internetSpeed.speedMbps.toFixed(2)} Mbps`);

}

function getInternetSpeed()
{
    return new Promise(async (resolve, reject) =>{

        releaseStuckedInternetSpeedCheck();
        
        if(internetSpeedUnderCheck == true)
        {
            if(lastInternetSpeed == null)
            {
                await waitInternetSpeedReadFinish();
            }
            else
            {
                resolve(lastInternetSpeed);
                return;
            }
        }
        

        internetSpeedUnderCheck = true;
        intenetSpeedCheckStartTime = (new Date()).getTime();

        // let addrCheck = endpoint;
        // if(addrCheck.endsWith('/'))
        // {
        //     addrCheck = addrCheck.slice(0, -1);
        // }
    
        // const noCacheId = makeid(6)
    
        // addrCheck = `${addrCheck}/images/download-test.jpg?ncid=${noCacheId}`;

        // const imageAddr = addrCheck;
        // const downloadSize = 7336784; // size of image in bytes
        const downloadSize = 1033414; // size of image in bytes
        // const downloadSize = 499293; // size of image in bytes

        const hundredKb = 100000;
        const fiveHundredKb = hundredKb * 5;
        const timeSecIn100Kbps = parseInt(downloadSize / hundredKb);
        const timeSecIn500Kbps = parseInt(downloadSize / fiveHundredKb);
        

        var startTime, endTime;
        
        // var download = new Image();
        // download.onload = function () {
        //     endTime = (new Date()).getTime();

        //     var duration = (endTime - startTime) / 1000;
        //     var bitsLoaded = downloadSize * 8;
        //     var speedBps = (bitsLoaded / duration).toFixed(2);
        //     var speedKbps = (speedBps / 1024).toFixed(2);
        //     var speedMbps = (speedKbps / 1024).toFixed(2);

        //     internetSpeedUnderCheck = false;

        //     const result = {
        //         "speedBps": speedBps,
        //         "speedKbps": speedKbps,
        //         "speedMbps": speedMbps
        //     };

        //     lastInternetSpeed = result;

        //     resolve(result);

        // }
        
        // download.onerror = function (err, msg) {
        //     internetSpeedUnderCheck = false;
        //     reject("Invalid image, or error downloading");
        // }
        
        startTime = (new Date()).getTime();
        // download.src = imageAddr; 

        const imageFile = `internet-check.jpg`;
        const offsetLoadTime = 5; // 5 sec. offset time for timeout considering network stability variation
        const timeoutValue = parseInt(offsetLoadTime + timeSecIn100Kbps) * 1000;
        let isTimedout = false;
        try
        {
            await downloadFileFromServer(`${endpoint}fs/internetcheckimagedownload`, imagesLocalFolderLocation, imageFile, timeoutValue);
            // await downloadFileFromServer(imageAddr, imagesLocalFolderLocation, imageFile, timeoutValue);
        }
        catch(downloadErr)
        {
            console.log(`Download internet speed test err: ${downloadErr}`);
            if(downloadErr == `[Timed out]`)
            {
                isTimedout = true;
            }

            if(isTimedout == false)
            {
                internetSpeedUnderCheck = false;
                reject("Invalid image, or error downloading");
                return;    
            }
        }

        if(isTimedout == true)
        {
            internetSpeedUnderCheck = false;

            const result = {
                "timedout": true,
                "speedBps": 0,
                "speedKbps": 0,
                "speedMbps": 0
            };
    
            lastInternetSpeed = result;
    
            resolve(result);
    
            return;
        }

        endTime = (new Date()).getTime();

        var duration = (endTime - startTime) / 1000;
        var bitsLoaded = downloadSize * 8;
        var speedBps = (bitsLoaded / duration).toFixed(2);
        var speedKbps = (speedBps / 1024).toFixed(2);
        var speedMbps = (speedKbps / 1024).toFixed(2);

        internetSpeedUnderCheck = false;

        const result = {
            "timedout": false,
            "speedBps": parseFloat(speedBps),
            "speedKbps": parseFloat(speedKbps),
            "speedMbps": parseFloat(speedMbps)
        };

        lastInternetSpeed = result;

        resolve(result);

    });

}

function releaseStuckedInternetSpeedCheck()
{
    if(internetSpeedUnderCheck == false)
    {
        return false;
    }

    let nowTime = (new Date()).getTime();

    var duration = (nowTime - intenetSpeedCheckStartTime) / 1000;
    const maxSec = 20;

    if(duration > maxSec)
    {
        console.log(`Stucked internet speed released after ${duration} sec.`);

        // Release service
        internetSpeedUnderCheck = false;
    }
    else
    {
        console.log(`Internet speed not stucked ${duration}/${maxSec} sec.`);
    }
}

function waitInternetSpeedReadFinish()
{
    return new Promise((resolve, reject) =>{
        if(internetSpeedUnderCheck == false)
        {
            resolve();
            return;
        }

        var itvInternetSpeedFinishCheck = setInterval(function(){
            if(internetSpeedUnderCheck == false)
            {
                clearInterval(itvInternetSpeedFinishCheck);
                itvInternetSpeedFinishCheck = null;
                resolve();
            }
        }, 20);
    })
}

function getLoginPhoneIsValidated()
{
    const uid = readLocalStorage("uid");
    if(uid == null)
    {
        return false;
    }

    if(uid.trim().length == 0)
    {
        return false;
    }

    const validated = readLocalStorage(`vlphone-${uid}`);

    if(validated != `1`)
    {
        return false;
    }

    return true;
}

function setLoginPhoneIsValidated()
{
    const uid = readLocalStorage("uid");
    writeLocalStorage(`vlphone-${uid}`, `1`);
}

function getInternalLoginExpDate()
{
    const expDateStr = readLocalStorage("loginexp");
    if(expDateStr == null)
    {
        return null;
    }

    if(expDateStr.trim().length == 0)
    {
        return null;
    }

    let expDate = null;
    try
    {
        expDate = JSON.parse(expDateStr);
    }
    catch(exception)
    {

    }

    return expDate;
}

function setInternalLoginExpDate(value)
{
    if(value == null)
    {
        return;
    }

    let strValue = null;
    try
    {
        strValue = JSON.stringify(value);
    }
    catch(exception)
    {

    }

    if(strValue != null)
    {
        writeLocalStorage("loginexp", strValue);
    }
}

function isDateGreaterOrEqualToday(dateStr) 
{
    const dateInt = parseInt(dateStr);
    const date = new Date(dateInt);
    const now = new Date();

    const day1 = date.getDate();
    const month1 = date.getMonth() + 1;
    const year1 = date.getFullYear();

    const day2 = now.getDate();
    const month2 = now.getMonth() + 1;
    const year2 = now.getFullYear();

    if (year1 > year2 || (year1 === year2 && month1 > month2) || (year1 === year2 && month1 === month2 && day1 >= day2)) {
        return true;
    } 
    else 
    {
        return false;
    }
}

function isDateLessOrEqualToday(dateStr) 
{
    const dateInt = parseInt(dateStr);
    const date = new Date(dateInt);
    const now = new Date();

    const day1 = date.getDate();
    const month1 = date.getMonth() + 1;
    const year1 = date.getFullYear();

    const day2 = now.getDate();
    const month2 = now.getMonth() + 1;
    const year2 = now.getFullYear();

    if (year1 < year2 || (year1 === year2 && month1 < month2) || (year1 === year2 && month1 === month2 && day1 <= day2)) {
        return true;
    } 
    else 
    {
        return false;
    }
}

function isDateEndLessDateStart(dateEndStr,dateStartStr) 
{
    const dateEndInt = parseInt(dateEndStr);
    const dateEnd = new Date(dateEndInt);
    
    const dateStarInt = parseInt(dateStartStr);
    const dateStart = new Date(dateStarInt);

    const day1 = dateEnd.getDate();
    const month1 = dateEnd.getMonth() + 1;
    const year1 = dateEnd.getFullYear();

    const day2 = dateStart.getDate();
    const month2 = dateStart.getMonth() + 1;
    const year2 = dateStart.getFullYear();

    if (year1 < year2 || (year1 === year2 && month1 < month2) || (year1 === year2 && month1 === month2 && day1 < day2)) {
        return true;
    } 
    else 
    {
        return false;
    }
}

async function appVersionNewsCheck()
{
    const versionCode = build_version;
    
    const lastCheckedNewsVersion = readLocalStorage('lastcheckednewsversion');
    const countryCode = readLocalStorage('country');

    let mustShowNews = false;

    if(lastCheckedNewsVersion == null)
    {
        mustShowNews = true;
    }
    else if(lastCheckedNewsVersion != versionCode)
    {
        mustShowNews = true;
    }

    if(mustShowNews == true)
    {
        const deviceConnectionState = await hasDeviceConnection();
        if(deviceConnectionState == true)
        {
            // Retrieve the news about this version
            const data = {
                version: versionCode,
                countryCode
            }
            const response = await callS(true, 'POST', `/services/versionnews/`, data);

            if(response.length == 0)
            {
                return;
            }

            if(response.content == null)
            {
                return;
            }

            // Display modal with response.content
            fillModalVersionNewsList(response.content, versionCode);
            initModalVersionNews();

            // Set as updated displayed news version
            //writeLocalStorage('lastcheckednewsversion', versionCode);
        }
    }
}

function waitATime(ms)
{
    return new Promise((resolve, reject) =>{
        setTimeout(function(){
            resolve();
        }, ms);
    })
}

async function getCompanyLogo(companyId)
{
    let companyLogo = null;

    let localFileName = companyId.trim();
    localFileName = replaceAll(localFileName, `.`, `_`);
    localFileName = replaceAll(localFileName, `/`, `_`);
    localFileName = replaceAll(localFileName, `\\`, `_`);
    localFileName = replaceAll(localFileName, `+`, `_`);
    localFileName = replaceAll(localFileName, `!`, `_`);
    localFileName = replaceAll(localFileName, `*`, `_`);
    localFileName = replaceAll(localFileName, `&`, `_`);
    localFileName = replaceAll(localFileName, `^`, `_`);
    localFileName = replaceAll(localFileName, `%`, `_`);
    localFileName = replaceAll(localFileName, `$`, `_`);
    localFileName = replaceAll(localFileName, `#`, `_`);
    localFileName = replaceAll(localFileName, `@`, `_`);
    localFileName = replaceAll(localFileName, `~`, `_`);
    localFileName = replaceAll(localFileName, "`", `_`);
    localFileName = replaceAll(localFileName, "'", `_`);
    localFileName = replaceAll(localFileName, `{`, `_`);
    localFileName = replaceAll(localFileName, `}`, `_`);
    localFileName = replaceAll(localFileName, `[`, `_`);
    localFileName = replaceAll(localFileName, `]`, `_`);
    localFileName = replaceAll(localFileName, `(`, `_`);
    localFileName = replaceAll(localFileName, `)`, `_`);
    localFileName = replaceAll(localFileName, `<`, `_`);
    localFileName = replaceAll(localFileName, `>`, `_`);
    localFileName = replaceAll(localFileName, `=`, `_`);
    localFileName = replaceAll(localFileName, `,`, `_`);
    localFileName = replaceAll(localFileName, `;`, `_`);
    localFileName = replaceAll(localFileName, `:`, `_`);
    localFileName = replaceAll(localFileName, `-`, `_`);
    localFileName = replaceAll(localFileName, ` `, `_`);

    localFileName = `${localFileName}.png`;

    const paramKey = `logo_${companyId}`;
    const savedParam = readLocalStorage(paramKey);

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == true)
    {
        // console.log(`🟡 Has connection, downloading logo...`);

        const dataCompanyLogoRequest = {
            "companyId": companyId
        };

        const companyLogoResponse = await callS(false, `POST`, `/services/retrievecompanylogo`, dataCompanyLogoRequest);

        if(companyLogoResponse != null)
        {
            if(companyLogoResponse.logo != null)
            {
                companyLogo = companyLogoResponse.logo;

                if(companyLogo != null)
                {
                    // Local save
                    // console.log(`🟡 Saving Logo Locally...`);
                    try
                    {
                        const companyLogoFileEntry = await saveBase64ToFile(companyLogo, 'image/png', localFileName);
                        const localCompanyLogoPath = companyLogoFileEntry.toURL();
                        companyLogo = localCompanyLogoPath;

                        if(companyLogo != null)
                        {
                            // console.log(`🟡 Local logo file generated...`);
                            if(savedParam != null)
                            {
                                if(savedParam != companyLogo)
                                {
                                    // Update in Database
                                    // console.log(`🟡 Updating local db...`);
                                    writeLocalStorage(paramKey, companyLogo);
                                }
                            }
                            else
                            {
                                // Insert in Database
                                // console.log(`🟡 Inserting local db...`);
                                writeLocalStorage(paramKey, companyLogo);
                            }
                        }

                    }
                    catch(localSaveErr)
                    {
                        console.log(`🔴 Error saving company logo as local file.`);
                    }
                }
            }
        }
    }
    else
    {
        // console.log(`🟡 Loading offline Logo...`);
        if(savedParam != null)
        {
            if(savedParam.trim().length > 0)
            {
                // console.log(`🟡 Has offline Logo...`);

                const localFileDetails = await localFileURLPathResolve(savedParam);
                if(localFileDetails.status == true)
                {
                    // console.log(`🟡 Offline logo found...`);
                    // Local Logo File Exists Locally
                    companyLogo = savedParam;
                }
            }
        }
    }

    // console.log(`🟢 Company Logo result: ${companyLogo}`);

    return companyLogo;
}

async function fixEmptyMessages()
{
    if(webSocket == null)
    {
        return;
    }

    const connectionState = webSocket.readyState;

    if(connectionState != SOCKET_OPEN)
    {
        return;
    }


    const sqlQuery = `SELECT messageId FROM MESSAGES WHERE LTRIM(RTRIM(content)) = '' AND media IS NULL`;
    const sqlQueryValues = [];
    const emptyMessages = await dbRun(sqlQuery, sqlQueryValues);

    if(emptyMessages == null)
    {
        return;
    }

    if(emptyMessages.rows.length == 0)
    {
        return;
    }

    console.log(`🔔 ${emptyMessages.rows.length} Empty messages to be fixed`);

    let messageToReloadContent = [];

    for(let ix = 0; ix < emptyMessages.rows.length; ix++)
    {
        const record = emptyMessages.rows.item(ix);
        const messageId = record.messageId;

        messageToReloadContent.push(messageId);
    }

    const data = {
        "request": "MESSAGES_GET_CONTENT",
        "params": [
            {"list": messageToReloadContent}
        ]
    }

    sendSocketText(JSON.stringify(data));
}

async function updateMessageContentInLocalDB(messageContentList)
{
    if(messageContentList == null)
    {
        return;
    }

    if(messageContentList.length == 0)
    {
        return;
    }

    console.log(`🔔 ${messageContentList.length} Content messages to be updated`);

    let updated = false;

    for(let ix = 0; ix < messageContentList.length; ix++)
    {
        const record = messageContentList[ix];
        const messageId = record.messageId;
        const content = record.content;

        if(messageId == null)
        {
            continue;
        }

        if(content == null)
        {
            continue;
        }

        if(content.trim().length == 0)
        {
            continue;
        }

        const sqlUpdate = `UPDATE Messages SET content = ? WHERE messageId = ?`;
        const sqlUpdateValues = [content, messageId];
        await dbRun(sqlUpdate, sqlUpdateValues);

        const sqlMessageData = `SELECT toId, fromId FROM Messages WHERE messageId = ?`;
        const sqlMessageDataValues = [messageId];
        const sqlMessageDataResponse = await await dbRun(sqlMessageData, sqlMessageDataValues);

        if(sqlMessageDataResponse != null)
        {
            if(sqlMessageDataResponse.rows.length > 0)
            {
                const messageDataRecord = sqlMessageDataResponse.rows.item(ix);
                const messageDataToId = messageDataRecord.toId;
                const messageDataFromId = messageDataRecord.fromId;

                // Remove Room Cache
                const sqlRemoveRoomCache = `DELETE FROM ChatRoomCache WHERE toId = ? OR toId = ?`;
                const sqlRemoveRoomCacheValues = [messageDataToId, messageDataFromId];
                await dbRun(sqlRemoveRoomCache, sqlRemoveRoomCacheValues);

                updated = true;
            }
        }
    }

    if(updated == true)
    {
        // Remove Linked Contact List Cache
        await dbRun(`DELETE FROM LinkedContactListCache`, null);
    }

}

function appReplaceNewlinesWithSymbol(inputString) 
{
    if(inputString == null)
    {
        return null;
    }

    if(typeof inputString != 'string')
    {
        return inputString;
    }

    // Replace all newline characters (\n) with the ASCII symbol ␊
    return inputString.replace(/\n/g, '␊');
}

function appReplaceSymbolWithNewlines(inputString) 
{
    if(inputString == null)
    {
        return null;
    }

    if(typeof inputString != 'string')
    {
        return inputString;
    }

    // Replace all the ASCII symbol ␊ with newline characters (\n)
    return inputString.replace(/␊/g, '\n');
}


function checkDeviceContactPermission()
{
    return new Promise((resolve, reject) =>{
        cordova.plugins.diagnostic.requestContactsAuthorization(function(status){

            if(status === cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS)
            {
                // Permission permanently denied to use contacts 
                resolve({
                    "allowed": false,
                    "denied_always": true
                });

                return;
            }
    
            if(status === cordova.plugins.diagnostic.permissionStatus.GRANTED)
            {
                // Permission granted to use contacts
                console.log("Contacts use is authorized");
    
                resolve({
                    "allowed": true,
                    "denied_always": false
                });
                return;
            }
            else
            {
                // Permission denied to use contact list
                resolve({
                    "allowed": false,
                    "denied_always": false
                });
            }

            
        }, function(error){
            
            reject(error);
        });
    
    });
}

function openDeviceSystemSettings()
{
    cordova.plugins.diagnostic.switchToSettings(function(){
        console.log("Successfully switched to Settings app");
    }, function(error){
        console.error("The following error occurred: "+error);
    });    
}

function truncateString(text, maxLength) 
{
    // Check if the text is longer than the maxLength
    if (text.length > maxLength) {
        // Truncate the text and add '...' at the end
        return text.substring(0, maxLength) + '...';
    }
    // If the text is shorter or equal to maxLength, return it as is
    return text;
}
