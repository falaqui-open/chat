$(function() {
    mountModalMessageSearchEvents();
});

function mountModalMessageSearchEvents()
{
    const modalIsDismissible = true;

    $("#modalMessageSearch").modal({
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

    $(`#btnCloseModalMessageSearch`).off(`click`);
    $(`#btnCloseModalMessageSearch`).on(`click`, function(){
        closeModalMessageSearch();
    });

    $(`#txtChatMessageSearch`)[0].addEventListener('onsearch', async function(event){
        const term = strToSimpleChars(event.detail.text.toLowerCase());

        if(term.trim().length == 0)
        {
            $(`#chatMessageSearchList`).empty();
            return;
        }

        const searchQueryTerm = `%${term}%`;
        const searchQuery = `SELECT fromId, messageId, mediaType, messageTime, content FROM Messages WHERE (fromId = ? OR toId = ?) AND content LIKE ? ORDER BY messageTime DESC`;
        const searchQueryValues = [talkToId, talkToId, searchQueryTerm];

        const searchQueryResponse = await dbRun(searchQuery, searchQueryValues);

        if(searchQueryResponse == null)
        {
            $(`#chatMessageSearchList`).empty();
            return;
        }
    
        let htmlItems = "";

        for(let ix = 0; ix < searchQueryResponse.rows.length; ix++)
        {
            const record = searchQueryResponse.rows.item(ix);
            
            const resultMessageFromId = record.fromId;
            const resultMessageId = record.messageId;
            const resultMessageTime = record.messageTime;
            const resultMessageContent = record.content;
            // const resultMessageProtected = record.protected;
            const resultMessageMediaType = record.mediaType;


            const msgDate = new Date(resultMessageTime);
        
            const msgDateDay = new Date(resultMessageTime);
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

            const noMessagesText = getTranslate(`no-messages`, `No Messages`);

            let displayName = "";
            if(resultMessageFromId == talkToId)
            {
                displayName = talkToName;
            }
            else
            {
                displayName = getTranslate(`you`, `you`);
            }
    
            // const messageText = resultMessageProtected == 0 ? resultMessageContent : CHAT_PROTECTED_TEXT;
            let messageText = resultMessageContent;
    
            if(messageText.trim().length == 0)
            {
                if(resultMessageMediaType == MEDIA_TYPE_IMAGE)
                {
                    messageText = `🖼️`;
                }
                else if(resultMessageMediaType == MEDIA_TYPE_AUDIO)
                {
                    messageText = `🔈`;
                }
                else
                {
                    if(resultMessageMediaType != null)
                    {
                        messageText = `📎`;
                    }
                    else
                    {
                        messageText = noMessagesText;
                    }
                }
            }


            htmlItems += `
            <li class="app-chat-message-search-list-item collection-item" data-messageid="${resultMessageId}">
                <a href="#" class="app-chat-message-search-list-item-link" data-messageid="${resultMessageId}">
                    <div class="app-chat-message-search-list-item-info">
                        <span class="app-chat-message-search-list-item-from">${displayName}</span>
                        <div class="app-chat-message-search-list-item-text">
                            ${messageText}
                        </div>
                    </div>
                    <div class="app-chat-message-search-list-item-time">
                        ${msgTime}
                    </div>
                </a>
            </li>
            `;
        }

        $(`#chatMessageSearchList`).html(htmlItems);

        $(`.app-chat-message-search-list-item-link`).off(`click`);
        $(`.app-chat-message-search-list-item-link`).on(`click`, async function(){
            const messageId = $(this).attr(`data-messageid`);
            
            await searchAndGoToMessage(messageId);

            closeModalMessageSearch();
        });

    });
}

function initModalMessageSearch()
{
    $("#modalMessageSearch").modal(`open`);

    $(`#chatMessageSearchList`).empty();
    $(`#txtChatMessageSearch`).val("");

    let messageSearchTitle = getTranslate(`search-for-messages-with-user`, `Search for messages with XXXXXX`);
    messageSearchTitle = replaceAll(messageSearchTitle, `XXXXXX`, talkToName);

    $(`#messageSearchTitle`).text(messageSearchTitle);
}

function closeModalMessageSearch()
{
    $(`#chatMessageSearchList`).empty();
    $(`#txtChatMessageSearch`).val("");
    $("#modalMessageSearch").modal(`close`);
}
