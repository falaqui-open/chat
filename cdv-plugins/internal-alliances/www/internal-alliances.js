var exec = require( 'cordova/exec');
var PLUGIN_NAME = 'Alliances';

module.exports = {
	getVersion: function()
	{
        return GetVersion();
    },
    audioProcessing: function(audioPath)
    {
        return AudioProcessing(audioPath);
    },
    transcribeAudio: function(audioPath, whLanguage, whDuration, isMP3)
    {
        return TranscribeAudio(audioPath, whLanguage, whDuration, isMP3);
    },
    wav2MP3: function(wavPath)
    {
        return Wav2MP3(wavPath);
    },
    startHTTPServer: function(publicPath, port)
    {
        return StartHTTPServer(publicPath, port);
    },
    stopHTTPServer: function()
    {
        return StopHTTPServer();
    }
}

function GetVersion()
{
    return new Promise(function(resolve, reject) {
        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "getVersion", []);
    });
}

function AudioProcessing(audioPath)
{
    return new Promise(function(resolve, reject) {
        const args = [
            audioPath
        ];

        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "audioProcessing", args);
    });
}

function Wav2MP3(wavPath)
{
    return new Promise(function(resolve, reject) {
        const args = [
            wavPath
        ];

        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "wav2mp3", args);
    });
}

function StartHTTPServer(publicPath, port)
{
    return new Promise(function(resolve, reject) {
        const args = [
            publicPath,
            port
        ];

        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "startHTTPServer", args);
    });
}

function StopHTTPServer()
{
    return new Promise(function(resolve, reject) {
        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "stopHTTPServer", []);
    });
}

function TranscribeAudio(audioPath, whLanguage, whDuration, isMP3)
{
    return new Promise(function(resolve, reject) {
        const args = [
            audioPath,
            whLanguage,
            whDuration,
            isMP3
        ];

        exec((result) =>{
            // successCallback
            resolve(result);
        }, (error) =>{
            // errorCallback
            reject(error);
        }, PLUGIN_NAME, "transcribeAudio", args);
    });
}