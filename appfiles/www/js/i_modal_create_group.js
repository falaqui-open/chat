var groupCreationEditMode = false;
var editGroupMembers = [];
var editGroupMembersMessagePermission = [];
var editGroupMembersIsAdmin = [];
var editGroupRecordId = null;
var editGroupCreatorAdmin = null;
var editGroupPhoto = "";
var isUserCreatorAdmin = false;
var editGroupNameLoad = null;

var editGroupPreLoadMembers = [];
var editValidityFromDate = null;
var editValidityBetweenDateStart = null;
var editValidityBetweenDateEnd = null;

var editGroupMembersHasValidity = [];
var editGroupMemberValidityFromDate = [];
var editGroupMemberValidityBetweenDate = [];

const SERVER_STATUS_TAG_CREATE              = 1;
const SERVER_STATUS_TAG_UPDATE              = 2;
const SERVER_STATUS_TAG_UPDATE_WITH_PHOTO   = 3;

$(function() {
    mountModalCreateGroupEvents();
});

function mountModalCreateGroupEvents()
{
    $("#modalCreateGroup").modal({
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

    $(`#btnCloseModalCreateGroup`).off(`click`);
    $(`#btnCloseModalCreateGroup`).on(`click`, function(){
        closeModalCreateGroup();
    });

    $(`#btnAddMembers`).off(`click`);
    $(`#btnAddMembers`).on(`click`, async function(){
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            await initModalContactSelection(editGroupMembers, (selectedContacts) =>{
                // console.log(selectedContacts);
                editGroupMembers = selectedContacts;
    
                refreshGroupEditMembers();
    
                validateGroupToSave();
            })
        }
        else
        {
            const selectedContacts = await initNativeContactListSelectionScreen(editGroupMembers);

            if(selectedContacts == null)
            {
                return;
            }

            editGroupMembers = selectedContacts;

            if(Array.isArray(editGroupMembers) == false)
            {
                editGroupMembers = [];
            }

            editGroupMembers.push(editGroupCreatorAdmin);
    
            refreshGroupEditMembers();

            validateGroupToSave();
        }

    });

    $(`#txtCreateGroupName`).off(`input`);
    $(`#txtCreateGroupName`).on(`input`, function(){
        validateGroupToSave();
    });

    $(`#txtCreateGroupDescription`).off(`input`);
    $(`#txtCreateGroupDescription`).on(`input`, function(){
        validateGroupToSave();
    });

    $(`#createGroupEditChangePhotoRequest`).off(`click`);
    $(`#createGroupEditChangePhotoRequest`).on(`click`, async function(){
        await initModalTakePhoto(100, 100, 80, false, true, async function(imageSetEvent){
            const imageURI = imageSetEvent.detail.image;
            const imageSource = await getDeviceFileBase64URL(imageURI);
            $(`#imgGroupEditPhoto`).attr(`src`, imageSource);

            $(`#btnCreateGroupSave`).attr("data-photouri", imageURI);
            $(`#btnCreateGroupSave`).attr("data-photochanged", "1");

            $(`#createGroupClearPhoto`).removeClass(`hide`);
        });
    });

    $(`#createGroupClearPhoto`).off(`click`);
    $(`#createGroupClearPhoto`).on(`click`, async function(){
        $(`#imgGroupEditPhoto`).attr(`src`, `images/add-photo-padding.png`);
        $(`#createGroupClearPhoto`).addClass(`hide`);
        $(`#btnCreateGroupSave`).removeAttr("data-photouri");
        $(`#btnCreateGroupSave`).attr("data-photochanged", "1");
    });

    $(`#btnCreateGroupSave`).off(`click`);
    $(`#btnCreateGroupSave`).on(`click`, async function(){

        const chkUseGroupAccessHours = $('#chkUseGroupAccessHours').prop('checked') == 1 ? 1 : 0;         

        const txtGroupAccessHoursStart = $(`#txtGroupAccessHoursStart`).val().trim();
        const txtGroupAccessHoursEnd = $(`#txtGroupAccessHoursEnd`).val().trim();
                
        const groupAccessHoursStart = chkUseGroupAccessHours == 1 && txtGroupAccessHoursStart.length == 5 ? timeToIntegerInMinutes(txtGroupAccessHoursStart) : null;        
        const groupAccessHoursEnd = chkUseGroupAccessHours == 1 && txtGroupAccessHoursEnd.length == 5 ? timeToIntegerInMinutes(txtGroupAccessHoursEnd) : null;

        if(chkUseGroupAccessHours == 1)
        {
            const groupAccessHourArr = {                
                "groupAccessHoursStart": groupAccessHoursStart,
                "groupAccessHoursEnd": groupAccessHoursEnd
            };

            const allowedAccess = checkGroupAccessHour(groupAccessHourArr);

            if(allowedAccess == false)
            {
                const swalTitle = getTranslate(`group-save-notallowed-access-title`, `Save Group with outside Access hours`);
                const swalText = getTranslate(`group-save-notallowed-access-text`, `Saving now this group will be outside of permitted access hours. Do you want to save now?`);
                const cancelButtonText = getTranslate(`no`, `NO`);
                const confirmButtonText = getTranslate(`yes`, `YES`);

                swalConfirm(swalTitle, swalText, `warning`, cancelButtonText, confirmButtonText, () => {
                    //on Cancel
            
                }, async () => {
                    //on Confirm
                    saveGroupEdit();
                });
            }
            else
            {
                saveGroupEdit();
            }
        }
        else
        {
            saveGroupEdit();
        }
    });

    $(`#btnGroupMemberLeaveGroup`).off(`click`);
    $(`#btnGroupMemberLeaveGroup`).on(`click`, async function(){

        if(isUserCreatorAdmin == true)
        {
            swal(getTranslate('group-member-creator-admin', 'You created this group as administrator. You will not be able to leave the group.'));

            return;
        }

        memberLeaveGroup();
    });

    $(`#btnDeleteGroup`).off(`click`);
    $(`#btnDeleteGroup`).on(`click`, async function(){
        deleteGroup();
    });

    $(`#chkUseGroupValidity`).off(`change`)
    $(`#chkUseGroupValidity`).on(`change`, function(){
        setGroupValidityVisible();
        validateGroupToSave();
    });

    $(`input[type="radio"][name="groupvalidityperiod"]`).off(`change`);
    $(`input[type="radio"][name="groupvalidityperiod"]`).on(`change`, function(){
        setGroupValidityPeriodVisible();
        validateGroupToSave();
    });

    $(`#chkUseGroupAccessHours`).off(`change`)
    $(`#chkUseGroupAccessHours`).on(`change`, function(){
        setGroupAccessHoursVisible();
        validateGroupToSave();
    });

    $('#btnGroupMemberRemoveFromGroup').off('click')
    $('#btnGroupMemberRemoveFromGroup').on('click', function(){
        deleteGroupMember();
    })

    $(`#txtGroupAccessHoursStart`).mask(`00:00`);
    $(`#txtGroupAccessHoursStart`).off(`change`);
    $(`#txtGroupAccessHoursStart`).on(`change`, function(){
        validateGroupToSave();
    });
    //Criar eventos para os campos referentes aos horários para chamar a função de validação dos valores informados para os mesmos
    $(`#txtGroupAccessHoursEnd`).mask(`00:00`);
    $(`#txtGroupAccessHoursEnd`).off(`change`);
    $(`#txtGroupAccessHoursEnd`).on(`change`, function(){
        validateGroupToSave();
    });

    $(`#txtGroupValidityPeriodFromDate`).datepicker({
        "autoClose": false,
        "format": "dd/mm/yyyy",
        "parse": null,
        "defaultDate": null,
        "setDefaultDate": false,
        "disableWeekends": false,
        "disableDayFn": null,
        "firstDay": 0,
        "minDate": null,
        "maxDate": null,
        "yearRange": 10,
        "isRTL": false,
        "showMonthAfterYear": false,
        "showDaysInNextAndPreviousMonths": false,
        "container": null,
        "showClearBtn": false,
        "events": [],
        "onSelect": function(event){
            const selectedDate = event;

            if(selectedDate != null)
            {
                $(`#txtGroupValidityPeriodFromDate`).attr(`data-value`, event.getTime());
            }
            else
            {
                $(`#txtGroupValidityPeriodFromDate`).removeAttr(`data-value`);
            }

            validateGroupToSave();
        },
        "onOpen": function(event){
        },
        "onClose": function(event){
        },
        "onDraw": function(event){
        }
    });

    //Colocar o evento para inicializar o datepicker de txtGroupValidityPeriodBetweenDateStart e txtGroupValidityPeriodBetweenDateEnd    
    $(`#txtGroupValidityPeriodBetweenDateStart`).datepicker({
        "autoClose": false,
        "format": "dd/mm/yyyy",
        "parse": null,
        "defaultDate": null,
        "setDefaultDate": false,
        "disableWeekends": false,
        "disableDayFn": null,
        "firstDay": 0,
        "minDate": null,
        "maxDate": null,
        "yearRange": 10,
        "isRTL": false,
        "showMonthAfterYear": false,
        "showDaysInNextAndPreviousMonths": false,
        "container": null,
        "showClearBtn": false,
        "events": [],
        "onSelect": function(event){
            
            const selectedDate = event;

            if(selectedDate != null)
            {
                $(`#txtGroupValidityPeriodBetweenDateStart`).attr(`data-value`, event.getTime());
            }
            else
            {
                $(`#txtGroupValidityPeriodBetweenDateStart`).removeAttr(`data-value`);
            }

            validateGroupToSave();
        },
        "onOpen": function(event){

        },
        "onClose": function(event){

        },
        "onDraw": function(event){

        }
    });

    $(`#txtGroupValidityPeriodBetweenDateEnd`).datepicker({
        "autoClose": false,
        "format": "dd/mm/yyyy",
        "parse": null,
        "defaultDate": null,
        "setDefaultDate": false,
        "disableWeekends": false,
        "disableDayFn": null,
        "firstDay": 0,
        "minDate": null,
        "maxDate": null,
        "yearRange": 10,
        "isRTL": false,
        "showMonthAfterYear": false,
        "showDaysInNextAndPreviousMonths": false,
        "container": null,
        "showClearBtn": false,
        "events": [],
        "onSelect": function(event){

            const selectedDate = event;

            if(selectedDate != null)
            {
                $(`#txtGroupValidityPeriodBetweenDateEnd`).attr(`data-value`, event.getTime());
            }
            else
            {
                $(`#txtGroupValidityPeriodBetweenDateEnd`).removeAttr(`data-value`);
            }

            //Criar eventos para os campos referentes aos horários para chamar a função de validação dos valores informados para os mesmos
            validateGroupToSave();
        },
        "onOpen": function(event){

        },
        "onClose": function(event){
            
        },
        "onDraw": function(event){
            
        }
    });
}

async function initModalCreateGroup(isEditMode, preloadMembers, editGroupId)
{
    $("#modalCreateGroup").modal(`open`);

    $(`#btnCreateGroupSave`).removeAttr("data-photouri");
    $(`#imgGroupEditPhoto`).attr(`src`, `images/add-photo-padding.png`);
    $(`#btnCreateGroupSave`).attr("data-photochanged", "0");
    $(`#createGroupClearPhoto`).addClass(`hide`);

    let uid = readLocalStorage("uid");
    groupCreationEditMode = isEditMode;
    editGroupRecordId = editGroupId;

    if(preloadMembers == null)
    {
        preloadMembers = [];
    }

    if(preloadMembers.length > 0)
    {
        editGroupMembers = preloadMembers;
    }
    else
    {
        editGroupMembers = [];
    }


    if(isEditMode == true)
    {        
        swal(getTranslate(`loading-group-data`,`Loading group data...`), {
            button: false, closeOnClickOutside: false
        });

        await loadGroupMembersFromDB(editGroupRecordId);
        await initGroupEditScreen();

        if(isUserCreatorAdmin == true)
        {
            $(`#btnGroupMemberLeaveGroup`).addClass(`hide`);
        }
        else
        {
            $(`#btnGroupMemberLeaveGroup`).removeClass(`hide`);
        }
        
        swal.close();
    }
    else
    {
        editGroupCreatorAdmin = uid;
        clearGroupEditScreen();
        enableGroupEditScreen();
        $(`#btnGroupMemberLeaveGroup`).addClass(`hide`);
    }

    refreshGroupEditMembers();

    if(isEditMode == true)
    {
        validateGroupToSave();
    }
}

async function initGroupEditScreen()
{
    let uid = readLocalStorage("uid");
    const groupRecord = await getChatAppGroupById(editGroupRecordId, false);
    const groupPhoto = await getPhotoGroupURL(editGroupRecordId);

    if(groupRecord == null)
    {
        return;
    }

    const groupName = groupRecord.Name;
    editGroupNameLoad = groupName;
    const groupDescription = groupRecord.Description;

    $(`#groupValidityFields`).addClass(`hide`);
    $(`#groupValidityPeriodFromDateFields`).addClass(`hide`);
    $(`#groupValidityPeriodBetweenDateFields`).addClass(`hide`);

    $('#chkUseGroupValidity').prop('checked', false);
    $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('checked', false);
    $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('checked', false);

    $(`#validateMsgGroupValidity`).addClass(`hide`);
    
    if (groupRecord.HasGroupValidity == 1)
    {
        $('#chkUseGroupValidity').prop('checked', true);
        $('#groupValidityFields').removeClass('hide');        
    }
    
    if (groupRecord.HasGroupValidityFromDate == 1) 
    {
        $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('checked', true);       
        editValidityFromDate = groupRecord.ValidityFromDate;

        setGroupValidityPeriodFromDateValue(groupRecord.ValidityFromDate);        
    }
    
    if (groupRecord.HasGroupValidityBetween == 1) 
    {
        $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('checked', true);
        
        editValidityBetweenDateStart = groupRecord.ValidityBetweenDateStart;
        setGroupValidityPeriodBetweenDateStart(groupRecord.ValidityBetweenDateStart);
        
        editValidityBetweenDateEnd = groupRecord.ValidityBetweenDateEnd;
        setGroupValidityPeriodBetweenDateEnd(groupRecord.ValidityBetweenDateEnd);        
    }

    setGroupValidityVisible();
    setGroupValidityPeriodVisible();

    $('#chkUseGroupAccessHours').prop('checked', false);
    // Marcar o checkbox (chkUseGroupAccessHours) de acordo com AppGroups.HasGroupAccessHours = 1
    if (groupRecord.HasGroupAccessHours == 1) 
    {
        $('#chkUseGroupAccessHours').prop('checked', true);
        // Preencher o campo referente à hora inicial(txtGroupAccessHoursStart) chamando a função timeInMinutesToTimeString(value), onde value é AppGroups.GroupAccessHoursStart
        let groupAccessHoursStart = timeInMinutesToTimeString(groupRecord.GroupAccessHoursStart);
        $('#txtGroupAccessHoursStart').val(groupAccessHoursStart);
        
        // Preencher o campo referente à hora final(txtGroupAccessHoursEnd) chamando a função timeInMinutesToTimeString(value), onde value é AppGroups.GroupAccessHoursEnd
        let groupAccessHoursEnd = timeInMinutesToTimeString(groupRecord.GroupAccessHoursEnd);
        $('#txtGroupAccessHoursEnd').val(groupAccessHoursEnd);
    }

    setGroupAccessHoursVisible();

    $(`#imgGroupEditPhoto`).attr(`src`, groupPhoto);
    $(`#btnCreateGroupSave`).attr("data-photouri", groupPhoto);
    $(`#btnCreateGroupSave`).attr("data-photochanged", "0");
    $(`#createGroupClearPhoto`).removeClass(`hide`);

    $(`#txtCreateGroupName`).val(groupName);
    $(`#txtCreateGroupDescription`).val(groupDescription);

    if(groupCreationEditMode == true)
    {
        const isAdmin = getGroupEditMemberIsAdmin(uid);
        
        if(isAdmin == true)
        {
            enableGroupEditScreen();
            
            if(groupRecord.CreatorAdminLogin == uid)
            {
                isUserCreatorAdmin = true;
            }
            else
            {
                isUserCreatorAdmin = false;
            }
        }
        else
        {
            disableGroupEditScreen();
            isUserCreatorAdmin = false;
        }

    }
}

function disableGroupEditScreen()
{
    $(`#btnAddMembers`).addClass(`hide`);
    $(`#btnCreateGroupSave`).addClass(`hide`);
    $(`#btnDeleteGroup`).addClass(`hide`);

    $(`#createGroupClearPhotoArea`).addClass(`hide`);
    $(`#createGroupChangePhotoLabel`).addClass(`hide`);
    
    $(`#txtCreateGroupName`).attr(`disabled`, `disabled`);
    $(`#txtCreateGroupDescription`).attr(`disabled`, `disabled`);
    
    $(`#chkUseGroupValidity`).attr(`disabled`, `disabled`);
    $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('disabled', true);
    $(`#txtGroupValidityPeriodFromDate`).attr(`disabled`, `disabled`);
    $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('disabled', true);
    $(`#txtGroupValidityPeriodBetweenDateStart`).attr(`disabled`, `disabled`);
    $(`#txtGroupValidityPeriodBetweenDateEnd`).attr(`disabled`, `disabled`);
    
    $('#chkUseGroupAccessHours').prop('disabled', true);
    $('#txtGroupAccessHoursStart').prop('disabled', true);
    $('#txtGroupAccessHoursEnd').prop('disabled', true);
    
    $('btnAddMembers').addClass('hide');
    $('adminMemberItem').addClass('hide');
    $('btnCreateGroupSave').addClass('hide');

    disableGroupEditMember();
}

function disableGroupEditMember()
{
    $(`#btnGroupMemberRemoveFromGroup`).addClass(`hide`);
    $(`#chkGroupMemberEditMessagePermission`).attr(`disabled`, `disabled`);
    $(`#chkGroupMemberEditIsAdmin`).attr(`disabled`, `disabled`);
    
    $(`#chkUseGroupUserValidity`).attr(`disabled`, `disabled`);

    $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodfromdate"]').prop('disabled', true);
    $(`#txtUserGroupValidityPeriodFromDate`).attr(`disabled`, `disabled`);
    $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodbetweendate"]').prop('disabled', true);
    $(`#txtUserGroupValidityPeriodBetweenDateStart`).attr(`disabled`, `disabled`);
    $(`#txtUserGroupValidityPeriodBetweenDateEnd`).attr(`disabled`, `disabled`);
    $('btnUserValiditySave').addClass('hide');
}

function enableGroupEditScreen()
{
    $(`#btnAddMembers`).removeClass(`hide`);
    $(`#btnCreateGroupSave`).removeClass(`hide`);
    $(`#btnDeleteGroup`).removeClass(`hide`);

    $(`#createGroupClearPhotoArea`).removeClass(`hide`);
    $(`#createGroupChangePhotoLabel`).removeClass(`hide`);
    
    $(`#txtCreateGroupName`).removeAttr(`disabled`);
    $(`#txtCreateGroupDescription`).removeAttr(`disabled`);

    $(`#groupValidityFromMsg`).addClass(`hide`);
    $(`#groupValidityBetweenMsg`).addClass(`hide`);

    $(`#chkUseGroupValidity`).removeAttr(`disabled`);
    $(`#txtGroupValidityPeriodFromDate`).removeAttr(`disabled`);
    $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('disabled', false);
    $(`#txtGroupValidityPeriodBetweenDateStart`).removeAttr(`disabled`);
    $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('disabled', false);

    //if validityFromDate is less than today cannot edit group validity check, group validity type and start date
    if(isDateGreaterOrEqualToday(editValidityFromDate) == false && editValidityFromDate != null)
    {
        $(`#txtGroupValidityPeriodFromDate`).attr(`disabled`, `disabled`);
        $(`#chkUseGroupValidity`).attr(`disabled`, `disabled`);
        $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('disabled', true);
        $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('disabled', true);
        $(`#groupValidityFromMsg`).removeClass(`hide`);
    }

    //if validityBetweenDateStart is less than today cannot edit group validity check, group validity type and start date
    if(isDateGreaterOrEqualToday(editValidityBetweenDateStart)== false && editValidityBetweenDateStart != null)
    {
        $(`#txtGroupValidityPeriodBetweenDateStart`).attr(`disabled`, `disabled`);
        $(`#chkUseGroupValidity`).attr(`disabled`, `disabled`);
        $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('disabled', true);
        $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('disabled', true);
        $(`#groupValidityBetweenMsg`).removeClass(`hide`);
    }

    //if validityBetweenDateStart is less than today cannot edit group validity check, group validity type and start date
    if(isDateGreaterOrEqualToday(editValidityBetweenDateStart)== false && editValidityBetweenDateStart != null)
    {
        $(`#txtGroupValidityPeriodBetweenDateStart`).attr(`disabled`, `disabled`);
        $(`#chkUseGroupValidity`).attr(`disabled`, `disabled`);
        $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('disabled', true);
        $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('disabled', true);
        $(`#groupValidityBetweenMsg`).removeClass(`hide`);
    }

    $('#chkUseGroupAccessHours').prop('disabled', false);
    $('#txtGroupAccessHoursStart').prop('disabled', false);
    $('#txtGroupAccessHoursEnd').prop('disabled', false);

    enableGroupEditMember();
}

function enableGroupEditMember()
{
    $(`#btnGroupMemberRemoveFromGroup`).removeClass(`hide`);
    $(`#chkGroupMemberEditMessagePermission`).removeAttr(`disabled`);
    $(`#chkGroupMemberEditIsAdmin`).removeAttr(`disabled`);

    $(`#chkUseGroupUserValidity`).removeAttr(`disabled`, `disabled`);

    $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodfromdate"]').prop('disabled', false);
    $(`#txtUserGroupValidityPeriodFromDate`).removeAttr(`disabled`, `disabled`);
    $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodbetweendate"]').prop('disabled', false);
    $(`#txtUserGroupValidityPeriodBetweenDateStart`).removeAttr(`disabled`, `disabled`);
    $(`#txtUserGroupValidityPeriodBetweenDateEnd`).removeAttr(`disabled`, `disabled`);

    $('btnUserValiditySave').removeClass('hide');
}

function clearGroupEditScreen()
{
    $(`#txtCreateGroupName`).val(``);
    $(`#txtCreateGroupDescription`).val(``);

    $(`#validateMsgGroupName`).removeClass(`hide`);
    $(`#validateMsgGroupDescription`).removeClass(`hide`);

    // Set the current (now) date to field
    const dtNow = new Date();
    const tsNow = dtNow.getTime();
    setGroupValidityPeriodFromDateValue(tsNow);

    // Set validity to checked as default
    $(`#chkUseGroupValidity`).prop('checked', false);
    setGroupValidityVisible();

    // Set validity from date checked by default
    $(`input[type="radio"][name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]`).prop('checked', false);
    $(`input[type="radio"][name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]`).prop('checked', false);
    setGroupValidityPeriodVisible();

    editValidityFromDate = null;
    editValidityBetweenDateStart = null;
    editValidityBetweenDateEnd = null;

    // Set access hours unchecked by default
    $(`#chkUseGroupAccessHours`).prop('checked', false);
    setGroupAccessHoursVisible();

    $(`#validateMsgAddGroupMembers`).removeClass(`hide`);

    $(`#btnCreateGroupSave`).removeAttr("data-photouri");
    $(`#imgGroupEditPhoto`).attr(`src`, `images/add-photo-padding.png`);
    $(`#btnCreateGroupSave`).attr("data-photochanged", "0");
    $(`#createGroupClearPhoto`).addClass(`hide`);

    $(`#adminMemberItem`).find(`.create-group-member-name`).text(``);
    $(`#btnCreateGroupSave`).addClass(`disabled`);
}

function closeModalCreateGroup()
{
    groupCreationEditMode = false;

    editGroupNameLoad = null;
    isUserCreatorAdmin = false;

    editGroupMembers = [];
    editGroupMembersIsAdmin = [];
    editGroupMembersMessagePermission = [];
    editGroupPhoto = "";
    editGroupRecordId = null;
    editGroupCreatorAdmin = null;
    editGroupPreLoadMembers = [];
    editValidityFromDate = null;
    editValidityBetweenDateStart = null;
    editValidityBetweenDateEnd = null;

    editGroupMembersHasValidity = [];
    editGroupMemberValidityFromDate = [];
    editGroupMemberValidityBetweenDate = [];
    
    $(`#btnCreateGroupSave`).removeAttr("data-photouri");
    $(`#btnCreateGroupSave`).attr("data-photochanged", "0");
    $(`#imgGroupEditPhoto`).attr(`src`, `images/add-photo-padding.png`);
    $(`#createGroupClearPhoto`).addClass(`hide`);

    $(`#chkUseGroupValidity`).prop('checked', false);
    setGroupValidityVisible();

    $(`#txtGroupValidityPeriodFromDate`).removeAttr(`data-value`);
    $(`#txtGroupValidityPeriodFromDate`).val('');

    $(`#txtGroupValidityPeriodBetweenDateStart`).removeAttr(`data-value`);
    $(`#txtGroupValidityPeriodBetweenDateStart`).val('');

    $(`#txtGroupValidityPeriodBetweenDateEnd`).removeAttr(`data-value`);
    $(`#txtGroupValidityPeriodBetweenDateEnd`).val('');

    $(`#chkUseGroupAccessHours`).prop('checked', false);
    $(`#txtGroupAccessHoursStart`).val('');
    $(`#txtGroupAccessHoursEnd`).val('');

    setGroupAccessHoursVisible();

    $("#modalCreateGroup").modal(`close`);
}

function refreshGroupEditMembersMessagePermission()
{
    if(editGroupMembers.length == 0)
    {
        editGroupMembersMessagePermission = [];
        return;
    }

    for(let ix = 0; ix < editGroupMembers.length; ix++)
    {
        const contactId = editGroupMembers[ix];

        const ixPermission = editGroupMembersMessagePermission.findIndex((item) =>{
            return item.contactId == contactId;
        });

        if(ixPermission == -1)
        {
            editGroupMembersMessagePermission.push({
                "contactId": contactId,
                "value": true
            });

            $(`.create-group-member-item[data-talktoid="${contactId}"]`).find(`.create-group-member-indicator-no-message-permission`).addClass(`hide`);
        }
        else
        {
            if(editGroupMembersMessagePermission[ixPermission].value == true)
            {
                $(`.create-group-member-item[data-talktoid="${contactId}"]`).find(`.create-group-member-indicator-no-message-permission`).addClass(`hide`);
            }
            else
            {
                $(`.create-group-member-item[data-talktoid="${contactId}"]`).find(`.create-group-member-indicator-no-message-permission`).removeClass(`hide`);
            }
        }        
    }
}



function refreshGroupEditMembersIsAdmin()
{
    if(editGroupMembers.length == 0)
    {
        editGroupMembersIsAdmin = [];
        return;
    }

    for(let ix = 0; ix < editGroupMembers.length; ix++)
    {
        const contactId = editGroupMembers[ix];

        const ixPermission = editGroupMembersIsAdmin.findIndex((item) =>{
            return item.contactId == contactId;
        });

        if(ixPermission == -1)
        {
            editGroupMembersIsAdmin.push({
                "contactId": contactId,
                "value": false
            });

            $(`.create-group-member-item[data-talktoid="${contactId}"]`).find(`.create-group-member-indicator-admin`).addClass(`hide`);
        }
        else
        {
            if(editGroupMembersIsAdmin[ixPermission].value == true)
            {
                $(`.create-group-member-item[data-talktoid="${contactId}"]`).find(`.create-group-member-indicator-admin`).removeClass(`hide`);
            }
            else
            {
                $(`.create-group-member-item[data-talktoid="${contactId}"]`).find(`.create-group-member-indicator-admin`).addClass(`hide`);
            }
        }        
    }
}



function refreshGroupEditMembers()
{
    showLoadingAnimationInSwal();

    // let uid = readLocalStorage("uid");
    // let photo = await getPhotoProfileURL(uid, null, true);

    // $(`#adminMemberItem`).find(`.create-group-member-photo`).attr(`src`, photo);

    if(groupCreationEditMode == false)
    {
        const userInfo = getLastLoginDataInfo();

        if(userInfo == null)
        {
            $(`#adminMemberItem`).find(`.create-group-member-name`).text(``);
        }
        else
        {
            $(`#adminMemberItem`).find(`.create-group-member-name`).text(userInfo.basicinfo.Name);
        }
    
        if(editGroupMembers.length == 0)
        {
            $(`#createGroupMemberList`).empty();
    
            setTimeout(function(){
                swal.close();
            }, 50);
    
            return;
        }    
    }
    else
    {
        // Group owner name will be loaded below
    }

    // let serverConnectionState = await hasServerConnection();

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

    let htmlItems = ``;

    for(let ix = 0; ix < editGroupMembers.length; ix++)
    {
        let contactId = editGroupMembers[ix];

        // if(contactId == editGroupCreatorAdmin)
        // {
        //     continue;
        // }

        // let contactPhoto = `images/contact.png`;
        // contactPhoto = await getPhotoProfileURL(contactId, serverConnectionState, false);

        let contactName = "...";

        const chatRecord = chatReadList.find((item) =>{
            return item.Login == contactId
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
                return phoneNumOnlyNumbers == contactId
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

        if(groupCreationEditMode == false)
        {    
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
                    let phoneDetails = getPhoneFormatsByNumber(contactId, null);
                    let phoneNum = phoneDetails.full;
                    //contactName = phoneNum.full;
                    contactName = phoneNum;
                }
            }
            else
            {
                contactName = chatRecord.Name;
            }
        }
        else
        {
            const recordItem = talkGroupMembers.find((item) =>{
                return item.Login == contactId
            });

            if(recordItem != null)
            {
                contactName = recordItem.LoginName;
            }
            else
            {
                if(chatRecord != null)
                {
                    if(chatRecord.Name != null)
                    {
                        contactName = chatRecord.Name;
                    }
                }
                else
                {
                    if(record != null)
                    {
                        contactName = record.displayName != null ? record.displayName : `${record.firstName} ${record.lastName}`;
                    }
                    else
                    {
                        let phoneDetails = getPhoneFormatsByNumber(contactId, null);
                        let phoneNum = phoneDetails.full;
                        // contactName = phoneNum.full;
                        contactName = phoneNum;
                    }
                }
            }

            if(contactId == editGroupCreatorAdmin)
            {
                $(`#adminMemberItem`).find(`.create-group-member-name`).text(contactName);
                continue;
            }
        }


        // htmlItems += `
        // <a href="#!" class="create-group-member-item collection-item" data-talktoid="${contactId}">
        //     <img class="create-group-member-photo" src="${contactPhoto}" onerror="this.onerror=null;this.src='images/contact.png'" />
        //     <span class="create-group-member-name">${contactName}</span>
        //     <i class="create-group-member-indicator-no-message-permission fa-solid fa-comment-slash hide"></i>
        //     <i class="create-group-member-indicator-admin fa-solid fa-solid fa-user-tie hide"></i>
        // </a>
        // `;

        htmlItems += `
        <a href="#!" class="create-group-member-item collection-item" data-talktoid="${contactId}">
            <span class="create-group-member-name">${contactName}</span>
            <i class="create-group-member-indicator-no-message-permission fa-solid fa-comment-slash hide"></i>
            <i class="create-group-member-indicator-admin fa-solid fa-solid fa-user-tie hide"></i>
        </a>
        `;
    }

    $(`#createGroupMemberList`).html(htmlItems);

    $(`.create-group-member-item`).off(`click`);
    $(`.create-group-member-item`).on(`click`, function(){
        const contactId = $(this).attr(`data-talktoid`);

        initModalGroupMemberEdit(contactId);
    });

    refreshGroupEditMembersMessagePermission();
    refreshGroupEditMembersIsAdmin();
    refreshGroupEditMembersValidity();

    setTimeout(function(){
        swal.close();
    }, 50);
}

function refreshGroupEditMembersValidity()
{
    if(editGroupMembers.length == 0)
    {
        editGroupMembersHasValidity = [];
        editGroupMemberValidityFromDate = [];
        editGroupMemberValidityBetweenDate = [];

        return;
    }

    for(let ix = 0; ix < editGroupMembers.length; ix++)
    {
        const contactId = editGroupMembers[ix];

        const ixHasUserValidity = editGroupMembersHasValidity.findIndex((item) =>{
            return item.contactId == contactId;
        });
    
        if(ixHasUserValidity == -1)
        {
            editGroupMembersHasValidity.push({
                "contactId": contactId,
                "value": false
            });
        }

        const ixUserFromDate = editGroupMemberValidityFromDate.findIndex((item) =>{
            return item.contactId == contactId;
        });
    
        if(ixUserFromDate == -1)
        {
            editGroupMemberValidityFromDate.push({
                "contactId": contactId,
                "value": false,
                "fromDate": null,
                "validityFromDate": null
            });
        }

        const ixUserBtwDate = editGroupMemberValidityBetweenDate.findIndex((item) =>{
            return item.contactId == contactId;
        });
    
        if(ixUserBtwDate == -1)
        {
            editGroupMemberValidityBetweenDate.push({
                "contactId": contactId,
                "value": false,
                "startDate": null,
                "endDate": null,
                "validityStartDate": null,
                "validityEndDate": null
            });
        } 
    }
}

function setGroupEditMemberMessagePermission(contactId, value)
{
    const ixPermission = editGroupMembersMessagePermission.findIndex((item) =>{
        return item.contactId == contactId;
    });

    if(ixPermission == -1)
    {
        editGroupMembersMessagePermission.push({
            "contactId": contactId,
            "value": value
        });
    }
    else
    {
        editGroupMembersMessagePermission[ixPermission].value = value;
    }
}

function getGroupEditMemberMessagePermission(contactId)
{
    const ixPermission = editGroupMembersMessagePermission.findIndex((item) =>{
        return item.contactId == contactId;
    });

    if(ixPermission == -1)
    {
        editGroupMembersMessagePermission.push({
            "contactId": contactId,
            "value": true
        });

        return true;
    }
    
    return editGroupMembersMessagePermission[ixPermission].value;
}



function setGroupEditMemberIsAdmin(contactId, value)
{
    const ixPermission = editGroupMembersIsAdmin.findIndex((item) =>{
        return item.contactId == contactId;
    });

    if(ixPermission == -1)
    {
        editGroupMembersIsAdmin.push({
            "contactId": contactId,
            "value": value
        });
    }
    else
    {
        editGroupMembersIsAdmin[ixPermission].value = value;
    }
}

function getGroupEditMemberIsAdmin(contactId)
{
    const ixPermission = editGroupMembersIsAdmin.findIndex((item) =>{
        return item.contactId == contactId;
    });

    if(ixPermission == -1)
    {
        editGroupMembersIsAdmin.push({
            "contactId": contactId,
            "value": false
        });

        return false;
    }
    
    return editGroupMembersIsAdmin[ixPermission].value;
}



function validateGroupToSave()
{
    $(`#btnCreateGroupSave`).addClass(`disabled`);

    /* editGroupMember will be validated after validity and access hour validate info
    if(editGroupMembers.length == 0)
    {
        return false;
    }*/

    const isGroupValidityChecked = $('#chkUseGroupValidity').prop('checked');
    const isAccessHoursChecked = $('#chkUseGroupAccessHours').prop('checked');
    
    if($(`#txtCreateGroupName`).val().trim().length == 0)
    {
        $(`#validateMsgGroupName`).removeClass(`hide`);
        
        validateGroupWarning(isGroupValidityChecked,isAccessHoursChecked);
        
        return false;
    }
    else
    {
        $(`#validateMsgGroupName`).addClass(`hide`);
    }

    if($(`#txtCreateGroupDescription`).val().trim().length == 0)
    {
        $(`#validateMsgGroupDescription`).removeClass(`hide`);
        validateGroupWarning(isGroupValidityChecked,isAccessHoursChecked);
        return false;
    }
    else
    {
        $(`#validateMsgGroupDescription`).addClass(`hide`);
    }

    //if ($('#chkUseGroupValidity').prop('checked'))
    if (isGroupValidityChecked == true)
    {
        const isPerdioFromDateChecked = $(`input[type="radio"][name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]`).prop('checked');
        const isPeriodBtwChecked = $(`input[type="radio"][name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]`).prop('checked');
        
        if (isPerdioFromDateChecked == false && isPeriodBtwChecked == false)
        {
            //$(`#validateMsgGroupValidity`).removeClass(`hide`);
            validateGroupWarning(isGroupValidityChecked,isAccessHoursChecked);
            return false;
        }
        /*else
        {
            $(`#validateMsgGroupValidity`).addClass(`hide`);
        }*/

        if (isPerdioFromDateChecked == true) 
        {
            let txtGroupValidityPeriodFromDateValue = $(`#txtGroupValidityPeriodFromDate`).attr(`data-value`);

            if(txtGroupValidityPeriodFromDateValue == null)
            {
                //$(`#validateMsgGroupFromDate`).removeClass(`hide`);
                validateGroupWarning(isGroupValidityChecked,isAccessHoursChecked);
                return false;
            }/*
            else
            {
                $(`#validateMsgGroupFromDate`).addClass(`hide`);
            }*/
            
            //editValidityFromDate == null is not in editMode, only validates this value when DB value is greater or equals today (only in this case is possible to edit)

            if (editValidityFromDate == null || isDateGreaterOrEqualToday(editValidityFromDate) == true) //editValidityFromDate - validityFromDate value from BD
            {
                if (isDateGreaterOrEqualToday(txtGroupValidityPeriodFromDateValue) == false)
                {                 
                    swal(getTranslate(`msg-from-date-greater`,`The from date must be greater than today`));
                    
                    if(editValidityFromDate == null)
                    {
                        // Set the current (now) date to field
                        const dtNow = new Date();
                        const tsNow = dtNow.getTime();
                        setGroupValidityPeriodFromDateValue(tsNow);
                    }
                    else
                    {
                        setGroupValidityPeriodFromDateValue(editValidityFromDate);
                    }
                    
                    return false;
                }
            }
            
        }

        if (isPeriodBtwChecked == true) 
        {
            let txtGroupValidityPeriodBetweenDateStartValue = $(`#txtGroupValidityPeriodBetweenDateStart`).attr(`data-value`);
            let txtGroupValidityPeriodBetweenDateEndValue = $(`#txtGroupValidityPeriodBetweenDateEnd`).attr(`data-value`);
            
            if(txtGroupValidityPeriodBetweenDateStartValue == null)
            {
                //$(`#validateMsgGroupStartDate`).removeClass(`hide`);

                validateGroupWarning(isGroupValidityChecked,isAccessHoursChecked);

                return false;
            }/*
            else
            {                
                $(`#validateMsgGroupStartDate`).addClass(`hide`);                
            } */          

            if(editValidityBetweenDateStart == null || isDateGreaterOrEqualToday(editValidityBetweenDateStart) == true) //editValidityBetweenDateStart - validityFromDate value from BD
            {
                if (isDateGreaterOrEqualToday(txtGroupValidityPeriodBetweenDateStartValue) == false)
                {
                    swal(getTranslate(`msg-from-date-greater`,`The from date must be greater than today`));
                    // Set the current (now) date to field
                    if(editValidityBetweenDateStart == null)
                    {
                        const dtNow = new Date();
                        const tsNow = dtNow.getTime();
                        setGroupValidityPeriodBetweenDateStart(tsNow);
                    }
                    else
                    {
                        setGroupValidityPeriodBetweenDateStart(editValidityBetweenDateStart);
                    }

                    //validateGroupValidityEndDateMsg(txtGroupValidityPeriodBetweenDateEndValue);
                    validateGroupWarning(isGroupValidityChecked,isAccessHoursChecked);
                    return false;
                }
            }
            
            if (txtGroupValidityPeriodBetweenDateEndValue == null) 
            {
                //$(`#validateMsgGroupEndDate`).removeClass(`hide`);
                validateGroupWarning(isGroupValidityChecked,isAccessHoursChecked);
                return false;
            }/*
            else
            {
                $(`#validateMsgGroupEndDate`).addClass(`hide`);
            }*/
            
            //only validates when there is no date end loaded or date end loaded is greater than today (if is not greater cannot edit)
            if(editValidityBetweenDateEnd == null || isDateGreaterOrEqualToday(editValidityBetweenDateEnd) == true)
            {
                //if (txtGroupValidityPeriodBetweenDateEndValue < txtGroupValidityPeriodBetweenDateStartValue) 
                if(isDateEndLessDateStart(txtGroupValidityPeriodBetweenDateEndValue,txtGroupValidityPeriodBetweenDateStartValue) == true)
                {
                    swal(getTranslate(`msg-start-date-less-end`,`The start date must be less than end date`));
                    
                    const instanceDateStart = M.Datepicker.getInstance($(`#txtGroupValidityPeriodBetweenDateStart`)[0]);
                    const tsDateStartValue = parseInt(txtGroupValidityPeriodBetweenDateStartValue);
                    const tsDateEndValue = parseInt(txtGroupValidityPeriodBetweenDateEndValue);
                                        
                    if(instanceDateStart.isOpen == true)
                    {
                        const dateStart = editValidityBetweenDateStart == null ?  tsDateEndValue : editValidityBetweenDateStart;
                        setGroupValidityPeriodBetweenDateStart(dateStart);
                    }
                    else
                    {
                        
                        const dateEnd = editValidityBetweenDateEnd == null ? tsDateStartValue : editValidityBetweenDateEnd;
                        setGroupValidityPeriodBetweenDateEnd(dateEnd);
                    }
    
                    return false;
                }
            }
            
        }

        validateGroupValidityWarning();
    }

    //if ($('#chkUseGroupAccessHours').prop('checked')) 
    if (isAccessHoursChecked == true) 
    {
        let txtGroupAccessHoursStart = $(`#txtGroupAccessHoursStart`).val().trim();
        let txtGroupAccessHoursEnd = $('#txtGroupAccessHoursEnd').val().trim();

        if (txtGroupAccessHoursStart.length == 0) 
        {
            //$(`#validateMsgGroupStartTime`).removeClass(`hide`);

            //validateGroupAccessUntilTimeMsg(txtGroupAccessHoursEnd);

            validateGroupAccessWarning();
            validateAddGroupMembersWarning();

            return false;
        }/*
        else
        {
            $(`#validateMsgGroupStartTime`).addClass(`hide`);
            validateGroupAccessUntilTimeMsg(txtGroupAccessHoursEnd);
        }*/

        if (txtGroupAccessHoursEnd.length == 0) 
        {
            //$(`#validateMsgGroupEndDate`).removeClass(`hide`);
            validateGroupAccessWarning();
            validateAddGroupMembersWarning();
            return false;
        }/*
        else
        {
            $(`#validateMsgGroupEndDate`).addClass(`hide`);
        }*/

        const txtGroupAccessHoursStartValue = timeToIntegerInMinutes(txtGroupAccessHoursStart);
        const txtGroupAccessHoursEndValue = timeToIntegerInMinutes(txtGroupAccessHoursEnd);

        if (txtGroupAccessHoursEnd.length > 0) 
        {
            if (txtGroupAccessHoursStartValue > txtGroupAccessHoursEndValue)
            {
                swal(getTranslate(`msg-start-hour-less-end`,'The start time must be less than the until time.'));
                return false;
            }
        }
        
        validateGroupAccessWarning();
    }

    if(validateAddGroupMembersWarning() == false)
    {           
        return false;
    }
    

    $(`#btnCreateGroupSave`).removeClass(`disabled`);

    return true;
}

function validateGroupWarning(isGroupValidityChecked,isAccessHoursChecked)
{
    if(isGroupValidityChecked == true)
    {
        validateGroupValidityWarning();
    }

    if(isAccessHoursChecked == true)
    {
        validateGroupAccessWarning();
    }

    validateAddGroupMembersWarning();
}
function validateGroupValidityWarning()
{
    const isPerdioFromDateChecked = $(`input[type="radio"][name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]`).prop('checked');
    const isPeriodBtwChecked = $(`input[type="radio"][name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]`).prop('checked');

    if (isPerdioFromDateChecked == false && isPeriodBtwChecked == false)
    {
        $(`#validateMsgGroupValidity`).removeClass(`hide`);        
    }
    else
    {
        $(`#validateMsgGroupValidity`).addClass(`hide`);
    }

    if (isPerdioFromDateChecked == true) 
    {
        let txtGroupValidityPeriodFromDateValue = $(`#txtGroupValidityPeriodFromDate`).attr(`data-value`);

        if(txtGroupValidityPeriodFromDateValue == null)
        {
            $(`#validateMsgGroupFromDate`).removeClass(`hide`);
        }
        else
        {
            $(`#validateMsgGroupFromDate`).addClass(`hide`);
        }
    }

    if (isPeriodBtwChecked == true) 
    {
        let txtGroupValidityPeriodBetweenDateStartValue = $(`#txtGroupValidityPeriodBetweenDateStart`).attr(`data-value`);
        let txtGroupValidityPeriodBetweenDateEndValue = $(`#txtGroupValidityPeriodBetweenDateEnd`).attr(`data-value`);
        
        if(txtGroupValidityPeriodBetweenDateStartValue == null)
        {
            $(`#validateMsgGroupStartDate`).removeClass(`hide`);

            validateGroupValidityEndDateWarning(txtGroupValidityPeriodBetweenDateEndValue);
        }
        else
        {
            $(`#validateMsgGroupStartDate`).addClass(`hide`);                
        }

        if (txtGroupValidityPeriodBetweenDateEndValue == null) 
        {
            $(`#validateMsgGroupEndDate`).removeClass(`hide`);
        }
        else
        {
            $(`#validateMsgGroupEndDate`).addClass(`hide`);
        }
    }
}

function validateGroupValidityEndDateWarning(txtGroupValidityPeriodBetweenDateEndValue)
{
    if(txtGroupValidityPeriodBetweenDateEndValue == null)
    {
        $(`#validateMsgGroupEndDate`).removeClass(`hide`);
    }
    else
    {
        $(`#validateMsgGroupEndDate`).addClass(`hide`);
    }
}

function validateGroupAccessWarning()
{
    let txtGroupAccessHoursStart = $(`#txtGroupAccessHoursStart`).val().trim();
    let txtGroupAccessHoursEnd = $('#txtGroupAccessHoursEnd').val().trim();

    if (txtGroupAccessHoursStart.length == 0) 
    {
        $(`#validateMsgGroupStartTime`).removeClass(`hide`);
    }
    else
    {
        $(`#validateMsgGroupStartTime`).addClass(`hide`);        
    }

    validateGroupAccessUntilTimeWrng(txtGroupAccessHoursEnd);
    
}

function validateGroupAccessUntilTimeWrng(txtGroupAccessHoursEnd)
{
    if (txtGroupAccessHoursEnd.length == 0)
    {
        $(`#validateMsgGroupUntilTime`).removeClass(`hide`);
    }
    else
    {
        $(`#validateMsgGroupUntilTime`).addClass(`hide`);
    }
}

function validateAddGroupMembersWarning()
{
    let result = false;
    const hasGroupMember = editGroupMembers.length > 0 ? true : false;

    if(hasGroupMember == false)
    {
        $(`#validateMsgAddGroupMembers`).removeClass(`hide`);
        result = false;      
    }
    else
    {
        $(`#validateMsgAddGroupMembers`).addClass(`hide`);
        result = true;
    }

    return result;
}

async function saveGroupEdit()
{
    const isValid = validateGroupToSave();

    if(isValid == false)
    {
        return;
    }

    showLoadingAnimationInSwal();

    editGroupPhoto = $(`#btnCreateGroupSave`).attr(`data-photouri`);

    const groupPhotoChangedValue = $(`#btnCreateGroupSave`).attr("data-photochanged");
    const groupPhotoChanged = groupPhotoChangedValue == "1";


    if(editGroupPhoto == null)
    {
        editGroupPhoto = "";
    }  

    const groupName = $(`#txtCreateGroupName`).val().trim();
    const groupDescription = $(`#txtCreateGroupDescription`).val().trim();
    let groupPhoto = editGroupPhoto;

    // console.log(`👾 Group Photo to be saved into local database: ${groupPhoto}`);

    if(groupCreationEditMode == false)
    {
        await saveNewGroup(groupName, groupDescription, groupPhoto);
    }
    else
    {
        // Update group
        await saveEditedGroup(groupName, groupDescription, groupPhoto, groupPhotoChanged);
    }

    setTimeout(function(){
        swal.close();
    }, 200);
}

async function saveNewGroup(groupName, groupDescription, groupPhoto)
{
    const newGroupId = makeid(32);
    const newGroupAdmin = readLocalStorage("uid");
    const newGroupCreationTime = new Date().getTime();
    
    const chkUseGroupValidity = $('#chkUseGroupValidity').prop('checked') == true ? 1 : 0; 
    
    const periodFromDateChecked = $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('checked');
    const hasGroupValidityFromDate = chkUseGroupValidity == 1 && periodFromDateChecked == true ? 1 : 0;
    const groupValidityPeriodFromDateTimeStamp = chkUseGroupValidity == 1 && hasGroupValidityFromDate == 1 ? getGroupValidityPeriodFromDateValue() : null;
    
    const hasGroupValidityBetween = $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('checked') ? 1 : 0;
    const validityBetweenDateStart = chkUseGroupValidity == 1 && hasGroupValidityBetween == 1 ? getGroupValidityPeriodBtwDateStartValue() : null;        
    const validityBetweenDateEnd = chkUseGroupValidity == 1 && hasGroupValidityBetween == 1 ? getGroupValidityPeriodBtwDateEndValue() : null;

    const chkUseGroupAccessHours = $('#chkUseGroupAccessHours').prop('checked') == 1 ? 1 : 0; 
    const hasGroupAccessHours = chkUseGroupAccessHours == 1 ? 1 : 0;

    const txtGroupAccessHoursStart = $(`#txtGroupAccessHoursStart`).val().trim();
    const txtGroupAccessHoursEnd = $(`#txtGroupAccessHoursEnd`).val().trim();
            
    const groupAccessHoursStart = chkUseGroupAccessHours == 1 && txtGroupAccessHoursStart.length == 5 ? timeToIntegerInMinutes(txtGroupAccessHoursStart) : null;        
    const groupAccessHoursEnd = chkUseGroupAccessHours == 1 && txtGroupAccessHoursEnd.length == 5 ? timeToIntegerInMinutes(txtGroupAccessHoursEnd) : null;


    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        await saveGroupPhotoInDefaultDeviceLocal(groupPhoto, newGroupId);
    }


    let scriptList = [];
    let scriptListValues = [];

    // Insert Group
    const scriptInsertGroup =
        `INSERT INTO AppGroups 
            (GroupId, 
            Name, 
            Description, 
            Photo,
            CreatorAdminLogin, 
            PrivateKey, CreationDate, HasGroupValidity, HasGroupValidityFromDate, ValidityFromDate, HasGroupValidityBetween, 
            ValidityBetweenDateStart, ValidityBetweenDateEnd, HasGroupAccessHours, GroupAccessHoursStart, GroupAccessHoursEnd) 
        VALUES(?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const scriptInsertGroupValues = [newGroupId, 
        groupName, 
        groupDescription, 
        groupPhoto, 
        newGroupAdmin, newGroupCreationTime, chkUseGroupValidity, hasGroupValidityFromDate, 
        groupValidityPeriodFromDateTimeStamp, hasGroupValidityBetween, validityBetweenDateStart, validityBetweenDateEnd, hasGroupAccessHours, groupAccessHoursStart, groupAccessHoursEnd];
    scriptList.push(scriptInsertGroup);
    scriptListValues.push(scriptInsertGroupValues);

    // Insert Admin Member
    const adminIsAdmin = 1;
    const adminMessagePermission = 1;
    const adminWaitingForApproval = 0;
    const adminLoginApproved = 1;
    const adminStatusDelivered = 1;
    const adminRemoved = 0;
    const hasUserValidity = 0;
    const hasUserValidityFromDate = 0;
    const userValidityFromDate = null;        
    const hasUserValidityBetween = 0;
    const userValidityBetweenDateStart = null;        
    const userValidityBetweenDateEnd = null;

    const scriptInsertAdminMember = `INSERT INTO AppGroupMembers 
        (GroupId, Login, IsAdmin, MessagePermission, WaitingLoginApproval, LoginApproved, StatusDelivered, Removed, CreationDate, 
            HasUserValidity, HasUserValidityFromDate, UserValidityFromDate, HasUserValidityBetween, UserValidityBetweenDateStart, UserValidityBetweenDateEnd) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const scriptInsertAdminMemberValues = [newGroupId, newGroupAdmin, adminIsAdmin, adminMessagePermission, adminWaitingForApproval, adminLoginApproved, adminStatusDelivered, 
        adminRemoved, newGroupCreationTime, hasUserValidity, hasUserValidityFromDate, userValidityFromDate, hasUserValidityBetween, userValidityBetweenDateStart, userValidityBetweenDateEnd];
    scriptList.push(scriptInsertAdminMember);
    scriptListValues.push(scriptInsertAdminMemberValues);

    // Insert Members
    for(let ix = 0; ix < editGroupMembers.length; ix++)
    {
        const memberContactId = editGroupMembers[ix];

        if(memberContactId == newGroupAdmin)
        {
            // Skip it, admin is already include previously
            continue;
        }

        // Get is admin member value
        const memberIsAdminRecord = editGroupMembersIsAdmin.find((item) =>{
            return item.contactId == memberContactId;
        });

        let memberIsAdmin = 0;
        if(memberIsAdminRecord != null)
        {
            memberIsAdmin = memberIsAdminRecord.value == true ? 1 : 0;
        }


        // Get member message permission value
        const memberMessagePermissionRecord = editGroupMembersMessagePermission.find((item) =>{
            return item.contactId == memberContactId;
        });

        let memberMessagePermission = 1;
        if(memberMessagePermissionRecord != null)
        {
            memberMessagePermission = memberMessagePermissionRecord.value == true ? 1 : 0;
        }

        // Get member has user validity
        const memberHasUserValidityRecord = editGroupMembersHasValidity.find((item) =>{
            return item.contactId == memberContactId;
        });

        let memberHasUserValidity = 0

        if(memberHasUserValidityRecord != null)
        {
            memberHasUserValidity = memberHasUserValidityRecord.value == true ? 1 : 0;
        }
        
        let memberHasUserValidityFromDate = 0;
        let memberValidityFromDate = null;

        // Get member has user validity from Date
        const memberHasUserValidityFromDateRecord = editGroupMemberValidityFromDate.find((item) =>{
            return item.contactId == memberContactId;
        });

        if(memberHasUserValidityFromDateRecord != null)
        {
            memberHasUserValidityFromDate = memberHasUserValidityFromDateRecord.value == true ? 1 : 0;
            if(memberHasUserValidityFromDate == 1)
            {
                memberValidityFromDate = memberHasUserValidityFromDateRecord.fromDate;
            }
        }

        let memberHasUserValidityBetween = 0;
        let memberValidityBetweenDateStart = null;        
        let memberValidityBetweenDateEnd = null;

        // Get member has user validity from Date
        const memberHasUserValidityBetweenRecord = editGroupMemberValidityBetweenDate.find((item) =>{
            return item.contactId == memberContactId;
        });

        if(memberHasUserValidityBetweenRecord != null)
        {
            memberHasUserValidityBetween = memberHasUserValidityBetweenRecord.value == true ? 1 : 0;
            if(memberHasUserValidityBetween == 1)
            {
                memberValidityBetweenDateStart = memberHasUserValidityBetweenRecord.startDate;
                memberValidityBetweenDateEnd = memberHasUserValidityBetweenRecord.endDate;
            }
        }

        const memberWaitingForApproval = 1;
        const memberLoginApproved = 0;
        const memberStatusDelivered = 0;
        const memberRemoved = 0;

        const scriptInsertMember = `INSERT INTO AppGroupMembers (
                                        GroupId, 
                                        Login, 
                                        IsAdmin, 
                                        MessagePermission, 
                                        HasUserValidity,
                                        HasUserValidityFromDate,
                                        UserValidityFromDate,
                                        HasUserValidityBetween,
                                        UserValidityBetweenDateStart,
                                        UserValidityBetweenDateEnd,
                                        WaitingLoginApproval, 
                                        LoginApproved, 
                                        StatusDelivered, 
                                        Removed, 
                                        CreationDate
                                    )
                                    VALUES 
                                    (
                                        ?, 
                                        ?, 
                                        ?, 
                                        ?,
                                        ?,
                                        ?,
                                        ?,
                                        ?,
                                        ?, 
                                        ?, 
                                        ?, 
                                        ?, 
                                        ?, 
                                        ?, 
                                        ?
                                    )`;
        const scriptInsertMemberValues = [
            newGroupId, 
            memberContactId, 
            memberIsAdmin, 
            memberMessagePermission,
            memberHasUserValidity,
            memberHasUserValidityFromDate,
            memberValidityFromDate,
            memberHasUserValidityBetween,
            memberValidityBetweenDateStart,
            memberValidityBetweenDateEnd,
            memberWaitingForApproval,
            memberLoginApproved, 
            memberStatusDelivered, 
            memberRemoved, 
            newGroupCreationTime];
        scriptList.push(scriptInsertMember);
        scriptListValues.push(scriptInsertMemberValues);

    }

    // Insert Group waiting for server status
    await insertAppGroupWaitingForServerStatusUpdate(newGroupId, SERVER_STATUS_TAG_CREATE, scriptList, scriptListValues);
    // const scriptGroupWaitingForServerStatus = `INSERT INTO AppGroupWaitingForServerStatusUpdate (GroupId, StatusTag) VALUES (?, ?)`;
    // const scriptGroupWaitingForServerStatusValues = [newGroupId, SERVER_STATUS_TAG_CREATE];
    // scriptList.push(scriptGroupWaitingForServerStatus);
    // scriptListValues.push(scriptGroupWaitingForServerStatusValues);

    await dbRunManyInSameTransaction(scriptList, scriptListValues);

    refreshGroupList();
    closeModalCreateGroup();

    // Open chat with group
    await waitTime(5000);

    if(chkUseGroupValidity == 1)
    {
        const groupValidityArr = {                
            "hasGroupValidityFromDate": hasGroupValidityFromDate,
            "validityFromDate": groupValidityPeriodFromDateTimeStamp,
            "hasGroupValidityBetween": hasGroupValidityBetween,
            "validityBetweenDateStart": validityBetweenDateStart,
            "validityBetweenDateEnd": validityBetweenDateEnd
        };

        checkGroupEditedValidity(groupValidityArr);
        checkInvalidGroupToSendMessage();
    }

    if(hasGroupAccessHours == 1)
    {
        const groupAccessHourArr = {                
            "groupAccessHoursStart": groupAccessHoursStart,
            "groupAccessHoursEnd": groupAccessHoursEnd
        };

        const allowedAccess = checkGroupAccessHour(groupAccessHourArr);

        if(allowedAccess == true)
        {
            await openChatWithContact(newGroupId);
        }
    }
    else
    {
        await openChatWithContact(newGroupId);
    }
    
    //$(`#chatTalkToPhoto`).attr(`src`, editGroupPhoto);

    closeModalNewContact();
}

async function saveEditedGroup(groupName, groupDescription, groupPhoto, groupPhotoChanged)
{
    let scriptList = [];
    let scriptListValues = [];
    const groupUpdateTime = new Date().getTime();

    const chkUseGroupValidity = $('#chkUseGroupValidity').prop('checked') == true ? 1 : 0; 
    
    const periodFromDateChecked = $('input[name="groupvalidityperiod"][value="groupvalidityperiodfromdate"]').prop('checked');
    const hasGroupValidityFromDate = chkUseGroupValidity == 1 && periodFromDateChecked == true ? 1 : 0;
    const groupValidityPeriodFromDateTimeStamp = chkUseGroupValidity == 1 && hasGroupValidityFromDate == 1 ? getGroupValidityPeriodFromDateValue() : null;
    
    const hasGroupValidityBetween = $('input[name="groupvalidityperiod"][value="groupvalidityperiodbtwdate"]').prop('checked') ? 1 : 0;
    const validityBetweenDateStart = chkUseGroupValidity == 1 && hasGroupValidityBetween == 1 ? getGroupValidityPeriodBtwDateStartValue() : null;        
    const validityBetweenDateEnd = chkUseGroupValidity == 1 && hasGroupValidityBetween == 1 ? getGroupValidityPeriodBtwDateEndValue() : null;

    const chkUseGroupAccessHours = $('#chkUseGroupAccessHours').prop('checked') == 1 ? 1 : 0; 
    const hasGroupAccessHours = chkUseGroupAccessHours == 1 ? 1 : 0;

    const txtGroupAccessHoursStart = $(`#txtGroupAccessHoursStart`).val().trim();
    const txtGroupAccessHoursEnd = $(`#txtGroupAccessHoursEnd`).val().trim();
            
    const groupAccessHoursStart = chkUseGroupAccessHours == 1 && txtGroupAccessHoursStart.length == 5 ? timeToIntegerInMinutes(txtGroupAccessHoursStart) : null;        
    const groupAccessHoursEnd = chkUseGroupAccessHours == 1 && txtGroupAccessHoursEnd.length == 5 ? timeToIntegerInMinutes(txtGroupAccessHoursEnd) : null;

    // Update Group
    if(groupPhotoChanged == true)
    {
        const scriptUpdateGroup = `UPDATE AppGroups 
                                        SET Name = ?, 
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
                                        EditDate = ?, 
                                        LastAction = 'Update App', 
                                        LastActionDate = ? 
                                    WHERE 
                                        GroupId = ?
                                    `;
        const scriptUpdateGroupValues = [groupName, 
                                        groupDescription, 
                                        groupPhoto, 
                                        chkUseGroupValidity,
                                        hasGroupValidityFromDate,
                                        groupValidityPeriodFromDateTimeStamp,
                                        hasGroupValidityBetween,
                                        validityBetweenDateStart,
                                        validityBetweenDateEnd,
                                        hasGroupAccessHours,
                                        groupAccessHoursStart,
                                        groupAccessHoursEnd,
                                        groupUpdateTime, 
                                        groupUpdateTime, 
                                        editGroupRecordId];
        scriptList.push(scriptUpdateGroup);
        scriptListValues.push(scriptUpdateGroupValues);
    }
    else
    {
        const scriptUpdateGroup = `UPDATE AppGroups 
                                        SET Name = ?, 
                                        Description = ?, 
                                        HasGroupValidity = ?,
                                        HasGroupValidityFromDate = ?, 
                                        ValidityFromDate = ?,
                                        HasGroupValidityBetween = ?,
                                        ValidityBetweenDateStart = ?,
                                        ValidityBetweenDateEnd = ?,
                                        HasGroupAccessHours = ?,
                                        GroupAccessHoursStart = ?,
                                        GroupAccessHoursEnd = ?,
                                        EditDate = ?, 
                                        LastAction = 'Update App', 
                                        LastActionDate = ? 
                                    WHERE 
                                        GroupId = ?
                                    `;
        const scriptUpdateGroupValues = [groupName, 
                                         groupDescription, 
                                         chkUseGroupValidity,
                                         hasGroupValidityFromDate,
                                         groupValidityPeriodFromDateTimeStamp,
                                         hasGroupValidityBetween,
                                         validityBetweenDateStart,
                                         validityBetweenDateEnd,
                                         hasGroupAccessHours,
                                         groupAccessHoursStart,
                                         groupAccessHoursEnd,
                                         groupUpdateTime, 
                                         groupUpdateTime, 
                                         editGroupRecordId];
        scriptList.push(scriptUpdateGroup);
        scriptListValues.push(scriptUpdateGroupValues);
    }


    // Read all members before update
    const scriptViewGroupMembers = `SELECT Login FROM AppGroupMembers WHERE GroupId = ?`;
    const scriptViewGroupMembersValues = [editGroupRecordId];
    const currentMembers = await dbRun(scriptViewGroupMembers, scriptViewGroupMembersValues);
    const currentMembersArr = [];

    //for(let ix = 0; ix < responseMembers.rows.length; ix++)
    for(let ix = 0; ix < currentMembers.rows.length; ix++)
    {
        const memberRead = currentMembers.rows.item(ix);
        currentMembersArr.push(memberRead);
        
        const memberInEdition = editGroupMembers.find((item) =>{
            return item == memberRead.Login;
        });

        if(memberInEdition == null)
        {
            // Removed from group member list
            const scriptRemoveFromGroup = `DELETE FROM AppGroupMembers WHERE GroupId = ? AND Login = ?`;
            const scriptRemoveFromGroupValues = [editGroupRecordId, memberRead.Login];
            scriptList.push(scriptRemoveFromGroup);
            scriptListValues.push(scriptRemoveFromGroupValues);
        }
        else
        {
            // Update member

            // Get is admin member value
            const memberIsAdminRecord = editGroupMembersIsAdmin.find((item) =>{
                return item.contactId == memberRead.Login;
            });

            let memberIsAdmin = 0;
            if(memberIsAdminRecord != null)
            {
                memberIsAdmin = memberIsAdminRecord.value == true ? 1 : 0;
            }

            // Get member message permission value
            const memberMessagePermissionRecord = editGroupMembersMessagePermission.find((item) =>{
                return item.contactId == memberRead.Login;
            });

            let memberMessagePermission = 1;
            if(memberMessagePermissionRecord != null)
            {
                memberMessagePermission = memberMessagePermissionRecord.value == true ? 1 : 0;
            }

            // Get member has user validity
            const memberHasUserValidityRecord = editGroupMembersHasValidity.find((item) =>{
                return item.contactId == memberRead.Login;
            });

            let memberHasUserValidity = 0

            if(memberHasUserValidityRecord != null)
            {
                memberHasUserValidity = memberHasUserValidityRecord.value == true ? 1 : 0;
            }

            let memberHasUserValidityFromDate = 0;
            let memberValidityFromDate = null;

            // Get member has user validity from Date
            const memberHasUserValidityFromDateRecord = editGroupMemberValidityFromDate.find((item) =>{
                return item.contactId == memberRead.Login;
            });

            if(memberHasUserValidityFromDateRecord != null)
            {
                memberHasUserValidityFromDate = memberHasUserValidityFromDateRecord.value == true ? 1 : 0;
                if(memberHasUserValidityFromDate == 1)
                {
                    memberValidityFromDate = memberHasUserValidityFromDateRecord.fromDate;
                }
            }

            let memberHasUserValidityBetween = 0;
            let memberValidityBetweenDateStart = null;        
            let memberValidityBetweenDateEnd = null;

            // Get member has user validity from Date
            const memberHasUserValidityBetweenRecord = editGroupMemberValidityBetweenDate.find((item) =>{
                return item.contactId == memberRead.Login;
            });

            if(memberHasUserValidityBetweenRecord != null)
            {
                memberHasUserValidityBetween = memberHasUserValidityBetweenRecord.value == true ? 1 : 0;
                
                if(memberHasUserValidityBetween == 1)
                {
                    memberValidityBetweenDateStart = memberHasUserValidityBetweenRecord.startDate;
                    memberValidityBetweenDateEnd = memberHasUserValidityBetweenRecord.endDate;
                }
            }

            const scriptUpdateGroupMember = `UPDATE AppGroupMembers SET 
                                                    IsAdmin = ?, 
                                                    MessagePermission = ?,
                                                    HasUserValidity = ?,
                                                    HasUserValidityFromDate = ?,
                                                    UserValidityFromDate = ?,
                                                    HasUserValidityBetween = ?,
                                                    UserValidityBetweenDateStart = ?,
                                                    UserValidityBetweenDateEnd = ?
                                            WHERE 
                                            GroupId = ? AND 
                                            Login = ?
                                            `;
            const scriptUpdateGroupMemberValues = [
                memberIsAdmin, 
                memberMessagePermission, 
                memberHasUserValidity,
                memberHasUserValidityFromDate,
                memberValidityFromDate,
                memberHasUserValidityBetween,
                memberValidityBetweenDateStart,
                memberValidityBetweenDateEnd,
                editGroupRecordId, 
                memberRead.Login];

            scriptList.push(scriptUpdateGroupMember);
            scriptListValues.push(scriptUpdateGroupMemberValues);

        }
    }

    // Check if the member in edition exists saved into current members, 
    // if it is not, consider a member to insert as new member
    for(let ix = 0; ix < editGroupMembers.length; ix++)
    {
        const editGroupMemberRecord = editGroupMembers[ix];
        const currentMemberIx = currentMembersArr.findIndex((item) =>{
            return item.Login == editGroupMemberRecord;
        });

        if(currentMemberIx == -1)
        {
            // Insert Member
            // Get is admin member value
            const memberIsAdminRecord = editGroupMembersIsAdmin.find((item) =>{
                return item.contactId == editGroupMemberRecord;
            });

            let memberIsAdmin = 0;
            if(memberIsAdminRecord != null)
            {
                memberIsAdmin = memberIsAdminRecord.value == true ? 1 : 0;
            }

            // Get member message permission value
            const memberMessagePermissionRecord = editGroupMembersMessagePermission.find((item) =>{
                return item.contactId == editGroupMemberRecord;
            });

            let memberMessagePermission = 1;
            if(memberMessagePermissionRecord != null)
            {
                memberMessagePermission = memberMessagePermissionRecord.value == true ? 1 : 0;
            }

            // Get member has user validity
            const memberHasUserValidityRecord = editGroupMembersHasValidity.find((item) =>{
                return item.contactId == editGroupMemberRecord;
            });

            let memberHasUserValidity = 0

            if(memberHasUserValidityRecord != null)
            {
                memberHasUserValidity = memberHasUserValidityRecord.value == true ? 1 : 0;
            }

            let memberHasUserValidityFromDate = 0;
            let memberValidityFromDate = null;

            // Get member has user validity from Date
            const memberHasUserValidityFromDateRecord = editGroupMemberValidityFromDate.find((item) =>{
                return item.contactId == editGroupMemberRecord;
            });

            if(memberHasUserValidityFromDateRecord != null)
            {
                memberHasUserValidityFromDate = memberHasUserValidityFromDateRecord.value == true ? 1 : 0;
                if(memberHasUserValidityFromDate == 1)
                {
                    memberValidityFromDate = memberHasUserValidityFromDateRecord.fromDate;
                }
            }

            let memberHasUserValidityBetween = 0;
            let memberValidityBetweenDateStart = null;        
            let memberValidityBetweenDateEnd = null;

            // Get member has user validity from Date
            const memberHasUserValidityBetweenRecord = editGroupMemberValidityBetweenDate.find((item) =>{
                return item.contactId == editGroupMemberRecord;
            });

            if(memberHasUserValidityBetweenRecord != null)
            {
                memberHasUserValidityBetween = memberHasUserValidityBetweenRecord.value == true ? 1 : 0;
                if(memberHasUserValidityBetween == 1)
                {
                    memberValidityBetweenDateStart = memberHasUserValidityBetweenRecord.startDate;
                    memberValidityBetweenDateEnd = memberHasUserValidityBetweenRecord.endDate;
                }
            }

            const memberWaitingForApproval = 1;
            const memberLoginApproved = 0;
            const memberStatusDelivered = 0;
            const memberRemoved = 0;
            const newMemberCreationTime = new Date().getTime();
            
            const scriptInsertMember = `INSERT INTO AppGroupMembers (
                                                    GroupId,
                                                    Login,
                                                    IsAdmin,
                                                    MessagePermission,
                                                    HasUserValidity, 
                                                    HasUserValidityFromDate,
                                                    UserValidityFromDate,
                                                    HasUserValidityBetween,
                                                    UserValidityBetweenDateStart,
                                                    UserValidityBetweenDateEnd,
                                                    WaitingLoginApproval, 
                                                    LoginApproved, 
                                                    StatusDelivered, 
                                                    Removed, 
                                                    CreationDate
                                                    ) 
                                                    VALUES 
                                                    (
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?, 
                                                    ?,
                                                    ?, 
                                                    ?)`;
            const scriptInsertMemberValues = [
                                                editGroupRecordId, 
                                                editGroupMemberRecord, 
                                                memberIsAdmin, 
                                                memberMessagePermission, 
                                                memberHasUserValidity,
                                                memberHasUserValidityFromDate,
                                                memberValidityFromDate,
                                                memberHasUserValidityBetween,
                                                memberValidityBetweenDateStart,
                                                memberValidityBetweenDateEnd,
                                                memberWaitingForApproval, 
                                                memberLoginApproved, 
                                                memberStatusDelivered, 
                                                memberRemoved, 
                                                newMemberCreationTime];
            scriptList.push(scriptInsertMember);
            scriptListValues.push(scriptInsertMemberValues);

        }
    }

    // Debug SQLite scripts on save group
    // for(let ix = 0; ix < scriptList.length; ix++)
    // {
    //     const scriptContent = scriptList[ix];
    //     const scriptContentValues = scriptListValues[ix];

    //     console.log(`⭐️ Save Group Script: ${scriptContent} | ${scriptContentValues}`);
    // }


    // Insert Group waiting for server status
    const SERVER_STATUS_TAG = groupPhotoChanged == true ? SERVER_STATUS_TAG_UPDATE_WITH_PHOTO : SERVER_STATUS_TAG_UPDATE;

    await insertAppGroupWaitingForServerStatusUpdate(editGroupRecordId, SERVER_STATUS_TAG, scriptList, scriptListValues);
    // const scriptGroupWaitingForServerStatus = `INSERT INTO AppGroupWaitingForServerStatusUpdate (GroupId, StatusTag) VALUES (?, ?)`;
    // const scriptGroupWaitingForServerStatusValues = [editGroupRecordId, SERVER_STATUS_TAG_UPDATE];
    // scriptList.push(scriptGroupWaitingForServerStatus);
    // scriptListValues.push(scriptGroupWaitingForServerStatusValues);

    try
    {
        await dbRunManyInSameTransaction(scriptList, scriptListValues);
    }
    catch(transactionError)
    {
        swal(`${getTranslate(`error`, `Error`)} 💬`);
        return;
    }



    contactIdIsGroupCheck();
    
    talkToAGroup = true;

    if(groupPhotoChanged == true)
    {
        if(editGroupPhoto.toLowerCase().trim().startsWith("file://") == true || editGroupPhoto.toLowerCase().trim().startsWith("filesystem:") == true)
        {
            var imageSource = editGroupPhoto;
            if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
            {
                const fileName = getFileNameFromPath(imageSource);
                imageSource = `${imagesLocalFolderLocation}${fileName}`;
            }

            imageSource = await getDeviceFileBase64URL(imageSource);

            $(`#chatTalkToPhoto`).attr(`src`, imageSource);
            $(`.app-chat-group-list-item-avatar-image[data-id="${editGroupRecordId}"]`).attr(`src`, imageSource);
        }
        else
        {
            if(editGroupPhoto.length > 0)
            {
                $(`#chatTalkToPhoto`).attr(`src`, editGroupPhoto);
                $(`.app-chat-group-list-item-avatar-image[data-id="${editGroupRecordId}"]`).attr(`src`, editGroupPhoto);
            }
            else
            {
                // Photo clear processing
                const emptyPhoto = `images/group.png`;
                $(`#chatTalkToPhoto`).attr(`src`, emptyPhoto);
                $(`.app-chat-group-list-item-avatar-image[data-id="${editGroupRecordId}"]`).attr(`src`, emptyPhoto);
            }
        }
    }

    const serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        await chatLoadRoomContactProfile();
    }

    if(chkUseGroupValidity == 1)
    {
        const groupValidityArr = {                
            "hasGroupValidityFromDate": hasGroupValidityFromDate,
            "validityFromDate": groupValidityPeriodFromDateTimeStamp,
            "hasGroupValidityBetween": hasGroupValidityBetween,
            "validityBetweenDateStart": validityBetweenDateStart,
            "validityBetweenDateEnd": validityBetweenDateEnd
        };

        checkGroupEditedValidity(groupValidityArr);
        checkInvalidGroupToSendMessage();

        const canSendMessage = userCanSendGroupMessage == true ? 1 : 0;
        $(`.app-chat-group-list-item-link[data-talktoid="${editGroupRecordId}"]`).attr(`data-sendMessage`, canSendMessage);
    }
    
    if(hasGroupAccessHours == 1)
    {            
        const groupAccessHourArr = {                
            "groupAccessHoursStart": groupAccessHoursStart,
            "groupAccessHoursEnd": groupAccessHoursEnd
        };

        const allowedAccess = checkGroupAccessHour(groupAccessHourArr);

        if(allowedAccess == false)
        {
            closeChat();
        }

        $(`.app-chat-group-list-item-link[data-talktoid="${editGroupRecordId}"]`).attr(`data-accessStart`, groupAccessHoursStart);
        $(`.app-chat-group-list-item-link[data-talktoid="${editGroupRecordId}"]`).attr(`data-accessEnd`, groupAccessHoursEnd);
    }

    if(editGroupNameLoad != groupName) //groupName was changed
    {
        $(`.app-chat-group-list-item[data-talktoid="${editGroupRecordId}"]`).find(`.app-chat-group-list-item-name`).text(groupName);
        $(`#chatTalkToName`).text(groupName);
    }

    closeModalCreateGroup();
}

async function loadGroupMembersFromDB(groupId)
{
    const queryGroup = `SELECT * FROM AppGroups WHERE GroupId = ?`;
    const queryGroupValues = [groupId];
    const responseGroup = await dbRun(queryGroup, queryGroupValues);

    if(responseGroup.rows.length == 0)
    {
        editGroupMembers = [];
        editGroupMembersIsAdmin = [];
        editGroupPreLoadMembers = [];
        editGroupMembersHasValidity = [];
        editGroupMemberValidityFromDate = [];
        editGroupMemberValidityBetweenDate = [];

        await swal(getTranslate('member-removed-from-group', 'You have been Removed from this group')).then(() =>{ 
            $(`#modalCreateGroup`).modal('close');
            closeChat();
        });

        return;
    }

    const groupRecord = responseGroup.rows.item(0);
    editGroupCreatorAdmin = groupRecord.CreatorAdminLogin;

    const queryMembers = `SELECT * FROM AppGroupMembers WHERE GroupId = ?`;
    const queryMembersValues = [groupId];
    const responseMembers = await dbRun(queryMembers, queryMembersValues);

    const mustUpdateEditGroupMembers = editGroupMembers.length == 0 ? true : false;
    editGroupMembersIsAdmin = [];
    editGroupMembersHasValidity = [];
    editGroupMemberValidityFromDate = [];
    editGroupMemberValidityBetweenDate = [];

    if(responseMembers.rows.length == 0)
    {
        editGroupMembers = [];
        editGroupPreLoadMembers = [];
    }
    else
    {
        for(let ix = 0; ix < responseMembers.rows.length; ix++)
        {
            const member = responseMembers.rows.item(ix);
            
            if(mustUpdateEditGroupMembers == true)
            {
                editGroupMembers.push(member.Login);                
            }

            editGroupPreLoadMembers.push(member.Login);

            editGroupMembersIsAdmin.push({
                "contactId": member.Login,
                "value": member.IsAdmin == 1 ? true : false
            });

            editGroupMembersHasValidity.push({
                "contactId":  member.Login,
                "value": member.HasUserValidity == 1 ? true : false
            });

            editGroupMemberValidityFromDate.push({
                "contactId":  member.Login,
                "value": member.HasUserValidityFromDate == 1 ? true : false,
                "fromDate": member.HasUserValidityFromDate == 1 ? member.UserValidityFromDate : null,
                "validityFromDate": member.HasUserValidityFromDate == 1 ? member.UserValidityFromDate : null
            });

            editGroupMemberValidityBetweenDate.push({
                "contactId":  member.Login,
                "value": member.HasUserValidityBetween == 1 ? true : false,
                "startDate": member.HasUserValidityBetween == 1 ? member.UserValidityBetweenDateStart : null,
                "endDate": member.HasUserValidityBetween == 1 ? member.UserValidityBetweenDateEnd : null,
                "validityStartDate": member.HasUserValidityBetween == 1 ? member.UserValidityBetweenDateStart : null,
                "validityEndDate": member.HasUserValidityBetween == 1 ? member.UserValidityBetweenDateEnd : null,
            });
        }   
    }
}

function setGroupValidityPeriodBetweenDateStart(value)
{
    const dtValue = new Date(value);
    const datepickerInstance = M.Datepicker.getInstance($(`#txtGroupValidityPeriodBetweenDateStart`)[0]);
    datepickerInstance.setDate(dtValue);
    datepickerInstance.setInputValue();
    $(`#txtGroupValidityPeriodBetweenDateStart`).attr(`data-value`, value);
}

//Criar a função setGroupValidityPeriodBetweenDateEnd() Determinar o valor da Data Inicial na validade do grupo por período
function setGroupValidityPeriodBetweenDateEnd(value)
{
    const dtValue = new Date(value);
    const datepickerInstance = M.Datepicker.getInstance($(`#txtGroupValidityPeriodBetweenDateEnd`)[0]);
    datepickerInstance.setDate(dtValue);
    datepickerInstance.setInputValue();
    $(`#txtGroupValidityPeriodBetweenDateEnd`).attr(`data-value`, value);
}

function setGroupValidityPeriodFromDateValue(value)
{
    const dtValue = new Date(value);
    const datepickerInstance = M.Datepicker.getInstance($(`#txtGroupValidityPeriodFromDate`)[0]);
    datepickerInstance.setDate(dtValue);
    datepickerInstance.setInputValue();
    $(`#txtGroupValidityPeriodFromDate`).attr(`data-value`, value);
}

function getGroupValidityPeriodFromDateValue()
{
    const datepickerInstance = M.Datepicker.getInstance($(`#txtGroupValidityPeriodFromDate`)[0]);
    const valueInDate = datepickerInstance.date;
    return valueInDate.getTime();
}

function getGroupValidityPeriodBtwDateStartValue()
{
    const datepickerInstance = M.Datepicker.getInstance($(`#txtGroupValidityPeriodBetweenDateStart`)[0]);
    const valueInDate = datepickerInstance.date;
    return valueInDate.getTime();
}

function getGroupValidityPeriodBtwDateEndValue()
{
    const datepickerInstance = M.Datepicker.getInstance($(`#txtGroupValidityPeriodBetweenDateEnd`)[0]);
    const valueInDate = datepickerInstance.date;
    return valueInDate.getTime();
}

function setGroupValidityVisible()
{
    const isChecked = $(`#chkUseGroupValidity`).prop('checked');

    if(isChecked == true)
    {
        $(`#groupValidityFields`).removeClass(`hide`);
    }
    else
    {
        $(`#groupValidityFields`).addClass(`hide`);
    }
}

function setGroupValidityPeriodVisible()
{
    let checkedValue = $(`input[type="radio"][name="groupvalidityperiod"]:checked`).val();

    $(`#groupValidityPeriodFromDateFields`).addClass(`hide`);
    $(`#groupValidityPeriodBetweenDateFields`).addClass(`hide`);

    if(checkedValue == `groupvalidityperiodfromdate`)
    {
        $(`#groupValidityPeriodFromDateFields`).removeClass(`hide`);
        const fromDate = $(`#txtGroupValidityPeriodFromDate`).val();

        if(fromDate.length == 0) //set date as today
        {
             // Set the current (now) date to field
            const dtNow = new Date();
            const tsNow = dtNow.getTime();
            setGroupValidityPeriodFromDateValue(tsNow);

        }
    }
    else if(checkedValue == `groupvalidityperiodbtwdate`)
    {
        $(`#groupValidityPeriodBetweenDateFields`).removeClass(`hide`);
        const betweenDateStart = $(`#txtGroupValidityPeriodBetweenDateStart`).val();
        
        if(betweenDateStart.length == 0) //set date as today
        {
             // Set the current (now) date to field
            const dtNow = new Date();
            const tsNow = dtNow.getTime();
            setGroupValidityPeriodBetweenDateStart(tsNow);
        }
    }
}

function setGroupAccessHoursVisible()
{
    const isChecked = $(`#chkUseGroupAccessHours`).prop('checked');

    if(isChecked == true)
    {
        $(`#groupAccessHoursFields`).removeClass(`hide`);
    }
    else
    {
        $(`#groupAccessHoursFields`).addClass(`hide`);
    }
}


async function insertAppGroupWaitingForServerStatusUpdate(newGroupId, statusTag, scriptList, scriptListValues)
{
    const existingQuery = `SELECT * FROM AppGroupWaitingForServerStatusUpdate WHERE GroupId = ? AND StatusTag = ?`;
    const existingQueryValues = [newGroupId, statusTag];

    const existingResponse = await dbRun(existingQuery, existingQueryValues);

    if(existingResponse.rows.length > 0)
    {
        return;
    }
 
    const scriptGroupWaitingForServerStatus = `INSERT INTO AppGroupWaitingForServerStatusUpdate (GroupId, StatusTag) VALUES (?, ?)`;
    const scriptGroupWaitingForServerStatusValues = [newGroupId, statusTag];
    scriptList.push(scriptGroupWaitingForServerStatus);
    scriptListValues.push(scriptGroupWaitingForServerStatusValues);
}


async function deleteGroupMember()
{
    const swalTitle = getTranslate(`group-member-remove-title`, `Delete Group Member`);
    const swalText = getTranslate(`group-member-remove-text`, `Confirm the deletion of the Group Member?`);
    const cancelButtonText = getTranslate(`no`, `NO`);
    const confirmButtonText = getTranslate(`yes`, `YES`);

    swalConfirm(swalTitle, swalText, `warning`, cancelButtonText, confirmButtonText, () => {
        //on Cancel

    }, async () => {    
        //on Confirm

        swal(getTranslate(`removing-group-member`, `Removing Group Member...`), {
            button: false, closeOnClickOutside: false
        });

        //check if member was add before edition
        let isPreLoadMember = editGroupPreLoadMembers.find((member) => member == groupMemberEditContactId);

        if(groupCreationEditMode == false) 
        {
            removeMemberFromArrays(); 
        } 
        else 
        {
            if(isPreLoadMember == null) //was add as member on this edition action - this member does not exist on server
            {
                removeMemberFromArrays();
                groupMemberEditContactId = null;
            }
            else
            {
                let serverConnectionState = await hasServerConnection();

                if(serverConnectionState == false) 
                {
                    swal(getTranslate('group-member-remove-not-connect', 'You are not online. This operation can only be performed when there is a connection.'));
                    return;
                }

                let groupMemberResponse = null;

                const data = {
                    "groupId": editGroupRecordId,
                    "userId" : groupMemberEditContactId
                }

                try
                {
                    groupMemberResponse = await callS(true, 'POST', `/services/groupmemberremove`,data);
                }
                catch(groupMemberRemoveException)
                {
                    console.log(`Error on save group: ${groupMemberRemoveException.responseJSON.message}`);

                    let messageError = groupMemberRemoveException.responseJSON.message;                
                    let messageErrorTranslated = getTranslate('error-msg-remove-group-member', messageError);

                    swal(messageErrorTranslated);

                    return;
                }           

                if(groupMemberResponse.success == true) 
                {
                    const removeQuery = 'DELETE FROM AppGroupMembers WHERE Login = ? and GroupId = ?';
                    const removeValues = [groupMemberEditContactId, editGroupRecordId];                
                    await dbRun(removeQuery, removeValues);

                    removeMemberFromArrays();

                    const socketData = {
                        request: "GROUP_MEMBER_DELETED",
                        params: [{
                            action: "delete",
                            groupId: editGroupRecordId,
                            deletedLogin: groupMemberEditContactId
                        }]
                    };

                    sendSocketText(JSON.stringify(socketData));

                    const messageGroupDelete = [{
                        "groupId": editGroupRecordId,
                        "deletedLogin": groupMemberEditContactId
                    }];

                    const socketDataAsMember = {
                        request: "GROUP_DELETED_ASMEMBER",
                        params: messageGroupDelete
                    }

                    sendSocketText(JSON.stringify(socketDataAsMember));
                }
            
            }
        }

        swal(getTranslate('group-member-removed', 'Group Member Removed')).then(() =>{ 
            $(`#modalGroupMemberEdit`).modal('close');
            refreshGroupEditMembers();
            validateAddGroupMembersWarning();
        });
    });
}

async function removeMemberFromArrays() 
{
    editGroupMembers = editGroupMembers.filter(member => member !== groupMemberEditContactId);
    editGroupMembersIsAdmin = editGroupMembersIsAdmin.filter(member => member.contactId !== groupMemberEditContactId);
    editGroupMembersMessagePermission = editGroupMembersMessagePermission.filter(member => member.contactId !== groupMemberEditContactId);

    editGroupMembersHasValidity = editGroupMembersHasValidity.filter(member => member.contactId !== groupMemberEditContactId);
    editGroupMemberValidityFromDate = editGroupMemberValidityFromDate.filter(member => member.contactId !== groupMemberEditContactId);
    editGroupMemberValidityBetweenDate = editGroupMemberValidityBetweenDate.filter(member => member.contactId !== groupMemberEditContactId);

    const querySelectGroupMemberCache = `SELECT * FROM AppTalkGroupMembersCache WHERE GroupId = ? AND Login = ?`;
    const querySelectGroupMemberCacheValues = [editGroupRecordId, groupMemberEditContactId];

    const responseGroupMemberCache = await dbRun(querySelectGroupMemberCache, querySelectGroupMemberCacheValues);

    if(responseGroupMemberCache.rows.length > 0)
    {
        const queryDeleteGroupMemberCache = `DELETE FROM AppTalkGroupMembersCache WHERE GroupId = ? AND Login = ?`;
        const queryDeleteGroupMemberCacheValues = [editGroupRecordId, groupMemberEditContactId];

        dbRun(queryDeleteGroupMemberCache, queryDeleteGroupMemberCacheValues);

        talkGroupMembers = await loadTalkGroupMembersCache();
    }
};

async function memberLeaveGroup() 
{
    const swalTitle = getTranslate(`group-member-leave-title`, `Leave Group`);
    const swalText = getTranslate(`group-member-leave-text`, `Do you really want to leave the group?`);
    const cancelButtonText = getTranslate(`no`, `NO`);
    const confirmButtonText = getTranslate(`yes`, `YES`);

    swalConfirm(swalTitle, swalText, `warning`, cancelButtonText, confirmButtonText, () => {
        //on Cancel
    }, async () => {
        // on confirm

        swal(getTranslate(`leaving-group`, `Leaving Group...`), {
            button: false, closeOnClickOutside: false
        });
        
        let serverConnectionState = await hasServerConnection();

        if(serverConnectionState == false) 
        {
            swal(getTranslate('group-member-remove-not-connect', 'You are not online. This operation can only be performed when there is a connection.'));
            return;
        }

        let groupMemberResponse = null;

        const data = {
            "groupId": editGroupRecordId,
        }

        try
        {
            groupMemberResponse = await callS(true, 'POST', `/services/leavegroup`, data);
        }
        catch(groupMemberRemoveException)
        {
            console.log(`Error on save group: ${groupMemberRemoveException.responseJSON.message}`);

            let messageError = groupMemberRemoveException.responseJSON.message;

            swal(messageError);

            return;
        }           

        if(groupMemberResponse.success == true) 
        {
            const removeGroupQuery = 'DELETE FROM AppGroups WHERE GroupId = ?'
            const removeGroupValues = [editGroupRecordId];
            await dbRun(removeGroupQuery, removeGroupValues);

            const removeQuery = 'DELETE FROM AppGroupMembers WHERE GroupId = ?';
            const removeValues = [editGroupRecordId];                
            await dbRun(removeQuery, removeValues);

            const socketData = {
                request: "GROUP_EXITED_MEMBER",
                params: [{
                    groupId: editGroupRecordId,
                }]
            };

            sendSocketText(JSON.stringify(socketData));

            swal(getTranslate('group-exited', 'Group exit completed')).then(() =>{ 
                $(`#modalGroupMemberEdit`).modal('close');
                closeModalCreateGroup();
                closeChat();
                refreshGroupList();
            });
        }
    });
}

function checkGroupEditedValidity(validity)
{    
    const hasGroupValidityFromDate = validity.hasGroupValidityFromDate;
    const validityFromDate = validity.validityFromDate;
    const hasGroupValidityBetween = validity.hasGroupValidityBetween;
    const validityBetweenDateStart = validity.validityBetweenDateStart;
    const validityBetweenDateEnd = validity.validityBetweenDateEnd;

    //checks group validity data
    let dateFrom = null;
    let dateEnd = null;

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
            userCanSendGroupMessage = false;        
        }
        else
        {
            userCanSendGroupMessage = true;
        }
    }

    if(isDateLessOrEqualToday(dateFrom) == false)
    {
        userCanSendGroupMessage = false;
    }
    else
    {
        userCanSendGroupMessage = true;
    }
}

async function deleteGroup() 
{
    const swalTitle = getTranslate(`group-delete-title`, `Delete Group`);
    const swalText = getTranslate(`group-delete-text`, `Do you want to delete group?`);
    const cancelButtonText = getTranslate(`no`, `NO`);
    const confirmButtonText = getTranslate(`yes`, `YES`);

    swalConfirm(swalTitle, swalText, `warning`, cancelButtonText, confirmButtonText, () => {
        //on Cancel
    }, async () => {
        // on confirm

        swal(getTranslate(`removing-group`, `Deleting Group...`), {
            button: false, closeOnClickOutside: false
        });

        let serverConnectionState = await hasServerConnection();

        if(serverConnectionState == false) 
        {
            swal(getTranslate('group-member-remove-not-connect', 'You are not online. This operation can only be performed when there is a connection.'));
            return;
        }

        let groupDeleteResponse = null;

        try
        {
            groupDeleteResponse = await callS(true, 'DELETE', `/services/deletegroup/${editGroupRecordId}`);
        }
        catch(groupDeleteException)
        {
            console.log(`Error deleting group: ${groupDeleteException.responseJSON.message}`);

            let messageError = groupDeleteException.responseJSON.message;

            swal(messageError);

            return;
        }           

        if(groupDeleteResponse.success == true) 
        {
            const deleteMembersQuery = 'DELETE FROM AppGroupMembers WHERE GroupId = ?';
            const deleteMembesValues = [editGroupRecordId];                
            await dbRun(deleteMembersQuery, deleteMembesValues);

            const deleteGroupQuery = 'DELETE FROM AppGroups WHERE GroupId = ?'
            const deleteGroupValues = [editGroupRecordId];
            await dbRun(deleteGroupQuery, deleteGroupValues);

            const deliveredMsg = {
                request: "SET_GROUP_DELETED_DELIVERED",
                params: [{
                    groupIds: [editGroupRecordId],
                }]
            };
            sendSocketText(JSON.stringify(deliveredMsg));

            const deliveryMsg = {
                request: "GROUP_DELETED",
                params: [{
                    groupId: editGroupRecordId,
                }]
            };
            sendSocketText(JSON.stringify(deliveryMsg));

            swal(getTranslate('group-deleted', ' Group Deleted')).then(() =>{ 
                
                closeModalCreateGroup();
                closeChat();
                refreshGroupList();
            });
            
        }

    })
}
