var exec = require( 'cordova/exec');
var PLUGIN_NAME = 'NativeScreen';

module.exports = {
    showNativeScreen: function(message)
    {
        return ShowNativeScreen(message);
    },
    showNativeContactList: function(screenTitle, searchBoxText, onlyMobileText, contactsText, createNewButtonText, createGroupButtonText)
    {
        return ShowNativeContactList(screenTitle, searchBoxText, onlyMobileText, contactsText, createNewButtonText, createGroupButtonText);
    },
    showNativeContactListSelection: function(preseledted, screenTitle, searchBoxText, onlyMobileText, addButtonText, contactsText)
    {
        return ShowNativeContactListSelection(preseledted, screenTitle, searchBoxText, onlyMobileText, addButtonText, contactsText);
    }
}

function ShowNativeScreen(message)
{
    return new Promise(function(resolve, reject) {
        const args = [
            message
        ];

        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "showNativeScreen", args);
    });
}

function ShowNativeContactList(screenTitle, searchBoxText, onlyMobileText, contactsText, createNewButtonText, createGroupButtonText)
{
    return new Promise(function(resolve, reject) {
        const args = [
            screenTitle,
            searchBoxText,
            onlyMobileText,
            contactsText,
            createNewButtonText,
            createGroupButtonText
        ];

        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "showNativeContactList", args);
    });
}

function ShowNativeContactListSelection(preseledted, screenTitle, searchBoxText, onlyMobileText, addButtonText, contactsText)
{
    return new Promise(function(resolve, reject) {
        const args = [
            preseledted,
            screenTitle,
            searchBoxText,
            onlyMobileText,
            addButtonText,
            contactsText
        ];

        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "showNativeContactListSelection", args);
    });
}