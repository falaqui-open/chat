var chatStateOpened = false;
var talkToId = null;
var talkToName = "";
var talkToGroupRecord = null;
var servedByCompany = null;
var chatCompanyList = [];
var talkToAGroup = false;
var talkToGroupInfo = null;
var talkGroupMembers = null;
var lastScrollMessage = null;
var skipChatInputFocus = false;
var pendingMediaToSend = null;
var pendingMediaTypeToSend = null;
var pendingReplyMessageId = null;
var updateUnreadMessageCounterReading = false;

var itvChatMessageStatusService = null;
var itvLoadMessageImageService = null;
var loadMessageImageServiceRunning = false;
var itvLoadMessageAudioService = null;
var loadMessageAudioServiceRunning = false;
var microphoneButtonSlideService = null;
var processingChatMessageStatus = false;
var chatRoomOldestLoadedMessage = null;
var chatRoomOldestLoadedMessageId = null;
var chatRoomLoadedMessageIdList = [];
var chatRoomHistoryBaseMessageId = null;
var pagedChatHistoryIsLoading = false;
var chatRoomIsSending = false;
var chatRoomIsReceiving = false;
var disableScrollHistoryCheck = false;
var lastUnreadMessageCount = [];
var totalNotReadChatMessage = null;
var pressingMessageBlock = false;
var pressingMessageBlockId = null;

var audioChatRecord = null;
var isAudioChatRecording = false;
var audioRecordTimeStart = null;
var audioRecordTimeEnd = null;
var audioRecordTotalTime = null;
var audioChatTimeout = null;
var audioChatRecordingService = null;
var audioChatSiriWave = null;
var audioPlaying = null;
var audioPlayingId = null;
var audioIsPlaying = false;
var audioPlayingStatusService = null;
var chatAudioRecordSendAfterFinish = true;
// var chatAudioRecordSendAfterFinish = false;
var chatMicrophoneAuthorizationUnderRequest = false;
var chatMicrophoneSwipeUnlocked = false;
var micAuthorized = false;

var microphoneButtonLoading = false;
var microphoneButtonIsPressing = false;

var localAudioPlaying = null;
var localAudioIsPlaying = false;
var localAudioFilePath = null;

var lastAudioRecordFileName = null;
var lastAudioRecordFilePath = null;

const MEDIA_TYPE_LOAN = 100;
const MEDIA_TYPE_IMAGE = 101;
const MEDIA_TYPE_AUDIO = 102;
const CHAT_MESSAGE_KEY_SIZE = 12;
const CHAT_HISTORY_PAGED_LOAD_LIMIT = 25;
const LOADMESSAGEIMAGESERVICE_MS_TIME = 500;
const LOADMESSAGEAUDIOSERVICE_MS_TIME = 500;
const MICROPHONELOADINGTIME = 1200;


$(function() {
    mountChatEvents();
    setChatDefaultValues();
});

function mountChatEvents()
{
    $(`#btnChatExit`).off(`click`);
    $(`#btnChatExit`).on(`click`, function(){
        closeChat();
    });

    $(`#chatTalkToContactLink`).off(`click`);
    $(`#chatTalkToContactLink`).on(`click`, function(){
        const contactId = talkToId;
        if(talkToAGroup == false)
        {
            console.log(`View Contact Info ${contactId}`);
        }
        else
        {
            console.log(`Open Group View/Edit ${contactId}`);

            let groupMembers = [];
            for(let ix = 0; ix < talkGroupMembers.length; ix++)
            {
                const record = talkGroupMembers[ix];

                groupMembers.push(record.Login);
            }

            initModalCreateGroup(true, groupMembers, contactId);
        }
    })

    $(`#btnChatMessageSearch`).off(`click`);
    $(`#btnChatMessageSearch`).on(`click`, function(){
        initModalMessageSearch();
    });

    $(`#chatMainInputText`).off(`input`);
    $(`#chatMainInputText`).on(`input`, function(){
        checkSendActionButton();

        autoHeightTextArea($(`#chatMainInputText`).get(0));
    });

    // $(`#chatMainInputText`).off(`keypress`);
    // $(`#chatMainInputText`).on(`keypress`, async function (e) {
    $(`#chatMainInputText`).off(`keyup`);
    $(`#chatMainInputText`).on(`keyup`, async function (e) {
        // const isTextArea = true;

        // if (e.which == 13) 
        // {
        //     if(isTextArea == false)
        //     {
        //         await chatSendMessage();
        //         return false; // <---- Important line to execute enter and stop propagation and prevent default    
        //     }
        // }
        // else
        // {
        //     if(isTextArea == true)
        //     {
        //         autoHeightTextArea(this);
        //     }
        // }

        autoHeightTextArea($(`#chatMainInputText`).get(0));
    });

    // $(`#chatMicrophoneButton`).on('mousedown touchstart', async function(e) {
    $(`#chatMicrophoneButton`).on('touchstart', async function(e) {
        console.log(`mic down`);

        micAuthorized = await microphoneIsEnabled();
        if(micAuthorized == false)
        {
            if(chatMicrophoneAuthorizationUnderRequest == true)
            {
                return;
            }

            chatMicrophoneAuthorizationUnderRequest = true;
            await requestMicrophoneAuthorization();
            chatMicrophoneAuthorizationUnderRequest = false;
    
            return;
        }

        microphoneButtonIsPressing = true;

        Keyboard.hide();

        microphoneButtonLoading = true;
        $(`#chatMicrophoneButtonLoadingOverlay`).removeClass(`hide`);

        setTimeout(function(){
            // If after some seconds still pressing (loading), start to record
            if(microphoneButtonLoading == true && microphoneButtonIsPressing == true)
            {
                microphoneButtonLoading = false;
                $(`#chatMicrophoneButtonLoadingOverlay`).addClass(`hide`);               
                chatMicrophoneModeOn();
            }
        }, MICROPHONELOADINGTIME)


    });

    // $(`#chatMicrophoneButton`).on('mouseup mouseleave touchend', function(e) {
    $(`#chatMicrophoneButton`).on('touchend', function(e) {
        console.log(`mic up`);

        if(chatMicrophoneSwipeUnlocked == true)
        {
            // Ignore the touch end effect when the mic swipe is unlocked
            return;
        }

        microphoneButtonIsPressing = false;

        if(microphoneButtonLoading == true)
        {
            microphoneButtonLoading = false;
            $(`#chatMicrophoneButtonLoadingOverlay`).addClass(`hide`);

            stoptMicrophoneButtonSlideService();

            return;
        }

        chatMicrophoneModeOff();

    });

    $(`#chatMicrophoneStopButton`).off(`click`);
    $(`#chatMicrophoneStopButton`).on(`click`, function(){
        $(`#chatMicrophoneStopButton`).addClass(`disabled`);

        microphoneButtonIsPressing = false;

        if(microphoneButtonLoading == true)
        {
            microphoneButtonLoading = false;
            $(`#chatMicrophoneButtonLoadingOverlay`).addClass(`hide`);

            stoptMicrophoneButtonSlideService();
            $(`#chatMicrophoneStopButton`).removeClass(`disabled`);
            return;
        }

        chatMicrophoneModeOff();

        $(`#chatMicrophoneStopButton`).removeClass(`disabled`);
    });


    $(`#chatMicrophoneButton`).off(`touchmove`);
    $(`#chatMicrophoneButton`).on('touchmove', async function(e) {

        if(microphoneButtonIsPressing == false)
        {
            return;
        }

        if(microphoneButtonLoading == true)
        {
            return;
        }

        const unlockIconElement = $(`#chatMicrophoneSwipeLock`).find(`.unlock-icon`);

        const unlockIconPositions = unlockIconElement.offset();
        const unlockIconX = unlockIconPositions.left;
        const unlockIconY = unlockIconPositions.top;
        const unlockIconWidth = unlockIconElement.width();
        const unlockIconHeight = unlockIconElement.height();

        const iconOffset = cordova.platformId == 'ios' ? 50 : 10;
    
        var xPos = e.originalEvent.touches[0].pageX;
        var yPos = e.originalEvent.touches[0].pageY;

        var xClientPos = e.originalEvent.touches[0].clientX;
        var yClientPos = e.originalEvent.touches[0].clientY;

        // console.log(`[xPos:${xPos}/yPos:${yPos}] - [xClientPos:${xClientPos}/yClientPos:${yClientPos}] - [unlockIconX:${unlockIconX}/unlockIconY:${unlockIconY}] - [unlockIconWidth:${unlockIconWidth}/unlockIconHeight:${unlockIconHeight}]`);

        if(xPos >= (unlockIconX - iconOffset) && xPos <= (unlockIconX + unlockIconWidth + iconOffset) )
        {
            if(yPos >= (unlockIconY - iconOffset) && yPos <= (unlockIconY + unlockIconHeight + iconOffset) )
            {
                console.log(`🔓 Mic unlock`);

                setMicrophoneSwipeUnlocked();

                return;
            }
        }
    });


    $(`#chatSendButton`).off(`click`);
    $(`#chatSendButton`).on(`click`, async function(){
        await chatSendMessage();
    });

    $("#modalChatPlus").modal({
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

    $(`#btnCloseModalChatPlus`).off(`click`);
    $(`#btnCloseModalChatPlus`).on(`click`, function(){
        $("#modalChatPlus").modal(`close`);
    });

    $(`#chatPlusButton`).off(`click`);
    $(`#chatPlusButton`).on(`click`, async function(){
        $("#modalChatPlus").modal(`open`);
    });

    $(`#chatSharePhotoOrImage`).off(`click`);
    $(`#chatSharePhotoOrImage`).on(`click`, async function(){
        
        await initModalTakePhoto(null, null, 100, true, true, async function(imageSetEvent){
            const imageURI = imageSetEvent.detail.image;

            pendingMediaToSend = imageURI;
            pendingMediaTypeToSend = MEDIA_TYPE_IMAGE;
            showPendingMediaToSend();
    
            $("#modalChatPlus").modal(`close`);
        });
    });

    // On chat scroll event
    $('#chatBox').on("scroll", function() {

        // Set message to not pressing
        pressingMessageBlock = false;
        pressingMessageBlockId = null;

        checkIsAtChatRoomBottom();

        if(disableScrollHistoryCheck == true)
        {
            return;
        }

        checkMessageMediaViewport();
        checkPagedChatHistoryLoad();
    });

    $('#chatBox').bind('touchmove', function(e) { 
        // Disable last scrolled message when user changes it
        lastScrollMessage = null;
    });

    $('#chatBox').on('wheel', function (e)
	{
        // Disable last scrolled message when user changes it
        lastScrollMessage = null;
	});

    $(`#btnChatRoomScrollDown`).off(`click`);
    $(`#btnChatRoomScrollDown`).on(`click`, function(){
        const scrollend = $('#chatBox').prop("scrollHeight");
        $("#chatBox").animate({ scrollTop: scrollend}, 250);
    })
}

function startMicrophoneButtonSlideService()
{
    if(microphoneButtonSlideService != null)
    {
        stoptMicrophoneButtonSlideService();
    }

    microphoneButtonSlideService = setInterval(function(){

        if(microphoneButtonIsPressing == false)
        {
            hideMicrophoneSwipeLock();
            return;
        }

        if(microphoneButtonLoading == true)
        {
            hideMicrophoneSwipeLock();
            return;
        }

        if(micAuthorized == false)
        {
            hideMicrophoneSwipeLock();
            return;
        }

        showMicrophoneSwipeLock();
    }, 50)
}

function stoptMicrophoneButtonSlideService()
{
    clearInterval(microphoneButtonSlideService);
    microphoneButtonSlideService = null;
    hideMicrophoneSwipeLock();
}

function hideMicrophoneSwipeLock()
{
    const swipeLockElement = $(`#chatMicrophoneSwipeLock`);
    swipeLockElement.addClass(`hide`);
}

function showMicrophoneSwipeLock()
{
    // Start swipe with locked state
    chatMicrophoneSwipeUnlocked = false;

    const micPosition = $(`#chatMicrophoneButton`).position();
    
    const swipeLockElement = $(`#chatMicrophoneSwipeLock`);
    const switeLockWidth = swipeLockElement.width();
    const switeLockHeight = swipeLockElement.height();

    swipeLockElement.css(`top`, micPosition.top - switeLockHeight + 48);
    swipeLockElement.css(`left`, micPosition.left);

    swipeLockElement.removeClass(`hide`);

    $(`#chatMicrophoneSwipeLock`).find(`.unlock-icon`).removeClass(`unlock-swipe-active`);
}

function setMicrophoneSwipeUnlocked()
{
    // Light icon color
    $(`#chatMicrophoneSwipeLock`).find(`.unlock-icon`).addClass(`unlock-swipe-active`);

    // Set unlocked state
    chatMicrophoneSwipeUnlocked = true;

    // Stop Mic Slide Service
    stoptMicrophoneButtonSlideService();

    microphoneButtonIsPressing = false;

    $(`#chatMicrophoneButton`).addClass(`hide`);
    $(`#chatMicrophoneStopButton`).removeClass(`hide`);
    $(`#chatMicrophoneStopButton`).removeClass(`disabled`);

    // Pulse animation effect on stop button
    $(`#chatMicrophoneStopButton`).addClass(`chat-microphone-pressed-button`);

    // Wait some seconds to hide swipe element
    setTimeout(function(){
        // Hide swipe element
        hideMicrophoneSwipeLock();
    }, 1000);

}

function resetMicrophoneSwipeUnlocked()
{
    chatMicrophoneSwipeUnlocked = false;

    $(`#chatMicrophoneButton`).removeClass(`hide`);
    $(`#chatMicrophoneStopButton`).addClass(`hide`);

    // Remove Pulse animation effect on stop button
    $(`#chatMicrophoneStopButton`).removeClass(`chat-microphone-pressed-button`);

}

async function setChatDefaultValues()
{
    initChatAudioRecordingService();

    audioChatSiriWave = new SiriWave({
        container: document.getElementById("chatAudioSiriWave"),
        width: 250,
        height: 42,
        speed: 0.2, 
        frequency: 6,
        // autostart: true, 
        style: 'ios9',
        // curveDefinition: [
        // {
        //     attenuation: -2,
        //     lineWidth: 1,
        //     opacity: 0.1,
        // },
        // {
        //     attenuation: -6,
        //     lineWidth: 1,
        //     opacity: 0.2,
        // },
        // {
        //     attenuation: 4,
        //     lineWidth: 1,
        //     opacity: 0.4,
        // },
        // {
        //     attenuation: 2,
        //     lineWidth: 1,
        //     opacity: 0.6,
        // },
        // {
        //     attenuation: 1,
        //     lineWidth: 1.5,
        //     opacity: 1,
        // }]
        // curveDefinition: [
        //     {
        //       color: "255,255,255",
        //       supportLine: true,
        //     },
        //     {
        //       color: "15, 82, 169",
        //     },
        //     {
        //       color: "173, 57, 76",
        //     },
        //     {
        //       color: "48, 220, 155",
        //     }
        // ]
    });
}

function initChatAudioRecordingService()
{
    if(audioChatRecordingService != null)
    {
        clearInterval(audioChatRecordingService);
        audioChatRecordingService = null;
    }

    audioChatRecordingService = setInterval(function(){
        if(isAudioChatRecording == false)
        {
            return;
        }

        audioChatRecord.getCurrentAmplitude(
            // success callback
            
            function (amp) {
                // console.log(amp + "%");
                // $(`#chatMainInputAudio`).text(`${amp}%`)
                audioChatSiriWave.setAmplitude(amp * 2);
            },
            // error callback
            function (e) 
            {
                // console.log("Error getting amp=" + e);
                // $(`#chatMainInputAudio`).text(`Error getting amp=${e}%`)
                audioChatSiriWave.setAmplitude(0);
            }
        );
    }, 500);

}

async function openChatWithContact(contactId)
{
    setChatRoom(contactId);
}

async function closeChat()
{
    chatStateOpened = false;
    // $(`#appChatArea`).addClass(`hide`);
    // $(`#appChatContacts`).removeClass(`hide`);
    swipeChatRoomToHide();
    
    $(`#chatTalkToPhoto`).attr(`src`, `images/contact.png`);
    $(`#chatTalkToName`).text(``);
    $(`#chatTalkToOnlineStatus`).addClass(`hide`);

    await updateChatRoomCache();
    clearChatBox();

    stopChatMessageStatusService();
    stopLoadMessageImageService();
    stopLoadMessageAudioService();
    stopLoadMessageLoanService();
    stoptMicrophoneButtonSlideService();

    if(audioPlaying != null)
    {
        audioPlayerStopAll();
    }
    
    chatMicrophoneModeOff();

    clearPendingMediaToSend();
    clearPendingReplyMessageId();

    chatMicrophoneAuthorizationUnderRequest = false;
    microphoneButtonIsPressing = false;
    chatRoomIsSending = false;
    chatRoomIsReceiving = false;
    disableScrollHistoryCheck = false;
    chatRoomHistoryBaseMessageId = null;
    pressingMessageBlock = false;
    pressingMessageBlockId = null;
    talkToId = null;
    talkToName = "";
    talkToGroupRecord = null;
    servedByCompany = null;
    chatCompanyList = [];
    talkToAGroup = false;
    talkToGroupInfo = null;
    talkGroupMembers = null;
    userCanSendGroupMessage = true;

    updateContactListCover();
}

async function setChatRoom(contactId)
{
    chatStateOpened = true;
    // $(`#appChatArea`).removeClass(`hide`);
    // $(`#appChatContacts`).addClass(`hide`);

    checkInvalidGroupToSendMessage();

    swipeChatRoomToShow();

    // console.log(contactId);

    talkToId = contactId;
    talkToGroupRecord = await getChatAppGroupIndentificationById(talkToId);

    await contactIdIsGroupCheck();

    preloadRoomContactProfile();
    chatLoadRoomContactProfile();

    checkSendActionButton();
    startChatMessageStatusService();
    startLoadMessageImageService();
    startLoadMessageAudioService();
    startLoadMessageLoanService();

    clearChatBox();

    microphoneButtonIsPressing = false;

    // Load chat history
    chatRoomIsSending = false;
    chatRoomIsReceiving = false;
    disableScrollHistoryCheck = false;

    await initChatBoxWithCache();
    loadChatRoomMessageHistory(null);

    micAuthorized = await microphoneIsEnabled();
}

function swipeChatRoomToShow()
{
    $(`#appChatArea`).css(`left`, `${window.screen.width}px`);
    $(`#appChatArea`).removeClass(`hide`);

    $(`#appChatArea`).animate({left: $(`#appChatContacts`).position().left, opacity: 1}, 200, function(){
        $(`#appChatArea`).css(`left`, `unset`);
        $(`#appChatArea`).css(`opacity`, ``);
        $(`#appChatContacts`).addClass(`hide`);
    });
}

function swipeChatRoomToHide()
{
    $(`#appChatContacts`).removeClass(`hide`);

    $(`#appChatArea`).animate({left: window.screen.width, opacity: 0.0}, 200, function(){
        $(`#appChatArea`).css(`left`, `unset`);
        $(`#appChatArea`).css(`opacity`, ``);
        $(`#appChatArea`).addClass(`hide`);
    });
}

function preloadRoomContactProfile()
{
    if(talkToId == null)
    {
        console.log(`(preloadRoomContactProfile) talkToId was probably reset by user`);
        return;
    }

    if(talkToAGroup == false)
    {
        let phoneDetails = getPhoneFormatsByNumber(talkToId, null);
        preloadName = phoneDetails.full;
    
        if(preloadName == null)
        {
            preloadName = "";
        }
    
        const preloadPhoto = `images/contact.png`;
    
        $(`#chatTalkToPhoto`).attr(`src`, preloadPhoto);
        $(`#chatTalkToName`).text(preloadName);
    }
    else
    {
        const preloadPhoto = `images/group.png`;
    
        $(`#chatTalkToPhoto`).attr(`src`, preloadPhoto);

        if(talkToGroupInfo != null)
        {
            $(`#chatTalkToName`).text(talkToGroupInfo.Name);
        }
        else
        {
            (async() =>{
                if(talkToGroupInfo == null)
                {
                    if(talkToGroupRecord == null)
                    {
                        if(talkToId != null)
                        {
                            talkToGroupRecord = await getChatAppGroupIndentificationById(talkToId);
                        }
                    }
        
                    if(talkToGroupRecord != null)
                    {
                        talkToGroupInfo = talkToGroupRecord;
                    }

                    if(talkToGroupInfo != null)
                    {
                        $(`#chatTalkToName`).text(talkToGroupInfo.Name);
                    }
                    else
                    {
                        $(`#chatTalkToName`).text("Err ⛔️ 🏁");
                    }
                }
            }) ();
        }

    }

    $(`#chatCompanySelection`).addClass(`hide`);
    $(`#chatRoomCompanyName`).text(``);

    $(`#chatTalkToOnlineStatus`).addClass(`hide`);
}

async function chatLoadRoomContactProfile()
{
    if(talkToAGroup == false)
    {
        const linkedRecord = linkedContactList.find((item) =>{
            return item.Contact == talkToId
        });
       
        let photo = "images/contact.png";
    
        if(linkedRecord != null)
        {
            talkToName = linkedRecord.Name;
            // photo = `${endpoint}services/userphotoraw/${talkToId}`;
            photo = await getPhotoProfileURL(talkToId, null, true);
        }
    
        if(talkToName == null)
        {
            talkToName = "";
        }
        
        if(talkToName.trim().length == 0)
        {
            const contactInfo = await getContactInfo(talkToId, null);
            talkToName = contactInfo.name;
            photo = contactInfo.photo;
        }
    
        if(talkToName == null)
        {
            talkToName = "";
        }
    
        if(talkToName.trim().length == 0)
        {
            let phoneDetails = getPhoneFormatsByNumber(talkToId, null);
            
            if(phoneDetails != null)
            {
                talkToName = phoneDetails.full;
            }
        }
    
        if(talkToName == null)
        {
            talkToName = "";
        }
    
        $(`#chatTalkToPhoto`).attr(`src`, photo);
        $(`#chatTalkToName`).text(talkToName);
    }
    else
    {
        let photo = await getPhotoGroupURL(talkToId);

        // console.log(`👾 Group Photo to be loaded: ${photo}`);

        if(talkToGroupInfo == null)
        {
            if(talkToGroupRecord == null)
            {
                if(talkToId != null)
                {
                    talkToGroupRecord = await getChatAppGroupIndentificationById(talkToId);
                }
            }

            if(talkToGroupRecord != null)
            {
                talkToGroupInfo = talkToGroupRecord;
            }
        }

        if(talkToGroupInfo != null)
        {
            talkToName = talkToGroupInfo.Name;
        }
        else
        {
            talkToName = "Err ⛔️ 🏳️";
        }

        $(`#chatTalkToPhoto`).attr(`src`, photo);
        $(`#chatTalkToName`).text(talkToName);

        // Refresh home list photo if it is different
        console.log(`Checking group photo diff from home list`);
        const homeListItemElement = $(`.app-chat-group-list-item-avatar-image[data-id="${talkToId}"]`);
        const homeListItemPhoto = homeListItemElement.attr(`src`);
        if(homeListItemPhoto != photo)
        {
            console.log(`Updating group photo home list item by chat diff`);
            // homeListItemElement.attr(`src`, photo);
            await refreshHomeGroupListItemPhotoById(talkToId);
            updateLinkedContactListCache();
        }
    }

    // Load Company Info
    await loadCompanyInfo();
}

async function loadCompanyInfo()
{
    servedByCompany = null;

    await waitForCompanyInfoLoading();

    let currentCompany = readLocalStorage(`company`);
    let mustCreateInitialServedByRecord = false;

    if(currentCompany != null)
    {
        const sqlServedByCompany = `SELECT company FROM ContactServedByCompany WHERE contact = ?`;
        const sqlServedByCompanyValues = [talkToId];
        const sqlServedByCompanyResponse = await dbRun(sqlServedByCompany, sqlServedByCompanyValues);
    
        if(sqlServedByCompanyResponse == null)
        {
            servedByCompany = currentCompany;
            mustCreateInitialServedByRecord = true;
        }
        else if(sqlServedByCompanyResponse.rows.length == 0)
        {
            servedByCompany = currentCompany;
            mustCreateInitialServedByRecord = true;
        }
        else
        {
            const servedByCompanyRecord = sqlServedByCompanyResponse.rows.item(0);
            servedByCompany = servedByCompanyRecord.company;
        }    
    }

    let companyList = [];
    if(servedByCompany != null)
    {
        // Retrieve company list
        const sqlCompaniesInfo = `SELECT companyId, name FROM Company`;
        const sqlCompaniesInfoResponse = await dbRun(sqlCompaniesInfo, null);

        if(sqlCompaniesInfoResponse == null)
        {
            // There is no company, so use no company mode
            servedByCompany = null;
        }
        else if(sqlCompaniesInfoResponse.rows.length == 0)
        {
            // There is no company, so use no company mode
            servedByCompany = null;
        }

        for(let ix = 0; ix < sqlCompaniesInfoResponse.rows.length; ix++)
        {
            const companyRecord = sqlCompaniesInfoResponse.rows.item(ix);
            companyList.push(companyRecord);
        }
    }

    if(servedByCompany != null)
    {
        chatCompanyList = JSON.parse(JSON.stringify(companyList));

        let companyName;

        let companyItem = companyList.find((item) =>{
            return item.companyId == servedByCompany;
        });

        if(companyItem == null)
        {
            companyName = servedByCompany;
        }
        else
        {
            companyName = companyItem.name;
        }

        $(`#chatCompanySelection`).removeClass(`hide`);
        $(`#chatRoomCompanyName`).text(companyName);
        $(`.chat-header`).addClass(`chat-header-with-company`);

        // Fill drop down companies
        let dropDownHtmlContent = ``;
        for(let ix = 0; ix < companyList.length; ix++)
        {
            const companyIteId = companyList[ix].companyId;
            const companyItemName = companyList[ix].name;
            dropDownHtmlContent += `
                <li>
                    <a href="#!" data-id="${companyIteId}" class="chat-company-selection-drop-down-item">
                        ${companyItemName}
                    </a>
                </li>
            `;
        }

        $(`#chatCompanySelectionDropDownElements`).html(dropDownHtmlContent);

        const dropDownOptions = {
            "alignment": "left",
            "autoTrigger": "false",
            "constrainWidth": "false",
            "container": null,
            "coverTrigger": false,
            "closeOnClick": true,
            "hover": false,
            "inDuration": 150,
            "outDuration": 250,
            "onOpenStart": null,
            "onOpenEnd": null,
            "onCloseStart": null,
            "onCloseEnd": null
        };
        $('#chatCompanySelectionDropDownTrigger').dropdown(dropDownOptions);

        $(`.chat-company-selection-drop-down-item`).off(`click`);
        $(`.chat-company-selection-drop-down-item`).on(`click`, async function(){
            const newCompanySelection = $(this).attr(`data-id`);

            if(newCompanySelection == null)
            {
                return;
            }

            if(newCompanySelection.trim().length == 0)
            {
                return;
            }

            servedByCompany = newCompanySelection;

            let companyName;

            let companyItem = chatCompanyList.find((item) =>{
                return item.companyId == servedByCompany;
            });
    
            if(companyItem == null)
            {
                companyName = servedByCompany;
            }
            else
            {
                companyName = companyItem.name;
            }
    
            $(`#chatRoomCompanyName`).text(companyName);

            await setContactServedByCompany(talkToId, servedByCompany);
        });

        
        if(mustCreateInitialServedByRecord == true)
        {
            await setContactServedByCompany(talkToId, servedByCompany);
        }
    }
    else
    {
        // Not under company
        chatCompanyList = [];
        $(`#chatCompanySelection`).addClass(`hide`);
        $(`#chatRoomCompanyName`).text(``);
        $(`.chat-header`).removeClass(`chat-header-with-company`);

        try
        {
            $('#chatCompanySelectionDropDownTrigger').dropdown('destroy');
        }
        catch(destroyDropdownException)
        {

        }

        $(`#chatCompanySelectionDropDownElements`).empty();
    }
}

function checkSendActionButton()
{
    const typedMessage = $(`#chatMainInputText`).val();

    // Show send button when has image media pending to send
    if(pendingMediaToSend != null && pendingMediaTypeToSend != null)
    {
        if(pendingMediaTypeToSend == MEDIA_TYPE_IMAGE)
        {
            $(`#chatSendButton`).removeClass(`hide`);
            $(`#chatMicrophoneButton`).addClass(`hide`);

            return;
        }
    }

    if(typedMessage.length > 0)
    {
        $(`#chatSendButton`).removeClass(`hide`);
        $(`#chatMicrophoneButton`).addClass(`hide`);
    }
    else
    {
        $(`#chatSendButton`).addClass(`hide`);
        $(`#chatMicrophoneButton`).removeClass(`hide`);
    }

}

async function chatSendMessage()
{
    const uid = readLocalStorage("uid");

    if(talkToId == uid)
    {
        console.log(`🔴 BLOCKED: Trying to send message to yourself`);
        return;
    }

    // const groupRecord = await getChatAppGroupById(talkToId, true);
    const groupRecord = talkToGroupRecord;

    if(groupRecord != null)
    {
        const queryGroupMembers = `SELECT Login FROM AppGroupMembers WHERE GroupId = ? AND Login = ?`;
        const queryGroupMembersValues = [talkToId, uid];
        const queryGroupMembersResult = await dbRun(queryGroupMembers, queryGroupMembersValues);

        if(queryGroupMembersResult.rows.length == 0)
        {
            swal(getTranslate('cannot-send-message-removed-from-group', 'You can not send message in this group. You have been removed from this group')).then(() =>{ 
                closeChat();
                $(`#chatMainInputText`).val("");
            });

            return;
        }
    }

    const messageId = makeid(CHAT_MESSAGE_KEY_SIZE);

    let msgText = $(`#chatMainInputText`).val();

    if(msgText.trim().length == 0)
    {
        if(pendingMediaToSend == null || pendingMediaTypeToSend == null)
        {
            return;
        }
    }

    msgText = removeSpacesAfter(msgText);

    // Check upload
    // if(pendingMediaToSend != null && pendingMediaTypeToSend != null)
    // {
    //     if(pendingMediaToSend.toLowerCase().trim().startsWith("file://") == true)
    //     {

    //         swal(getTranslate(`uploading`, `Uploading...`), {
    //             button: false, closeOnClickOutside: false
    //         });

    //         let serverConnectionState = await hasServerConnection();
            
    //         if(serverConnectionState == false)
    //         {
    //             swal.close();
    //             swal(getTranslate("unable-to-send-file", "You cannot send file without internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again."));
    //             return;
    //         }

    //         let fileName = pendingMediaToSend.replace(/^.*[\\/]/, '').split('?')[0];
    //         let uniqueFileName = fileName.replace(/(\.[\w\d_-]+)$/i, `-${new Date().getTime()}$1`);

    //         let uploadResponse = null;

    //         try
    //         {
    //             const UPLOAD_TIMEOUT = 120000;
    //             uploadResponse = await uploadFileToServer(`/fs/sendimage`, pendingMediaToSend, uniqueFileName, null, null, UPLOAD_TIMEOUT);
    //         }
    //         catch(uploadException)
    //         {
    //             swal.close();
    //             swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
    //             return;
    //         }

    //         swal.close();

    //         if(uploadResponse == null)
    //         {
    //             swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
    //             return;
    //         }


    //         if(typeof uploadResponse.code != 'undefined')
    //         {
    //             if(uploadResponse.code == "OK")
    //             {
    //                 // let uid = readLocalStorage("uid");
    //                 // const fileMedia = `${uid}|${uniqueFileName}`;
    //                 // pendingMediaToSend = fileMedia;
    //                 pendingMediaToSend = uploadResponse.fileId;
    //             }
    //             else
    //             {
    //                 swal(`1005 - ${getTranslate("error-on-save", "Error saving data")}`);
    //                 return;
    //             }
    //         }
    //     }
    // }

    chatRoomIsSending = true;

    if(pendingMediaToSend == null || pendingMediaTypeToSend == null)
    {
        appendSendMessage(messageId, msgText, new Date(), 0, 0, 0, pendingReplyMessageId, null);
    }
    else
    {
        appendSendMessageWithMedia(messageId, msgText, pendingMediaTypeToSend, pendingMediaToSend, new Date(), 0, 0, 0, pendingReplyMessageId, null);
    }



    $(`#audioChatMessageSend`)[0].play();

    // Scroll to bottom
    scrollChatToBottom(false, false);

    $(`#chatMainInputText`).select()
    $(`#chatMainInputText`).val("");
    autoHeightTextArea($(`#chatMainInputText`).get(0));
    checkSendActionButton();

    setChatInputFocus();

    if(pendingMediaTypeToSend == MEDIA_TYPE_AUDIO)
    {
        await setAudioTranscriptionMessage(messageId);
    }

    const inputIsProtected = false;
    await setSendMessage(messageId, talkToId, msgText, inputIsProtected);

    skipChatInputFocus = false;

    chatRoomIsSending = false;
}

function removeSpacesAfter(value)
{
    value = value.replace(/\s+$/, '');
    return value;
}

function scrollChatToBottom(fromAllHistory, noWait)
{
    disableScrollHistoryCheck = true;

    lastScrollMessage = null;

    if(noWait == null)
    {
        noWait = false;
    }

    // Scroll to bottom
    const allUnreadMessage = $(`#chatBox`).find(`.chat-message-block[data-statusread="0"][data-fromid="${talkToId}"]`);
    const allChatMessage = $(`#chatBox`).find(`.chat-message-block[data-fromid="${talkToId}"]`);
    const scrollend = $('#chatBox').prop("scrollHeight");

    const hasUnreadMessage = allUnreadMessage.length > 0 ? true : false;

    if(hasUnreadMessage == false)
    {
        lastScrollMessage = allChatMessage.length > 0 ? allChatMessage[allChatMessage.length -1] : null;

        if(fromAllHistory == true)
        {
            if(noWait == false)
            {
                setTimeout(function(){
                    $("#chatBox").scrollTop(scrollend);
                }, 1000);
            }
            else
            {
                $("#chatBox").scrollTop(scrollend);
            }
        }
        else
        {
            // Make it animated
            $("#chatBox").animate({ scrollTop: scrollend}, 1000);
        }
    }
    else
    {
        const firstUnreadMessage = allUnreadMessage[0];
        const firstUnreadMessageTop = getChatMessageTopPosition(firstUnreadMessage);

        lastScrollMessage = firstUnreadMessage;

        if(fromAllHistory == true)
        {
            if(noWait == false)
            {
                setTimeout(function(){
                    $("#chatBox").scrollTop(firstUnreadMessageTop);
                }, 1000);    
            }
            else
            {
                $("#chatBox").scrollTop(firstUnreadMessageTop);
            }
        }
        else
        {
            // Make it animated
            $("#chatBox").animate({ scrollTop: firstUnreadMessageTop}, 1000);
        }
    }

    // Set all to read after scroll
    $(`#chatBox`).find(`.message`).attr("data-statusread", "1");

    checkMessageMediaViewport();

    disableScrollHistoryCheck = false;
}

function getChatMessageTopPosition(messageItem)
{
    const messageTop = $('#chatBox').scrollTop() + $(messageItem).position().top;
    return messageTop;
}

function checkMessageMediaViewport()
{
    let elements = $('#chatBox').find(`.card-media`);

    for(let ix = 0; ix < elements.length; ix++)
    {
        const element = elements[ix];
        const isInViewport = isElementInViewport(element);

        if(isInViewport == true)
        {
            $(element).addClass(`card-media-in-view-port`);
        }
        else
        {
            $(element).removeClass(`card-media-in-view-port`);
        }
    }
}

async function checkPagedChatHistoryLoad()
{
    if(pagedChatHistoryIsLoading == true)
    {
        return;
    }

    var scrollTop = $('#chatBox').scrollTop();

    if(scrollTop < 5)
    {
        if(chatRoomIsSending == false && chatRoomIsReceiving == false)
        {
            loadChatRoomMessageHistory(null);
        }
    }
}

function checkIsAtChatRoomBottom()
{
    var elem = $('#chatBox');
    const diff = (elem[0].scrollHeight - elem.scrollTop()) - elem.outerHeight();
    if (diff < 2)
    {
	    // when scroll to bottom of the page
        $(`#btnChatRoomScrollDown`).addClass(`hide`);
	}
    else
    {
        $(`#btnChatRoomScrollDown`).removeClass(`hide`);
    }
}

function isElementInViewport(el) 
{
    var rect     = el.getBoundingClientRect();
    var vWidth   = window.innerWidth || document.documentElement.clientWidth;
    var vHeight  = window.innerHeight || document.documentElement.clientHeight;
    var efp      = function (x, y) { return document.elementFromPoint(x, y) };

    // Return false if it's not in the viewport
    if (rect.right < 0 || rect.bottom < 0  || rect.left > vWidth || rect.top > vHeight)
    {
        return false;
    }

    // Return true if any of its four corners are visible
    return (
          el.contains(efp(rect.left,  rect.top)) ||
          el.contains(efp(rect.right, rect.top)) ||
          el.contains(efp(rect.right, rect.bottom)) ||
          el.contains(efp(rect.left,  rect.bottom))
    );
}

function appendSendMessage(messageId, text, date, statusSent, statusReceived, statusRead, inReplyToMessageId, beforeMessageId)
{
    disableScrollHistoryCheck = true;

    let momentYear = date.getFullYear();
    let momentMonth = date.getMonth() + 1;
    let momentDay = date.getDate();

    const msgMomentLabel = `<div class="chat-message-moment-label" data-year="${momentYear}" data-month="${momentMonth}" data-day="${momentDay}">
        ${date.toLocaleDateString()}
    </div>`;

    // Detect URL into text
    text = urlify(text);

    const mustSuppress = text.length > 500 ? true : false;

    let replyMessageCard = ""
    let replyMessageCardAdded = false;
    if(inReplyToMessageId != null)
    {
        if(inReplyToMessageId.trim().length > 0)
        {
            replyMessageCard = `<div class="reply-card-loading" data-id="${messageId}" data-replyid="${inReplyToMessageId}"></div>`;
            replyMessageCardAdded = true;
        }
    }

    let groupMessageOwner = "";
    if(talkToAGroup == true)
    {
        groupMessageOwner = `<div class="chat-group-message-owner chat-group-message-owner-loading" data-id="${messageId}"></div>`
    }

    const msgCode = `
    <div class="chat-message-block message primary" data-id="${messageId}" data-statusprocessed="0" data-statussent="${statusSent}" data-statusreceived="${statusReceived}" data-statusread="${statusRead}" data-moment="${date.getTime()}">
        ${groupMessageOwner}
        ${replyMessageCard}
        <div class="message-text ${mustSuppress == true ? `suppressed-message-text`: ``}" data-id="${messageId}">${text}</div>
        ${mustSuppress == true ? `<a href="#" class="message-text-show-more" data-id="${messageId}">... ${getTranslate(`read-more`, `Read More`)}</a>` : ``}
        ${mustSuppress == true ? `<a href="#" class="message-text-show-minimize hide" data-id="${messageId}">${getTranslate(`minimize`, `Minimize`)}</a>` : ``}
        <div class="message-block-footer">
            <span class="timestamp">${getHourAndMinute(date)}</span>
            <span class="message-status-mark">
                <i class="message-status-mark-sent hide fa-solid fa-check"></i>
                <i class="message-status-mark-received hide fa-solid fa-check"></i>
            </span>
        </div>
    </div>
    `;


    let existingMomentLabel = $(`#chatBox`).find(`.chat-message-moment-label[data-year="${momentYear}"][data-month="${momentMonth}"][data-day="${momentDay}"]`);

    if(beforeMessageId == null)
    {
        if(existingMomentLabel.length == 0)
        {
            $(`#chatBox`).append(msgMomentLabel);
        }

        $(`#chatBox`).append(msgCode);
    }
    else
    {
        if(existingMomentLabel.length > 0)
        {
            existingMomentLabel.remove();
        }

        $(msgMomentLabel).insertBefore( `.chat-message-block[data-id="${beforeMessageId}"]`);
        $(msgCode).insertBefore( `.chat-message-block[data-id="${beforeMessageId}"]`);
    }

    toogleSuppressedUnsuppressedEvent();
    messageBlockEvents();

    // If is the first message in the history, set as the oldest loaded message
    // if($(`.chat-message-block`).length == 1)
    // {
    //     chatRoomOldestLoadedMessage = 0;
    //     chatRoomOldestLoadedMessageId = messageId
    // }

    if(replyMessageCardAdded == true)
    {
        processReplyCards();
    }

    if(talkToAGroup == true)
    {
        refreshTalkGroupMembersView();
    }

    disableScrollHistoryCheck = false;
}

function appendReceiveMessage(messageId, text, date, inReplyToMessageId, beforeMessageId)
{
    if($(`.chat-message-block[data-id="${messageId}"]`).length > 0)
    {
        // Already inserted 
        return;
    }

    disableScrollHistoryCheck = true;

    let momentYear = date.getFullYear();
    let momentMonth = date.getMonth() + 1;
    let momentDay = date.getDate();

    const msgMomentLabel = `<div class="chat-message-moment-label" data-year="${momentYear}" data-month="${momentMonth}" data-day="${momentDay}">
        ${date.toLocaleDateString()}
    </div>`;

    // Detect URL into text
    text = urlify(text);

    const mustSuppress = text.length > 500 ? true : false;

    let replyMessageCard = ""
    let replyMessageCardAdded = false;
    if(inReplyToMessageId != null)
    {
        if(inReplyToMessageId.trim().length > 0)
        {
            replyMessageCard = `<div class="reply-card-loading" data-id="${messageId}" data-replyid="${inReplyToMessageId}"></div>`;
            replyMessageCardAdded = true;
        }
    }

    let groupMessageOwner = "";
    if(talkToAGroup == true)
    {
        groupMessageOwner = `<div class="chat-group-message-owner chat-group-message-owner-loading" data-id="${messageId}"></div>`
    }

    const msgCode = `
    <div class="chat-message-block message secondary" data-id="${messageId}" data-statusprocessed="1" data-moment="${date.getTime()}">
        ${groupMessageOwner}
        ${replyMessageCard}
        <div class="message-text ${mustSuppress == true ? `suppressed-message-text`: ``}" data-id="${messageId}">${text}</div>
        ${mustSuppress == true ? `<a href="#" class="message-text-show-more" data-id="${messageId}">... ${getTranslate(`read-more`, `Read More`)}</a>` : ``}
        ${mustSuppress == true ? `<a href="#" class="message-text-show-minimize hide" data-id="${messageId}">${getTranslate(`minimize`, `Minimize`)}</a>` : ``}
        <div class="message-block-footer">
            <span class="timestamp">${getHourAndMinute(date)}</span>
        </div>
    </div>
    `;

    let existingMomentLabel = $(`#chatBox`).find(`.chat-message-moment-label[data-year="${momentYear}"][data-month="${momentMonth}"][data-day="${momentDay}"]`);

    if(beforeMessageId == null)
    {
        if(existingMomentLabel.length == 0)
        {
            $(`#chatBox`).append(msgMomentLabel);
        }

        $(`#chatBox`).append(msgCode);
    }
    else
    {
        if(existingMomentLabel.length > 0)
        {
            existingMomentLabel.remove();
        }

        $(msgMomentLabel).insertBefore( `.chat-message-block[data-id="${beforeMessageId}"]`);
        $(msgCode).insertBefore( `.chat-message-block[data-id="${beforeMessageId}"]`);
    }

    toogleSuppressedUnsuppressedEvent();
    messageBlockEvents();

    // If is the first message in the history, set as the oldest loaded message
    // if($(`.chat-message-block`).length == 1)
    // {
    //     chatRoomOldestLoadedMessage = 0;
    //     chatRoomOldestLoadedMessageId = messageId
    // }

    if(replyMessageCardAdded == true)
    {
        processReplyCards();
    }

    if(talkToAGroup == true)
    {
        refreshTalkGroupMembersView();
    }
    

    disableScrollHistoryCheck = false;
}


async function appendSendMessageWithMedia(messageId, text, mediaType, media, date, statusSent, statusReceived, statusRead, inReplyToMessageId, beforeMessageId)
{
    disableScrollHistoryCheck = true;

    let mediaCard = ``;
    if(mediaType == MEDIA_TYPE_LOAN)
    {
        const loanId = media;
        mediaCard = getMessageLoanCard(loanId);
    }
    else if(mediaType == MEDIA_TYPE_IMAGE)
    {
        const imageAddress = media;
        mediaCard = getMessageImageCard(messageId, imageAddress);
    }
    else if(mediaType == MEDIA_TYPE_AUDIO)
    {
        const audioAddress = media;
        mediaCard = getMessageAudioCard(messageId, audioAddress);
    }

    appendSendMessage(messageId, text, date, statusSent, statusReceived, statusRead, inReplyToMessageId, beforeMessageId);
    $(`.chat-message-block[data-id="${messageId}"]`).find(`.message-text`).before(mediaCard);

    updateImageCardLocalPreview();

    disableScrollHistoryCheck = false;
}

async function appendReceiveMessageWithMedia(messageId, text, mediaType, media, date, inReplyToMessageId, beforeMessageId)
{
    disableScrollHistoryCheck = true;

    let mediaCard = ``;
    if(mediaType == MEDIA_TYPE_LOAN)
    {
        const loanId = media;
        mediaCard = getMessageLoanCard(loanId);
    }
    else if(mediaType == MEDIA_TYPE_IMAGE)
    {
        const imageAddress = media;
        mediaCard = getMessageImageCard(messageId, imageAddress);
    }
    else if(mediaType == MEDIA_TYPE_AUDIO)
    {
        const audioAddress = media;
        mediaCard = getMessageAudioCard(messageId, audioAddress);
    }


    appendReceiveMessage(messageId, text, date, inReplyToMessageId, beforeMessageId);
    $(`.chat-message-block[data-id="${messageId}"]`).find(`.message-text`).before(mediaCard);

    updateImageCardLocalPreview();

    disableScrollHistoryCheck = false;
}


function getMessageLoanCard(loanId)
{
    const mediaCard = `
    <div class="card card-media card-media-loan-loading" data-id="${loanId}">
        <div class="card-content">
            <img class="media-loancard-source-loading" referrerPolicy="no-referrer" data-id="${loanId}" src="/images/chat-loading.gif"/>
        </div>
    </div>
    `;

    return mediaCard;
}

function getMessageImageCard(messageId, imageMediaId)
{

    let mediaCard = ``;

    if(imageMediaId.toLowerCase().trim().startsWith("file://") == true || imageMediaId.toLowerCase().trim().startsWith("filesystem:") == true)
    {
        mediaCard = `
        <div class="card card-media card-media-image card-image-waiting-for-upload" data-message="${messageId}" data-id="">
            <div class="card-content">
                <img class="media-image-waiting-for-upload" referrerPolicy="no-referrer" data-message="${messageId}" data-id="" data-filesrc="${imageMediaId}" src="/images/picture.png"/>
            </div>
        </div>
        `; 
    }
    else
    {
        mediaCard = `
        <div class="card card-media card-media-image" data-message="${messageId}" data-id="${imageMediaId}">
            <div class="card-content">
                <img class="media-image-source-loading" referrerPolicy="no-referrer" data-message="${messageId}" data-id="${imageMediaId}" src="/images/picture.png"/>
            </div>
        </div>
        `;            
    }

    return mediaCard;
}

function getMessageAudioCard(messageId, audioMediaId)
{

    let mediaCard = ``;

    if(audioMediaId.toLowerCase().trim().startsWith("file://") == true || audioMediaId.toLowerCase().trim().startsWith("filesystem:") == true)
    {
        // mediaCard = `
        // <div class="card card-media card-media-audio card-audio-waiting-for-upload" data-message="${messageId}" data-id="">
        //     <div class="card-content">
        //         <img class="media-audio-waiting-for-upload" referrerPolicy="no-referrer" data-message="${messageId}" data-id="" data-filesrc="${audioMediaId}" src="/images/audio.png"/>
        //     </div>
        // </div>
        // `;
        mediaCard = `
        <div class="card card-media card-media-audio card-audio-waiting-for-upload" data-message="${messageId}" data-id="${audioMediaId}">
            <div class="card-content" onclick="localAudioPlay('${audioMediaId}')">
                <div class="card-media-audio-player-local" data-id="${audioMediaId}">
                    <i class="card-media-audio-player-status-icon fa-solid fa-circle-play" data-id="${audioMediaId}"></i>
                    <div class="card-media-audio-timeline-loading progress">
                        <div class="indeterminate"></div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    else
    {
        mediaCard = `
        <div class="card card-media card-media-audio" data-message="${messageId}" data-id="${audioMediaId}">
            <div class="card-content">
                <img class="media-audio-source-loading" referrerPolicy="no-referrer" data-message="${messageId}" data-id="${audioMediaId}" src="/images/audio.png"/>
            </div>
        </div>
        `;            
    }

    return mediaCard;
}

async function updateImageCardLocalPreview()
{
    const elements = $(`.media-image-waiting-for-upload[data-filesrc]`);

    for(let ix = 0; ix < elements.length; ix++)
    {
        const el = $(elements.get(ix));
        const imageLocalURL = el.attr(`data-filesrc`);
        el.removeAttr(`data-filesrc`);
        let imageSource = await getDeviceFileBase64URL(imageLocalURL);
        el.attr(`src`, imageSource);
    }

}


function getHourAndMinute(dateToCheck)
{
    let hour = dateToCheck.getHours();
    let minute = dateToCheck.getMinutes();

    if(hour.toString().length == 1)
    {
        hour = `0${hour}`;
    }

    if(minute.toString().length == 1)
    {
        minute = `0${minute}`;
    }

    let result = hour + ":" + minute;
    return result;
}

function autoHeightTextArea(element)
{
    // element.style.height = "5px";
    // element.style.height = (element.scrollHeight) + "px";
    element.style.setProperty('height', "5px", 'important');
    element.style.setProperty('height', (element.scrollHeight) + "px", 'important');
}

function setChatInputFocus()
{
    if(skipChatInputFocus == true)
    {
        setTimeout(function(){
            Keyboard.hide();
        }, 20);
        return;
    }

    const chatScrollIsAtBottom = isScrollAtBottomOfChat();

    // Try to focus until timeout
    var focusTry = 0;
    const focusTimeoutTries = 20;
    var itvInputFocus = setInterval(function(){
        const hasFocus = $(`#chatMainInputText`).is(":focus");

        if(hasFocus == true)
        {
            clearInterval(itvInputFocus);
            focusTry = 0;

            if(typeof Keyboard != `undefined`)
            {
                if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
                {
                    Keyboard.show();
                }
            }

            // Scroll to bottom after apply focus (sometimes keyboard overlap the scrolled bottom)
            if(chatScrollIsAtBottom == true)
            {
                setTimeout(function(){
                    scrollChatToBottom(false, false);
                }, 50);
            }

            return;
        }

        if(focusTry >= focusTimeoutTries)
        {
            clearInterval(itvInputFocus);
            focusTry = 0;

            // Scroll to bottom after apply focus (sometimes keyboard overlaps the scrolled bottom)
            if(chatScrollIsAtBottom == true)
            {
                setTimeout(function(){
                    scrollChatToBottom(false, false);
                }, 50);
            }

            return;
        }

        focusTry++;

        $(`#chatMainInputText`).focus();

    }, 50);
}

function isScrollAtBottomOfChat()
{
    var elem = $("#chatBox");
    const bottomPxOffset = $(`.input-area`).outerHeight();
    const scrollPosition = elem[0].scrollHeight - elem.scrollTop();

    if (scrollPosition >= elem.outerHeight() - bottomPxOffset && scrollPosition <= elem.outerHeight() + bottomPxOffset)
    {
        return true;
    }

    return false;
}

async function setSendMessage(messageId, toId, messageToShow, isProtected)
{
    let protected = isProtected == true ? 1 : 0;

    const timestamp = new Date().getTime();

    const uid = readLocalStorage("uid");

    const messageTimeValue = getAdjustInternalTime(timestamp);

    const toGroupId = await getChatAppGroupById(toId, true);

    let toIsGroup = toGroupId == null ? 0 : 1;

    if(messageToShow == null)
    {
        messageToShow = "";
    }

    const sqlNewMessage = `INSERT INTO Messages (messageId, fromId, toId, content, protected, messageTime, media, mediaType, InReplyToMessageId, toIsGroup, statusSent, statusReceived, statusRead) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const sqlNewMessageValues = [
        messageId,
        uid,
        toId,
        messageToShow,
        protected,
        messageTimeValue,
        pendingMediaToSend != null ? pendingMediaToSend : null,
        pendingMediaTypeToSend != null ? pendingMediaTypeToSend : null,
        pendingReplyMessageId != null ? pendingReplyMessageId : null,
        toIsGroup,
        0,
        0,
        0
    ];
    await dbRun(sqlNewMessage, sqlNewMessageValues);

    clearPendingMediaToSend();
    clearPendingReplyMessageId();
}

function startChatMessageStatusService()
{
    if(itvChatMessageStatusService != null)
    {
        stopChatMessageStatusService();
    }

    itvChatMessageStatusService = setInterval(async function(){
        if(talkToId == null)
        {
            return;
        }

        if(processingChatMessageStatus == true)
        {
            return;
        }

        processingChatMessageStatus = true;

        let unProcessedMessages = $(`.chat-message-block[data-statusprocessed="0"]`);
        for(let ix = 0; ix < unProcessedMessages.length; ix++)
        {
            const element = $(unProcessedMessages[ix]);
            const messageId = element.attr(`data-id`);

            const sqlMessage = `SELECT statusSent, statusReceived, statusRead FROM Messages WHERE messageId = ?`;
            const sqlMessageValues = [messageId];
            const sqlMessageResponse = await dbRun(sqlMessage, sqlMessageValues);

            if(sqlMessageResponse == null)
            {
                continue;
            }

            if(sqlMessageResponse.rows.length == 0)
            {
                continue;
            }

            const messageRecord = sqlMessageResponse.rows.item(0);

            // Update status values
            element.attr(`data-statussent`, messageRecord.statusSent);
            element.attr(`data-statusreceived`, messageRecord.statusReceived);
            element.attr(`data-statusread`, messageRecord.statusRead);

            // Mark as processed when message was read
            if(messageRecord.statusRead == "1")
            {
                // Wait 1 sec to set to processed to finish internal process
                element.attr(`data-statusprocessed`, "1");
            }

            // Set visual check marks
            if(messageRecord.statusSent == "1")
            {
                element.find(`.message-status-mark-sent`).removeClass(`hide`);
            }
            else
            {
                element.find(`.message-status-mark-sent`).addClass(`hide`);
            }

            if(messageRecord.statusReceived == "1")
            {
                element.find(`.message-status-mark-received`).removeClass(`hide`);
            }
            else
            {
                element.find(`.message-status-mark-received`).addClass(`hide`);
            }

            if(messageRecord.statusRead == "1")
            {
                element.find(`.message-status-mark`).addClass(`message-status-mark-read`)
                element.find(`.message-status-mark-received`).removeClass(`hide`); // Read message is automatically received message
            }
            else
            {
                element.find(`.message-status-mark`).removeClass(`message-status-mark-read`)
            }

        }
      
        processingChatMessageStatus = false;

    }, 1000);
}

function stopChatMessageStatusService()
{
    if(itvChatMessageStatusService != null)
    {
        clearInterval(itvChatMessageStatusService);
        itvChatMessageStatusService = null;
    }
}

function startLoadMessageImageService()
{
    if(itvLoadMessageImageService != null)
    {
        clearInterval(itvLoadMessageImageService);
        itvLoadMessageImageService = null;
    }

    itvLoadMessageImageService = setInterval(function(){
        loadMessageImageService();
    }, LOADMESSAGEIMAGESERVICE_MS_TIME);
}

function stopLoadMessageImageService()
{
    if(itvLoadMessageImageService != null)
    {
        clearInterval(itvLoadMessageImageService);
        itvLoadMessageImageService = null;
    }
}



function startLoadMessageAudioService()
{
    if(itvLoadMessageAudioService != null)
    {
        clearInterval(itvLoadMessageAudioService);
        itvLoadMessageAudioService = null;
    }

    itvLoadMessageAudioService = setInterval(function(){
        loadMessageAudioService();
    }, LOADMESSAGEAUDIOSERVICE_MS_TIME);
}

function stopLoadMessageAudioService()
{
    if(itvLoadMessageAudioService != null)
    {
        clearInterval(itvLoadMessageAudioService);
        itvLoadMessageAudioService = null;
    }
}


function startLoadMessageLoanService()
{
    // It isn't used in this product
}

function stopLoadMessageLoanService()
{
    // It isn't used in this product
}

async function getLastMessageWithContact(contactId, isGroup)
{
    const toIsGroup = isGroup == true ? 1 : 0;

    const query = `SELECT 
        content,
        protected,
        messageTime,
        media,
        mediaType
    FROM Messages 
    WHERE 
        (fromId = ? OR 
        toId = ? ) AND
        toIsGroup = ?
    ORDER BY messageTime DESC
    LIMIT 1`;

    const queryValues = [contactId, contactId, toIsGroup];
    const result = await dbRun(query, queryValues);

    const record = result.rows.length > 0 ? result.rows.item(0) : null;

    return record;
}

function clearChatBox()
{
    $(`#chatBox`).empty();
    chatRoomOldestLoadedMessage = null;
    chatRoomOldestLoadedMessageId = null;
    chatRoomLoadedMessageIdList = [];
}

async function initChatBoxWithCache()
{
    if(talkToId == null)
    {
        return;
    }

    const chatRoomCache = await getChatRoomCache();


    if(chatRoomCache == null)
    {
        return;
    }

    if(chatRoomCache.trim().length == 0)
    {
        return;
    }

    $(`#chatBox`).html(chatRoomCache);

    await reviewChatRoomAfterCacheRead();

    disableScrollHistoryCheck = true;
    const scrollend = $('#chatBox').prop("scrollHeight");
    $("#chatBox").scrollTop(scrollend);
    disableScrollHistoryCheck = false;

}

async function loadChatRoomMessageHistory(startingInMessageId)
{
    if(pagedChatHistoryIsLoading == true)
    {
        return;
    }

    let uid = readLocalStorage("uid");

    pagedChatHistoryIsLoading = true;

    let result;

    const queryBase = `
        SELECT 
            id,
            messageId,
            fromId,
            toId,
            content,
            protected,
            messageTime,
            media,
            mediaType,
            InReplyToMessageId,
            toIsGroup,
            statusSent,
            statusReceived,
            statusRead
        FROM Messages 
        WHERE 
            ${talkToAGroup == false ? `(fromId = ? OR toId = ?) AND toIsGroup = 0 AND `: `toId = ? AND toIsGroup = 1 AND `} 
            ${chatRoomOldestLoadedMessage != null ? ` id < ${chatRoomOldestLoadedMessage} ` : ` 1=1 `}
    `;

    if(startingInMessageId == null)
    {
        const query = `${queryBase}
            ORDER BY messageTime DESC
            LIMIT ?
        `;

        const queryValues = talkToAGroup == false ? [talkToId, talkToId, CHAT_HISTORY_PAGED_LOAD_LIMIT] : [talkToId, CHAT_HISTORY_PAGED_LOAD_LIMIT];
        result = await dbRun(query, queryValues);
    }
    else
    {
        const query = `${queryBase}
            AND
            messageTime >= (SELECT messageTime FROM Messages WHERE messageId = ?)
            ORDER BY messageTime DESC
        `;

        const queryValues = talkToAGroup == false ? [talkToId, talkToId, startingInMessageId] : [talkToId, startingInMessageId];
        result = await dbRun(query, queryValues);
    }

    if(result == null)
    {
        pagedChatHistoryIsLoading = false;
        return;
    }

    // for(let ix = 0; ix < result.rows.length; ix++)
    for(let ix = result.rows.length -1; ix >= 0; ix--)
    {
        const record = result.rows.item(ix);
        const msgDate = new Date(record.messageTime);
        const protected = record.protected;
        const media = record.media != null ? record.media : "";
        const mediaType = record.mediaType != null ? record.mediaType : "";
        const messageId = record.messageId != null ? record.messageId : "";
        const fromId = record.messageId != null ? record.fromId : "";
        const toId = record.messageId != null ? record.toId : "";
        const inReplyToMessageId = record.InReplyToMessageId != null ? record.InReplyToMessageId : "";
        const toIsGroup = record.toIsGroup != null ? record.toIsGroup : "0";
        const statusSent = record.statusSent != null ? record.statusSent : "0";
        const statusReceived = record.statusReceived != null ? record.statusReceived : "0";
        const statusRead = record.statusRead != null ? record.statusRead : "0";

        let loadedIndex = chatRoomLoadedMessageIdList.findIndex((item) =>{
            return item == messageId;
        });
    
        if(loadedIndex == -1)
        {
            chatRoomLoadedMessageIdList.push(messageId);
        }


        let alreadyAdded = false;
        if($(`.chat-message-block[data-id="${messageId}"]`).length > 0)
        {
            alreadyAdded = true;
        }

        if(alreadyAdded == true)
        {
            if(statusRead == 0)
            {
                markChatMessageToRead(messageId);
            }

            continue;
        }

        if(ix == result.rows.length -1)
        {
            chatRoomHistoryBaseMessageId = messageId;
        }

        const isReceiveMessageType = toIsGroup == 0 ? (fromId == talkToId) : (fromId != uid);
        
        if(isReceiveMessageType == true)
        {
            const chatText = protected == 0 ? record.content : CHAT_PROTECTED_TEXT;

            if(media.length == 0 || mediaType.length == 0)
            {
                appendReceiveMessage(messageId, chatText, msgDate, inReplyToMessageId, chatRoomOldestLoadedMessageId);
            }
            else
            {
                appendReceiveMessageWithMedia(messageId, chatText, mediaType, media, msgDate, inReplyToMessageId, chatRoomOldestLoadedMessageId);
            }

            if(statusRead == 0)
            {
                markChatMessageToRead(messageId);
            }
        }
        else
        {
            const chatText = protected == 0 ? record.content : CHAT_PROTECTED_TEXT;

            if(media.length == 0 || mediaType.length == 0)
            {
                appendSendMessage(messageId, chatText, msgDate, statusSent, statusReceived, statusRead, inReplyToMessageId, chatRoomOldestLoadedMessageId);
            }
            else
            {
                appendSendMessageWithMedia(messageId, chatText, mediaType, media, msgDate, statusSent, statusReceived, statusRead, inReplyToMessageId, chatRoomOldestLoadedMessageId);
            }
        }

        // const allAddedMessage = $(`#chatBox`).find(`.message`);
        // const lastAddedMessage = allAddedMessage.length > 0 ? allAddedMessage[allAddedMessage.length - 1] : null;
        const lastAddedMessage = $(`.chat-message-block[data-id="${messageId}"]`);
        if(lastAddedMessage != null)
        {
            $(lastAddedMessage).attr("data-messageid", messageId);
            $(lastAddedMessage).attr("data-fromid", fromId);
            $(lastAddedMessage).attr("data-toid", toId);
            $(lastAddedMessage).attr("data-statusread", statusRead);
        }
    }

    // Scroll to bottom when is first load
    if(chatRoomOldestLoadedMessage == null)
    {
        // Fast scroll down
        disableScrollHistoryCheck = true;
        const scrollend = $('#chatBox').prop("scrollHeight");
        $("#chatBox").scrollTop(scrollend);
        disableScrollHistoryCheck = false;

        setTimeout(function(){
            // After 100 miliseconds anchor to scroll down (some device internal loading)
            scrollChatToBottom(true, true);
        }, 100);
    }


    // Update oldest loaded message
    let lastRecord = null;
    if(result.rows.length > 0)
    {
        lastRecord = result.rows.item(result.rows.length -1);
        chatRoomOldestLoadedMessage = lastRecord.id;
        chatRoomOldestLoadedMessageId = lastRecord.messageId;
    }

    pagedChatHistoryIsLoading = false;

    toogleSuppressedUnsuppressedEvent();
    messageBlockEvents();
    processReplyCards();
    refreshTalkGroupMembersView();

    postChatRoomMessageHistoryLoad();
}

async function postChatRoomMessageHistoryLoad()
{
    await waitNoMediaLoading();
    await updateChatRoomCache();
}

function waitNoMediaLoading()
{
    return new Promise((resolve, reject) =>{
        var hasImageLoading = loadMessageImageServiceRunning;
        var hasAudioLoading = loadMessageAudioServiceRunning;
    
        if(hasImageLoading == false && hasAudioLoading == false)
        {
            // Give 3 second of time to finish any loading
            setTimeout(function(){
                resolve();
            }, 3000)
            return;
        }

        var itvMediaLoading = setInterval(function(){
            hasImageLoading = loadMessageImageServiceRunning;
            hasAudioLoading = loadMessageAudioServiceRunning;
        
            if(hasImageLoading == false && hasAudioLoading == false)
            {
                clearInterval(itvMediaLoading);
                itvMediaLoading = null;

                // Give 3 second of time to finish any loading
                setTimeout(function(){
                    resolve();
                }, 3000)
            }    
        }, 1000);
    });

}

async function loadMessageImageService()
{
    if(loadMessageImageServiceRunning == true)
    {
        return;
    }

    loadMessageImageServiceRunning = true;

    let elementsToLoad = $(`.media-image-source-loading`).toArray().reverse();
    for(let ix = 0; ix < elementsToLoad.length; ix++)
    {
        const element = $(elementsToLoad[ix]);

        const imageAddress = element.attr("data-id");

        const cardElement = $(`.card-media[data-id="${imageAddress}"]`);

        if(cardElement.hasClass(`card-media-in-view-port`) == false)
        {
            continue;
        }

        // let mediaResponse = null;

        // const localDBMedia = await getMediaCacheFromDB(imageAddress);

        // if(localDBMedia != null)
        // {
        //     mediaResponse = {
        //         "thumbnail": localDBMedia.mediaThumbnailURL,
        //         "webview": localDBMedia.mediaViewURL
        //     }
        // }
        // else
        // {
        //     const requestData = {
        //         "mediaaddress": imageAddress
        //     }
        //     mediaResponse = await callS(true, `POST`, `/services/readfileview`, requestData);
        // }


        // if(mediaResponse == null)
        // {
        //     continue;
        // }


        // if(localDBMedia == null)
        // {
        //     await setMediaCacheToDB(imageAddress, 
        //         mediaResponse.thumbnail, 
        //         mediaResponse.webview, 
        //         mediaResponse.permanentthumbnail, 
        //         mediaResponse.permanentwebview, 
        //         mediaResponse.directview
        //     );
        // }
        
        const thumbURL = `${endpoint}fs/imagethumbraw/${imageAddress}`;
        const viewURL = `${endpoint}fs/imageraw/${imageAddress}`;

        const localDownloadThumbFileInfo = await getLocalSavedThumbImage(imageAddress);
        const localDownloadedThumbFilePath = localDownloadThumbFileInfo.filePath;
        const localThumbFileName = localDownloadThumbFileInfo.fileName;

        let thumbDownloaded = false;
        if(localDownloadThumbFileInfo.found == true)
        {
            console.log(`Local thumb file already downloaded`);
            thumbDownloaded = true;
        }
        else
        {
            let serverConnectionState = await hasServerConnection();

            if(serverConnectionState == true)
            {
                console.log(`Downloading local thumb file`);

                if(imageAddress.indexOf(`filesystem:`) == -1)
                {
                    await downloadFileFromServer(`${endpoint}fs/thumbimagedownload/${imageAddress}`, imagesLocalFolderLocation, localThumbFileName, null);
                    thumbDownloaded = true;
                }
                else
                {
                    console.log(`Invalid use of filesystem as image address for thumbnail`);
                }
            }
            else
            {
                console.log(`Unable to download thumb file - offline`);
            }
        }

        let thumbImageSource = `images/blurry.jpg`;
        if(thumbDownloaded == true)
        {
            // thumbImageSource = await getDeviceFileBase64URLOrLocalURL(localDownloadedThumbFilePath);
            thumbImageSource = await getDeviceFileBase64URL(localDownloadedThumbFilePath);

            if(thumbImageSource == null)
            {
                // Try to download again if thumb is null, if is not ok, use the local path (maybe a 404 image)
                if(imageAddress.indexOf(`filesystem:`) == -1)
                {
                    await downloadFileFromServer(`${endpoint}fs/thumbimagedownload/${imageAddress}`, imagesLocalFolderLocation, localThumbFileName, null);
                    thumbImageSource = await getDeviceFileBase64URLOrLocalURL(localDownloadedThumbFilePath);    
                }
                else
                {
                    console.log(`Invalid use of filesystem as image address for image source`);
                }
            }
        }


        element.removeClass("media-image-source-loading");
        element.addClass("media-image-source");
        element.attr("onerror", `this.src='images/f-404.png'; tryDownloadThumbForAddress('${imageAddress}');`);
        element.attr("src", thumbImageSource);
        element.attr("data-view", viewURL);
        element.attr("data-thumb", thumbURL);
        element.attr("data-imageaddress", imageAddress);

        $(`.card-media-image[data-id="${imageAddress}"]`).attr("data-view", viewURL);

        if(lastScrollMessage != null)
        {
            const lastScrollMessageTop = getChatMessageTopPosition(lastScrollMessage);
            $("#chatBox").scrollTop(lastScrollMessageTop);

            setTimeout(function(){
                checkMessageMediaViewport();
            }, 1000);
        }
    }

    $(`.card-media-image`).off(`click`);
    $(`.card-media-image`).on(`click`, async function(){

        if($(this).hasClass(`card-image-waiting-for-upload`) == true)
        {
            return;
        }

        swal("...", {
            button: false, closeOnClickOutside: false
        });

        const mediaPreloaderHTML = `
        <div class="progress">
            <div class="indeterminate"></div>
        </div>
        `;

        setTimeout(function(){
            // $(`.swal-text`).html(`<img src="/images/chat-loading.gif" style="height: 48px; width: auto;" />`);

            $(`.swal-text`).html(mediaPreloaderHTML);

        }, 300);

        // const viewLink = $(this).attr("data-view");
        // openInAppBrowser(viewLink, true);

        const imageId = $(this).attr("data-id");
        const localDownloadFileInfo = await getLocalSavedImage(imageId);
        const localDownloadedFilePath = localDownloadFileInfo.filePath;
        const fileName = localDownloadFileInfo.fileName;

        let downloaded = false;

        if(localDownloadFileInfo.found == true)
        {
            console.log(`Local file already downloaded`);
            downloaded = true;
        }
        else
        {
            let serverConnectionState = await hasServerConnection();

            if(serverConnectionState == true)
            {
                console.log(`Downloading local file`);
                await downloadFileFromServer(`${endpoint}fs/imagedownload/${imageId}`, imagesLocalFolderLocation, fileName, null);
                downloaded = true;        
            }
            else
            {
                console.log(`Unable to download file - offline`);
            }
        }

        if(downloaded == false)
        {
            swal.close();
            swal(getTranslate("unable-to-download-file", "Unable to download file"));
            return;
        }

        const imageSource = await getDeviceFileBase64URL(localDownloadedFilePath);

        swal.close();

        swal("...", {
            button: false
        });

        // Image width is screen width less 20%
        const imageWidth = window.screen.width - (window.screen.width * 0.2);

        const previewHTML = `
            <div class="media-image-preview-area">
                <a id="btnCloseMediaImagePreview" class="close-buton-media-float-right waves-effect waves-light btn-flat">
                    <i class="fa-solid fa-xmark left"></i>
                </a>
                <img src="${imageSource}" class="media-image-preview" data-id="${imageId}" onerror="tryDownloadImageForAddress('${imageId}');" style="height: auto; width: ${imageWidth}px; max-width: 420px;" />
            </div>
        `;

        setTimeout(function(){
            $(`.swal-text`).html(previewHTML);

            $(`#btnCloseMediaImagePreview`).off(`click`);
            $(`#btnCloseMediaImagePreview`).on(`click`, function(){
                swal.close();
            });
        }, 300);

    });

    loadMessageImageServiceRunning = false;
}

async function loadMessageAudioService()
{
    if(loadMessageAudioServiceRunning == true)
    {
        return;
    }

    loadMessageAudioServiceRunning = true;

    let elementsToLoad = $(`.media-audio-source-loading`).toArray().reverse();
    for(let ix = 0; ix < elementsToLoad.length; ix++)
    {
        const element = $(elementsToLoad[ix]);

        const audioAddress = element.attr("data-id");

        const cardElement = $(`.card-media[data-id="${audioAddress}"]`);

        if(cardElement.hasClass(`card-media-in-view-port`) == false)
        {
            continue;
        }

        
        const localDownloadAudioFileInfo = await getLocalSavedAudio(audioAddress);
        const localDownloadedAudioFilePath = localDownloadAudioFileInfo.filePath;
        const localAudioFileName = localDownloadAudioFileInfo.fileName;

        let localAudioInfo = await getLocalAudioInfo(audioAddress);

        let audioDownloaded = false;
        if(localDownloadAudioFileInfo.found == true && localAudioInfo.found == true)
        {
            console.log(`Local audio file already downloaded`);
            audioDownloaded = true;
        }
        else
        {
            let serverConnectionState = await hasServerConnection();

            if(serverConnectionState == true)
            {
                console.log(`Downloading local audio file`);
                await downloadFileFromServer(`${endpoint}fs/audiodownload/${audioAddress}`, audioLocalFolderLocation, localAudioFileName, null);

                const audioInfo = await callS(false, "GET", `/fs/audioinfo/${audioAddress}`, null);
                if(audioInfo != null)
                {
                    await updateLocalAudioInfo(audioAddress, audioInfo);
                    localAudioInfo = await getLocalAudioInfo(audioAddress);
                    // localDownloadAudioFileInfo = await getLocalSavedAudio(audioAddress);
                }

                audioDownloaded = true;
            }
            else
            {
                console.log(`Unable to download audio file - offline`);
            }
        }

        element.removeClass("media-audio-source-loading");
        element.addClass("media-audio-source");

        // const wavesContainerId = `chatCardMediaAudioPlayerWaves_${audioAddress}`;

        if(audioDownloaded == false)
        {
            element.attr("src", `images/audio-disabled.jpg`);
        }
        else
        {
            element.attr("src", "");
            element.addClass(`hide`);

            let showTranscriptionLimitSecondsWarning = false;
            let transcriptionLimitSecondsWarningMessage = ``;
            const transcriptionMaxDurationInMiliSec = getWhisperTranscriptMaxDuration();
            const transcriptionMaxDuration = parseInt(transcriptionMaxDurationInMiliSec/1000);

            const audioTimeInSec = parseInt(localAudioInfo.lengthInSeconds);

            if(audioTimeInSec > transcriptionMaxDuration)
            {
                showTranscriptionLimitSecondsWarning = true;
                transcriptionLimitSecondsWarningMessage = getTranslate(`text-transcription-limited-seconds-warning`, `Text transcription limited to {XX} seconds`);
                transcriptionLimitSecondsWarningMessage = replaceAll(transcriptionLimitSecondsWarningMessage, `{XX}`, transcriptionMaxDuration.toString());
            }

            // Draw audio player into card
            const audioPlayerHTML = `
            <div class="card-media-audio-player" data-id="${audioAddress}">
                <i class="card-media-audio-player-status-icon fa-solid fa-circle-play" data-id="${audioAddress}"></i>
                <div class="card-media-audio-timeline">
                    <input class="card-media-audio-timeline-input" type="range" value="0" min="0" step="0.01" max="${audioTimeInSec}" data-id="${audioAddress}" />
                </div>
                <div class="card-media-audio-player-timers">
                    <div class="card-media-audio-player-time-position" data-id="${audioAddress}" data-maxposition="${localAudioInfo.lengthInSeconds}"></div>
                    <div class="card-media-audio-player-time-length">${toMMSS(localAudioInfo.lengthInSeconds)}</div>
                </div>
            </div>
            `;
            $(`.card-media-audio[data-id="${audioAddress}"]`).find(".card-content").html(audioPlayerHTML);

            if(showTranscriptionLimitSecondsWarning == true)
            {
                const messageIdToSet = $(`.card-media-audio[data-id="${audioAddress}"]`).attr(`data-message`);

                const transcriptionLimitSecondsWarningElement = `
                <div class="message-transcription-limit-seconds-warning">
                    ${transcriptionLimitSecondsWarningMessage}
                </div>
                `;

                $(`.chat-message-block[data-id="${messageIdToSet}"]`).find(`.message-text`).after(transcriptionLimitSecondsWarningElement);
            }
        }


        if(lastScrollMessage != null)
        {
            const lastScrollMessageTop = getChatMessageTopPosition(lastScrollMessage);
            $("#chatBox").scrollTop(lastScrollMessageTop);

            setTimeout(function(){
                checkMessageMediaViewport();
            }, 1000);
        }
    }

    $(`.card-media-audio`).off(`click`);
    $(`.card-media-audio`).on(`click`, async function(){

        if($(this).hasClass(`card-audio-waiting-for-upload`) == true)
        {
            return;
        }

        // const viewLink = $(this).attr("data-view");
        // openInAppBrowser(viewLink, true);

        const audioId = $(this).attr("data-id");

        // if(record == null)
        // {
        //     return;
        // }

        // record.component.play();

        playAudioCard(audioId, 0);
    });

    $(`.card-media-audio-timeline-input`).off(`change`);
    $(`.card-media-audio-timeline-input`).on(`change`, function(){
        const audioId = $(this).attr(`data-id`);
        const playTime = $(this).val();
        playAudioCard(audioId, playTime);
    });

    loadMessageAudioServiceRunning = false;
}

async function tryDownloadThumbForAddress(imageAddress)
{
    console.log(`⛑️ Trying to download thumbnail for image address ${imageAddress}`);

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        console.log(`Unable to download thumb file - offline`);
        return;
    }

    const localDownloadThumbFileInfo = await getLocalSavedThumbImage(imageAddress);
    const localDownloadedThumbFilePath = localDownloadThumbFileInfo.filePath;
    const localThumbFileName = localDownloadThumbFileInfo.fileName;

    if(localDownloadThumbFileInfo.found == true)
    {
        console.log(`Local thumb file already downloaded - removing...`);
        await deleteLocalFile(localDownloadedThumbFilePath);
    }

    // Try to download again if thumb is null, if is not ok, use the local path (maybe a 404 image)
    await downloadFileFromServer(`${endpoint}fs/thumbimagedownload/${imageAddress}`, imagesLocalFolderLocation, localThumbFileName, null);
    let thumbImageSource = await getDeviceFileBase64URLOrLocalURL(localDownloadedThumbFilePath);

    console.log(`Local thumb file downloaded`);

    if($(`.media-image-source[data-imageaddress="${imageAddress}"]`).hasClass(`media-image-source-from-cache`) == false)
    {
        $(`.media-image-source[data-imageaddress="${imageAddress}"]`).attr("onerror", `this.src='images/f-404.png';`);
        $(`.media-image-source[data-imageaddress="${imageAddress}"]`).attr("src", thumbImageSource);
    }

}

async function tryDownloadImageForAddress(imageId)
{
    console.log(`⛑️ Trying to download for image address ${imageId}`);

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        console.log(`Unable to download thumb file - offline`);
        return;
    }

    const localDownloadFileInfo = await getLocalSavedImage(imageId);
    const localDownloadedFilePath = localDownloadFileInfo.filePath;
    const fileName = localDownloadFileInfo.fileName;

    if(localDownloadFileInfo.found == true)
    {
        console.log(`Local file already downloaded - removing...`);
        await deleteLocalFile(localDownloadedFilePath);
    }

    // Try to download again if thumb is null, if is not ok, use the local path (maybe a 404 image)
    await downloadFileFromServer(`${endpoint}fs/imagedownload/${imageId}`, imagesLocalFolderLocation, fileName, null);
    const imageSource = await getDeviceFileBase64URL(localDownloadedFilePath);

    console.log(`Local file downloaded`);

    $(`.media-image-preview[data-id="${imageId}"]`).attr("onerror", `this.src='images/f-404.png';`);
    $(`.media-image-preview[data-id="${imageId}"]`).attr("src", imageSource);
}

async function showPendingMediaToSend()
{
    if(pendingMediaToSend == null || pendingMediaTypeToSend == null)
    {
        $(`#pendingMediaToSendArea`).empty();
        checkSendActionButton();
        return;
    }

    let htmlCard = ``;

    if(pendingMediaTypeToSend == MEDIA_TYPE_LOAN)
    {
        // It isn't used in this product
    }
    else if(pendingMediaTypeToSend == MEDIA_TYPE_IMAGE)
    {
        const imageAddress = pendingMediaToSend;
        const fileName = imageAddress.replace(/^.*[\\/]/, '').split('?')[0];

        let imageSource = imageAddress;
        if(imageSource.toLowerCase().trim().startsWith("file://") == true || imageSource.toLowerCase().trim().startsWith("filesystem:") == true)
        {
            if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
            {
                const fileName = getFileNameFromPath(imageSource);
                imageSource = `${imagesLocalFolderLocation}${fileName}`;
            }

            imageSource = await getDeviceFileBase64URL(imageSource);
        }



        const imageTitle = `<div class="image-share-title">${fileName}</div>`;

        htmlCard = `
            <div class="card pending-media-to-send-card">
                <div class="card-content">
                    <div class="row">
                        <div class="col s12 center">
                            <img class="image-share-view" src="${imageSource}" />
                            ${imageTitle}
                        </div>
                    </div>
                    <a id="btnCancelPendingMedia" href="#!" class="waves-effect waves-green btn-flat btn-cancel-pending-media">
                        <i class="fa-solid fa-xmark left"></i>
                    </a>

                </div>
            </div>
        `;
    }

    $(`#pendingMediaToSendArea`).html(htmlCard);

    $(`#btnCancelPendingMedia`).off(`click`);
    $(`#btnCancelPendingMedia`).on(`click`, function(){
        clearPendingMediaToSend();
    });

    checkSendActionButton();
}

async function showPendingReplyMessage(preloadedMessageRecord, setInputFocusAfterLoad)
{
    if(pendingReplyMessageId == null)
    {
        $(`#pendingReplyMessageArea`).empty();
        checkSendActionButton();
        return;
    }
    
    let htmlCard = ``;

    let messageRecord = null;

    if(preloadedMessageRecord == null)
    {
        const sqlMessage = `SELECT messageId, fromId, toId, content FROM Messages WHERE messageId = ?`;
        const sqlMessageValues = [pendingReplyMessageId];
        const sqlMessageResponse = await dbRun(sqlMessage, sqlMessageValues);

        if(sqlMessageResponse == null)
        {
            $(`#pendingReplyMessageArea`).empty();
            checkSendActionButton();

            return;
        }

        if(sqlMessageResponse.rows.length == 0)
        {
            $(`#pendingReplyMessageArea`).empty();
            checkSendActionButton();

            return;
        }

        messageRecord = sqlMessageResponse.rows.item(0);
    }
    else
    {
        messageRecord = preloadedMessageRecord;
    }

    let uid = readLocalStorage("uid");

    let messageAuthorName = ``;

    if(messageRecord.fromId.trim() == uid)
    {
        messageAuthorName = getTranslate(`you`, `You`);
    }
    else
    {
        const linkedRecord = linkedContactList.find((item) =>{
            return item.Contact == messageRecord.fromId
        });
   
        if(linkedRecord != null)
        {
            messageAuthorName = linkedRecord.Name;
        }
    
        if(messageAuthorName.trim().length == 0)
        {
            const contactInfo = await getContactInfo(messageRecord.fromId, null);
            messageAuthorName = contactInfo.name;    
        }
    }

    if(messageAuthorName.trim().length == 0)
    {
        let phoneDetails = getPhoneFormatsByNumber(messageRecord.fromId, null);
        messageAuthorName = phoneDetails.full;
    }

    let messageContent = messageRecord.content;
    const MAX_REPLY_LENGTH = 150;

    if(messageContent.length > MAX_REPLY_LENGTH)
    {
        messageContent = messageContent.substring(0, MAX_REPLY_LENGTH);
    }

    htmlCard = `
        <div class="card no-margin">
            <div class="card-content">
                <div class="row no-margin">
                    <div class="col s8">
                        <div class="chat-reply-message-author">
                            ${messageAuthorName}
                        </div>
                    </div>
                    <div class="col s4">
                        <div class="right-align">
                            <a id="btnCancelPendingReplyMessage" href="#!" class="waves-effect waves-green btn-flat">
                                <i class="fa-solid fa-xmark left"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="chat-reply-message-content">
                    ${messageContent}
                </div>
            </div>
        </div>
    `;


    $(`#pendingReplyMessageArea`).html(htmlCard);

    $(`#btnCancelPendingReplyMessage`).off(`click`);
    $(`#btnCancelPendingReplyMessage`).on(`click`, function(){
        clearPendingReplyMessageId();
    });

    checkSendActionButton();

    if(setInputFocusAfterLoad == true)
    {
        setChatInputFocus();
    }
}

function clearPendingMediaToSend()
{
    pendingMediaToSend = null;
    pendingMediaTypeToSend = null;
    $(`#pendingMediaToSendArea`).empty();
    checkSendActionButton();
}

function clearPendingReplyMessageId()
{
    pendingReplyMessageId = null;
    $(`#pendingReplyMessageArea`).empty();
    checkSendActionButton();
}

async function getLocalSavedImage(imageId)
{
    const fileName = `${imageId}.png`;
    var localDownloadedFilePath = `${imagesLocalFolderLocation}${fileName}`;
    var localFileForDetails = localDownloadedFilePath;
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        localFileForDetails = await getFileURI(fileName);
    }

    const localFileDetails = await localFileURLPathResolve(localFileForDetails);

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

async function getLocalSavedThumbImage(imageId)
{
    const fileName = `thumb-${imageId}.png`;
    const localDownloadedFilePath = `${imagesLocalFolderLocation}${fileName}`;
    var localFileForDetails = localDownloadedFilePath;
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        localFileForDetails = await getFileURI(fileName);
    }

    const localFileDetails = await localFileURLPathResolve(localFileForDetails);

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

function chatMicrophoneModeOn()
{
    $(`#chatMicrophoneButton`).addClass(`chat-microphone-pressed-button`);
    $(`#chatMainInputAudio`).removeClass(`hide`);
    $(`#chatMainInputText`).addClass(`hide`);
    startChatSoundRecording();
    startMicrophoneButtonSlideService();
}

function chatMicrophoneModeOff()
{
    $(`#chatMicrophoneButton`).removeClass(`chat-microphone-pressed-button`);
    $(`#chatMainInputAudio`).addClass(`hide`);
    $(`#chatMainInputText`).removeClass(`hide`);
    resetMicrophoneSwipeUnlocked();
    stopChatSoundRecording();
    stoptMicrophoneButtonSlideService();
}

async function getLocalSavedAudio(audioId)
{
    const fileName = `audio-${audioId}.mp3`;
    var localDownloadedFilePath = `${imagesLocalFolderLocation}${fileName}`;
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        localDownloadedFilePath = await getFileURI(fileName);
    }

    const localFileDetails = await localFileURLPathResolve(localDownloadedFilePath);

    let result = {
        "fileName": fileName,
        "filePath": localDownloadedFilePath,
        "internalURL": localFileDetails.fileEntry != null ? localFileDetails.fileEntry.toInternalURL() : null,
        "fullPath": localFileDetails.fileEntry != null ? localFileDetails.fileEntry.fullPath : null,
        "found": false
    }

    if(localFileDetails.status == true)
    {
        result.found = true;
    }

    return result;
}

async function getLocalAudioInfo(audioId)
{
    const sqlAudioInfo = `SELECT lengthInSeconds FROM AudioInfo WHERE fileId = ?`;
    const sqlAudioInfoValues = [audioId];
    const sqlAudioInfoResponse = await dbRun(sqlAudioInfo, sqlAudioInfoValues);

    let result = {
        "found": false,
        "lengthInSeconds": null
    }

    if(sqlAudioInfoResponse == null)
    {
        return result;
    }

    if(sqlAudioInfoResponse.rows.length == 0)
    {
        return result;
    }

    const audioInfoRecord = sqlAudioInfoResponse.rows.item(0);

    result.found = true;
    result.lengthInSeconds = audioInfoRecord.lengthInSeconds;

    return result;
}

async function updateLocalAudioInfo(audioId, serverRecord)
{
    const existingRecord = await getLocalAudioInfo(audioId);

    if(existingRecord.found == false)
    {
        const sqlNewRecord = `INSERT INTO AudioInfo(fileId, lengthInSeconds) VALUES(?, ?)`;
        const sqlNewRecordValues = [audioId, serverRecord.timeLength];
        await dbRun(sqlNewRecord, sqlNewRecordValues);
    }
    else
    {
        const sqlUpdateRecord = `UPDATE AudioInfo SET lengthInSeconds = ? WHERE fileId = ?`;
        const sqlUpdateRecordValues = [serverRecord.timeLength, audioId];
        await dbRun(sqlUpdateRecord, sqlUpdateRecordValues);
    }
}

async function startChatSoundRecording() 
{
    if(chatMicrophoneAuthorizationUnderRequest == true)
    {
        return;
    }

    lastAudioRecordFileName = `audio-${makeid(10)}.wav`;
    lastAudioRecordFilePath = `${audioLocalFolderLocation}${lastAudioRecordFileName}`;

    // For iOS Media File must exists before creation
    if(cordova.platformId == 'ios')
    {
        let newFileEntry;

        try
        {
            newFileEntry = await createNewFileInDirectory(audioLocalFolderLocation, lastAudioRecordFileName);
        }
        catch(createMediaFileException)
        {
            console.log(`Error creating media file: ${createMediaFileException}`);
            return;
        }

        if(newFileEntry == null)
        {
            console.log(`Media File not created`);
            return;
        }

    }

    audioChatRecord = new Media(lastAudioRecordFilePath, 
        // success callback
        function() {
            console.log("recordAudio():Audio Success");
            if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
            {
                audioChatRecord.release();
            }

            chatAudioRecordFinish();
        },

        // error callback
        function(err) {
            console.log("recordAudio():Audio Error: "+ err.code);
        }
    );

    // Refresh authorized status check
    micAuthorized = await microphoneIsEnabled();

    if(micAuthorized == false)
    {
        chatMicrophoneModeOff();
        chatMicrophoneAuthorizationUnderRequest = true;
        await requestMicrophoneAuthorization();
        chatMicrophoneAuthorizationUnderRequest = false;
        return;
    }
    else
    {
        chatMicrophoneAuthorizationUnderRequest = false;
    }


    audioChatRecord.startRecord();
    isAudioChatRecording = true;
    audioChatSiriWave.start();
    audioRecordTimeStart = new Date();

    // audioChatTimeout = setTimeout(stopChatSoundRecording, 30000);

}

async function chatAudioRecordFinish()
{
    if(chatMicrophoneAuthorizationUnderRequest == true)
    {
        return;
    }

    // Send prepare
    // pendingMediaToSend = `${lastAudioRecordFilePath}|${audioRecordTotalTime}`;
    pendingMediaToSend = lastAudioRecordFilePath;
    pendingMediaTypeToSend = MEDIA_TYPE_AUDIO;

    // Send execute
    if(chatAudioRecordSendAfterFinish == true)
    {
        skipChatInputFocus = true;
        chatSendMessage();
    }


    lastAudioRecordFileName = null;
    lastAudioRecordFilePath = null;
}

function stopChatSoundRecording() 
{
    if (isAudioChatRecording)
    {
        if(audioChatTimeout != null)
        {
            clearTimeout(audioChatTimeout);
            audioChatTimeout = null;
        }

        audioRecordTimeEnd = new Date();

        audioRecordTotalTime = diffInSeconds(audioRecordTimeStart, audioRecordTimeEnd);
        
        isAudioChatRecording = false;
        audioChatRecord.stopRecord();
        audioChatSiriWave.stop();

        // Test
        // audioChatRecord.play();

        // var audioDuration = audioChatRecord.getDuration();
        // if(audioDuration > 0)
        // {
        //     pendingMediaToSend = lastAudioRecordFilePath;
        //     pendingMediaTypeToSend = MEDIA_TYPE_AUDIO;

        //     chatSendMessage();
        // }
    }
}

async function localAudioPlay(localFilePath)
{
    const localFileDetails = await localFileURLPathResolve(localFilePath);

    if(localFileDetails.status == false)
    {
        return;
    }

    if(localFileDetails.fileEntry == null)
    {
        return;
    }

    if(localAudioPlaying != null)
    {
        if(localAudioFilePath == localFilePath)
        {
            if(localAudioIsPlaying == true)
            {
                $(`.card-media-audio-player-status-icon[data-id="${localFilePath}"]`).attr(`class`, `card-media-audio-player-status-icon fa-solid fa-circle-play`);

                localAudioPlaying.pause();
                localAudioIsPlaying = false;
            }
            else
            {
                $(`.card-media-audio-player-status-icon[data-id="${localFilePath}"]`).attr(`class`, `card-media-audio-player-status-icon fa-solid fa-circle-pause`);

                localAudioPlaying.play();
                localAudioIsPlaying = true;
            }

            return;
        }
        else
        {
            audioPlayerStopAll();
        }

    }

    // const localFileURL = localFileDetails.fileEntry.toInternalURL();

    localAudioPlaying = new Media(localFilePath, () =>{
        // Play finished
        localAudioPlaying.stop();

        if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
        {
            localAudioPlaying.release();
        }

        localAudioPlaying = null;
        localAudioIsPlaying = false;
        localAudioFilePath = null;
    });

    $(`.card-media-audio-player-status-icon[data-id="${localFilePath}"]`).attr(`class`, `card-media-audio-player-status-icon fa-solid fa-circle-pause`);


    localAudioPlaying.play();
    localAudioIsPlaying = true;
    localAudioFilePath = localFilePath;
}

async function playAudioCard(audioId, fromTimeSec)
{
    if(fromTimeSec == null)
    {
        fromTimeSec = 0;
    }

    // If is playing this audio, stop it and return
    if(audioPlaying != null)
    {
        if(audioPlayingId == audioId)
        {
            if(audioIsPlaying == true)
            {
                $(`.card-media-audio-player-status-icon[data-id="${audioId}"]`).attr(`class`, `card-media-audio-player-status-icon fa-solid fa-circle-play`);
                audioPlaying.pause();
                audioIsPlaying = false;
            }
            else
            {
                $(`.card-media-audio-player-status-icon[data-id="${audioId}"]`).attr(`class`, `card-media-audio-player-status-icon fa-solid fa-circle-pause`);
                audioPlaying.play();

                if(fromTimeSec != 0)
                {
                    audioPlaying.seekTo(fromTimeSec * 1000);
                }

                audioIsPlaying = true;
            }

            return;
        }
        else
        {
            audioPlayerStopAll();
        }
    }       

    const localDownloadFileInfo = await getLocalSavedAudio(audioId);
    const localDownloadedFilePath = localDownloadFileInfo.filePath;
    const fileName = localDownloadFileInfo.fileName;

    let downloaded = false;

    if(localDownloadFileInfo.found == true)
    {
        console.log(`Local file already downloaded`);
        downloaded = true;
    }
    else
    {
        let serverConnectionState = await hasServerConnection();

        if(serverConnectionState == true)
        {
            console.log(`Downloading local file`);
            await downloadFileFromServer(`${endpoint}fs/audiodownload/${audioId}`, imagesLocalFolderLocation, fileName, null);
            downloaded = true;        
        }
        else
        {
            console.log(`Unable to download file - offline`);
        }
    }

    if(downloaded == false)
    {
        swal(getTranslate("unable-to-download-file", "Unable to download file"));
        return;
    }

    // const audioSource = await getDeviceFileBase64URL(localDownloadedFilePath);
    var audioSource = localDownloadedFilePath;

    // console.log(`🔉 Audio Native Local Transcription Test Start`);
    // const audioLang = getWhisperLanguage();
    // const audioTranscriptMaxDuration = getWhisperTranscriptMaxDuration();
    // const isMP3 = true;
    // const alliancesAudioProcessing = await window.internal.alliances.transcribeAudio(audioSource, audioLang, audioTranscriptMaxDuration, isMP3);
    // console.log(JSON.stringify(alliancesAudioProcessing));
    // console.log(`🔉 Audio Native Local Transcription Test End`);

    audioPlayingId = audioId;

    audioPlaying = new Media(audioSource, () =>{
        // Play finished

        // Auto stop
        audioPlayerStopAll();
    });

    $(`.card-media-audio-player-status-icon[data-id="${audioPlayingId}"]`).attr(`class`, `card-media-audio-player-status-icon fa-solid fa-circle-pause`);

    // console.log(`🔉 Audio Browser Local Transcription Test Start`);
    // const recognition = new webkitSpeechRecognition();
    // recognition.continuous = true;
    // recognition.interimResults = true;
    // recognition.onresult = function(event) {
    //   if (event.results[0].isFinal) {
    //     // do stuff with `event.results[0][0].transcript`
    //     console.log(event.results[0][0].transcript);
    //     recognition.stop();
    //   }
    // }
    // recognition.onaudiostart = e => {
    //     console.log("audio capture started");
    // }
    // recognition.onaudioend = e => {
    //     console.log("audio capture ended");
    // }
    // recognition.start();
    // console.log(`🔈 Audio Browser Local Transcription Test End`);

    audioIsPlaying = true;
    audioPlaying.play();


    if(fromTimeSec != 0)
    {
        audioPlaying.seekTo(fromTimeSec * 1000);
    }

    audioPlayingStatusService = setInterval(function(){
        if(audioPlaying == null)
        {
            clearInterval(audioPlayingStatusService);
            audioPlayingStatusService = null;
            return;
        }

        if(audioIsPlaying == false)
        {
            return;
        }

        audioPlaying.getCurrentPosition(function (position) {
                if (position > -1) 
                {
                    $(`.card-media-audio-player-time-position[data-id="${audioPlayingId}"]`).text(toMMSS(position));

                    $(`.card-media-audio-timeline-input[data-id="${audioPlayingId}"]`).val(parseFloat(position));

                    const maxPosition = parseInt($(`.card-media-audio-player-time-position[data-id="${audioPlayingId}"]`).attr(`data-maxposition`));

                    if(position > maxPosition)
                    {
                        // Auto stop
                        audioPlayerStopAll();
                    }
                }
                else
                {
                    // Auto stop
                    audioPlayerStopAll();
                }
            },
            function (e) {
                console.log("Error getting pos=" + e);
                clearInterval(audioPlayingStatusService);
                audioPlayingStatusService = null;
            }
        );
    }, 250);
}

function audioPlayerStopAll()
{
    if(audioPlayingId != null)
    {
        $(`.card-media-audio-player-status-icon[data-id="${audioPlayingId}"]`).attr(`class`, `card-media-audio-player-status-icon fa-solid fa-circle-play`);

        $(`.card-media-audio-timeline-input[data-id="${audioPlayingId}"]`).val(0);
    }

    if(audioPlayingStatusService != null)
    {
        clearInterval(audioPlayingStatusService);
        audioPlayingStatusService = null;    
    }

    if(audioPlayingId != null)
    {
        audioPlaying.stop();
        if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
        {
            audioPlaying.release();
        }

        audioPlaying = null;
    }

    audioIsPlaying = false;
    audioPlayingId = null;

    if(localAudioPlaying != null)
    {
        $(`.card-media-audio-player-status-icon[data-id="${localAudioFilePath}"]`).attr(`class`, `card-media-audio-player-status-icon fa-solid fa-circle-play`);

        localAudioPlaying.stop();
        if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
        {
            localAudioPlaying.release();
        }

        localAudioPlaying = null;
    }

    localAudioIsPlaying = false;
    localAudioFilePath = null;
}

function waitRefreshUnreadMessageCounterToFinish()
{
    return new Promise((resolve, reject) =>{
        if(updateUnreadMessageCounterReading == false)
        {
            resolve();
            return;
        }

        var itvLoadingRefreshUnreadMessageCounterRead = setInterval(function(){
            if(updateUnreadMessageCounterReading == false)
            {
                clearInterval(itvLoadingRefreshUnreadMessageCounterRead);
                itvLoadingRefreshUnreadMessageCounterRead = null;
                resolve();
            }
        });
    })
}

async function refreshUnreadMessageCounter()
{
    await waitRefreshUnreadMessageCounterToFinish();

    updateUnreadMessageCounterReading = true;

    // const firstOpening = totalNotReadChatMessage == null ? true : false;
    // const startCounter = totalNotReadChatMessage;

    let unreadList = await getUnreadMessageCount();
    let unreadGroupList = await getUnreadGroupMessageCount();

    $(`.contact-list-unread-counter`).remove();

    let allContactElements = $(`#chatContactListCollection .app-chat-contact-list-item`);
    let allGroupElements = $(`#chatContactListCollection .app-chat-group-list-item`);
    let allElements = allContactElements.toArray().concat(allGroupElements.toArray());
    
    // Reset the counter
    totalNotReadChatMessage = 0;

    for(let ix = 0; ix < allElements.length; ix++)
    {
        let readElement = $(allElements[ix]);
        const contactId = readElement.attr(`data-talktoid`);

        const isGroupElement = readElement.hasClass(`app-chat-group-list-item`);
        const linkElementClassSelector = isGroupElement == false ? `.app-chat-contact-list-item-link` : `.app-chat-group-list-item-link`;

        let unreadRecord;

        if(isGroupElement == false)
        {
            unreadRecord = unreadList.find((item) =>{
                return strToOnlyNum(item.fromId) == strToOnlyNum(contactId)
            });
        }
        else
        {
            unreadRecord = unreadGroupList.find((item) =>{
                return strToOnlyNum(item.toId) == strToOnlyNum(contactId)
            });
        }

        if(unreadRecord == null)
        {
            if(totalNotReadChatMessage == null)
            {
                totalNotReadChatMessage = 0;
            }

            continue;
        }

        if(unreadRecord.totalNotRead == 0)
        {
            if(totalNotReadChatMessage == null)
            {
                totalNotReadChatMessage = 0;
            }

            continue;
        }

        if(totalNotReadChatMessage == null)
        {
            totalNotReadChatMessage = unreadRecord.totalNotRead;
        }
        else
        {
            totalNotReadChatMessage += unreadRecord.totalNotRead;
        }


        readElement.find(linkElementClassSelector).append(`
            <span class="contact-list-unread-counter">${unreadRecord.totalNotRead}</span>
        `);

        // Move to top in list
        if($(`#chatContactListCollection li`).length > 1)
        {
            const firstElement = $(`#chatContactListCollection li:first`);
            const firstElementId = firstElement.attr(`data-talktoid`);
            const readElementId = readElement.attr(`data-talktoid`);
            
            // Check if readElement is not already the first element
            if (readElementId != firstElementId)
            {
                const moveToTarget = firstElement;
                $(readElement).moveToTop({ // element: which element to move top. (mandatory)
                    target: moveToTarget, // target: where to move element. Default is prevoious element (optional)
                    speed: 5, // speed: speed of animation in ms. Default is 1000. (optional)
                    opacity: 0.7, // opacity: Set the opacity of moving element. Default is 0.7. (optional)
                    start: function () {
                        // start: callback called when animation start. Default is empty. (optional)  
                    },
                    end: function () {
                        // end: callback called when animation end. Default is empty. (optional)
                    }
                }); 
            }          
        }
    }

    if(totalNotReadChatMessage > 0)
    {
        setDeviceBadge(totalNotReadChatMessage);
    }
    else
    {
        setBadgeToZero();
    }

    // if(firstOpening == false)
    // {
    //     if(totalNotReadChatMessage > startCounter)
    //     {
    //         $(`#audioChatNotification`)[0].play();
    //     }
    // }

    updateUnreadMessageCounterReading = false;
}

async function getUnreadMessageCount()
{
    let uid = readLocalStorage("uid");

    const query = `SELECT COUNT(*) AS totalNotRead, fromId
    FROM Messages
    WHERE 
        statusRead = 0 AND
        toId = ?
    GROUP BY fromId`;

    const queryValues = [uid]

    const result = await dbRun(query, queryValues);

    let arrResult = [];

    if(result == null)
    {
        lastUnreadMessageCount = arrResult;
        return arrResult;
    }

    for(let ix = 0; ix < result.rows.length; ix++)
    {
        const record = result.rows.item(ix);
        arrResult.push(record);
    }

    lastUnreadMessageCount = arrResult;

    return arrResult;
}

async function getUnreadGroupMessageCount()
{
    let uid = readLocalStorage("uid");

    const query = `SELECT COUNT(*) AS totalNotRead, toId
    FROM Messages
    WHERE 
        statusRead = 0 AND
        toIsGroup = 1 AND
        fromId <> ?
    GROUP BY toId`;

    const queryValues = [uid]

    const result = await dbRun(query, queryValues);

    let arrResult = [];

    if(result == null)
    {
        return [];
    }

    for(let ix = 0; ix < result.rows.length; ix++)
    {
        const record = result.rows.item(ix);
        arrResult.push(record);
    }

    return arrResult;
}

function toogleSuppressedUnsuppressedEvent()
{
    $(`.suppressed-message-text`).off(`click`);
    $(`.message-text-show-more`).off(`click`);

    $(`.suppressed-message-text, .message-text-show-more`).on(`click`, function(){
        const messageId = $(this).attr(`data-id`);

        $(`.message-text[data-id="${messageId}"]`).removeClass(`suppressed-message-text`);
        $(`.message-text[data-id="${messageId}"]`).addClass(`unsuppressed-message-text`);
        toogleSuppressedUnsuppressedEvent();

        $(`.message-text-show-more[data-id="${messageId}"]`).addClass(`hide`);
        $(`.message-text-show-minimize[data-id="${messageId}"]`).removeClass(`hide`);
    });

    $(`.unsuppressed-message-text`).off(`click`);
    $(`.message-text-show-minimize`).off(`click`);

    $(`.unsuppressed-message-text, .message-text-show-minimize`).on(`click`, function(){
        const messageId = $(this).attr(`data-id`);

        $(`.message-text[data-id="${messageId}"]`).removeClass(`unsuppressed-message-text`);
        $(`.message-text[data-id="${messageId}"]`).addClass(`suppressed-message-text`);
        toogleSuppressedUnsuppressedEvent();

        $(`.message-text-show-more[data-id="${messageId}"]`).removeClass(`hide`);
        $(`.message-text-show-minimize[data-id="${messageId}"]`).addClass(`hide`);
    });
}

function messageBlockEvents()
{
    $(`.chat-message-block`).off(`touchstart`);
    $(`.chat-message-block`).on(`touchstart`, function(){
        pressingMessageBlock = true;
        pressingMessageBlockId = $(this).attr(`data-id`);

        const PRESSING_MESSAGE_BLOCK_CALLCONTEXT_MENU_TIME = 1000;

        setTimeout(function(){
            if(pressingMessageBlock == true && pressingMessageBlockId != null)
            {
                // console.log(`Call context menu for message id ${pressingMessageBlockId}`);
                showMessageContextMenu(pressingMessageBlockId);

                pressingMessageBlock = false;
                pressingMessageBlockId = null;
            }
        }, PRESSING_MESSAGE_BLOCK_CALLCONTEXT_MENU_TIME);
    });

    $(`.chat-message-block`).off(`touchend`);
    $(`.chat-message-block`).on(`touchend`, function(){
        pressingMessageBlock = false;
        pressingMessageBlockId = null;
    });
}

async function getChatRoomCache()
{
    let result = "";

    if(talkToId == null)
    {
        return result;
    }

    const sqlRoomCache = `SELECT htmlCode FROM ChatRoomCache WHERE toId = ?`;
    const sqlRoomCacheValues = [talkToId];
    const sqlRoomCacheResponse = await dbRun(sqlRoomCache, sqlRoomCacheValues);

    if(sqlRoomCacheResponse != null)
    {
        if(sqlRoomCacheResponse.rows.length > 0)
        {
            const sqlRoomCacheRecord = sqlRoomCacheResponse.rows.item(0);
            result = sqlRoomCacheRecord.htmlCode;
        }
    }

    //This javascript code removes all 3 types of line breaks
    // result = result.replace(/(\r\n|\n|\r)/gm,"");
    result = appReplaceSymbolWithNewlines(result);

    return result;
}

async function reviewChatRoomAfterCacheRead()
{
    // Check if waiting for upload audio is already done
    for(let ix = 0; ix < $(`.card-audio-waiting-for-upload`).length; ix++)
    {
        const element = $($(`.card-audio-waiting-for-upload`).get(ix));
        const messageId = element.attr(`data-message`);
        
        const query = `
        SELECT 
            id,
            messageId,
            content,
            media,
            statusSent,
            statusReceived,
            statusRead
        FROM Messages 
        WHERE 
            messageId = ? AND
            (
                statusSent = 1 OR 
                statusReceived = 1 OR 
                statusRead = 1 OR 
                media NOT LIKE 'file://%' OR 
                (content IS NOT NULL AND LENGTH(content) > 0)
            )
        `;

        const queryValues = [messageId];

        result = await dbRun(query, queryValues);

        if(result == null)
        {
            continue;
        }

        if(result.rows.length == 0)
        {
            continue;
        }

        const messageRecord = result.rows.item(0);
        switchAudioWaitingForUploadToAudioSourceLoading(messageRecord.messageId, messageRecord.media, messageRecord.content);
    }

}

async function updateChatRoomCache()
{
    if(talkToId == null)
    {
        return;
    }

    // First thing is get new html code (some calls aren't using await, so just take the html code in a very first time)
    let chatBoxClone = $(`#chatBox`).clone();

    if(chatRoomHistoryBaseMessageId != null)
    {
        // Remove previous messages from load base
        chatBoxClone.find(`.chat-message-block[data-id="${chatRoomHistoryBaseMessageId}"]`).prevAll().remove();

        chatBoxClone.find(`.media-image-source`).addClass(`media-image-source-from-cache`);
    }

    let newHTML = chatBoxClone.html();
    
    //This javascript code removes all 3 types of line breaks
    // newHTML = newHTML.replace(/(\r\n|\n|\r)/gm,"");
    newHTML = appReplaceNewlinesWithSymbol(newHTML);

    const sqlRoomCache = `SELECT htmlCode FROM ChatRoomCache WHERE toId = ?`;
    const sqlRoomCacheValues = [talkToId];
    const sqlRoomCacheResponse = await dbRun(sqlRoomCache, sqlRoomCacheValues);

    let isInsert = false;

    if(sqlRoomCacheResponse == null)
    {
        isInsert = true;
    }

    if(sqlRoomCacheResponse.rows.length == 0)
    {
        isInsert = true;
    }

    // const sqlRoomCacheRecord = sqlRoomCacheResponse.rows.item(0);

    let scriptCache = null;
    let scriptCacheValues = null;
    if(isInsert == true)
    {
        if(newHTML.trim().length > 0)
        {
            scriptCache = `INSERT INTO ChatRoomCache (toId, htmlCode) VALUES (?, ?)`;
            scriptCacheValues = [talkToId, newHTML];
        }
    }
    else
    {
        const currentRecord = sqlRoomCacheResponse.rows.item(0);
        const currentCode = currentRecord.htmlCode;

        if(currentCode != newHTML)
        {
            if(newHTML.trim().length > 0)
            {
                scriptCache = `UPDATE ChatRoomCache SET htmlCode = ? WHERE toId = ?`;
                scriptCacheValues = [newHTML, talkToId];
            }
            else
            {
                scriptCache = `DELETE FROM ChatRoomCache WHERE toId = ?`;
                scriptCacheValues = [talkToId];
            }
        }
    }

    if(scriptCache != null && scriptCacheValues != null)
    {
        await dbRun(scriptCache, scriptCacheValues);
    }
}

function showMessageContextMenu(messageId)
{
    const messageElement = $(`.chat-message-block[data-id="${messageId}"]`);
    if(messageElement.length == 0)
    {
        return;
    }

    const messageElementClone = messageElement.clone();


    $(`#messageContextMenuOverlay`).remove();

    $(`body`).append(`
        <div id="messageContextMenuOverlay" class="chat-message-context-menu-overlay">
            <div class="message-under-context-menu">
            </div>
            <div id="messageContextMenuCollection" class="collection chat-message-context-menu-collection">
                <a href="#!" class="collection-item waves-effect waves-light chat-message-context-menu-collection-item" data-action="reply" data-id="${messageId}">
                    <span>${getTranslate(`reply`, `Reply`)}</span>
                    <i class="fa-solid fa-reply"></i>
                </a>

                <a href="#!" class="collection-item waves-effect waves-light chat-message-context-menu-collection-item" data-action="copy" data-id="${messageId}">
                    <span>${getTranslate(`copy`, `Copy`)}</span>
                    <i class="fa-solid fa-copy"></i>
                </a>

                <a href="#!" class="collection-item waves-effect waves-light chat-message-context-menu-collection-item" data-action="status" data-id="${messageId}">
                    <span>${getTranslate(`message-status`, `Message Status`)}</span>
                    <i class="fa-solid fa-circle-info"></i>
                </a>
            </div>
        </div>
    `);

    const messageHeight = parseInt(messageElement.height()) <= 150 ? parseInt(messageElement.height()) : 150;
    const menuOffsetTop = 10;

    $(`#messageContextMenuCollection`).css(`top`, `calc(10% + ${messageHeight + menuOffsetTop}px)`);

    $(`#messageContextMenuOverlay`).find(`.message-under-context-menu`).append(messageElementClone);

    $(`.chat-message-context-menu-collection-item`).off(`click`);
    $(`.chat-message-context-menu-collection-item`).on(`click`, async function(){
        const action = $(this).attr(`data-action`);
        const actionMessageId = $(this).attr(`data-id`);

        const sqlMessage = `SELECT messageId, fromId, toId, content, statusSent, statusReceived, statusRead, messageTime, mediaType FROM Messages WHERE messageId = ?`;
        const sqlMessageValues = [actionMessageId];
        const sqlMessageResponse = await dbRun(sqlMessage, sqlMessageValues);

        if(sqlMessageResponse == null)
        {
            if(action == `status`)
            {
                showMessageStatusScreen(actionMessageId, null);
            }

            return;
        }

        if(sqlMessageResponse.rows.length == 0)
        {
            if(action == `status`)
            {
                showMessageStatusScreen(actionMessageId, null);
            }

            return;
        }

        const messageRecord = sqlMessageResponse.rows.item(0);


        if(action == `reply`)
        {
            // console.log(`Reply Message ${actionMessageId}`);
            pendingReplyMessageId = actionMessageId;
            await showPendingReplyMessage(messageRecord, true);
            
        }
        else if(action == `copy`)
        {
            // console.log(`Copy Message ${actionMessageId}`)
            CopyTextToClipboard(messageRecord.content);
            showToastWithStyle(getTranslate("copied-message", `Copied message.`), 2000, `chat-copied-message-style`);
        }
        else if(action == `status`)
        {
            showMessageStatusScreen(actionMessageId, messageRecord);
        }
    });

    $(`#messageContextMenuOverlay`).off(`click`);
    $(`#messageContextMenuOverlay`).on(`click`, function(){
        $(`#messageContextMenuOverlay`).fadeOut(600, function() {
            $(`#messageContextMenuOverlay`).remove();
        });
    });
}

async function getCardOfMessageInReply(messageId, preloadedMessageRecord)
{
    let htmlCard = ``;

    if(messageId == null)
    {
        return htmlCard;
    }

    let messageRecord = null;

    if(preloadedMessageRecord == null)
    {
        const sqlMessage = `SELECT messageId, fromId, toId, content FROM Messages WHERE messageId = ?`;
        const sqlMessageValues = [messageId];
        const sqlMessageResponse = await dbRun(sqlMessage, sqlMessageValues);

        if(sqlMessageResponse == null)
        {
            $(`#pendingReplyMessageArea`).empty();
            checkSendActionButton();

            return;
        }

        if(sqlMessageResponse.rows.length == 0)
        {
            $(`#pendingReplyMessageArea`).empty();
            checkSendActionButton();

            return;
        }

        messageRecord = sqlMessageResponse.rows.item(0);
    }
    else
    {
        messageRecord = preloadedMessageRecord;
    }

    let uid = readLocalStorage("uid");

    let messageAuthorName = ``;

    if(messageRecord.fromId.trim() == uid)
    {
        messageAuthorName = getTranslate(`you`, `You`);
    }
    else
    {
        const linkedRecord = linkedContactList.find((item) =>{
            return item.Contact == messageRecord.fromId
        });
    
        if(linkedRecord != null)
        {
            messageAuthorName = linkedRecord.Name;
        }
    
        if(messageAuthorName.trim().length == 0)
        {
            const contactInfo = await getContactInfo(messageRecord.fromId, null);
            messageAuthorName = contactInfo.name;    
        }
    }

    if(messageAuthorName.trim().length == 0)
    {
        let phoneDetails = getPhoneFormatsByNumber(messageRecord.fromId, null);
        messageAuthorName = phoneDetails.full;
    }

    let messageContent = messageRecord.content;
    const MAX_REPLY_LENGTH = 150;

    if(messageContent.length > MAX_REPLY_LENGTH)
    {
        messageContent = messageContent.substring(0, MAX_REPLY_LENGTH);
    }

    htmlCard = `
        <div class="card no-margin message-reply-card">
            <div class="card-content">
                <div class="chat-message-reply-card-color-indicator">
                </div>
                <div class="chat-message-reply-card-message-author">
                    ${messageAuthorName}
                </div>
                <div class="chat-message-reply-card-message-content">
                    ${messageContent}
                </div>
            </div>
        </div>
    `;
 
    return htmlCard;
}

async function processReplyCards()
{
    let elements = $(`.reply-card-loading`);

    for(let ix = 0; ix < elements.length; ix++)
    {
        const element = $(elements.get(ix));
        const messageId = element.attr(`data-id`);
        const replyMessage = element.attr(`data-replyid`);

        const card = await getCardOfMessageInReply(replyMessage, null);

        element.html(card);
        element.removeClass(`reply-card-loading`);
        element.addClass(`reply-card-applied`);
    }

    $(`.reply-card-applied`).off(`click`);
    $(`.reply-card-applied`).on(`click`, async function(){
        const replyMessageToGo = $(this).attr(`data-replyid`);
        await searchAndGoToMessage(replyMessageToGo);
    });
}

async function processGroupMessageOwnerInfo()
{
    let elements = $(`.chat-group-message-owner-loading`);
    let elementsWaitToSet = $(`.chat-group-message-owner`).not('[data-ownerset*="1"]');
    let allElements = elements.toArray().concat(elementsWaitToSet.toArray());

    for(let ix = 0; ix < allElements.length; ix++)
    {
        // const element = $(allElements.get(ix));
        const element = $(allElements[ix]);
        const messageId = element.attr(`data-id`);

        element.removeClass(`chat-group-message-owner-loading`);

        const queryMessageOwner = `SELECT fromId FROM Messages WHERE messageId = ?`;
        const queryMessageOwnerValues = [messageId];
        const queryMessageOwnerResponse = await dbRun(queryMessageOwner, queryMessageOwnerValues);

        if(queryMessageOwnerResponse == null)
        {
            element.text(``);
            continue
        }

        if(queryMessageOwnerResponse.rows.length == 0)
        {
            element.text(``);
            continue
        }

        const messageOwnerRecord = queryMessageOwnerResponse.rows.item(0);
        const messageOwner = messageOwnerRecord.fromId;

        element.attr(`data-ownerlogin`, messageOwner);
        
        const ownerGroupMemberRecord = talkGroupMembers.find((item) =>{
            return item.Login.trim().toLowerCase() == messageOwner.trim().toLowerCase()
        });

        if(ownerGroupMemberRecord == null)
        {
            element.text(messageOwner);
            continue;
        }

        element.text(ownerGroupMemberRecord.LoginName);
        element.attr(`data-ownerset`, `1`);
    }

}

async function searchAndGoToMessage(messageId)
{
    if(messageId == null)
    {
        return;
    }

    if(messageId.trim().length == 0)
    {
        return;
    }

    let loadedIndex = chatRoomLoadedMessageIdList.findIndex((item) =>{
        return item == messageId;
    });

    if(loadedIndex == -1)
    {
        showLoadingAnimationInSwal();
        await loadChatRoomMessageHistory(messageId);

        setTimeout(function(){
            swal.close();
        }, 200);

        loadedIndex = chatRoomLoadedMessageIdList.findIndex((item) =>{
            return item == messageId;
        });
    }

    if(loadedIndex > -1)
    {
        const elementToScrollToSelector = `.chat-message-block[data-id="${messageId}"]`;
        const elementToScrollTo = $(elementToScrollToSelector);
        if(elementToScrollTo.length > 0)
        {
            const elementTop = getChatMessageTopPosition(elementToScrollTo[0]) - elementToScrollTo.height() - 32;
            $("#chatBox").scrollTop(elementTop);

            highlight(elementToScrollToSelector, 2000);
        }
    }
}

function switchAudioWaitingForUploadToAudioSourceLoading(messageId, media, content)
{
    // Detect URL into text
    const urlfyTContent = urlify(content);
    $(`.chat-message-block[data-id="${messageId}"]`).find(`.message-text`).html(urlfyTContent);

    // $(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).find(`.media-audio-waiting-for-upload`).attr(`data-id`, messageToSend.media);
    // $(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).find(`.media-audio-waiting-for-upload`).addClass(`media-audio-source-loading`);
    // $(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).find(`.media-audio-waiting-for-upload`).attr(`src`, `/images/audio.png`);
    // $(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).find(`.media-audio-waiting-for-upload`).removeClass(`media-audio-waiting-for-upload`);

    $(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).find(`.card-content`).removeAttr(`onclick`);
    $(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).find(`.card-content`).html(`
        <img class="media-audio-source-loading" referrerPolicy="no-referrer" data-message="${messageId}" data-id="${media}" src="/images/audio.png"/>
    `);

    $(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).attr(`data-id`, media);
    $(`.card-audio-waiting-for-upload[data-message="${messageId}"]`).removeClass(`card-audio-waiting-for-upload`);
}

async function contactIdIsGroupCheck()
{
    // const groupRecord = await getChatAppGroupById(talkToId, false);
    const groupRecord = talkToGroupRecord;

    if(groupRecord == null)
    {
        talkToAGroup = false;
        talkToGroupInfo = null;
        talkGroupMembers = null;
        return false;
    }

    talkToAGroup = true;
    talkToGroupInfo = groupRecord;

    talkGroupMembers = await loadTalkGroupMembersCache();
    refreshTalkGroupMembersView();

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == true)
    {
        // No await here
        refreshTalkGroupMembersCache();
    }

    return true;
}

function refreshTalkGroupMembersView()
{
    processGroupMessageOwnerInfo();
}

async function getChatAppGroupById(groupId, onlyID)
{
    if(onlyID == null)
    {
        onlyID = false;
    }

    const groupQueryFields = onlyID == false ? `*` : `id`;
    const groupQuery = `SELECT ${groupQueryFields} FROM AppGroups WHERE GroupId = ?`;
    const groupQueryValues = [groupId];
    const groupQueryResponse = await dbRun(groupQuery, groupQueryValues);

    if(groupQueryResponse.rows.length == 0)
    {
        return null;
    }

    const record = groupQueryResponse.rows.item(0);

    return record;
}

async function getChatAppGroupIndentificationById(groupId)
{
    const groupQuery = `SELECT id, GroupId, Name, Description, Photo FROM AppGroups WHERE GroupId = ?`;
    const groupQueryValues = [groupId];
    const groupQueryResponse = await dbRun(groupQuery, groupQueryValues);

    if(groupQueryResponse.rows.length == 0)
    {
        return null;
    }

    const record = groupQueryResponse.rows.item(0);

    return record;
}

async function loadTalkGroupMembersCache()
{
    if(talkToId == null)
    {
        return [];
    }

    const query = `SELECT Login, LoginName FROM AppTalkGroupMembersCache WHERE GroupId = ?`;
    const values = [talkToId];

    const queryResult = await dbRun(query, values);

    let result = [];

    for(let ix = 0; ix < queryResult.rows.length; ix++)
    {
        const record = queryResult.rows.item(ix);
        result.push(record);
    }

    return result;
}

async function refreshTalkGroupMembersCache()
{
    if(talkToId == null)
    {
        return;
    }

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        return;
    }


    const queryGroupMembers = `SELECT Login FROM AppGroupMembers WHERE GroupId = ?`;
    const queryGroupMembersValues = [talkToId];
    const queryGroupMembersResult = await dbRun(queryGroupMembers, queryGroupMembersValues);

    let userList = [];
    for(let ix = 0; ix < queryGroupMembersResult.rows.length; ix++)
    {
        const groupMemberRecord = queryGroupMembersResult.rows.item(ix);
        const groupMemberLogin = groupMemberRecord.Login;

        userList.push(groupMemberLogin);
    }

    const serverRequestData = {
        "users": JSON.stringify(userList)
    };

    const serverUserInfo = await callS(true, `POST`, `/services/userlistinfo`, serverRequestData);

    if(serverUserInfo == null)
    {
        return;
    }

    if(serverUserInfo.list == null)
    {
        return;
    }

    // Update talkGroupMembers
    talkGroupMembers = serverUserInfo.list;

    // Add to talkGroupMembers AppGroupMember not registered as user
    if(talkGroupMembers.length < userList.length)
    {
        for(ixUser = 0; ixUser < userList.length; ixUser++)
        {
            const memberToCheck = userList[ixUser];

            const foundInServer = talkGroupMembers.find((item) => {
                return item.Login == memberToCheck;
            });

            if(foundInServer == null)
            {
                const contactName = getContactName(memberToCheck);
                talkGroupMembers.push({
                    "Login"      : memberToCheck,
                    "LoginName"  : contactName
                });
            }
        }
    }

    if(talkToId == null)
    {
        console.log(`(refreshTalkGroupMembersCache) talkToId was probably reset by user`);
        return;
    }

    const queryListCacheUpdate = [];
    const queryListCacheUpdateValues = [];

    const queryRemoveOldTalkGroupMembers = `DELETE FROM AppTalkGroupMembersCache WHERE GroupId = ?`;
    const queryRemoveOldTalkGroupMembersValues = [talkToId];
    queryListCacheUpdate.push(queryRemoveOldTalkGroupMembers);
    queryListCacheUpdateValues.push(queryRemoveOldTalkGroupMembersValues);


    for(let ix = 0; ix < talkGroupMembers.length; ix++)
    {
        const record = talkGroupMembers[ix];

        const queryInsert = `INSERT INTO AppTalkGroupMembersCache (GroupId, Login, LoginName) VALUES (?, ?, ?)`;
        const queryInsertValus = [talkToId, record.Login, record.LoginName];

        queryListCacheUpdate.push(queryInsert);
        queryListCacheUpdateValues.push(queryInsertValus);
    }

    if(talkToId == null)
    {
        console.log(`(refreshTalkGroupMembersCache) talkToId was probably reset by user`);
        return;
    }

    await dbRunManyInSameTransaction(queryListCacheUpdate, queryListCacheUpdateValues);

    refreshTalkGroupMembersView();
    
}

async function getChatDisplayNameByLogin(contactLogin)
{
    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        return contactLogin;
    }
}

function checkInvalidGroupToSendMessage()
{
    if(userCanSendGroupMessage == false)
    {
        $(`.chat-input-area`).find('.chat-input-add-action').addClass('hide');
        $(`.chat-input-area`).find('.chat-input-text-area').addClass('hide');
        $(`.chat-input-area`).find('.chat-input-send').addClass('hide');

        const message = getTranslate(`validity-cannot-send-message`, `Group expired, cannot send messages`);
        // $('#chatMainInputText').attr('placeholder', message);
        // $(`#chatMainInputText`).prop('disabled',true)
        // $('#chatMainInputText').val(message);
        $(`#chatMainInputDisabledMessage`).removeClass(`hide`);
        $(`#chatMainInputDisabledMessage`).text(message);

        return;
    }
    else
    {
        $(`.chat-input-area`).find('.chat-input-add-action').removeClass('hide');
        $(`.chat-input-area`).find('.chat-input-text-area').removeClass('hide');
        $(`.chat-input-area`).find('.chat-input-send').removeClass('hide');

        $(`#chatMainInputDisabledMessage`).addClass(`hide`);
    }
}

async function showMessageStatusScreen(messageId, messageRecord)
{
    const modalId = `messageStatusScreenModal`;
    const modalSelector = `#${modalId}`;

    let currentCompany = readLocalStorage(`company`);
    if(currentCompany == null)
    {
        currentCompany = "0";
    }

    if(currentCompany.trim().length == 0)
    {
        currentCompany = "0";
    }

    const registered = messageRecord != null ? true : false;
    const sent = registered == false ? false : (messageRecord.statusSent == 1 ? true : false);
    const received = registered == false ? false : (messageRecord.statusReceived == 1 ? true : false);
    const read = registered == false ? false : (messageRecord.statusRead == 1 ? true : false);
    const messageTime = registered == false ? 0 : messageRecord.messageTime;
    const messageDate = messageTime > 0 ? new Date(messageTime) : null;
    // let momentYear = messageDate != null ? messageDate.getFullYear() : null;
    // let momentMonth = messageDate != null ? messageDate.getMonth() + 1 : null;
    // let momentDay = messageDate != null ? messageDate.getDate() : null;
    const content = registered == false ? "" : messageRecord.content;

    let socketIsActive = false;
    if(webSocket != null)
    {
        const connectionState = webSocket.readyState;

        if(connectionState == SOCKET_OPEN)
        {
            socketIsActive = true;
        }
    }

    let outgoingMessageServiceIsActive = false;
    if(itvOutgoingMessageService != null)
    {
        outgoingMessageServiceIsActive = true;
    }

    const outgoingMessageServiceIsUnderProcessing = processingOutgoingMessage;
    const restoreDatabaseIsUnderProcessing = restoreDatabaseProcessing;
    const afterRestoreDatabaseIsUnderProcessing = afterRestoreDatabaseProcessing;


    if($(modalSelector).length > 0)
    {
        $(modalSelector).modal('close');
        $(modalSelector).modal('destroy');
        $(modalSelector).remove();
    }


    const html = `
        <div id="${modalId}" class="modal bottom-sheet">
            <div class="modal-content">
                <a id="btnCloseMessageStatusScreenModal" href="#!" class="close-buton-float-right default-modal-close-button waves-effect waves-green btn-flat">
                    <i class="fa-solid fa-xmark left"></i>
                </a>

                <table style="margin-top: 15px;">
                    <thead>
                        <tr>
                            <th>${getTranslate("id", `Id`)}</th>
                            <th>${getTranslate("registered", `Registered`)}</th>
                            <th>${getTranslate("sent", `Sent`)}</th>
                            <th>${getTranslate("received", `Received`)}</th>
                            <th>${getTranslate("read", `Read`)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${messageId}</td>
                            <td class="center">${registered == true     ? `<i class="green-text fa-regular fa-circle-check"></i>` : `<i class="red-text fa-solid fa-circle-xmark"></i>`}</td>
                            <td class="center">${sent == true           ? `<i class="green-text fa-regular fa-circle-check"></i>` : `<i class="red-text fa-solid fa-circle-xmark"></i>`}</td>
                            <td class="center">${received == true       ? `<i class="green-text fa-regular fa-circle-check"></i>` : `<i class="red-text fa-solid fa-circle-xmark"></i>`}</td>
                            <td class="center">${read == true           ? `<i class="green-text fa-regular fa-circle-check"></i>` : `<i class="red-text fa-solid fa-circle-xmark"></i>`}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="row">
                    <div class="col s2">
                        <i class="fa-solid fa-clock"></i>
                    </div>
                    <div class="col s10">
                        ${messageDate != null ? messageDate.toLocaleDateString() : "-"}
                    </div>
                </div>
                <div class="row">
                    <div class="col s2">
                        <i class="fa-solid fa-envelope-open-text"></i>
                    </div>
                    <div class="col s10">
                        ${registered == true ? content : ""}
                    </div>
                </div>



                <h6>Online Check</h6>
                <span id="messageStatusOnlineCheckServerOfflineMsg" class="hide" data-lang="offline-connection">${getTranslate("offline-connection", `No internet connection. Make sure that Wi-Fi or mobile data is turned on, then try again.`)}</span>

                <div class="row">
                    <div class="col s2">
                        <i class="fa-solid fa-wifi"></i>
                    </div>
                    <div class="col s10">
                        ${socketIsActive == true ? `<i class="green-text fa-regular fa-circle-check"></i>` : `<i class="red-text fa-solid fa-circle-xmark"></i>`}
                    </div>
                </div>

                <div class="row">
                    <div class="col s2">
                        <i class="fa-solid fa-paper-plane"></i>
                    </div>
                    <div class="col s10">
                        ${outgoingMessageServiceIsActive == true ? `<i class="green-text fa-regular fa-circle-check"></i>` : `<i class="red-text fa-solid fa-circle-xmark"></i>`}
                    </div>
                </div>


                <div class="row">
                    <div class="col s2">
                        <i class="fa-solid fa-hourglass-half"></i>
                    </div>
                    <div class="col s10">
                        ${outgoingMessageServiceIsUnderProcessing == true ? `<i class="fa-regular fa-circle-check"></i>`: `<i class="fa-solid fa-minus"></i>`}
                    </div>
                </div>

                
                <div class="row">
                    <div class="col s2">
                        <i class="fa-solid fa-user-lock"></i>
                    </div>
                    <div class="col s10">
                        ${restoreDatabaseIsUnderProcessing == true ? `<i class="fa-regular fa-circle-check"></i>`: `<i class="fa-solid fa-minus"></i>`}
                    </div>
                </div>
               
                <div class="row">
                    <div class="col s2">
                        <i class="fa-solid fa-arrow-down-up-lock"></i>
                    </div>
                    <div class="col s10">
                        ${afterRestoreDatabaseIsUnderProcessing == true ? `<i class="fa-regular fa-circle-check"></i>`: `<i class="fa-solid fa-minus"></i>`}
                    </div>
                </div>

                <div class="row">
                    <div class="col s4">
                        ${getTranslate("last-message-service-error", `Last Service Message Error`)}
                    </div>
                    <div class="col s8">
                        ${outgoingMessageServiceLastError.trim().length == 0 ? `<i class="fa-solid fa-minus"></i>` : `${outgoingMessageServiceLastError}`}
                    </div>
                </div>

                <table style="margin-top: 15px;">
                    <thead>
                        <tr>
                            <th>${getTranslate("server-queue", `Server Queue`)}</th>
                            <th>${getTranslate("datalake", `Datalake`)}</th>
                            <th>${getTranslate("pending-group-members", `Pending Group Members`)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="center">
                                <span id="messageStatusOnlineCheckServerQueue" class="message-status-online-check-text">...</span>
                            </td>
                            <td class="center">
                                <span id="messageStatusOnlineCheckDatalake" class="message-status-online-check-text">...</span>
                            </td>
                            <td class="center">
                                <span id="messageStatusOnlineCheckPendingGroupMembers" class="message-status-online-check-text">...</span>
                            </td>
                        </tr>
                    </tbody>
                </table>


            </div>
        </div>
    `;

    $(`body`).append(html);


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

    $(`#btnCloseMessageStatusScreenModal`).off(`click`);
    $(`#btnCloseMessageStatusScreenModal`).on(`click`, function(){
        $(modalSelector).modal('close');    
    });

    $(modalSelector).modal('open');

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        $(`.message-status-online-check-text`).text(``);
        $(`#messageStatusOnlineCheckServerOfflineMsg`).removeClass(`hide`);
        return;
    }

    $(`#messageStatusOnlineCheckServerOfflineMsg`).addClass(`hide`);

    // http://localhost:24011/services/srvmessagestatus/bPKOrjaPfOJO/0


    const serverMsgInfoData = {
        "messageId": messageId,
        "companyId": currentCompany
    }

    const serverMsgInfo = await callS(true, "POST", `/services/srvmessagestatus`, serverMsgInfoData);

    if(serverMsgInfo == null)
    {
        $(`#messageStatusOnlineCheckServerQueue`).html(`<i class="red-text fa-solid fa-triangle-exclamation"></i>`);
        $(`#messageStatusOnlineCheckDatalake`).html(`<i class="red-text fa-solid fa-triangle-exclamation"></i>`);
        $(`#messageStatusOnlineCheckPendingGroupMembers`).html(`<i class="red-text fa-solid fa-triangle-exclamation"></i>`);
        return;
    }

        $(`#messageStatusOnlineCheckServerQueue`).html(serverMsgInfo.server_queue == true ? `<i class="fa-regular fa-circle-check"></i>`: `<i class="fa-solid fa-minus"></i>`);
        $(`#messageStatusOnlineCheckDatalake`).html(serverMsgInfo.stored_in_datalake == true ? `<i class="green-text fa-regular fa-circle-check"></i>`: `<i class="red-text fa-solid fa-circle-xmark"></i>`);
        $(`#messageStatusOnlineCheckPendingGroupMembers`).html(`${serverMsgInfo.group_members_pending_to_receive}`);
}
