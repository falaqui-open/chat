function writeLocalStorage(key, value)
{
	if(value == null)
	{
		value = "";
	}
	
	if(isiOS == true)
	{
		localStorage.setItem(key, value);
		return;
	}

	let encKey = encodeStr(key);
	let encValue = encodeStr(value);

	localStorage.setItem(encKey, encValue);
}

function readLocalStorage(key)
{
	if(isiOS == true)
	{
		var itemiOS = localStorage[key];
		return itemiOS;
	}
	let encKey = encodeStr(key);
	var item = localStorage[encKey];

	if(item == null)
	{
		return null;
	}

	var decValue = decodeStr(item);

	return decValue;
}

function removeLocalStorage(key)
{
	if(isiOS == true)
	{
		localStorage.removeItem(key);
		return;
	}

	let encKey = encodeStr(key);
	localStorage.removeItem(encKey);
}

function clearLocalStorage()
{
	localStorage.clear();
}

function writeSessionStorage(key, value)
{
	if(isiOS == true)
	{
		sessionStorage.setItem(key, value);
		return;
	}

	let encKey = encodeStr(key);
	let encValue = encodeStr(value);

	sessionStorage.setItem(encKey, encValue);
}

function readSessionStorage(key)
{
	if(isiOS == true)
	{
		var itemiOS = sessionStorage[key];
		return itemiOS;
	}

	let encKey = encodeStr(key);
	var item = sessionStorage[encKey];
	
	if(item == null)
	{
		return null;
	}

	var decValue = decodeStr(item);
	return decValue;
}

function removeSessionStorage(key)
{
	if(isiOS == true)
	{
		sessionStorage.removeItem(key);
		return;
	}
	
	let encKey = encodeStr(key);
	sessionStorage.removeItem(encKey);
}

function clearSessionStorage()
{
	sessionStorage.clear();
}

function readStorageFile(fileName)
{
	return new Promise((resolve, reject) =>{

		var itvWaitDevice = setInterval(function(){
			if(deviceIsReady == true)
			{
				clearInterval(itvWaitDevice);
				
				// window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
					// let dir = fs.root;
				window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dir) {
					dir.getFile(fileName, { create: false }, function(fileEntry) {
		
						fileEntry.file(function (file) {
							var reader = new FileReader();
		
							reader.onloadend = function () {
								resolve(this.result);
							};
			
							reader.onerror = function(){
								resolve(null);
							};
			
							reader.readAsText(file);
					
						}, function(err){
							resolve(null);
						});


					}, function(){
						// File not exists
						resolve(null);
					});
				}, function(err){
					console.log(`FileSystem Error reading mod storage ${cordova.file.dataDirectory}`);
					console.log(err);
					reject(err);
				});
			}
		}, 500);
	})
}

function writeStorageFile(fileName, data)
{
	return new Promise((resolve, reject) =>{
		var itvWaitDevice = setInterval(function(){
			if(deviceIsReady == true)
			{
				clearInterval(itvWaitDevice);
				
				// window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
				window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(dir) {
					// let dir = fs.root;
					dir.getFile(fileName, { create: true, exclusive: false }, function(file) {
						// var jsonData = JSON.stringify(data);
			
						file.createWriter(function(fileWriter) 
						{
							fileWriter.seek(fileWriter.length);
					
							var blob = new Blob([data], { type: 'text/plain' });
							fileWriter.write(blob);

							resolve();
						});
					});
				}, function(err){
					console.log(`FileSystem Error reading for write mod storage file ${cordova.file.dataDirectory}`);
					console.log(err);
					reject(err);
				});
			}
		}, 500);
	})
    


}

function encodeStr(content) 
{
	var passcode = sessionk;
	var result = []; 
	var passLen = passcode.length ;
	for(var i = 0  ; i < content.length ; i++) 
	{
		var passOffset = i%passLen ;
		var calAscii = (content.charCodeAt(i)+passcode.charCodeAt(passOffset));
		result.push(calAscii);
	}
	return btoa(JSON.stringify(result));
}

function decodeStr(content) 
{
	var passcode = sessionk;

	var result = [];var str = '';
	var codesArr = JSON.parse( atob(content));
	var passLen = passcode.length ;
	
	for(var i = 0  ; i < codesArr.length ; i++) 
	{
		var passOffset = i%passLen ;
		var calAscii = (codesArr[i]-passcode.charCodeAt(passOffset));
		result.push(calAscii) ;
	}

	for(var i = 0 ; i < result.length ; i++) 
	{
		var ch = String.fromCharCode(result[i]); str += ch ;
	}
	return str ;
} 
