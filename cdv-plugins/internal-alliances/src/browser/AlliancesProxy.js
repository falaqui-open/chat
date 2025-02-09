
// Cordova expects each method that the plugin exposes to take success and error callbacks, and an array (opts) of parameters
function callGetVersion(success, error, opts) 
{
    const result = {
        "version": "1.0.0",
        "native": "Not Implemented"
    };

    success(result);
}

function callAudioProcessing(success, error, opts) 
{
    let audioPath = opts[0];

    console.log(`Audio Processing Call: ${audioPath}`);

    const result = {
        "result": "OK"
    };

    success(result);
}

function callStartHTTPServer(success, error, opts) 
{
    const result = {
        "responseText": "Not Implemented"
    };

    success(result);
}

function callStopHTTPServer(success, error, opts) 
{
    const result = {
        "responseText": "Not Implemented"
    };

    success(result);
}

module.exports = {
    getVersion: callGetVersion,
    audioProcessing: callAudioProcessing,
    startHTTPServer: callStartHTTPServer,
    stopHTTPServer: callStopHTTPServer
};

require('cordova/exec/proxy').add('Alliances', module.exports);