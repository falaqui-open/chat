var contactSelectionCallbackFunction = null;
var contactSelectionSelectedList = [];
var contactSelectionListIsLoading = false;

$(function() {
    mountModalContactSelectionEvents();
});

function mountModalContactSelectionEvents()
{
    $("#modalContactSelection").modal({
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

    $(`#btnCloseModalContactSelection`).off(`click`);
    $(`#btnCloseModalContactSelection`).on(`click`, function(){
        closeModalContactSelection();
    });

    $(`#txtContactSelectionSearch`)[0].addEventListener('onsearch', function(event){
        const contactElements = $(`.contact-selection-list-item-applied`);

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
        $(`.contact-selection-alpha-nav-item`).each(function() {
            var firstLetter = $(this).attr('data-query');
            const hasVisibleItemsInLetter = $(`.contact-selection-list-item-applied[data-firstletter="${firstLetter}"]:not(.hide)`).length > 0;

            if(hasVisibleItemsInLetter == true)
            {
                $(`.contact-selection-list-alphabetical-item-applied[data-letter="${firstLetter}"]`).removeClass(`hide`);
            }
            else
            {
                $(`.contact-selection-list-alphabetical-item-applied[data-letter="${firstLetter}"]`).addClass(`hide`);
            }
        });
    });

    $('.contact-selection-alpha-nav').on('touchstart touchmove', function(e) {
        e.preventDefault();

        const x = e.originalEvent.touches[0].pageX;
        const y = e.originalEvent.touches[0].pageY;

        var elem = $(document.elementFromPoint(x, y));

        if(elem.hasClass(`contact-selection-alpha-nav-item`) == true)
        {
            const queryLetter = elem.attr(`data-query`).toUpperCase();

            const selectorElementToScroll = `.contact-selection-list-alphabetical-item-applied[data-letter="${queryLetter}"]`;
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
            $(`.contact-selection-alpha-nav-item[data-letter!="${queryLetter}"]`).removeClass(`contact-selection-alpha-nav-item-hover`);
            elem.addClass(`contact-selection-alpha-nav-item-hover`);

        }
    });

    $('.contact-selection-alpha-nav').on('touchend', function(e) {
        e.preventDefault();
        $(`.contact-selection-alpha-nav-item`).removeClass(`contact-selection-alpha-nav-item-hover`);
    });

    $(`#btnContactSelectionAddContactList`).off(`click`);
    $(`#btnContactSelectionAddContactList`).on(`click`, function(){
        const selectionList = JSON.parse(JSON.stringify(contactSelectionSelectedList));
        contactSelectionCallbackFunction(selectionList);

        closeModalContactSelection();
    });
}

async function initModalContactSelection(preloadSelected, selectionCallback)
{
    contactSelectionCallbackFunction = selectionCallback;

    showLoadingAnimationInSwal();

    $("#modalContactSelection").modal(`open`);

    await mountContactSelectionList();

    if(preloadSelected == null)
    {
        preloadSelected = [];
    }

    if(preloadSelected.length > 0)
    {
        contactSelectionSelectedList = preloadSelected;

        for(let ix = 0; ix < contactSelectionSelectedList.length; ix++)
        {
            const contactId = contactSelectionSelectedList[ix];
            addContactSelectionHeaderItem(contactId);
            $(`.contact-selection-checkbox[data-talktoid="${contactId}"]`).prop('checked', true);
        }
    }
    else
    {
        contactSelectionSelectedList = [];
    }

    setTimeout(function(){
        swal.close();
    }, 50);
}

function closeModalContactSelection()
{
    contactSelectionCallbackFunction = null;
    contactSelectionSelectedList = [];
    $(`.contact-selection-added-item-applied`).remove();
    $(`#btnContactSelectionAddContactList`).addClass(`hide`);
    $(`.contact-selection-checkbox`).prop('checked', false);
    $(`#txtContactSelectionSearch`).val("");

    $("#modalContactSelection").modal(`close`);
}


async function mountContactSelectionList()
{
    contactSelectionListIsLoading = true;

    // If has swal in action, inform the starting status
    if($(`.swal-text`).length > 0)
    {
        const preparingStatus = getTranslate(`preparing-contact-list`, `Preparing Contact List...`);
        $(`.swal-text`).html(`<div class="app-loading-data-base-text">${preparingStatus}</div>`);
    }

    await waitContactListLoadDoneByIndex();

    if(deviceContactList == null)
    {
        deviceContactList = [];
    }

    if(deviceContactList.length == 0)
    {
        await loadDevicePhoneContactList();
        saveLocalLoadedContactList();
        await loadServerContactListStatus();
    }

    $(`#txtContactSelectionSearch`).val("");

    contactSelectionSelectedList = [];
    $(`.contact-selection-added-item-applied`).remove();
    $(`#btnContactSelectionAddContactList`).addClass(`hide`);
    $(`.contact-selection-checkbox`).prop('checked', false);

    let serverConnectionState = await hasServerConnection();
    
    let htmlItems = ``;
    let added = [];

    let fullContactList = JSON.parse(JSON.stringify(deviceContactList));

    for(let ix = 0; ix < linkedContactList.length; ix++)
    {
        const linkedRecordId = linkedContactList[ix].Contact;
        const indexInFullList = fullContactList.findIndex((item) =>{
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
                return phoneNumOnlyNumbers == linkedRecordId
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

        if(indexInFullList == -1)
        {
            const contactNames = linkedContactList[ix].Name != null ? linkedContactList[ix].Name.split(' ') : "";
            fullContactList.push({
                "id": parseInt(makeidnum(6)).toString(),
                "displayName": linkedContactList[ix].Name,
                "firstName": contactNames.length>0 ? contactNames[0] : "",
                "lastName": contactNames.length > 1 ? contactNames[contactNames.length -1] : "",
                "phoneNumbers": [{
                    "normalizedNumber": linkedRecordId,
                    "number": linkedRecordId,
                    "type": "MOBILE",
                }],
                "isLinked": true
            })
        }
        else
        {
            fullContactList[indexInFullList].isLinked = true;
        }
    }

    let cacheIsOK = await contactSelectionCheckCacheIsOudatedAndLoadFromCache(fullContactList, $(`#contactSelectionListCollection`));

    if(cacheIsOK == true)
    {
        contactSelectionListIsLoading = false;
        return;
    }

    for(let ix = 0; ix < fullContactList.length; ix++)
    {
        // If has swal in action, show the progress of loading
        if($(`.swal-text`).length > 0)
        {
            const totalCount = fullContactList.length;
            const currentCount = ix + 1;
    
            const baseTextLoading = getTranslate(`loading-contact-list`, `Loading Contact List...`);
            const percent = parseInt((totalCount > 0 ? (currentCount / totalCount) : 0) * 100);
            const preloaderPercentHtml = `
                <div class="progress">
                    <div class="determinate" style="width: ${percent}%"></div>
                </div>
            `;
            const progressLoading = `
                <div class="app-loading-data-status-text">
                    <span>${percent}% </span>
                    <span>(</span>
                    <span>${currentCount}</span>
                    <span>/</span>
                    <span>${totalCount}</span>
                    <span>)</span>
                </div>
            `;
            $(`.swal-text`).html(`<div class="app-loading-data-base-text">${baseTextLoading}</div>${preloaderPercentHtml}${progressLoading}`);
    
        }


        let record = fullContactList[ix];

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

            if(phoneDetails.isMobile == false)
            {
                continue;
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

            const isLinked = typeof record.isLinked == `undefined` ? false : record.isLinked;

            let contactPhoto = `images/contact.png`;

            if(isLinked == true)
            {
                contactPhoto = await getPhotoProfileURL(phoneNumOnlyNumbers, serverConnectionState, false);
            }
            else
            {
                if(statusRecord == null)
                {
                    if(record.thumbnail != null)
                    {
                        try
                        {
                            contactPhoto = await getDeviceFileBase64URL(record.thumbnail);
                        }
                        catch(devicePhotoURLException)
                        {
    
                        }
                    }
                }
                else
                {
                    contactPhoto = await getPhotoProfileURL(statusRecord.Login, serverConnectionState, false);
                }
            }



            let item = $(`.contact-selection-list-item-to-clone`).clone();
            item.removeClass(`contact-selection-list-item-to-clone`);
            item.removeClass(`hide`);
            item.addClass(`contact-selection-list-item-applied`);
            item.attr(`data-id`, record.id);
            item.attr(`data-firstletter`, firstLetter);
            item.attr(`data-searchname`, contactName);
            item.attr(`data-searchnumber`, strToOnlyNum(contactIdentification));  
            item.attr(`data-talktoid`, phoneNumOnlyNumbers);
            item.attr(`data-phone`, phoneDetails.full);
            item.attr(`data-ismobile`, phoneDetails.isMobile == true ? "1" : "0");
            item.find(`.contact-selection-name`).text(contactName);
            item.attr(`data-q`, contactName);
            item.find(`.chat-contact-identification`).text(contactIdentification);
            item.find(`.chat-contact-phone-type`).text(phoneDetails.phoneTypeLabel);
            item.find(`.contact-selection-checkbox`).attr('data-talktoid', phoneNumOnlyNumbers);

            item.attr(`data-photo`, contactPhoto);
            // item.find(`img`).attr(`src`, contactPhoto);
            // item.find(`img`).attr(`alt`, contactIdentification);

            htmlItems += item.wrap('<span/>').parent().html();
        }
    }

    // If has swal in action, inform the finalizing status
    if($(`.swal-text`).length > 0)
    {
        const preparingStatus = getTranslate(`preparing-contact-list`, `Preparing Contact List...`);
        $(`.swal-text`).html(`<div class="app-loading-data-base-text">${preparingStatus}</div>`);
    }


    $(`.contact-selection-list-item-applied`).remove();
    $(`.contact-selection-list-alphabetical-item-applied`).remove();

    $(`#contactSelectionListCollection`).append(htmlItems);

    sortContactList(`#contactSelectionListCollection`, `.contact-selection-list-item-applied`);

    // Add alphabetical letters to list
    const itemElements = $(`.contact-selection-list-item-applied`);
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
            if($(`.contact-selection-list-alphabetical-item-applied[data-letter="${itemLetter}"]`).length == 0)
            {
                // Add letter
                let itemLetterElement = $(`.contact-alphabetical-list-item-to-clone`).clone();
                itemLetterElement.removeClass(`contact-alphabetical-list-item-to-clone`);
                itemLetterElement.removeClass(`hide`);
                itemLetterElement.addClass(`contact-selection-list-alphabetical-item-applied`);
                itemLetterElement.attr(`data-letter`, itemLetter);
                itemLetterElement.find(`.contact-alphabetical-text`).text(itemLetter);

                $(`.contact-selection-list-item-applied[data-id="${itemId}"]`).before(itemLetterElement);
            }

            currentLetter = itemLetter;
        }
    }

    // Remove duplicate letter elements
    var mapLetter = {};
    $('.contact-selection-list-alphabetical-item-applied').each(function() {
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

    // Save cache
    updateContactSelectionCache(fullContactList, $(`#contactSelectionListCollection`));
    
    // Mount contact selection list events
    mountContactSelectionListAfterLoadEvents();

    contactSelectionListIsLoading = false;
}

function mountContactSelectionListAfterLoadEvents()
{
    $(`.contact-selection-checkbox`).off(`click`);
    $(`.contact-selection-checkbox`).on(`click`, async function(event){
        // Preventing any parent handlers from being notified of the event.
        event.stopPropagation();

        // const contactId = $(this).attr(`data-talktoid`);
        // setContactSelectionItem(contactId);
    });

    $(`.contact-selection-list-item`).off(`click`);
    $(`.contact-selection-list-item`).on(`click`, async function(event){

        // Preventing any parent handlers from being notified of the event.
        event.stopPropagation();
        const contactId = $(this).attr(`data-talktoid`);
        setTimeout(function(){
            setContactSelectionItem(contactId);
        }, 50);
    });
}

function setContactSelectionItem(contactId)
{
    const selectedListIndex = contactSelectionSelectedList.findIndex((item) =>{
        return item.trim().toLowerCase() == contactId.trim().toLowerCase()
    });

    if(selectedListIndex < 0)
    {
        $(`.contact-selection-checkbox[data-talktoid="${contactId}"]`).prop('checked', true);
        contactSelectionSelectedList.push(contactId);
        addContactSelectionHeaderItem(contactId);
    }
    else
    {
        $(`.contact-selection-checkbox[data-talktoid="${contactId}"]`).prop('checked', false);
        contactSelectionSelectedList.splice(selectedListIndex, 1);
        removeContactSelectionHeaderItem(contactId);
    }

    if(contactSelectionSelectedList.length == 0)
    {
        $(`#btnContactSelectionAddContactList`).addClass(`hide`);
    }
    else
    {
        $(`#btnContactSelectionAddContactList`).removeClass(`hide`);
    }
}

function addContactSelectionHeaderItem(contactId)
{
    let item = $(`.contact-selection-added-item-to-clone`).clone();
    item.removeClass(`contact-selection-added-item-to-clone`);
    item.removeClass(`hide`);
    item.addClass(`contact-selection-added-item-applied`);
    item.attr(`data-talktoid`, contactId);

    const contactElement = $(`.contact-selection-list-item[data-talktoid="${contactId}"]`);
    const contactName = contactElement.find(`.contact-selection-name`).text();
    const contactPhoto = contactElement.attr(`data-photo`);
    // const contactPhoto = contactElement.find(`.contact-selection-photo`).attr(`src`);

    item.find(`.contact-selection-added-item-photo`).attr(`src`, contactPhoto);
    item.find(`.contact-selection-added-item-photo`).attr(`alt`, contactName);
    item.find(`.contact-selection-added-item-name`).text(contactName);

    $(`#contactSelectionAddedHeader`).append(item);

    // Scroll to right end
    $(`#contactSelectionAddedHeader`)[0].scrollLeft = $(`#contactSelectionAddedHeader`)[0].scrollWidth;
}

function removeContactSelectionHeaderItem(contactId)
{
    $(`.contact-selection-added-item[data-talktoid="${contactId}"]`).remove();

    // Scroll to right end
    $(`#contactSelectionAddedHeader`)[0].scrollLeft = $(`#contactSelectionAddedHeader`)[0].scrollWidth;
}

// function waitForContactListRendered(statusViewElement)
// {
//     return new Promise((resolve, reject) =>{
//         const contactElements = $(`.chat-phone-contact-selection-list-item-applied`);

//         if(contactListIsLoading == false)
//         {
//             if(contactSelectionListIsLoading == false || contactElements.length > 0)
//             {
//                 if(statusViewElement != null)
//                 {
//                     $(statusViewElement).html(``);
//                 }

//                 resolve();
//                 return;
//             }        
//         }

//         let itvContactListLoading = setInterval(function(){
//             if(contactListIsLoading == false)
//             {
//                 if(contactSelectionListIsLoading == false || contactElements.length > 0)
//                 {
//                     clearInterval(itvContactListLoading);
//                     itvContactListLoading = null;

//                     if(statusViewElement != null)
//                     {
//                         $(statusViewElement).html(``);
//                     }

//                     resolve();
//                 }
//             }

//             if(statusViewElement != null)
//             {
//                 if(contactLoadingStatus.length > 0 && contactLoadingTotal.length > 0)
//                 {
//                     $(statusViewElement).html(`${contactLoadingStatus}/${contactLoadingTotal}`);
//                 }
//                 else
//                 {
//                     $(statusViewElement).html(``);
//                 }
//             }
//         }, 100);
//     });
// }

async function getContactSelectionCache()
{
    console.log(`📞 Selection Contact: 🟡 DB cache loading...`);

    var html = "";
    var list = "";
    var arrList = [];

    const sqlCache = `SELECT htmlCode FROM ContactSelectionCache`;
    const sqlCacheValues = null;
    const sqlCacheResponse = await dbRun(sqlCache, sqlCacheValues);

    if(sqlCacheResponse != null)
    {
        if(sqlCacheResponse.rows.length > 0)
        {
            const sqlCacheRecord = sqlCacheResponse.rows.item(0);
            html = sqlCacheRecord.htmlCode;
        }
    }

    //This javascript code removes all 3 types of line breaks
    // html = html.replace(/(\r\n|\n|\r)/gm,"");

    html = stringDecompress(html);
    html = appReplaceSymbolWithNewlines(html);

    if(html == null)
    {
        html = "";
    }



    const sqlCacheList = `SELECT list FROM ContactSelectionCacheList`;
    const sqlCacheListValues = null;
    const sqlCacheResponseList = await dbRun(sqlCacheList, sqlCacheListValues);

    if(sqlCacheResponseList != null)
    {
        if(sqlCacheResponseList.rows.length > 0)
        {
            const sqlCacheRecord = sqlCacheResponseList.rows.item(0);
            list = sqlCacheRecord.list;

            if(list != null)
            {
                if(list.length > 0)
                {
                    try
                    {
                        list = stringDecompress(list);
                        arrList = JSON.parse(list);
                    }
                    catch(parseError)
                    {
                        arrList = [];
                    }
                }
            }
        }
    }

    const result = {
        "html": html,
        "list": arrList
    };

    console.log(`📞 Selection Contact: 🟢 DB cache loaded (${arrList.length} records)`);

    return result;
}

async function updateContactSelectionCache(fullContactList, jqElementList)
{
    console.log(`📞 Selection Contact: 🟡 Saving cache...`);

    // First thing is get new html code (some calls aren't using await, so just take the html code in a very first time)
    let elementClone = jqElementList.clone();

    let newHTML = elementClone.html();
    
    //This javascript code removes all 3 types of line breaks
    // newHTML = newHTML.replace(/(\r\n|\n|\r)/gm,"");

    newHTML = appReplaceNewlinesWithSymbol(newHTML);

    newHTML = stringCompress(newHTML);

    if(newHTML == null)
    {
        newHTML = "";
    }

    let strList = JSON.stringify(fullContactList);
    strList = stringCompress(strList);





    const sqlCache = `SELECT htmlCode FROM ContactSelectionCache`;
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
            scriptCache = `INSERT INTO ContactSelectionCache (htmlCode) VALUES (?)`;
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
                scriptCache = `UPDATE ContactSelectionCache SET htmlCode = ?`;
                scriptCacheValues = [newHTML];
            }
            else
            {
                scriptCache = `DELETE FROM ContactSelectionCache WHERE 1 = ?`;
                scriptCacheValues = ["1"];
            }
        }
    }

    if(scriptCache != null && scriptCacheValues != null)
    {
        await dbRun(scriptCache, scriptCacheValues);
    }









    const sqlCacheList = `SELECT list FROM ContactSelectionCacheList`;
    const sqlCacheListValues = null;
    const sqlCacheResponseList = await dbRun(sqlCacheList, sqlCacheListValues);

    let isInsertList = false;

    if(sqlCacheResponseList == null)
    {
        isInsertList = true;
    }

    if(sqlCacheResponseList.rows.length == 0)
    {
        isInsertList = true;
    }

    let scriptCacheList = null;
    let scriptCacheListValues = null;
    if(isInsertList == true)
    {
        scriptCacheList = `INSERT INTO ContactSelectionCacheList (list) VALUES (?)`;
        scriptCacheListValues = [strList];
    }
    else
    {
        const currentRecord = sqlCacheResponseList.rows.item(0);
        const currentCode = currentRecord.list;

        if(currentCode != strList)
        {
            scriptCacheList = `UPDATE ContactSelectionCacheList SET list = ?`;
            scriptCacheListValues = [strList];    
        }
    }

    if(scriptCacheList != null && scriptCacheListValues != null)
    {
        await dbRun(scriptCacheList, scriptCacheListValues);
    }






    console.log(`📞 Selection Contact: 🟢 Cache saved`);
}

async function contactSelectionCheckCacheIsOudatedAndLoadFromCache(fullContactList, jqElementList)
{
    console.log(`📞 Selection Contact: 🟡 Loading cache...`);

    const cacheValue = await getContactSelectionCache();
    if(cacheValue == null)
    {
        console.log(`📞 Selection Contact: 🔴 No cache`);
        return false;
    }

    if(cacheValue.list == null || cacheValue.html == null)
    {
        console.log(`📞 Selection Contact: 🔴 No list or no html`);
        return false;
    }

    if(cacheValue.list.length == 0 || cacheValue.html.trim().length == 0)
    {
        console.log(`📞 Selection Contact: 🔴 Empty list or empty html`);
        return false;
    }

    if(cacheValue.list.length != fullContactList.length)
    {
        // Outdated list
        console.log(`📞 Selection Contact: 🔴 Diff in list size (cached=${cacheValue.list.length}) vs. (list=${fullContactList.length})`);
        return false;
    }

    for(let ix = 0; ix < fullContactList.length; ix++)
    {
        const record = fullContactList[ix];
        const listRecord = cacheValue.list[ix];

        if(
            listRecord.phoneNumbers.length != record.phoneNumbers.length ||
            listRecord.displayName != record.displayName ||
            listRecord.firstName != record.firstName ||
            listRecord.lastName != record.lastName
        )
        {
            // Outdated list item
            console.log(`📞 Selection Contact: 🔴 Outdated list item`);
            return false;
        }

        for(let ixPhone = 0; ixPhone < listRecord.phoneNumbers.length; ixPhone++)
        {
            const phoneRecord = record.phoneNumbers[ixPhone];
            const listPhoneRecord = listRecord.phoneNumbers[ixPhone];

            if(
                phoneRecord.normalizedNumber != listPhoneRecord.normalizedNumber ||
                phoneRecord.number != listPhoneRecord.number ||
                phoneRecord.type != listPhoneRecord.type
            )
            {
                // Outdated phone in list item
                console.log(`📞 Selection Contact: 🔴 Outdated phone in list item`);
                return false;
            }
        }
    }

    console.log(`📞 Selection Contact: 🟢 Cache loaded`);

    jqElementList.html(cacheValue.html);
    mountContactSelectionListAfterLoadEvents();

    return true;
}