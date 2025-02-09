var exec = require( 'cordova/exec');
var PLUGIN_NAME = 'ActiveContacts';

module.exports = {
	list: function()
	{
        return List();
    }
}

function List()
{
    return new Promise(function(resolve, reject) {
        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "list", []);
    });
}