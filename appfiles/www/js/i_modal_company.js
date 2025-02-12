var modalCompanyMemberList = [];

$(function() {
    mountModalCompanyEvents();
});

function mountModalCompanyEvents()
{
    $("#modalCompany").modal({
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

    $(`#btnCloseModalCompany`).off(`click`);
    $(`#btnCloseModalCompany`).on(`click`, function(){
        $("#modalCompany").modal(`close`);
    });

    $(`#btnAddCompanyMembers`).off(`click`);
    $(`#btnAddCompanyMembers`).on(`click`, function(){
        initModalModeToAddCompanyMember();
    });
}

async function initModalCompany()
{
    $(`#noCompanyLoading`).removeClass(`hide`);
    $(`#noCompanyArea`).addClass(`hide`);
    $(`#selectCompanyArea`).addClass(`hide`);
    $(`#selectCompanyAdminArea`).addClass(`hide`);

    $("#modalCompany").modal(`open`);

    const serverConnectionState = await hasServerConnection();
    if(serverConnectionState == true)
    {
        await refreshCompanyInfoFromServer();
    }

    const companyQuery = `SELECT * FROM Company`;
    const companyQueryValues = [];
    const companyQueryResponse = await dbRun(companyQuery, companyQueryValues);

    $(`#noCompanyLoading`).addClass(`hide`);

    if(companyQueryResponse.rows.length == 0)
    {
        $(`#noCompanyArea`).removeClass(`hide`);
        clearCompanyId();
        return;
    }
    
    $(`#selectCompanyArea`).removeClass(`hide`);

    await fillModalCompanyList(companyQueryResponse);
    companyInputAdminCheck();
}


async function fillModalCompanyList(dbRecords)
{
    $(`#selectCompanyInput`).empty();
    $(`#selectCompanyAdminArea`).addClass(`hide`);

    if(dbRecords.rows.length == 0)
    {
        return;
    }

    for(let ix = 0; ix < dbRecords.rows.length; ix++)
    {
        const company = dbRecords.rows.item(ix);
        $(`#selectCompanyInput`).append(`<option value="${company.companyId.toString()}" data-isadmin="${company.isAdmin.toString()}">${company.name}</option>`)
    }

    // Turn off change
    $(`#selectCompanyInput`).off(`change`);

    const currentCompany = readLocalStorage(`company`);

    if(currentCompany == null)
    {
        const firstCompanyRecord = dbRecords.rows.item(0);
        $(`#selectCompanyInput`).val(firstCompanyRecord.companyId.toString());
        setCompanyId(firstCompanyRecord.companyId.toString());
    }
    else
    {
        $(`#selectCompanyInput`).val(currentCompany);
    }

    listMembersOfCompany();

    // Turn on change
    $(`#selectCompanyInput`).on(`change`, function(){
        const newCompany = $(this).val();
        setCompanyId(newCompany);

        companyInputAdminCheck();
        listMembersOfCompany();
    });
}

function companyInputAdminCheck()
{
    const newCompany = $(`#selectCompanyInput`).val();
    const isAdminValue = $(`#selectCompanyInput`).find(`option[value="${newCompany}"]`).attr(`data-isadmin`);
    const isAdmin = isAdminValue == `1`;

    if(isAdmin == true)
    {
        $(`#selectCompanyAdminArea`).removeClass(`hide`);
    }
    else
    {
        $(`#selectCompanyAdminArea`).addClass(`hide`);
    }
}

async function listMembersOfCompany()
{
    const company = $(`#selectCompanyInput`).val();
    const sqlScript = `SELECT CompanyId, Login, IsAdmin, IsExternal, Position, MemberCompanyName, Department 
        FROM CompanyMembers WHERE CompanyId = ? AND PendingToRemove = 0 ORDER BY IsAdmin DESC, IsExternal ASC, Login ASC`;
    const sqlScriptValues = [company];
    const dbResult = await dbRun(sqlScript, sqlScriptValues);
    
    modalCompanyMemberList = [];

    for(let ix = 0; ix < dbResult.rows.length; ix++)
    {
        const record = dbResult.rows.item(ix);
        modalCompanyMemberList.push(record);
    }

    drawModalCompanyMemberList();
}

function drawModalCompanyMemberList()
{
    $('#modalCompanyMemberList').empty();

    for(let ix = 0; ix < modalCompanyMemberList.length; ix++)
    {
        const record = modalCompanyMemberList[ix];

        $('#modalCompanyMemberList').append(`
            <a data-uid="${record.Login}" class="collection-item company-member-list-view-item company-member-list-view-item-loading-info" onclick="editCompanyMember('${record.CompanyId}', '${record.Login}', ${record.IsAdmin})">
                <span class="company-member-list-view-item-contact-number">${record.Login}</span>
                <span class="secondary-content">
                    ${record.IsAdmin == 1 ? `<i class="fa-solid fa-user-tie"></i> ` : ``}
                    <span class="company-member-list-view-item-contact-info"></span>
                </span>
            </a>
        `);
    }

    refreshLazyLoadModalCompanyMemberListContactInfo();
}

async function refreshLazyLoadModalCompanyMemberListContactInfo()
{
    const serverConnectionState = await hasServerConnection();

    $(`.company-member-list-view-item-loading-info`).each(async function(){
        const uid = $(this).attr(`data-uid`);
        const contactInfo = await getContactInfo(uid, serverConnectionState);

        const displayName = truncateString(contactInfo.name, 40);

        $(this).find(`.company-member-list-view-item-contact-info`).text(displayName);
        $(this).removeClass(`company-member-list-view-item-loading-info`);
    })
}

function editCompanyMember(companyId, login, isAdmin) {
    initModalCompanyMember(companyId, login, isAdmin)
}
