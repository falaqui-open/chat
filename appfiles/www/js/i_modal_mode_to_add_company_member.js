$(function() {
    mountModalModeToAddCompanyMemberEvents();
});

function mountModalModeToAddCompanyMemberEvents()
{
    $("#modalModeToAddCompanyMember").modal({
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

    $(`#btnCloseModalModeToAddCompanyMember`).off(`click`);
    $(`#btnCloseModalModeToAddCompanyMember`).on(`click`, function(){
        closeModalModeToAddCompanyMember();
    });

    $(`#modeToAddCompanyMemberImportFromContactList`).off(`click`);
    $(`#modeToAddCompanyMemberImportFromContactList`).on(`click`, async function(){
        closeModalModeToAddCompanyMember();

        const emptyPreselectedList = []; // This functionality doesn't use a pre-selected list

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            await initModalContactSelection(emptyPreselectedList, async (selectedContacts) =>{
                await setAddCompanyMemberSelectedContacts(selectedContacts);
            })
        }
        else
        {
            const selectedContacts = await initNativeContactListSelectionScreen(emptyPreselectedList);

            if(selectedContacts == null)
            {
                return;
            }

            await setAddCompanyMemberSelectedContacts(selectedContacts);
        }

    });

    $(`#modeToAddCompanyMemberEnterAPhoneNumber`).off(`click`);
    $(`#modeToAddCompanyMemberEnterAPhoneNumber`).on(`click`, function(){
        closeModalModeToAddCompanyMember();
        initModalCompanyMember();
    });
}

function initModalModeToAddCompanyMember()
{
    $("#modalModeToAddCompanyMember").modal(`open`);
}

function closeModalModeToAddCompanyMember()
{
    $("#modalModeToAddCompanyMember").modal(`close`);
}

async function setAddCompanyMemberSelectedContacts(selectedContacts)
{
    showLoadingAnimationInSwal();

    for(let ix = 0; ix < selectedContacts.length; ix++)
    {
        let currentCount = ix + 1;
        const totalCount = selectedContacts.length;

        const baseTextLoading = getTranslate(`saving-data`, `Saving Data...`);
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

        const contactToSave = selectedContacts[ix];
        try
        {
            await companyMemberSavePhone(contactToSave);
        }
        catch(saveContactException)
        {
            console.log(`Error saving contact: ${contactToSave}`);
        }
    }

    setTimeout(function(){
        swal.close();
    }, 200);

    await listMembersOfCompany();
}