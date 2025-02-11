var groupMemberEditContactId = null;
var editMemberValidityFromDate = null; //Member FromDate data loaded from  BD
var editMemberValidityBetweenDateStart = null; //Member DateStart data loaded from  BD
var editMemberValidityBetweenDateEnd = null; //Member DateEnd data loaded from  BD

$(function() {
    mountModalGroupMemberEditEvents();
});

function mountModalGroupMemberEditEvents()
{
    $("#modalGroupMemberEdit").modal({
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

    $(`#btnCloseModalGroupMemberEdit`).off(`click`);
    $(`#btnCloseModalGroupMemberEdit`).on(`click`, function(){
        closeModalGroupMemberEdit();
    });

    $(`#chkGroupMemberEditMessagePermission`).off(`change`);
    $(`#chkGroupMemberEditMessagePermission`).on(`change`, function(){
        const isChecked = $(this).is(":checked");
        setGroupEditMemberMessagePermission(groupMemberEditContactId, isChecked);
    });

    $(`#chkGroupMemberEditIsAdmin`).off(`change`);
    $(`#chkGroupMemberEditIsAdmin`).on(`change`, function(){
        const isChecked = $(this).is(":checked");
        setGroupEditMemberIsAdmin(groupMemberEditContactId, isChecked);
    });

    //Colocar evento para o  checkbox de UserValidity verificar o que foi feito para chkUseGroupValidity.
    $(`#chkUseGroupUserValidity`).off(`change`)
    $(`#chkUseGroupUserValidity`).on(`change`, function(){
        setGroupUserValidityVisible();
        const isChecked = $(this).is(":checked");
        setGroupEditMemberHasUserValidity(groupMemberEditContactId, isChecked);
        let isValidityDataSaved = false;

        if(isChecked == false)
        {
            // sets userGroupValidaty date to null
            clearGroupEditValidityData();
            isValidityDataSaved = true;            
        }
        
        let radioCheckedValue = $(`input[type="radio"][name="usergroupvalidityperiod"]:checked`).val();

        if(radioCheckedValue == null) //if there is no radio checked, check fromdate radio and set today as datefrom
        {
            $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodfromdate"]').prop('checked', true);
            setGroupMemberSelectedValidity();
        }

        changeBtnUserValiditySave(isValidityDataSaved);
        
        validateMemberValidityToSave();
    });

    $(`#btnUserValiditySave`).off(`click`);
    $(`#btnUserValiditySave`).on(`click`, function(){

        const isValid = validateMemberValidityToSave();

        if(isValid == false)
        {
            return;
        }

        //saves validitydate on editGroupMemberValidityFromDate and editGroupMemberValidityBetweenDate (arrays that controls member data to save)
        saveUserValidityData();
        
        changeBtnUserValiditySave(true);   

    });

    $(`input[type="radio"][name="usergroupvalidityperiod"]`).off(`change`);
    $(`input[type="radio"][name="usergroupvalidityperiod"]`).on(`change`, function(){
        setGroupMemberSelectedValidity();
        validateMemberValidityToSave();
        
        changeBtnUserValiditySave(false);
    });
    
    $(`#txtUserGroupValidityPeriodFromDate`).datepicker({
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
            const selectedDateTime = event.getTime();

            if(selectedDate != null)
            {
                $(`#txtUserGroupValidityPeriodFromDate`).attr(`data-value`,selectedDateTime);
            }
            else
            {
                $(`#txtUserGroupValidityPeriodFromDate`).removeAttr(`data-value`);
            }

            validateMemberValidityToSave();            
            changeBtnUserValiditySave(false);
        },
        "onOpen": function(event){
        },
        "onClose": function(event){           
        },
        "onDraw": function(event){
        }
    });

    $(`#txtUserGroupValidityPeriodBetweenDateStart`).datepicker({
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
            const selectedDateTime = event.getTime();

            if(selectedDate != null)
            {
                $(`#txtUserGroupValidityPeriodBetweenDateStart`).attr(`data-value`, selectedDateTime);                
            }
            else
            {
                $(`#txtUserGroupValidityPeriodBetweenDateStart`).removeAttr(`data-value`);
            }

            validateMemberValidityToSave();
            
            changeBtnUserValiditySave(false);
        },
        "onOpen": function(event){

        },
        "onClose": function(event){
        },
        "onDraw": function(event){

        }
    });

    $(`#txtUserGroupValidityPeriodBetweenDateEnd`).datepicker({
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
            const selectedDateTime = event.getTime();

            if(selectedDate != null)
            {
                $(`#txtUserGroupValidityPeriodBetweenDateEnd`).attr(`data-value`, selectedDateTime);                
            }
            else
            {
                $(`#txtUserGroupValidityPeriodBetweenDateEnd`).removeAttr(`data-value`);
            }

            validateMemberValidityToSave();

            changeBtnUserValiditySave(false);
        },
        "onOpen": function(event){

        },
        "onClose": function(event){
        },
        "onDraw": function(event){
            
        }
    });
}

function initModalGroupMemberEdit(contactId)
{
    $("#modalGroupMemberEdit").modal(`open`);

    groupMemberEditContactId = contactId;

    let contactName = "...";

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

    $(`#groupMemberEditContactName`).text(contactName);

    const messagePermission = getGroupEditMemberMessagePermission(contactId);
    $(`#chkGroupMemberEditMessagePermission`).prop("checked", messagePermission);

    const isAdmin = getGroupEditMemberIsAdmin(contactId);
    $(`#chkGroupMemberEditIsAdmin`).prop("checked", isAdmin);

    $(`#userGroupValidityFields`).addClass(`hide`);
    $(`#userGroupValidityPeriodFromDateFields`).addClass(`hide`);
    $(`#userGroupValidityPeriodBetweenDateFields`).addClass(`hide`);

    $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodfromdate"]').prop('checked', false);
    $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodbetweendate"]').prop('checked', false);

    //Setar o valor para o checkbox validade para o usuário.
    //Usar como referência o que foi realizado para o checkbox isAdmin (chkGroupMemberEditIsAdmin) 
    const useGroupUserValidity = getGroupEditMemberHasUserValidity(contactId);
    $('#chkUseGroupUserValidity').prop('checked', useGroupUserValidity);

    const useGroupValidityPeriodFromDate = getGroupMemberUseValidityPeriodFromDate(contactId);
    const useGroupValidityPeriodBetween = getGroupMemberUseValidityPeriodBetween(contactId);

    setGroupUserValidityVisible();
    
    if(useGroupUserValidity == true)
    {   
        if(useGroupValidityPeriodFromDate.value == true)
        {           
            $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodfromdate"]').prop('checked', true);

            editMemberValidityFromDate = useGroupValidityPeriodFromDate.validityFromDate; //member FromDate loaded from BD
            setGroupMemberValidityPeriodFromDateValue(useGroupValidityPeriodFromDate.fromDate);

            if(isDateGreaterOrEqualToday(useGroupValidityPeriodFromDate.fromDate) == false)
            {
                $(`#txtUserGroupValidityPeriodFromDate`).attr(`disabled`, `disabled`);
            }
            else
            {
                if(isAdmin == true)
                {
                    $(`#txtUserGroupValidityPeriodFromDate`).removeAttr(`disabled`, `disabled`);                   
                }
            }
        }

        if(useGroupValidityPeriodBetween.value == true)
        {            
            $('input[name="usergroupvalidityperiod"][value="usergroupvalidityperiodbetweendate"]').prop('checked', true);

            editMemberValidityBetweenDateStart = useGroupValidityPeriodBetween.validityStartDate; //member FromDate loaded from BD            
            setGroupMemberUserValidityPeriodBtwDateStartValue(useGroupValidityPeriodBetween.startDate);

            if(isDateGreaterOrEqualToday(useGroupValidityPeriodBetween.startDate) == false)
            {                
                $(`#txtUserGroupValidityPeriodBetweenDateStart`).attr(`disabled`, `disabled`);
            }
            else
            {
                if(isAdmin == true)
                {
                    $(`#txtUserGroupValidityPeriodBetweenDateStart`).removeAttr(`disabled`, `disabled`);
                }
            }

            editMemberValidityBetweenDateEnd = useGroupValidityPeriodBetween.validityEndDate; //member FromDate loaded from BD
            setGroupMemberUserValidityPeriodBtwDateEndValue(useGroupValidityPeriodBetween.endDate);
        }

        setGroupMemberSelectedValidity();
    }

    setBtnGroupUserValiditySaved();
}

function closeModalGroupMemberEdit()
{
    const isUserValiditySaved = $(`#txtBtnUserValiditySave`).attr(`data-saved`);

    if(isUserValiditySaved == 'false')
    {
        swal(getTranslate(`msg-user-validity-not-saved`,`User Validity not saved, please check validity data`));

        return;
    }

    groupMemberEditContactId = null;
    $(`#groupMemberEditContactName`).text(``);

    $(`#chkUseGroupUserValidity`).prop('checked', false);
    setGroupUserValidityVisible();

    $(`#txtUserGroupValidityPeriodFromDate`).removeAttr(`data-value`);
    $(`#txtUserGroupValidityPeriodFromDate`).val('');

    $(`#txtUserGroupValidityPeriodBetweenDateStart`).removeAttr(`data-value`);
    $(`#txtUserGroupValidityPeriodBetweenDateStart`).val('');

    $(`#txtUserGroupValidityPeriodBetweenDateEnd`).removeAttr(`data-value`);
    $(`#txtUserGroupValidityPeriodBetweenDateEnd`).val('');


    refreshGroupEditMembersMessagePermission();
    refreshGroupEditMembersIsAdmin();
    refreshGroupEditMembersValidity();
   
    editMemberValidityFromDate = null;
    editMemberValidityBetweenDateStart = null; 
    editMemberValidityBetweenDateEnd = null;

    $("#modalGroupMemberEdit").modal(`close`);
}


function setGroupUserValidityVisible()
{
    const isChecked = $(`#chkUseGroupUserValidity`).prop('checked');

    if(isChecked == true)
    {
        $(`#userGroupValidityFields`).removeClass(`hide`);
    }
    else
    {
        $(`#userGroupValidityFields`).addClass(`hide`);
    }
}

function setGroupMemberSelectedValidity()
{
    //input(name="usergroupvalidityperiod", type="radio", value="usergroupvalidityperiodfromdate")
    //input(name="groupvalidityperiod", type="radio", value="groupvalidityperiodbetweendate")

    let checkedValue = $(`input[type="radio"][name="usergroupvalidityperiod"]:checked`).val();

    $(`#userGroupValidityPeriodFromDateFields`).addClass(`hide`);
    $(`#userGroupValidityPeriodBetweenDateFields`).addClass(`hide`);

    const fromDate = $(`#txtUserGroupValidityPeriodFromDate`).val();
    const betweenDateStart = $(`#txtUserGroupValidityPeriodBetweenDateStart`).val();
    const betweenDateEnd = $(`#txtUserGroupValidityPeriodBetweenDateEnd`).val();

    if(checkedValue == `usergroupvalidityperiodfromdate`)
    {
        $(`#userGroupValidityPeriodFromDateFields`).removeClass(`hide`);       

        if(fromDate.length == 0) //set date as today if there is no value
        {
            // Set the current (now) date to field
            const dtNow = new Date();
            const tsNow = dtNow.getTime();
            setGroupMemberValidityPeriodFromDateValue(tsNow);
        }
    }
    else if(checkedValue == `usergroupvalidityperiodbetweendate`)
    {
        $(`#userGroupValidityPeriodBetweenDateFields`).removeClass(`hide`);
        
        
        if(betweenDateStart.length == 0) //set date as today if there is no value
        {
             // Set the current (now) date to field
            const dtNow = new Date();
            const tsNow = dtNow.getTime();
            setGroupMemberUserValidityPeriodBtwDateStartValue(tsNow,false);
        }
    }

}

function getGroupEditMemberHasUserValidity(memberId)
{
    const ixHasUserValidity = editGroupMembersHasValidity.findIndex((item) =>{
        return item.contactId == memberId;
    });

    if(ixHasUserValidity == -1)
    {
        editGroupMembersHasValidity.push({
            "contactId": memberId,
            "value": false
        });

        return false;
    }
    
    return editGroupMembersHasValidity[ixHasUserValidity].value;
}

function setGroupEditMemberHasUserValidity(memberId,value)
{
    const ixPermission = editGroupMembersHasValidity.findIndex((item) =>{
        return item.contactId == memberId;
    });

    if(ixPermission == -1)
    {
        editGroupMembersHasValidity.push({
            "contactId": memberId,
            "value": value
        });
    }
    else
    {
        editGroupMembersHasValidity[ixPermission].value = value;
    }
}

function getGroupMemberUseValidityPeriodFromDate(memberId)
{
    const memberIndex = editGroupMemberValidityFromDate.findIndex((item) =>{
        return item.contactId == memberId;
    });

    if(memberIndex == -1)
    {
        editGroupMemberValidityFromDate.push({
            "contactId": memberId,
            "value": false,
            "fromDate": null,
            "validityFromDate": null
        });

        return false;
    }

    return editGroupMemberValidityFromDate[memberIndex];
}

function setGroupMemberValidityPeriodFromDateValue(value)
{
    const dtValue = new Date(value);
    const datepickerInstance = M.Datepicker.getInstance($(`#txtUserGroupValidityPeriodFromDate`)[0]);
    datepickerInstance.setDate(dtValue);
    datepickerInstance.setInputValue();
    $(`#txtUserGroupValidityPeriodFromDate`).attr(`data-value`, value);
}

function setGroupMemberValidityPeriodFromDate(value, memberId)
{
    if(memberId == null)
    {
        return;
    }

    const memberIndex = editGroupMemberValidityFromDate.findIndex((item) =>{
        return item.contactId == memberId;
    });

    const isValidityFromDate = value == null ? false : true;

    if(memberIndex == -1)
    {
        editGroupMemberValidityFromDate.push({
            "contactId": memberId,
            "value": isValidityFromDate,
            "fromDate": value,
            "validityFromDate": null
        });
    }
    else
    {
        editGroupMemberValidityFromDate[memberIndex].fromDate = value;
        editGroupMemberValidityFromDate[memberIndex].value = isValidityFromDate;
    }
}
/*
function getGroupMemberUserValidityPeriodFromDateValue()
{
    const datepickerInstance = M.Datepicker.getInstance($(`#txtUserGroupValidityPeriodFromDate`)[0]);
    const valueInDate = datepickerInstance.date;
    return valueInDate.getTime();
}*/

function getGroupMemberUseValidityPeriodBetween(memberId)
{
    const memberIndex = editGroupMemberValidityBetweenDate.findIndex((item) =>{
        return item.contactId == memberId;
    });

    if(memberIndex == -1)
    {
        editGroupMemberValidityBetweenDate.push({
            "contactId": memberId,
            "value": false,
            "startDate": null,
            "endDate": null,
            "validityStartDate": null,
            "validityEndDate": null
        });

        return false;
    }

    return editGroupMemberValidityBetweenDate[memberIndex];
}

function setGroupMemberUserValidityPeriodBtwDateStartValue(value)
{    
    const dtValue = new Date(value);
    const datepickerInstance = M.Datepicker.getInstance($(`#txtUserGroupValidityPeriodBetweenDateStart`)[0]);
    datepickerInstance.setDate(dtValue);
    datepickerInstance.setInputValue();
    $(`#txtUserGroupValidityPeriodBetweenDateStart`).attr(`data-value`, value);
}

function setGroupMemberUserValidityPeriodBtwDateStart(value, memberId)
{

    if(memberId == null)
    {
        return;
    }
    
    const memberIndex = editGroupMemberValidityBetweenDate.findIndex((item) =>{
        return item.contactId == memberId;
    });

    if(memberIndex == -1)
    {
        editGroupMemberValidityBetweenDate.push({
            "contactId": memberId,
            "value": false,
            "startDate": null,
            "endDate": null,
            "validityStartDate": null,
            "validityEndDate": null
        });

        return false;
    }
    else
    {
        editGroupMemberValidityBetweenDate[memberIndex].startDate = value;
        editGroupMemberValidityBetweenDate[memberIndex].value = value == null ? false : true;
    }
}
/*
function getGroupMemberUserValidityPeriodBtwDateStartValue()
{
    const datepickerInstance = M.Datepicker.getInstance($(`#txtUserGroupValidityPeriodBetweenDateStart`)[0]);
    const valueInDate = datepickerInstance.date;
    return valueInDate.getTime();
}*/

function setGroupMemberUserValidityPeriodBtwDateEndValue(value)
{
    const dtValue = new Date(value);
    const datepickerInstance = M.Datepicker.getInstance($(`#txtUserGroupValidityPeriodBetweenDateEnd`)[0]);
    datepickerInstance.setDate(dtValue);
    datepickerInstance.setInputValue();
}

function setGroupMemberUserValidityPeriodBtwDateEnd(value, memberId) 
{
    if(memberId == null)
    {
        return;
    }
    
    const memberIndex = editGroupMemberValidityBetweenDate.findIndex((item) =>{
        return item.contactId == memberId;
    });

    if(memberIndex == -1)
    {
        editGroupMemberValidityBetweenDate.push({
            "contactId": memberId,
            "value": false,
            "startDate": null,
            "endDate": null,
            "validityStartDate": null,
            "validityEndDate": null
        });

        return false;
    }
    else
    {
        editGroupMemberValidityBetweenDate[memberIndex].endDate = value;
        editGroupMemberValidityBetweenDate[memberIndex].value = value == null ? false : true;
    }
}
/*
function getGroupMemberUserValidityPeriodBtwDateEndValue()
{
    const datepickerInstance = M.Datepicker.getInstance($(`#txtUserGroupValidityPeriodBetweenDateEnd`)[0]);
    const valueInDate = datepickerInstance.date;
    return valueInDate.getTime();
}*/

function validateMemberValidityToSave()
{
    $(`#btnUserValiditySave`).addClass(`disabled`);
    
    if ($('#chkUseGroupUserValidity').prop('checked'))
    {
        if ($(`input[type="radio"][name="usergroupvalidityperiod"][value="usergroupvalidityperiodfromdate"]`).prop('checked'))
        {
            let txtUserGroupValidityPeriodFromDate = $(`#txtUserGroupValidityPeriodFromDate`).attr(`data-value`);
            
            if (txtUserGroupValidityPeriodFromDate.length == 0) 
            {
                return false;
            }
            
            //validate fromDatetxt only if there is not fromDate loaded from DB or fromDate Loaded is greater than today (if is not it is not possible to edit)
            if (editMemberValidityFromDate == null || isDateGreaterOrEqualToday(editMemberValidityFromDate) == true) 
            {
                if (isDateGreaterOrEqualToday(txtUserGroupValidityPeriodFromDate) == false) //verify fromdate selected is greater than today
                {                 
                    swal(getTranslate(`msg-from-date-greater`,`The from date must be greater than today`));
                    
                    if(editMemberValidityFromDate == null)
                    {
                        // Set the current (now) date to field
                        const dtNow = new Date();
                        const tsNow = dtNow.getTime();
                        setGroupMemberValidityPeriodFromDateValue(tsNow);
                    }
                    else
                    {
                        setGroupMemberValidityPeriodFromDateValue(editMemberValidityFromDate);
                    }
                    
                    return false;
                }
            }
        }
        
        if ($(`input[type="radio"][name="usergroupvalidityperiod"][value="usergroupvalidityperiodbetweendate"]`).prop('checked'))
        {
            let userGroupValidityPeriodBetweenDateStartValue = $(`#txtUserGroupValidityPeriodBetweenDateStart`).attr(`data-value`);
            let userGroupValidityPeriodBetweenDateEndValue = $(`#txtUserGroupValidityPeriodBetweenDateEnd`).attr(`data-value`);
            
            // o campo data a data inicial de deve estar preenchido.
            if (userGroupValidityPeriodBetweenDateStartValue == null) 
            {
                return false;
            }

            //editValidityBetweenDateStart - validityFromDate value from BD, validates when has value or when date is greater than today (if is not cannot edit)
            if (editMemberValidityBetweenDateStart == null || isDateGreaterOrEqualToday(editMemberValidityBetweenDateStart) == true) 
            {
                if (isDateGreaterOrEqualToday(userGroupValidityPeriodBetweenDateStartValue) == false)
                {
                    swal(getTranslate(`msg-from-date-greater`,`The from date must be greater than today`));
                    // Set the current (now) date to field
                    if(editMemberValidityBetweenDateStart == null)
                    {
                        const dtNow = new Date();
                        const tsNow = dtNow.getTime();
                        setGroupMemberUserValidityPeriodBtwDateStartValue(tsNow, false);
                    }
                    else
                    {
                        setGroupMemberUserValidityPeriodBtwDateStartValue(editMemberValidityBetweenDateStart, false);
                    }
    
                    return false;
                }
            }

            //end Date has to be informed
            if (userGroupValidityPeriodBetweenDateEndValue == null) 
            {
                return false;
            }
            else 
            {   
                //if (txtUserGroupValidityPeriodBetweenDateEnd  < txtUserGroupValidityPeriodBetweenDateStart)
                if(isDateEndLessDateStart(userGroupValidityPeriodBetweenDateEndValue,userGroupValidityPeriodBetweenDateStartValue) == true)
                {
                    swal(getTranslate(`msg-start-date-less-end`,`The start date must be less than end date`));

                    const instanceDateStart = M.Datepicker.getInstance($(`#txtUserGroupValidityPeriodBetweenDateStart`)[0]);
                    const tsDateStartValue = parseInt(userGroupValidityPeriodBetweenDateStartValue);
                    const tsDateEndValue = parseInt(userGroupValidityPeriodBetweenDateEndValue);                    
                                        
                    if(instanceDateStart.isOpen == true)
                    {                        
                        const dateStart = editMemberValidityBetweenDateStart == null ?  tsDateEndValue : editMemberValidityBetweenDateStart;
                        setGroupMemberUserValidityPeriodBtwDateStartValue(dateStart, false);
                    }
                    else
                    {                           
                        const dateEnd = editMemberValidityBetweenDateEnd == null ? tsDateStartValue : editMemberValidityBetweenDateEnd;
                        setGroupMemberUserValidityPeriodBtwDateEndValue(dateEnd, false);
                    }

                    return false;
                }
                
            }
        }

        $(`#btnUserValiditySave`).removeClass(`disabled`);

        return true;
    }
}

function clearGroupEditValidityData()
{
    setGroupMemberValidityPeriodFromDate(null, groupMemberEditContactId);

    setGroupMemberUserValidityPeriodBtwDateStart(null, groupMemberEditContactId);

    setGroupMemberUserValidityPeriodBtwDateEnd(null, groupMemberEditContactId);
}

function saveUserValidityData()
{
    if ($(`input[type="radio"][name="usergroupvalidityperiod"][value="usergroupvalidityperiodfromdate"]`).prop('checked'))
    {
        let txtUserGroupValidityPeriodFromDate = $(`#txtUserGroupValidityPeriodFromDate`).attr(`data-value`);
        setGroupMemberValidityPeriodFromDate(txtUserGroupValidityPeriodFromDate, groupMemberEditContactId);

        setGroupMemberUserValidityPeriodBtwDateStart(null, groupMemberEditContactId);
        setGroupMemberUserValidityPeriodBtwDateEnd(null, groupMemberEditContactId);
    }
    
    if ($(`input[type="radio"][name="usergroupvalidityperiod"][value="usergroupvalidityperiodbetweendate"]`).prop('checked'))
    {
        setGroupMemberValidityPeriodFromDate(null, groupMemberEditContactId);

        let txtUserGroupValidityPeriodBetweenDateStart = $(`#txtUserGroupValidityPeriodBetweenDateStart`).attr(`data-value`);
        setGroupMemberUserValidityPeriodBtwDateStart(txtUserGroupValidityPeriodBetweenDateStart, groupMemberEditContactId);

        let txtUserGroupValidityPeriodBetweenDateEnd = $(`#txtUserGroupValidityPeriodBetweenDateEnd`).attr(`data-value`);
        setGroupMemberUserValidityPeriodBtwDateEnd(txtUserGroupValidityPeriodBetweenDateEnd, groupMemberEditContactId);
    }    
}

function changeBtnUserValiditySave(isValidityDataSaved)
{
    if(isValidityDataSaved == true)
    {
       setBtnGroupUserValiditySaved();
    }
    else //to Save - user validity data not saved
    {
        setBtnGroupUserValidityRequireToSave();
    }
}

function setBtnGroupUserValiditySaved()
{
    $(`#txtBtnUserValiditySave`).attr(`data-saved`, true);
    $(`#txtBtnUserValiditySave`).text(getTranslate("user-validity-saved", `SAVED`));
    $(`#btnUserValiditySave`).attr(`disabled`, `disabled`);
}

function setBtnGroupUserValidityRequireToSave()
{
    $(`#txtBtnUserValiditySave`).text(getTranslate("save-user-validity", `Save User Validity`));
    $(`#txtBtnUserValiditySave`).attr(`data-saved`, false);
    $(`#btnUserValiditySave`).removeAttr(`disabled`);
}
