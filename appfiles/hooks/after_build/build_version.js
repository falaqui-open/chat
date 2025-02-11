#!/usr/bin/env node

// This plugin replaces text in a file with the app version from config.xml.

console.log("Starting Build Version Hook...");

var wwwFileToReplace = "js/parameters.js";

var fs = require('fs');
var path = require('path');

var rootdir = process.argv[2];

console.log("BUILD VERSION HOOK: Root dir: " + rootdir);

function loadConfigXMLDoc(filePath) 
{
    var fs = require('fs');
    var xml2js = require('xml2js');
    var json = "";
    try 
    {
        var fileData = fs.readFileSync(filePath, 'ascii');
        var parser = new xml2js.Parser();

        parser.parseString(fileData.substring(0, fileData.length), function (err, result) {
            //console.log("config.xml as JSON", JSON.stringify(result, null, 2));
            json = result;
        });

        console.log("BUILD VERSION HOOK: File '" + filePath + "' was successfully read.");
        return json;
    } 
    catch (ex) 
    {
        console.log(ex)
    }
}

function replace_string_in_file(filename, to_replace, replace_with) 
{
    var data = fs.readFileSync(filename, 'utf8');

    var result = data.replace(new RegExp(to_replace, "g"), replace_with);
    fs.writeFileSync(filename, result, 'utf8');
}

var configXMLPath = "config.xml";
var rawJSON = loadConfigXMLDoc(configXMLPath);
var version = rawJSON.widget.$.version;
var buildRawData = fs.readFileSync('script-build.json');
var buildData = JSON.parse(buildRawData);
console.log("BUILD VERSION HOOK: Version:", version);

var rootdir = process.argv[2];

//console.log("ENV: " + JSON.stringify(process.env));

var allPlatforms = process.env.CORDOVA_PLATFORMS;

if(allPlatforms == null)
{
    // Read from 2 directories above a local file last-build-platform.txt (if exists) the content and store into allPlatforms
    var lastBuildPlatformPath = path.join(__dirname, '../../last-build-platform.txt');
    if (fs.existsSync(lastBuildPlatformPath)) 
    {
        allPlatforms = fs.readFileSync(lastBuildPlatformPath, 'utf8');
    }
    else
    {
        console.log(`BUILD VERSION HOOK: last-build-platform.txt (${lastBuildPlatformPath}) not found.`);
    }    
}

console.log("BUILD VERSION HOOK: Platforms: " + allPlatforms);

var currentBuildPlatforms = allPlatforms.split(",");
console.log("BUILD VERSION HOOK: Current build platforms: ", currentBuildPlatforms);

if (rootdir) 
{
    currentBuildPlatforms.forEach(function(val, index, array) {
        var wwwPath = "";
        var isiOS = false;
        switch(val) 
        {
            case "ios":
                //wwwPath = "platforms/ios/www/";
                wwwPath = "www/";
                isiOS = true;
                break;
            case "android":
                //wwwPath = "platforms/android/assets/www/";
                wwwPath = "www/";
                break;
            case "browser":
                //wwwPath = "platforms/browser/www/";
                wwwPath = "www/";
                break;
            case "electron":
                //wwwPath = "platforms/browser/www/";
                wwwPath = "www/";
                break;
            default:
                console.log("Unknown build platform: " + val);
        }

        //var fullfilename = path.join(rootdir, wwwPath + wwwFileToReplace);
        var fullfilename = path.join(wwwPath + wwwFileToReplace);

        if (fs.existsSync(fullfilename)) 
        {
            replace_string_in_file(fullfilename, "%%ENDPOINT%%", buildData.serverEndpoint);
            console.log("BUILD SERVER ENDPOINT HOOK: Replaced version in file: " + buildData.serverEndpoint);

            replace_string_in_file(fullfilename, "%%SOCKETENDPOINT%%", buildData.socketEndpoint);
            console.log("BUILD SOCKET ENDPOINT HOOK: Replaced version in file: " + buildData.socketEndpoint);

            replace_string_in_file(fullfilename, "%%VERSION%%", version);
            console.log("BUILD VERSION HOOK: Replaced version in file: " + fullfilename);

            replace_string_in_file(fullfilename, "%%PRODUCTVERSION%%", buildData.productVersion);
            console.log("BUILD PRODUCT VERSION HOOK: Replaced version in file: " + buildData.productVersion);

            replace_string_in_file(fullfilename, "%%USEINTERNALSPLASHSCREEN%%", buildData.useInternalSplashScreen);
            console.log("BUILD USE INTERNAL SPLASH SCREEN: Replaced version in file: " + buildData.useInternalSplashScreen);

            replace_string_in_file(fullfilename, "%%SAMSUNGGALAXYSTOREBUILD%%", buildData.samsungGalaxyStoreBuild);
            console.log("SAMSUNG GALAXY STORE BUILD ACTIVE: Replaced version in file: " + buildData.samsungGalaxyStoreBuild);

            

            if(isiOS == true)
            {
                replace_string_in_file(fullfilename, '"%%ISIOS%%"', "true");
                console.log("BUILD ISIOS HOOK: Replaced for iOS usage: " + fullfilename);
            }
            else
            {
                replace_string_in_file(fullfilename, '"%%ISIOS%%"', "false");
                console.log("BUILD ISIOS HOOK: Replaced for non-iOS usage: " + fullfilename);
            }
        }
        else
        {
            console.log("BUILD VERSION HOOK: " + fullfilename + "Not Found ");
        }
    });
}
