$(function() {
    mountModalCompanyMemberEvents();
});

function mountModalCompanyMemberEvents()
{
    $("#modalCompanyMember").modal({
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

    $(`#btnCloseModalCompanyMember`).off(`click`);
    $(`#btnCloseModalCompanyMember`).on(`click`, function(){
        closeModalCompanyMember();
    });

    $(`#selCompanyMemberDialCode`).off(`change`);
    $(`#selCompanyMemberDialCode`).on(`change`, function(){
        companyMemberSetSelectedDialCode();

        $(`#txtCompanyMemberPhoneNumber`).val("");
        setTimeout(function(){
            $(`#txtCompanyMemberPhoneNumber`).focus();
        }, 500);
    });

    $(`#txtCompanyMemberPhoneNumber`).off(`input`);
    $(`#txtCompanyMemberPhoneNumber`).on(`input`, function(){
        const typedPhone = $(this).val();

        setTimeout(function(){
            const typedAfterATime = $(`#txtCompanyMemberPhoneNumber`).val();

            if(typedAfterATime != typedPhone)
            {
                // Is typing
                return;
            }
            companyMemberValidation(typedAfterATime);

        }, 500);
    });

    $(`#btnCompanyMemberSave`).off(`click`);
    $(`#btnCompanyMemberSave`).on(`click`, function(){
        saveNewCompanyMember();
    });

    $(`#btnCompanyMemberDelete`).off(`click`);
    $(`#btnCompanyMemberDelete`).on(`click`, function(){
        const companyId = $(this).attr('data-companyId')
        const login = $(this).attr('data-login')
        deleteCompanyMember(companyId, login);
    });
}

function initModalCompanyMember(companyId, login, isAdmin)
{
    $("#modalCompanyMember").modal(`open`);
    $('#btnCompanyMemberDelete').removeAttr('data-companyId');
    $('#btnCompanyMemberDelete').removeAttr('data-login');
    
    const member = modalCompanyMemberList.find(item => item.Login == login);

    if(companyId && login) 
    {
        $('#addMemberTitle').addClass('hide');
        $('#editMemberTitle').removeClass('hide');

        $(`#btnCompanyMemberSave`).removeClass(`disabled`);
        $("#divCompanyMemberSave").removeClass("s12");
        $("#divCompanyMemberSave").removeClass("center");

        $("#divCompanyMemberSave").addClass("s6");
        $("#divCompanyMemberSave").addClass("right-align");        
        
        $('#btnCompanyMemberDelete').removeClass('hide');
        $('#btnCompanyMemberDelete').attr('data-companyId', companyId);
        $('#btnCompanyMemberDelete').attr('data-login', login);
        
        const userDialCode = '+' + login.substring(0,2);
        const phone = login.substring(2);
        //$('#selCompanyMemberDialCode').val('+'+country);
        $(`#companyMemberDialCodeValue`).text(userDialCode);
        $('#selCompanyMemberDialCode').prop('disabled', true);
        $('#txtCompanyMemberPhoneNumber').val(phone);
        $('#txtCompanyMemberPhoneNumber').prop('disabled', true);
        $('#companyMemberDialCodeValue').addClass('disabled');
        $('#chkCompanyMemberIsAdmin').prop('checked', isAdmin);

        $('#chkCompanyMemberIsExternal').prop('checked', member.IsExternal == 1);
        $('#txtCompanyMemberCompanyName').val(member.MemberCompanyName);
        $('#txtCompanyMemberPosition').val(member.Position);
        $('#txtCompanyMemberDepartment').val(member.Department);

        let dialCountryCode = null;

        for(let ix = 0; ix < phoneCodes.length; ix++)
        {
            const dialCodeItem = phoneCodes[ix];
            const dialCodeValue = dialCodeItem.dial_code;
            
            let htmlDialCodeItem = null;

            if(userDialCode == dialCodeValue)
            {
                dialCountryCode = dialCodeItem.code.toUpperCase().trim();
                
                htmlDialCodeItem = `
                <option value="${dialCodeValue}" data-country="${dialCountryCode}" data-mask="${dialCodeItem.mobile_format_area_code}">
                    ${dialCodeItem.emoji} ${dialCodeItem.name}
                </option>
                `;
                
                $(`#selCompanyMemberDialCode`).append(htmlDialCodeItem);
                
                break;
            }
        }

        companyMemberChangeDialCodeSelectionByCountry(dialCountryCode);
    } 
    else 
    {
        $('#addMemberTitle').removeClass('hide');
        $('#editMemberTitle').addClass('hide');

        $("#divCompanyMemberSave").removeClass("s6");
        $("#divCompanyMemberSave").removeClass("right");

        $("#divCompanyMemberSave").addClass("s12");
        $("#divCompanyMemberSave").addClass("center");

        $('#btnCompanyMemberDelete').addClass('hide');
        $('#selCompanyMemberDialCode').prop('disabled', false);
        $('#txtCompanyMemberPhoneNumber').prop('disabled', false);
        $('#companyMemberDialCodeValue').removeClass('disabled');
        
        $('#chkCompanyMemberIsExternal').prop('checked', false) ;
        $('#txtCompanyMemberCompanyName').val('');
        $('#txtCompanyMemberPosition').val('');
        $('#txtCompanyMemberDepartment').val('');
        
        companyMemberClearScreen();
    }
}

function closeModalCompanyMember()
{
    $("#modalCompanyMember").modal(`close`);
}

function companyMemberChangeDialCodeSelectionByCountry(vCountryCode)
{
    if(vCountryCode == null)
    {
        return;
    }

    if(vCountryCode.trim().length == 0)
    {
        return;
    }

    vCountryCode = vCountryCode.toUpperCase().trim();

    $(`#selCompanyMemberDialCode option[data-country="${vCountryCode}"]`).attr("selected","selected");
}

function companyMemberSetSelectedDialCode()
{
    const dialCode = $("#selCompanyMemberDialCode").val();
    const newMask = $(`#selCompanyMemberDialCode`).find("option:selected").attr(`data-mask`);
    const placeHolder = replaceAll(newMask, "0", "_");

    $(`#companyMemberDialCodeValue`).text(dialCode);

    $(`#txtCompanyMemberPhoneNumber`).unmask();

    let masked = false;
    if(newMask != null)
    {
        if(newMask.length > 0)
        {
            $(`#txtCompanyMemberPhoneNumber`).mask(newMask, {placeholder: placeHolder});
            masked = true;
        }
    }

    if(masked == false)
    {
        $(`#txtCompanyMemberPhoneNumber`).removeAttr("placeholder");
    }
}

function companyMemberGetSelectedCountryCode()
{
    const vCountryCode = $(`#selCompanyMemberDialCode`).find("option:selected").attr(`data-country`);
    return vCountryCode;
}

function companyMemberClearScreen()
{
    $(`#btnCompanyMemberSave`).addClass(`disabled`);
    $(`#txtCompanyMemberPhoneNumber`).val(``);


    $(`#selCompanyMemberDialCode`).empty();

    for(let ix = 0; ix < phoneCodes.length; ix++)
    {
        const dialCodeItem = phoneCodes[ix];
        const dialCodeValue = dialCodeItem.dial_code;
        const dialCountryCode = dialCodeItem.code.toUpperCase().trim();

        const htmlDialCodeItem = `
        <option value="${dialCodeValue}" data-country="${dialCountryCode}" data-mask="${dialCodeItem.mobile_format_area_code}">
            ${dialCodeItem.emoji} ${dialCodeItem.name}
        </option>
        `
        $(`#selCompanyMemberDialCode`).append(htmlDialCodeItem);
    }

    $('#chkCompanyMemberIsAdmin').prop('checked', false);

    companyMemberChangeDialCodeSelectionByCountry(countryCode);

    companyMemberSetSelectedDialCode();
}

function companyMemberValidation(typedPhoneNum)
{
    if(strToOnlyNum(typedPhoneNum).trim().length == 0)
    {
        // Reset screen
        $(`#btnCompanyMemberSave`).addClass(`disabled`);
        $(`#companyMemberInvalidMobilePhone`).addClass(`hide`);
        return;
    }

    const fullPhone = `${$(`#selCompanyMemberDialCode`).val()}${strToOnlyNum(typedPhoneNum)}`;

    const vCountryCode = companyMemberGetSelectedCountryCode();
    const isValid = lpnIsValid(fullPhone, vCountryCode);

    if(isValid == false)
    {
        $(`#btnCompanyMemberSave`).addClass(`disabled`);
        $(`#companyMemberInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    const isMobile = lpnIsMobile(fullPhone, vCountryCode);
    if(isMobile == false)
    {
        $(`#btnCompanyMemberSave`).addClass(`disabled`);
        $(`#companyMemberInvalidMobilePhone`).removeClass(`hide`);
        return;
    }
    $(`#btnCompanyMemberSave`).removeClass(`disabled`);

    $(`#companyMemberInvalidMobilePhone`).addClass(`hide`);

    setTimeout(function(){
        Keyboard.hide();
    }, 500);
}

async function saveNewCompanyMember()
{
    const typedPhone = $(`#txtCompanyMemberPhoneNumber`).val();

    if(strToOnlyNum(typedPhone).trim().length == 0)
    {
        // Reset screen
        $(`#btnCompanyMemberSave`).addClass(`disabled`);
        $(`#companyMemberInvalidMobilePhone`).addClass(`hide`);
        return;
    }

    const fullPhone = `${$(`#selCompanyMemberDialCode`).val()}${strToOnlyNum(typedPhone)}`;

    const vCountryCode = companyMemberGetSelectedCountryCode();
    const isValid = lpnIsValid(fullPhone, vCountryCode);

    if(isValid == false)
    {
        $(`#btnCompanyMemberSave`).addClass(`disabled`);
        $(`#companyMemberInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    const isMobile = lpnIsMobile(fullPhone, vCountryCode);
    if(isMobile == false)
    {
        $(`#btnCompanyMemberSave`).addClass(`disabled`);
        $(`#companyMemberInvalidMobilePhone`).removeClass(`hide`);
        return;
    }

    $(`#btnCompanyMemberSave`).addClass(`disabled`);

    doCompanyMemberSaveNew(fullPhone);
}

async function doCompanyMemberSaveNew(fullPhone)
{
    const onlyNumPhone = strToOnlyNum(fullPhone);

    try
    {
        await companyMemberSavePhone(onlyNumPhone);
    }
    catch(saveContactError)
    {
        swal(`2003: ${getTranslate(`error`, `Error`)} - ${saveContactError}`);

        $(`#btnCompanyMemberSave`).removeClass(`disabled`);

        return;
    }

    afterNewCompanyMemberCreation();
}

async function companyMemberSavePhone(fullPhone)
{
    const isAdmin = $('#chkCompanyMemberIsAdmin').is(':checked');
    const isAdminValue = isAdmin == true ? 1 : 0;

    const company = $(`#selectCompanyInput`).val();
    
    const checkQuery = 'SELECT * FROM CompanyMembers WHERE CompanyId = ? AND Login = ?';
    const checkResult = await dbRun(checkQuery, [company, fullPhone]);

    const isExternalValue = $('#chkCompanyMemberIsExternal').is(':checked');
    const companyNameValue = $('#txtCompanyMemberCompanyName').val();
    const positionValue = $('#txtCompanyMemberPosition').val();
    const departamentoValue = $('#txtCompanyMemberDepartment').val();
    
    let IsExternal = isExternalValue ? 1 : 0;     
    const MemberCompanyName = companyNameValue?.length > 0 ? companyNameValue : null;
    const Position =  positionValue?.length > 0 ? positionValue : null;
    const Department = departamentoValue?.length > 0 ? departamentoValue : null;

    if(checkResult.rows.length) 
    {
        const lastAction = 'Update App';
        const sqlScript = 'UPDATE CompanyMembers SET IsAdmin = ?,  IsExternal = ?, MemberCompanyName = ?, Department = ? , Position = ?, IsServerUpdated = 0, PendingToRemove= 0, LastAction = ? WHERE Login=? AND CompanyId=?';
        const sqlScriptValues = [isAdminValue,  IsExternal, MemberCompanyName, Department, Position,  lastAction, fullPhone, company];
        await dbRun(sqlScript, sqlScriptValues);
    } 
    else 
    {
        const insertAction = 'App';
        const lastAction = 'Insert';
        const sqlScript = 'INSERT INTO CompanyMembers(CompanyId, Login, IsAdmin,  IsExternal, MemberCompanyName, Department, Position, IsServerUpdated, PendingToRemove, InsertAction, LastAction) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)';
        const sqlScriptValues = [company, fullPhone, isAdminValue,  IsExternal, MemberCompanyName, Department, Position, insertAction, lastAction];

        await dbRun(sqlScript, sqlScriptValues);
    }
}

async function afterNewCompanyMemberCreation()
{
    companyMemberClearScreen();
    closeModalCompanyMember();
    await listMembersOfCompany();
}

function deleteCompanyMember(companyId, login)
{
    const confirmationTitle = getTranslate(`delete-company-member-title`, `Delete Company Member`);
    const confirmationText = getTranslate(`delete-company-member-text`, `Do you want to delete this company member?`);
    const cancelButtonText = getTranslate(`no`, `NO`);
    const confirmButtonText = getTranslate(`yes`, `YES`);
    
    swalConfirm(confirmationTitle, confirmationText, `warning`, cancelButtonText, confirmButtonText, ()=>{
        closeModalCompanyMember();
    }, async ()=> {
        
        dbRun(`UPDATE CompanyMembers SET PendingToRemove = 1, IsServerUpdated = 0, LastAction= 'Delete App' WHERE  Login=? AND CompanyId=?`, [login, companyId]);
        
        listMembersOfCompany();
        closeModalCompanyMember();
    });
}
