
// Cordova expects each method that the plugin exposes to take success and error callbacks, and an array (opts) of parameters
function callShowNativeScreen(success, error, opts) 
{
    let message = opts[0];

    console.log(`Show Narive Screen Call: ${message}`);

    const result = {
        "result": "OK"
    };

    success(result);
}

function callShowNativeContactList(success, error, opts) 
{
    let screenTitle = opts[0];
    let searchBoxText = opts[1];
    let onlyMobileText = opts[2];
    let contactsText = opts[3];
    let createNewButtonText = opts[4];
    let createGroupButtonText = opts[5];

    const result = {
        "result": "OK"
    };

    success(result);
}

function callShowNativeContactListSelection(success, error, opts) 
{
    let screenTitle = opts[0];
    let searchBoxText = opts[1];
    let onlyMobileText = opts[2];
    let addButtonText = opts[3];
    let contactsText = opts[4];

    const result = {
        "result": "OK"
    };

    success(result);
}

module.exports = {
    nativeScreen: callShowNativeScreen,
    nativeContactList: callShowNativeContactList,
    nativeContactListSelection: callShowNativeContactListSelection
};

require('cordova/exec/proxy').add('NativeScreen', module.exports);
