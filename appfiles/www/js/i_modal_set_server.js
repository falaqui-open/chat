var modalSetServerSelectionCallback = null;
var modalSetServerHasDefined = false;

$(function() {
    mountModalSetServerEvents();
});

function mountModalSetServerEvents()
{
    $("#modalSetServer").modal({
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

    $(`#setAppServerConnectionAddOptionsCollapsible`).collapsible({
        "accordion": true,
        "onOpenStart": null,
        "onOpenEnd": function(liIElement){
            if(liIElement == null)
            {
                return;
            }

            let inputToFocus = $(liIElement).find(`.set-app-server-connection-input-check`);
            if(inputToFocus.length == 0)
            {
                return;
            }

            inputToFocus.val("");
            inputToFocus.focus();
        },
        "onCloseStart": null,
        "onCloseEnd": null,
        "inDuration": 300,
        "outDuration": 300
    });

    $(`#btnCloseModalSetServer`).off(`click`);
    $(`#btnCloseModalSetServer`).on(`click`, function(){
        closeModalSetServer();
    });

    $(`#btnSetAppServerQRCodeScan`).off(`click`);
    $(`#btnSetAppServerQRCodeScan`).on(`click`, function(){
        writeSessionStorage(`qrscanbackscreen`, `signup.html`);
        writeSessionStorage(`lastqrscanrequest`, `appserverconnectioncode`);
        redirectToRight('qrscan.html');
    });

    $(`#btnSetAppServerConnectionCodeCheck`).off(`click`);
    $(`#btnSetAppServerConnectionCodeCheck`).on(`click`, function(){
        setAppServerConnectionCodeCheck();
    });

}

async function initModalSetServer(selectionCallback)
{
    modalSetServerSelectionCallback = selectionCallback;
    modalSetServerHasDefined = false;

    if(appServerConnectionList.length == 0)
    {
        createDefaultAppServerConnection(true);
    }

    refreshScreenSetAppServerConnectionList();
    clearSetAppServerScreen();


    $("#modalSetServer").modal(`open`);
}

function clearSetAppServerScreen()
{
    $(`#txtSetAppServerConnectionCodeCheck`).val("");

    $(`#txtSetAppServerConnectionCompanyId`).unmask();
    $(`#txtSetAppServerConnectionCompanyId`).val("");
    if(countryCode == `BR`)
    {
        // BR uses CNPJ mask
        $(`#txtSetAppServerConnectionCompanyId`).mask('00.000.000/0000-00', {reverse: true});
    }
}

function refreshScreenSetAppServerConnectionList()
{
    let htmlItems = ``;

    for(let ix = 0; ix < appServerConnectionList.length; ix++)
    {
        const record = appServerConnectionList[ix];

        const isDefault = record.default;
        const isSelected = record.selected;
        const label = isDefault == false ? record.label : getTranslate(`default-connection`, `Default Connection`);

        htmlItems += `
        <a href="#" class="collection-item app-server-connection-list-item">
            <label>
                <input name="setServerConnection" type="radio" data-id="${record.id}" class="app-server-connection-radio-item ${isDefault == true ? "app-server-connection-default" : ""}" ${isSelected == true ? `checked="checked"` : ``} />
                <span>${label}</span>
            </label>
        </a>
        `;
    }

    $(`#setAppServerConnectionList`).html(htmlItems);

    $(`.app-server-connection-list-item`).off(`click`);
    $(`.app-server-connection-list-item`).on(`click`, function(event){
        $(this).find(`input:radio`).prop('checked', true);
        const connectionId = $(this).find(`input:radio`).attr(`data-id`);
        setAppServerConnectionChanged(connectionId);

        event.stopPropagation();
    });

    // $('input[name=setServerConnection]').off('change');
    // $('input[name=setServerConnection]').on('change', function(event) {
    //     event.stopPropagation();

    //     const connectionId = $("input[name='setServerConnection']:checked").attr(`data-id`);
    //     setAppServerConnectionChanged(connectionId);
    // });
}

async function setAppServerConnectionCodeCheck()
{
    const accessCode = $(`#txtSetAppServerConnectionCodeCheck`).val();

    if(accessCode.length == 0)
    {
        return;
    }

    showLoadingAnimationInSwal();

    const response = await callSDefaultServer(false, `GET`, `/services/externalcompanyconnectionbyaccesscode/${accessCode}`, null);

    setTimeout(function(){
        swal.close();

        if(response == null)
        {
            swal(`${getTranslate("invalid-code", "Invalid code")}`);
            return;
        }
        
        if(typeof response.AccessCode == `undefined`)
        {
            swal(`${getTranslate("invalid-code", "Invalid code")}`);
            return;
        }

        if(response.AccessCode == null)
        {
            swal(`${getTranslate("invalid-code", "Invalid code")}`);
            return;
        }

        addAppServerConnection(response.CompanyId, response.AccessCode, response.Name, true, response.Endpoint, response.SocketEndpoint);

        refreshScreenSetAppServerConnectionList();

        setAppServerConnectionChanged();
    }, 200);

}

function closeModalSetServer()
{
    $("#modalSetServer").modal(`close`);

    if(modalSetServerSelectionCallback != null)
    {
        modalSetServerSelectionCallback();
    }

    modalSetServerSelectionCallback = null;
    modalSetServerHasDefined = false;
}

function setAppServerConnectionChanged(connectionId)
{
    if(modalSetServerHasDefined == true)
    {
        return;
    }

    setSelectedAppServerConnection(connectionId);
    modalSetServerHasDefined = true;
    showToastWithStyle(getTranslate("connection-changed", `Connection Changed`), 2000, toastDefaultClasses);

    setTimeout(function(){
        closeModalSetServer();
    }, 600);

}