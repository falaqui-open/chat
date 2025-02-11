var preloadPhoneContactListActivated = false;
var previousPreloadPhoneContactListStructure = null;
var contactListIsLoading = false;
var contactListCountIsProcessing = false;
var contactListLoadingVisible = false;
var contactLoadingStatus = "";
var contactLoadingTotal = "";

$(function() {
    mountModalNewContactEvents();
});

function mountModalNewContactEvents()
{
    $("#modalNewContact").modal({
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

    $(`#btnCloseModalNewContact`).off(`click`);
    $(`#btnCloseModalNewContact`).on(`click`, function(){
        closeModalNewContact();
    });

    $(`#btnNewContactCreateNew`).off(`click`);
    $(`#btnNewContactCreateNew`).on(`click`, function(){
        initModalCreateContact();
    });

    $(`#btnNewContactCreateGroup`).off(`click`);
    $(`#btnNewContactCreateGroup`).on(`click`, function(){
        const emptyArray = [];
        initModalCreateGroup(false, emptyArray, null);
    });

    $(`#chkChatPhoneContactSelectionListLoadOnlyMobile`).off(`change`);
    $(`#chkChatPhoneContactSelectionListLoadOnlyMobile`).on(`change`, async function(){
        await mountContactList();
    });

    $(`#txtPhoneContactSearch`)[0].addEventListener('onsearch', function(event){
        const contactElements = $(`.chat-phone-contact-selection-list-item-applied`);

        contactElements.removeClass(`hide`);

        const term = strToSimpleChars(event.detail.text.toLowerCase());

        if(term.trim().length == 0)
        {
            return;
        }

        // Loop through contact elements
        for(let ix = 0; ix < contactElements.length; ix++)
        {
            let readElement = $(contactElements[ix]);
            const searchName = strToSimpleChars(readElement.attr(`data-searchname`).toLowerCase());
            const searchNumber = strToSimpleChars(readElement.attr(`data-searchnumber`).toLowerCase());

            if(searchName.indexOf(term) > -1 || searchNumber.indexOf(term) > -1)
            {
                readElement.removeClass(`hide`);
            }
            else
            {
                readElement.addClass(`hide`);
            }
        }

        // Change visibility of letter label when has/hasn't children
        $(`.chat-phone-contact-alpha-nav-item`).each(function() {
            var firstLetter = $(this).attr('data-query');
            const hasVisibleItemsInLetter = $(`.chat-phone-contact-selection-list-item-applied[data-firstletter="${firstLetter}"]:not(.hide)`).length > 0;

            if(hasVisibleItemsInLetter == true)
            {
                $(`.chat-phone-contact-selection-list-alphabetical-item-applied[data-letter="${firstLetter}"]`).removeClass(`hide`);
            }
            else
            {
                $(`.chat-phone-contact-selection-list-alphabetical-item-applied[data-letter="${firstLetter}"]`).addClass(`hide`);
            }
        });
    });

    $('.chat-phone-contact-alpha-nav').on('touchstart touchmove', function(e) {
        e.preventDefault();

        const x = e.originalEvent.touches[0].pageX;
        const y = e.originalEvent.touches[0].pageY;

        var elem = $(document.elementFromPoint(x, y));

        if(elem.hasClass(`chat-phone-contact-alpha-nav-item`) == true)
        {
            const queryLetter = elem.attr(`data-query`).toUpperCase();

            const selectorElementToScroll = `.chat-phone-contact-selection-list-alphabetical-item-applied[data-letter="${queryLetter}"]`;
            if($(selectorElementToScroll).length > 0)
            {
                if(queryLetter != `#`)
                {
                    $(selectorElementToScroll).get(0).scrollIntoView({behavior: 'instant'});
                }
                else
                {
                    $(`#modalNewContact`).scrollTop(0);
                }

            }

            // // Letter zoom
            $(`.chat-phone-contact-alpha-nav-item[data-letter!="${queryLetter}"]`).removeClass(`chat-phone-contact-alpha-nav-item-hover`);
            elem.addClass(`chat-phone-contact-alpha-nav-item-hover`);

        }
    });

    $('.chat-phone-contact-alpha-nav').on('touchend', function(e) {
        e.preventDefault();
        $(`.chat-phone-contact-alpha-nav-item`).removeClass(`chat-phone-contact-alpha-nav-item-hover`);
    });
}

async function initModalNewContact()
{
    $("#modalNewContact").modal(`open`);

    $(`#txtPhoneContactSearch`).val("");

    await refreshContactListScreen();
}

function closeModalNewContact()
{
    $("#modalNewContact").modal(`close`);
}

function newContactLoadingMode(state)
{
    if(state == true)
    {
        $(`#chatPhoneContactSelectionListLoading`).removeClass(`hide`);
        $(`#chkChatPhoneContactSelectionListLoadOnlyMobile`).attr(`disabled`, `disabled`);
    }
    else
    {
        $(`#chatPhoneContactSelectionListLoading`).addClass(`hide`);
        $(`#chkChatPhoneContactSelectionListLoadOnlyMobile`).removeAttr(`disabled`);
    }
}

async function refreshContactListScreen()
{
    if(contactListIsLoading == true)
    {
        return;
    }

    await preloadPhoneContactCollection();

    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        await mountContactList();
    }

}

async function mountContactList()
{
    if(contactListIsLoading == true)
    {
        return;
    }

    contactListIsLoading = true;
    contactLoadingStatus = "";
    contactLoadingTotal = "";

    if(deviceContactList == null)
    {
        deviceContactList = [];
    }

    if(preloadPhoneContactListActivated == true)
    {
        $(`#chatPhoneContactSelectionListCollection`).html(previousPreloadPhoneContactListStructure);
        mountPhoneContactCollectionEvents();
        preloadPhoneContactListActivated = false;
    }

    if(deviceContactList.length == 0)
    {
        await loadDevicePhoneContactList();
        saveLocalLoadedContactList();
        await loadServerContactListStatus();
    }

    // let serverConnectionState = await hasServerConnection();

    const onlyMobileFilter = $('#chkChatPhoneContactSelectionListLoadOnlyMobile').prop('checked');
    let htmlItems = ``;
    let added = [];

    contactLoadingTotal = deviceContactList.length.toString();

    for(let ix = 0; ix < deviceContactList.length; ix++)
    {
        contactLoadingStatus = (ix+1).toString();

        let record = deviceContactList[ix];

        // const mobilePhoneList = record.phoneNumbers.filter((item) =>{
        //     return item.type.toLowerCase() == "mobile" || item.type == null
        // });

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
            // let phoneValue = mobilePhoneList[ixPhone].value;
            let phoneValue = mobilePhoneList[ixPhone].normalizedNumber != null ? mobilePhoneList[ixPhone].normalizedNumber : mobilePhoneList[ixPhone].number;
            // let phoneNum = getFormattedPhoneNumberFromCustomUID(phoneValue);

            if(phoneValue == null)
            {
                continue;
            }

            let phoneDetails = getPhoneFormatsByNumber(phoneValue, mobilePhoneList[ixPhone].type);

            if(phoneDetails == null)
            {
                continue;
            }


            if(onlyMobileFilter == true)
            {
                if(phoneDetails.isMobile == false)
                {
                    continue;
                }
            }

            let phoneNum = phoneDetails.full;
            // const formats = getPhoneFormatsByNumber(phoneValue, mobilePhoneList[ixPhone].type);
            // const phoneNumOnlyNumbers = strToOnlyNum(formats.fullNumbersOnly);
            const phoneNumOnlyNumbers = strToOnlyNum(phoneDetails.fullNumbersOnly);

            // let contactName = record.name.formatted != null ? record.name.formatted : record.name.givenName;
            let contactName = "...";
            let contactIdentification = contactName != null ? phoneNum : ``;

            const statusRecord = contactStatusList.find((item) =>{
                return item.Login == strToOnlyNum(phoneNum)
            });
            
            if(statusRecord == null)
            {
                contactName = record.displayName != null ? record.displayName : `${record.firstName} ${record.lastName}`;
            }
            else
            {
                contactName = statusRecord.Name;
            }

            let firstLetter = contactName.length > 0 ? contactName[0].toString().toUpperCase() : "#";

            // Letter must be A-Z
            let regexLetter = /^[a-zA-Z]+$/;
            let regexResult = regexLetter.test(firstLetter);
            if(regexResult == false)
            {
                firstLetter = "#";
            }


            let foundAdded = added.find((item) =>{
                return item.name == contactName && item.identification == strToOnlyNum(contactIdentification)
            });

            if(foundAdded != null)
            {
                continue;
            }

            added.push({
                "name": contactName,
                "identification": strToOnlyNum(contactIdentification)
            });

            // let contactPhoto = `images/contact.png`;
            // if(statusRecord == null)
            // {
            //     if(record.thumbnail != null)
            //     {
            //         try
            //         {
            //             contactPhoto = await getDeviceFileBase64URL(record.thumbnail);
            //         }
            //         catch(devicePhotoURLException)
            //         {

            //         }
            //     }
            // }
            // else
            // {
            //     // contactPhoto = `${endpoint}services/userphotoraw/${statusRecord.Login}`
            //     contactPhoto = await getPhotoProfileURL(statusRecord.Login, serverConnectionState, false);
            // }


            let item = $(`.chat-phone-contact-selection-list-item-to-clone`).clone();
            item.removeClass(`chat-phone-contact-selection-list-item-to-clone`);
            item.removeClass(`hide`);
            item.addClass(`chat-phone-contact-selection-list-item-applied`);
            item.attr(`data-id`, record.id);
            item.attr(`data-firstletter`, firstLetter);
            item.attr(`data-searchname`, contactName);
            item.attr(`data-searchnumber`, strToOnlyNum(contactIdentification));  
            item.attr(`data-talktoid`, phoneNumOnlyNumbers);
            item.attr(`data-phone`, phoneDetails.full);
            item.attr(`data-ismobile`, phoneDetails.isMobile == true ? "1" : "0");
            item.find(`.chat-phone-contact-name`).text(contactName);
            item.attr(`data-q`, contactName);
            item.find(`.chat-contact-identification`).text(contactIdentification);
            item.find(`.chat-contact-phone-type`).text(phoneDetails.phoneTypeLabel);

            if(phoneDetails.isMobile == true)
            {
                item.find(`.chat-contact-phone-type`).addClass(`chat-contact-phone-type-mobile`);
            }
            else
            {
                item.addClass(`disabled-style-list-item`);
                item.find(`.chat-contact-phone-type`).addClass(`chat-contact-phone-type-nonmobile`);
            }

            // item.find(`img`).attr(`src`, contactPhoto);
            // item.find(`img`).attr(`alt`, contactIdentification);

            htmlItems += item.wrap('<span/>').parent().html();
            // $(`#chatPhoneContactListCollection`).append(item);
        }
    }

    $(`#chatPhoneContactListSize`).text(` (${added.length})`);

    $(`.chat-phone-contact-selection-list-item-applied`).remove();
    $(`.chat-phone-contact-selection-list-alphabetical-item-applied`).remove();

    $(`#chatPhoneContactSelectionListCollection`).append(htmlItems);

    sortContactList(`#chatPhoneContactSelectionListCollection`, `.chat-phone-contact-selection-list-item-applied`);

    // Add alphabetical letters to list
    mountPhoneContactAlphabeticalLetters();

    mountPhoneContactCollectionEvents();

    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        // Wait 3 seconds to update the cache (to finish some features loading)
        setTimeout(function(){
            updatePhoneContactCollectionCache();
        }, 3000);
    }

    contactLoadingStatus = "";
    contactLoadingTotal = "";

    contactListIsLoading = false;
}

function mountPhoneContactAlphabeticalLetters()
{
    const itemElements = $(`.chat-phone-contact-selection-list-item-applied`);
    let currentLetter = "";
    for(let ix = 0; ix < itemElements.length; ix++)
    {
        const itemEl = $(itemElements[ix]);
        const itemId = itemEl.attr(`data-id`);

        if(itemId == null)
        {
            continue;
        }

        if(itemId.length == 0)
        {
            continue;
        }

        const itemLetter = itemEl.attr(`data-firstletter`).toUpperCase();
        if(itemLetter.toUpperCase() != currentLetter.toUpperCase())
        {
            if($(`.chat-phone-contact-selection-list-alphabetical-item-applied[data-letter="${itemLetter}"]`).length == 0)
            {
                // Add letter
                // console.log(`Adding Letter ${itemLetter}`);

                let itemLetterElement = $(`.chat-phone-contact-alphabetical-list-item-to-clone`).clone();
                itemLetterElement.removeClass(`chat-phone-contact-alphabetical-list-item-to-clone`);
                itemLetterElement.removeClass(`hide`);
                itemLetterElement.addClass(`chat-phone-contact-selection-list-alphabetical-item-applied`);
                itemLetterElement.attr(`data-letter`, itemLetter);
                itemLetterElement.find(`.chat-phone-contact-alphabetical-text`).text(itemLetter);

                $(`.chat-phone-contact-selection-list-item-applied[data-id="${itemId}"]`).before(itemLetterElement);
            }

            currentLetter = itemLetter;
        }
    }

    // Remove duplicate letter elements
    var mapLetter = {};
    $('.chat-phone-contact-selection-list-alphabetical-item-applied').each(function() {
        var letter = $(this).attr('data-letter');
        if (mapLetter[letter] == null)
        {
            mapLetter[letter] = true;
        } 
        else 
        {
            // Removing duplicate letter 
            // console.log(`Removing duplicating letter ${letter}`);
            $(this).remove();
        }
    });    
}

function mountPhoneContactCollectionEvents()
{
    $(`.chat-phone-contact-selection-list-item`).off(`click`);
    $(`.chat-phone-contact-selection-list-item`).on(`click`, async function(){
        const contactId = $(this).attr(`data-talktoid`);

        const isMobile = $(this).attr(`data-ismobile`);
        if(isMobile == "0")
        {
            showToastWithStyle(getTranslate(`contact-must-be-mobile-phone-number`, `The contact must be a cell phone number`), 3000, toastDefaultClasses);
            return;
        }

        closeModalNewContact();
        openChatWithContact(contactId);
    });    
}



async function preloadPhoneContactCollection()
{
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        if(contactListIsLoading == true)
        {
            return;
        }
    
        const cacheValue = await getPhoneContactCollectionCache();
        if(cacheValue == null)
        {
            return;
        }
    
        if(cacheValue.trim().length == 0)
        {
            return;
        }
    
        preloadPhoneContactListActivated = true;
        previousPreloadPhoneContactListStructure = $(`#chatPhoneContactSelectionListCollection`).html();
    
        $(`#chatPhoneContactSelectionListCollection`).html(cacheValue);
        // mountPhoneContactAlphabeticalLetters();
        mountPhoneContactCollectionEvents();        
    }   
}

async function getPhoneContactCollectionCache()
{
    let result = "";

    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        const sqlCache = `SELECT htmlCode FROM PhoneContactCollectionCache`;
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

        result = stringDecompress(result);
        result = appReplaceSymbolWithNewlines(result);
    
        if(result == null)
        {
            result = "";
        }
    }

    return result;
}

async function updatePhoneContactCollectionCache()
{
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        // First thing is get new html code (some calls aren't using await, so just take the html code in a very first time)
        let elementClone = $(`#chatPhoneContactSelectionListCollection`).clone();

        let newHTML = elementClone.html();
        
        //This javascript code removes all 3 types of line breaks
        // newHTML = newHTML.replace(/(\r\n|\n|\r)/gm,"");
        newHTML = appReplaceNewlinesWithSymbol(newHTML);

        newHTML = stringCompress(newHTML);

        if(newHTML == null)
        {
            newHTML = "";
        }

        const sqlCache = `SELECT htmlCode FROM PhoneContactCollectionCache`;
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
                scriptCache = `INSERT INTO PhoneContactCollectionCache (htmlCode) VALUES (?)`;
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
                    scriptCache = `UPDATE PhoneContactCollectionCache SET htmlCode = ?`;
                    scriptCacheValues = [newHTML];
                }
                else
                {
                    scriptCache = `DELETE FROM PhoneContactCollectionCache WHERE 1 = ?`;
                    scriptCacheValues = ["1"];
                }
            }
        }

        if(scriptCache != null && scriptCacheValues != null)
        {
            await dbRun(scriptCache, scriptCacheValues);
        }
    }
}

function startContactListLoadingService()
{
    if(itvContactListLoadingService != null)
    {
        clearInterval(itvContactListLoadingService);
        itvContactListLoadingService = null;
    }

    itvContactListLoadingService = setInterval(function(){
        if(contactListIsLoading == true)
        {
            if(contactListCountIsProcessing == true)
            {
                return;
            }

            contactListCountIsProcessing = true;
            contactListLoadingVisible = true;

            // if(contactSelectionListIsLoading == false || contactElements.length > 0)
            // {
            //     enableAddContactActions();
            // }
            // else
            // {
            //     disableAddContactActions();
            // }


            if(contactLoadingStatus.length > 0 && contactLoadingTotal.length > 0)
            {
                const percentAmount = parseInt((parseInt(contactLoadingStatus) / parseInt(contactLoadingTotal)) * 100);
                $(`#contactListStatusHome`).html(`${percentAmount}% - ${contactLoadingStatus}/${contactLoadingTotal}`);

                $(`#contactListStatusHomePercent`).removeClass(`hide`);
                $(`#contactListStatusHomePercent`).find(`.determinate`).attr(`style`, `width: ${percentAmount}%`);
            }
            else
            {
                $(`#contactListStatusHome`).html(``);
                $(`#contactListStatusHomePercent`).addClass(`hide`);
                $(`#contactListStatusHomePercent`).find(`.determinate`).attr(`style`, `width: 0%`);
            }

            contactListCountIsProcessing = false;
        }
        else
        {
            if(contactListLoadingVisible == true)
            {
                // enableAddContactActions();
                $(`#contactListStatusHome`).html(``);
                $(`#contactListStatusHomePercent`).addClass(`hide`);
                $(`#contactListStatusHomePercent`).find(`.determinate`).attr(`style`, `width: 0%`);

                contactListLoadingVisible = false;
            }
        }
    }, 100);
}