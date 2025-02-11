var miniAppServerLocation = null;
var miniAppInstances = [];
const MINIAPP_ALLOW_ONLY_ONE_INSTANCE = true;

async function startMiniApp(appId)
{
    const existingInstanceOfApp = getMiniAppInstanceByAppId(appId);

    if(existingInstanceOfApp != null)
    {
        resumeMiniAppInstance(existingInstanceOfApp);
        return;
    }

    if(MINIAPP_ALLOW_ONLY_ONE_INSTANCE == true)
    {
        if(miniAppInstances.length > 0)
        {
            closeAndDestroyAllInstances();
        }
    }

    createMiniAppInstance(appId);
}

async function createMiniAppBrowser(appId, instanceId)
{
    var instanceRecord = miniAppInstances.find((item) =>{
        return item.id == instanceId
    });

    let appServerAddress = `localhost`;

    let urlScheme = `http`;

    const appOpenURL = `${urlScheme}://${appServerAddress}:8080/${appId}/index.html`;

    var target = "_blank";
    // var options = "location=yes,hidden=yes,beforeload=yes";
    // var options = "location=yes";
    const toolboxColor = convertRGBToHex($(`body`).css("background-color"));

    // Inapp browser options: https://cordova.apache.org/docs/en/12.x/reference/cordova-plugin-inappbrowser/index.html
    var options = `location=no`;

    if(cordova.platformId == 'ios')
    {
        // options += `,toolbar=yes`;
        // options += `,beforeload=yes`;
        // options += `,toolbarcolor=${toolboxColor}`;
        // options += `,toolbartranslucent=yes`;
        // options += `,toolbarposition=bottom`;
        
    }
    else
    {
        options += `,footer=yes`;
        options += `,footercolor=${toolboxColor}`;
        options += `,hardwareback=yes`;
    }

    instanceRecord.browser = cordova.InAppBrowser.open(appOpenURL, target, options);
    instanceRecord.browser.__instanceId = instanceId;
    instanceRecord.browser.__appId = appId;
    instanceRecord.browser.__url = appOpenURL;

    instanceRecord.browser.addEventListener('loadstart', function(event){

    });

    instanceRecord.browser.addEventListener('loadstop', function(){
        const instanceActionRecord = getMiniAppInstance(instanceId);

        if (instanceActionRecord.browser != null) 
        {
            instanceActionRecord.browser.executeScript({
                code: `
                    // Create a div element for the header toolbox
                    var headerDiv = document.createElement('div');
                    headerDiv.style.position = 'fixed';
                    headerDiv.style.top = '0';
                    headerDiv.style.left = '0';
                    headerDiv.style.width = '100%';
                    headerDiv.style.height = '80px';
                    headerDiv.style.backgroundColor = '${toolboxColor}';
                    headerDiv.style.display = 'flex';
                    headerDiv.style.justifyContent = 'left';
                    headerDiv.style.alignItems = 'center';
                    headerDiv.style.color = '#fff'; // Text color
                    headerDiv.style.zIndex = '1000'; // Make sure it's on top of everything
                    headerDiv.style.padding = '0 15px';

                    // Create the minimize button
                    var minimizeButton = document.createElement('button');
                    minimizeButton.innerHTML = '▼ Minimize';
                    minimizeButton.style.fontFamily = "Arial, Verdana, monospace";
                    minimizeButton.style.fontSize = "16pt";
                    minimizeButton.style.height = '80px';
                    minimizeButton.style.backgroundColor = '#3b7d99'; // Button background color
                    minimizeButton.style.color = '#ffffff'; // Button text color
                    minimizeButton.style.border = 'none';
                    minimizeButton.style.padding = '10px 20px';
                    minimizeButton.style.marginLeft = "20px";
                    minimizeButton.style.cursor = 'pointer';

                    // Add the minimize button to the header div
                    headerDiv.appendChild(minimizeButton);


                    // Create the close button
                    var closeButton = document.createElement('button');
                    closeButton.innerHTML = '⛌ Close';
                    closeButton.style.fontFamily = "Arial, Verdana, monospace";
                    closeButton.style.fontSize = "16pt";
                    closeButton.style.height = '80px';
                    closeButton.style.backgroundColor = '#ff0000'; // Button background color
                    closeButton.style.color = '#ffffff'; // Button text color
                    closeButton.style.border = 'none';
                    closeButton.style.padding = '10px 20px';
                    closeButton.style.marginLeft = "20px";
                    closeButton.style.cursor = 'pointer';

                    // Add the close button to the header div
                    headerDiv.appendChild(closeButton);



                    // Append the header div to the body
                    document.body.appendChild(headerDiv);

                    // Adjust the body content to move below the header
                    document.body.style.paddingTop = '60px'; // Push content down by the height of the header

                    // Minimize button click event
                    minimizeButton.addEventListener('click', function() {
                        var message = 'maMinimize';
                        var messageObj = {messageValue: message, appId: "${appId}", instanceId: "${instanceId}"};
                        var stringifiedMessageObj = JSON.stringify(messageObj);
                        webkit.messageHandlers.cordova_iab.postMessage(stringifiedMessageObj);
                    });

                    // Close button click event
                    closeButton.addEventListener('click', function() {
                        var message = 'maClose';
                        var messageObj = {messageValue: message, appId: "${appId}", instanceId: "${instanceId}"};
                        var stringifiedMessageObj = JSON.stringify(messageObj);
                        webkit.messageHandlers.cordova_iab.postMessage(stringifiedMessageObj);
                    });
                `
            });

            instanceActionRecord.browser.show();
        }
    });

    instanceRecord.browser.addEventListener('loaderror', function(event){   
        // instanceRecord.browser.close();
    
        // instanceRecord.browser = null;
    });


    instanceRecord.browser.addEventListener('beforeload', function(params, callback){

    });

    instanceRecord.browser.addEventListener('message', function(params){
        // console.log(params.data.messageValue);
        if(params.data.messageValue == `maMinimize`)
        {
            // console.log(`Minimize action: ${params.data.appId}`);
            const instanceActionRecord = getMiniAppInstance(params.data.instanceId);
            instanceActionRecord.browser.hide();
        }
        else if(params.data.messageValue == `maClose`)
        {
            // console.log(`Close action: ${params.data.appId}`);
            const instanceActionRecord = getMiniAppInstance(params.data.instanceId);
            instanceActionRecord.browser.close();
            instanceActionRecord.browser = null;
            destroyMiniAppInstance(instanceActionRecord.id);
        }
    });

    instanceRecord.browser.addEventListener('exit', function(params){
        // if (instanceRecord.browser == null) 
        // {
        //     return;
        // }

        // instanceRecord.browser.close();
        // instanceRecord.browser = null;
    });


}

// function openMiniAppModal()
// {
//     $(`#modalMiniApp`).modal(`open`);
// }

function closeMiniApp()
{
     // closeMiniAppModal();
}

// function closeMiniAppModal()
// {

//     let modalElement = $(`#appCustomArea`).find(`#modalMiniApp`);
//     if(modalElement.length > 0)
//     {
//         const elem = document.getElementById(`modalMiniApp`);
//         var instance = M.Modal.getInstance(elem);
//         if(instance.isOpen == true)
//         {
//             $(`#modalMiniApp`).modal(`close`);
//             $(`#modalMiniApp`).modal(`destroy`);
//         }

//         $(`#appCustomArea`).find(`#modalMiniApp`).remove();
//     }
// }

function miniAppWebServerStart()
{
    return new Promise(async (resolve, reject) => {

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            resolve();
            return;
        }


        webserver.onRequest(
            function(request) {
                // console.log("O MA GAWD! This is the request: ", request);

                // let appLocation = `${miniAppLocalFolderLocation}${appId}/index.html`;
                // let appLocation = miniAppRunningLocation;

                /*
                    Request Object
                        headers:  "{sec-fetch-mode=navigate, ..."
                        method: "GET"
                        path: "/index.html"
                        requestId: "076d7446-0d05-4b04-82c6-e1ebedec566e"
                */

                let relativePath = request.path;
                if(miniAppServerLocation.endsWith("/") == true && relativePath.startsWith("/") == true)
                {
                    relativePath = relativePath.substring(1);
                }

                let filePath = `${miniAppServerLocation}${relativePath}`;
                let requestMimeType = getMimeType(filePath);

                // console.log(`Requesting from app webserver ${filePath} (${requestMimeType})`);
        
                webserver.sendResponse(
                    request.requestId,
                    {
                        status: 200,
                        path: filePath,
                        headers: {
                            'Content-Type':requestMimeType,
                            'Access-Control-Allow-Origin': '*', // Allow all origins for testing
                            // 'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
                            'Access-Control-Allow-Headers': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                            'Access-Control-Allow-Credentials': 'true',
                            'Connection': 'Keep-Alive'
                        }
                    }
                );
            }
        );

        await waitForMiniAppLocalFolderSet();

        // At 8080 port - window.open("http://localhost:8080", "_self", "location=yes");
        await webserver.start();

        miniAppServerLocation = miniAppLocalFolderLocation;
        if (miniAppServerLocation.toLowerCase().trim().startsWith("file://")) 
        {
            // Remove the "file://" prefix from miniAppServerLocation
            miniAppServerLocation = miniAppServerLocation.substring(7); // 7 is the length of "file://"
        }
        

        console.log(`🌎 Miniapp webserver started`);
    });

}

function getMimeType(filePath) 
{
    const extension = filePath.split('.').pop().toLowerCase();
    switch (extension) 
    {
        // Text files
        case 'html':
        case 'htm': return 'text/html';
        case 'xhtml': return 'application/xhtml+xml';
        case 'css': return 'text/css';
        case 'js': return 'application/javascript';
        case 'json': return 'application/json';
        case 'jsonld': return 'application/ld+json';
        case 'xml': return 'application/xml';
        case 'txt': return 'text/plain';
        case 'csv': return 'text/csv';
        case 'md': return 'text/markdown';
        case 'yaml':
        case 'yml': return 'application/x-yaml';

        // Image files
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'bmp': return 'image/bmp';
        case 'webp': return 'image/webp';
        case 'svg': return 'image/svg+xml';
        case 'ico': return 'image/x-icon';
        case 'tiff':
        case 'tif': return 'image/tiff';
        case 'heic': return 'image/heic';

        // Audio files
        case 'mp3': return 'audio/mpeg';
        case 'wav': return 'audio/wav';
        case 'ogg': return 'audio/ogg';
        case 'm4a': return 'audio/mp4';
        case 'aac': return 'audio/aac';
        case 'flac': return 'audio/flac';
        case 'oga': return 'audio/ogg';
        case 'weba': return 'audio/webm';

        // Video files
        case 'mp4': return 'video/mp4';
        case 'webm': return 'video/webm';
        case 'ogv': return 'video/ogg';
        case 'avi': return 'video/x-msvideo';
        case 'mov': return 'video/quicktime';
        case 'mkv': return 'video/x-matroska';
        case 'flv': return 'video/x-flv';
        case 'mpeg':
        case 'mpg': return 'video/mpeg';
        case '3gp': return 'video/3gpp';
        case '3g2': return 'video/3gpp2';

        // Font files
        case 'woff': return 'font/woff';
        case 'woff2': return 'font/woff2';
        case 'ttf': return 'font/ttf';
        case 'otf': return 'font/otf';
        case 'eot': return 'application/vnd.ms-fontobject';

        // Archive files
        case 'zip': return 'application/zip';
        case 'tar': return 'application/x-tar';
        case 'gz': return 'application/gzip';
        case 'rar': return 'application/vnd.rar';
        case '7z': return 'application/x-7z-compressed';
        case 'bz2': return 'application/x-bzip2';

        // Application files
        case 'pdf': return 'application/pdf';
        case 'exe': return 'application/vnd.microsoft.portable-executable';
        case 'msi': return 'application/x-msdownload';
        case 'apk': return 'application/vnd.android.package-archive';
        case 'iso': return 'application/x-iso9660-image';
        case 'dmg': return 'application/x-apple-diskimage';
        case 'deb': return 'application/x-debian-package';
        case 'rpm': return 'application/x-rpm';
        case 'sh': return 'application/x-sh';
        case 'bat': return 'application/x-bat';

        // Document files
        case 'doc': return 'application/msword';
        case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        case 'xls': return 'application/vnd.ms-excel';
        case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'ppt': return 'application/vnd.ms-powerpoint';
        case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        case 'odt': return 'application/vnd.oasis.opendocument.text';
        case 'ods': return 'application/vnd.oasis.opendocument.spreadsheet';
        case 'odp': return 'application/vnd.oasis.opendocument.presentation';

        // Miscellaneous
        case 'rtf': return 'application/rtf';
        case 'log': return 'text/plain';
        case 'bin': return 'application/octet-stream';
        case 'c': 
        case 'cpp': 
        case 'h': 
        case 'hpp': return 'text/x-c';
        case 'py': return 'text/x-python';
        case 'java': return 'text/x-java-source';
        case 'php': return 'application/x-httpd-php';
        case 'sql': return 'application/sql';
        case 'sqlite': return 'application/x-sqlite3';

        // Default case for unknown file types
        default: return 'application/octet-stream';
    }
}

function waitForMiniAppLocalFolderSet()
{
    return new Promise((resolve, reject) =>{
        if(miniAppLocalFolderSet == true)
        {
            resolve();
            return;
        }

        var itvLoadingMiniAppLocalFolder = setInterval(function(){
            if(miniAppLocalFolderSet == true)
                {
                    clearInterval(itvLoadingMiniAppLocalFolder);
                    itvLoadingMiniAppLocalFolder = null;
                    resolve();
                }
        }, 500);
    })
}

function getMiniAppInstanceByAppId(appId)
{
    const instance = miniAppInstances.find((item) =>{
        return item.appId == appId;
    });

    return instance;
}

function getMiniAppInstance(instanceId)
{
    const instance = miniAppInstances.find((item) =>{
        return item.id == instanceId;
    });

    return instance;
}

function resumeMiniAppInstance(instance)
{
    instance.browser.show();
}

async function createMiniAppInstance(appId)
{
    const miniAppIsInstalled = await isMiniAppInstalled(appId);

    if(miniAppIsInstalled == false)
    {
        // console.log(`Downloading mini app... ${appId}`);
        const donwloaded = await downloadMiniApp(appId, null, true);

        if(donwloaded == false)
        {
            swal(`Unable to get App`);
            return;
        }

        console.log(`Mini app downloaded: ${appId}`);
    }
    else
    {
        console.log(`Mini app already installed: ${appId}`);
    }

    let miniAppInstanceId = makeid(12);

    miniAppInstances.push({
        "id": miniAppInstanceId,
        "appId": appId,
        "browser": null
    });

    await createMiniAppBrowser(appId, miniAppInstanceId);


}

async function closeAndDestroyAllInstances()
{
    for(let ix = miniAppInstances.length -1; ix >= 0; ix--)
    {
        miniAppInstances[ix].browser.close();
        miniAppInstances[ix].browser = null;
        destroyMiniAppInstance(miniAppInstances[ix].id);
    }
}

async function destroyMiniAppInstance(instanceId)
{
    const instanceIx = miniAppInstances.findIndex((item) =>{
        return item.id == instanceId;
    });

    if(instanceIx < 0)
    {
        return;
    }

    miniAppInstances.splice(instanceIx, 1);
}

async function isMiniAppInstalled(appId)
{
    const localDownloadDirInfo = await getLocalSavedMiniapp(appId);

    let installed = false;

    if(localDownloadDirInfo.found == true)
    {
        // console.log(`Miniapp directory found`);

        let indexFound = false;

        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {
            let indexFilePath = `${miniAppLocalFolderBaseLocation}${appId}/index.html`;
            indexFound = ZenFS.fs.existsSync(indexFilePath);
        }
        else
        {
            let indexFilePath = `${miniAppLocalFolderLocation}${appId}/index.html`;
            const indexFileDetails = await localFileURLPathResolve(indexFilePath);
            indexFound = indexFileDetails.status == true;
        }

        if(indexFound == false)
        {
            console.log(`Local index not found, removing directory and reinstalling`);
            deleteMiniAppDirectory(appId);
        }
        else
        {
            // console.log(`Miniapp index found`);
            installed = true;
        }
    }

    return installed;
}

function downloadMiniApp(appid, preloadedConnectionState, noCache)
{
    return new Promise(async (resolve, reject) =>{
        let serverConnectionState;

        if(preloadedConnectionState != null)
        {
            serverConnectionState = preloadedConnectionState;
        }
        else
        {
            serverConnectionState = await hasServerConnection();
        }
    
        if(noCache == null)
        {
            noCache = false;
        }
    
        const localDownloadDirInfo = await getLocalSavedMiniapp(appid);
        const localDownloadedDirPath = localDownloadDirInfo.filePath;
        const localDownloadedDirName = localDownloadDirInfo.dirName;
        const localBaseDownloadedDirPath = `${miniAppLocalFolderBaseLocation}${appid}`;
    
        let existsApp = false;
    
        if(localDownloadDirInfo.found == false)
        {
            if(serverConnectionState == true)
            {
                await createNewFolderInMiniAppLocation(appid);
    
                let downloadURL = `${endpoint}services/miniappsource/${appid}`;
                const zipName = `${appid}.zip`;
        
                if(noCache == true)
                {
                    downloadURL += `?nocacheid=${makeid(6)}`;
                }
    
                // Browser-specific logic
                try 
                {
                    const response = await fetch(downloadURL);
                    const blob = await response.blob();

                    let unzipToLocation = localDownloadedDirPath;
                    // if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
                    // {
                    //     // Using ZenFS
                    //     unzipToLocation = localDownloadedDirPath;
                    // }
                    // else
                    // {
                    //     // Using resolveLocalFileSystemURL
                    //     unzipToLocation = localBaseDownloadedDirPath;
                    // }

                    // Use zip.js to unzip the blob
                    await unzipMiniAppBlob(blob, unzipToLocation);

                    setTimeout(function(){
                        // console.log(`Unzip ok in browser`);
                        // deleteLocalFile(zipPath);
                        resolve(true);
                    }, 600);


                } 
                catch (error) {
                    console.log(`Error downloading or unzipping in browser: ${error}`);
                    resolve(false);
                }
                

    
            }
            else
            {
                console.log(`Unable to download when device is offline`);
                resolve(false);
                return;
            }
        }
        else
        {
            resolve(true);
            return;
        }
    });

}

async function getLocalSavedMiniapp(appid)
{
    const dirName = appid;
    let result = null;

    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        const localDownloadedFilePath = `${miniAppLocalFolderBaseLocation}${dirName}`;
        const found = ZenFS.fs.existsSync(localDownloadedFilePath);
    
        result = {
            "dirName": dirName,
            "filePath": localDownloadedFilePath,
            "found": found
        }
    }
    else
    {
        const localDownloadedFilePath = `${miniAppLocalFolderLocation}${dirName}`;
        const localFileDetails = await localFileURLPathResolve(localDownloadedFilePath);

        result = {
            "fileName": dirName,
            "filePath": localDownloadedFilePath,
            "found": false
        }
    
        if(localFileDetails.status == true)
        {
            result.found = true;
        }
    }

    return result;
}

function deleteMiniAppDirectory(appFolderName)
{
    return new Promise(async (resolve, reject) => {
        if (cordova.platformId === 'browser' || cordova.platformId === 'electron') 
        {
            // For browser platform
            ZenFS.fs.rmSync(`${miniAppLocalFolderBaseLocation}${appFolderName}`, {"recursive": true});
        } 
        else 
        {
            await deleteLocalDirectory(`${miniAppLocalFolderLocation}${appFolderName}`);
        }
    });
}

async function createNewFolderInMiniAppLocation(folderName)
{
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        ZenFS.fs.mkdirSync(`${miniAppLocalFolderBaseLocation}${folderName}`, {"recursive": true});
    }
    else
    {
        await createNewFolderInDirectory(miniAppLocalFolderLocation, folderName);
    }
}

async function unzipMiniAppBlob(blob, targetDir) 
{
    // Create a zip reader
    const reader = new zip.ZipReader(new zip.BlobReader(blob));

    try 
    {
        // Get all entries from the zip file
        const entries = await reader.getEntries();

        for (const entry of entries) 
        {
            if (entry.directory) 
            {
                // Handle directories as needed
                continue;
            }

            // Create a writer for the file content
            const filePath = `${targetDir}/${entry.filename}`;
            const writer = new zip.BlobWriter();

            // Extract the entry's content and save it to the desired location
            const data = await entry.getData(writer);
            
            // Save the file data to the target directory (filesystem API logic here)
            await saveFileToMiniAppDir(filePath, data);
            // console.log(`File extracted: ${filePath}`);
        }
    } catch (error) {
        console.error(`Error unzipping file: ${error}`);
    } finally {
        // Close the reader after extracting
        await reader.close();
    }
}

async function saveFileToMiniAppDir(filePath, data) 
{
    // Convert Blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();

    // Extract the directory path from the file path
    var directoryPath = filePath.substring(0, filePath.lastIndexOf('/') + 1);

    // Extract the file name from the file path
    var fileName = filePath.substring(filePath.lastIndexOf('/') + 1);

    // Use browser filesystem API to save file data
    if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
    // browserFs.root.getFile(filePath, { create: true, exclusive: false }, function (fileEntry) {
        browserFs.root.getFile(filePath, { create: true }, function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {
                const blob = new Blob([arrayBuffer]);
                fileWriter.write(blob);
    
                // console.log('File saved:', filePath);
            }, browserFSErrorHandler);
        }, browserFSErrorHandler);    
    }
    else
    {
        // Use window.resolveLocalFileSystemURL to get the directory entry
        window.resolveLocalFileSystemURL(directoryPath, function(dirEntry) {
            // console.log("Directory Entry obtained successfully:", dirEntry);

            // Pass the relative file name instead of the full path
            dirEntry.getFile(fileName, { create: true, exclusive: false }, function (fileEntry) {

                fileEntry.createWriter(function (fileWriter) {
                    const blob = new Blob([arrayBuffer]);
                    fileWriter.write(blob);
                    // console.log('File saved:', filePath);
                }, function(errWrite) {
                    console.error("Error writing file:", errWrite);
                });

            }, function (err) { 
                console.error("Error getting file entry:", err);
            });

        }, function(error) {
            console.error("Failed to get directory entry:", error);
        });
    }

}

function browserFSErrorHandler(e) 
{
    let msg = '';

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'Quota exceeded';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'File not found';
            break;
        case FileError.SECURITY_ERR:
            msg = 'Security error';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'Invalid modification';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'Invalid state';
            break;
        default:
            msg = 'Unknown error ' + e;
            break;
    };

    console.error('Error: ' + msg);
}
