$(function() {
    initThemeSwitch();
});

function initThemeSwitch()
{
    mountThemeSwitchEvents();
    setThemeSwitchState();
}

function mountThemeSwitchEvents()
{
    $(`#chkThemeSwitch`).off(`input`);
    $(`#chkThemeSwitch`).on(`input`, function(){
        // const checkStatus = $(`#chkThemeSwitch`).is(":checked");
        switchColorTheme();
    });
}


function setThemeSwitchState()
{
    let applied = readLocalStorage("themecolor");

    if(applied == null)
    {
        applied = SYS_INITIAL_THEME;
    }

    if(applied == "light")
    {
        $(`#chkThemeSwitch`).prop('checked', false);
    }
    else
    {
        $(`#chkThemeSwitch`).prop('checked', true);
    }
}