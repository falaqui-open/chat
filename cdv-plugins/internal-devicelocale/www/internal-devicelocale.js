var exec = require( 'cordova/exec');
var PLUGIN_NAME = 'DeviceLocale';

module.exports = {
	get: function()
	{
        return Get();
    }
}

function Get()
{
    return new Promise(function(resolve, reject) {
        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "get", []);
    });
}