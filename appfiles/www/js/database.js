const DB_CORRUPT_MESSAGE = `database disk image is malformed (code 11 SQLITE_CORRUPT)`;
var dbFolderLocation = "";
var dbFileLocation = "";
var dbFolderDetails;
var dbFileDetails;
var backupDatabaseProcessing = false;
var backupDatabaseUploadProcessing = false;
var backupDatabaseUploadChunkStatus = 0;
var backupDatabaseUploadChunkLength = 0;
var restoreDatabaseProcessing = false;
var afterRestoreDatabaseProcessing = false;
var localDatabaseIsNew = false;
var newDatabaseWaitingToCheckHasPreviousBackup = false;
var localDatabaseIsRestored = false;
var databaseDataChanged = false;
var itvDatabaseBackupService = null;
var backupServiceProcessing = false;

async function initDatabase()
{
    let databbaseOptions = null;

    if(cordova.platformId == 'android')
    {
        databbaseOptions = {
            name: DB_NAME, 
            location: 'default',
            androidDatabaseProvider: 'system'
        };
    }
    else
    {
        databbaseOptions = {
            name: DB_NAME, 
            location: 'default'
        };
    }


    if(cordova.platformId == 'android')
    {
        dbFolderLocation = `${cordova.file.applicationStorageDirectory}databases/`;
        dbFileLocation = `${dbFolderLocation}${DB_NAME}`;
    }
    else if(cordova.platformId == 'ios')
    {
        dbFolderLocation = `${cordova.file.applicationStorageDirectory}Library/LocalDatabase/`;
        dbFileLocation = `${dbFolderLocation}${DB_NAME}`;
    }
    else if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    {
        dbFolderLocation = ``;
        dbFileLocation = ``;
    }

    var dbExists = false;

    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        dbFolderDetails = await localFileURLPathResolve(dbFolderLocation);
        if(dbFolderDetails.status == true)
        {
            dbFileDetails = await localFileURLPathResolve(dbFileLocation);
    
            if(dbFileDetails.status == true)
            {
                dbExists = true;
            }
        }
        // console.log(`DB Exists: ${dbExists}`);
    }

    database = window.sqlitePlugin.openDatabase(databbaseOptions);   
    await createDatabaseObjectsIfNotExists();

    // If is the first db creation, request db details again, now after creation
    if(dbExists == false)
    {
        if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        {

        }
        else
        {
            localDatabaseIsNew = true;
            newDatabaseWaitingToCheckHasPreviousBackup = true;

            // Refresh details after creation
            dbFolderDetails = await localFileURLPathResolve(dbFolderLocation);
            dbFileDetails = await localFileURLPathResolve(dbFileLocation);
    
            if(dbFolderDetails.status == true && dbFileDetails.status == true)
            {
                console.log(`🟢 Database created successfully`);
            }
            else
            {
                console.log(`🔴 Database creation failed`);
            }
        }
    }

    // Even when the database is not new, if it is has no messages, consider as a new database
    if(localDatabaseIsNew == false)
    {
        const isEmptyMessages = await IsEmptyMessagesTable();

        if(isEmptyMessages == true)
        {
            localDatabaseIsNew = true;
            newDatabaseWaitingToCheckHasPreviousBackup = true;
        }
    }
}

function closeDB()
{
    return new Promise((resolve, reject) =>{
        database.close(async function() {
            console.log('database is closed ok');
            resolve();

        }, function (error) {
            console.log("Error closing DB:" + error.message);
            reject();
        });
    });
}

function waitDBReady()
{
    return new Promise((resolve, reject) =>{
        if(database != null)
        {
            resolve();
            return;
        }

        let itvWaitDB = setInterval(function(){
            if(database != null)
            {
                clearInterval(itvWaitDB);
                resolve();
                return;    
            }
        }, 20);
    })
}

function initDatabaseBackupService()
{
    // // First Restore check before service running
    // runDBRestoreCheck();

    if(itvDatabaseBackupService != null)
    {
        clearInterval(itvDatabaseBackupService);
        backupServiceProcessing = false;
    }

    itvDatabaseBackupService = setInterval(async function(){
        if(isLoggedIn() == false)
        {
            return;
        }

        // Could not proceed while is waiting checking for previous backup
        // if(newDatabaseWaitingToCheckHasPreviousBackup == true)
        // {
        //     console.log(`🆘 Database restore after logged in!`);
        //     runDBRestoreCheck();
        //     return;
        // }

        // if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
        // {
        //     return;
        // }

        // console.log("⭐️ Pending Backup Change processing...");

        if(backupServiceProcessing == true)
        {
            return;
        }

        if(databaseDataChanged == false)
        {
            return;
        }

        let backupDatabaseRestoreWaitingForApproval = readLocalStorage(`backup-db-restore-waiting-for-approval`);
        if(backupDatabaseRestoreWaitingForApproval == `1`)
        {
            console.log(`Unable to create new backup. Last Backup Restore is waiting for approval.`)
            return;
        }

        backupServiceProcessing = true;
        let backupDone = await checkTimeToBackupDatabase();

        if(backupDone == true)
        {
            // console.log("🟢 Backup Done");
            databaseDataChanged = false;
        }
        else
        {
            // console.log("✋ Backup waiting next time to send");
        }

        backupServiceProcessing = false;

    }, 10000); // 10 sec.
}

function waitBackupServiceProcessingToFinish()
{
    return new Promise((resolve, reject) =>{
        if(backupServiceProcessing == false)
        {
            resolve();
            return;
        }

        var itvWaitBackupServiceProcessingToFinish = setInterval(function(){
            if(backupServiceProcessing == false)
            {
                clearInterval(itvWaitBackupServiceProcessingToFinish);
                itvWaitBackupServiceProcessingToFinish = null;
                resolve();
            }
        }, 1000);
    })
}

function waitBackupUploadProcessingToFinish()
{
    return new Promise((resolve, reject) =>{
        if(backupDatabaseUploadProcessing == false)
        {
            resolve();
            return;
        }

        var itvWaitBackupUploadProcessingToFinish = setInterval(function(){
            if(backupDatabaseUploadProcessing == false)
            {
                clearInterval(itvWaitBackupUploadProcessingToFinish);
                itvWaitBackupUploadProcessingToFinish = null;
                resolve();
            }
        }, 1000);
    })
}

async function runDBRestoreCheck()
{
    if(newDatabaseWaitingToCheckHasPreviousBackup == false)
    {
        return;
    }

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        return;
    }

    if(restoreDatabaseProcessing == true)
    {
        return;
    }

    await checkDBBackupRestore();
}

async function checkDBBackupRestore()
{
    if(restoreDatabaseProcessing == true)
    {
        return;
    }

    // if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    // {
    //     return;
    // }

    restoreDatabaseProcessing = true;

    swal(getTranslate(`database-restoring`, `Loading Data...`), {
        button: false, closeOnClickOutside: false
    });

    const response = await callS(true, `GET`, `/services/downloadappbackup`, null);

    if(response == null)
    {
        swal.close();
        restoreDatabaseProcessing = false;
        return;
    }

    if(response.content == null)
    {
        swal.close();
        restoreDatabaseProcessing = false;
        return;
    }

    if(response.content.trim().length == 0)
    {
        // DB File doesn't exits in server
        swal.close();
        restoreDatabaseProcessing = false;
        newDatabaseWaitingToCheckHasPreviousBackup = false;
        return;
    }

    const sqlContent = response.content;

    await importSqlToDb(database, sqlContent, function(currentCount, totalCount){
        // Progress
        const baseTextLoading = getTranslate(`database-restoring`, `Loading Data...`);
        const percent = parseInt((totalCount > 0 ? (currentCount / totalCount) : 0) * 100);
        const preloaderPercentHtml = `
            <div class="progress">
                <div class="determinate" style="width: ${percent}%"></div>
            </div>
        `;
        const progressLoading = `
            <div class="app-loading-data-status-text">
                <span>${percent}% </span>
                <span>(</span>
                <span>${currentCount}</span>
                <span>/</span>
                <span>${totalCount}</span>
                <span>)</span>
            </div>
        `;
        $(`.swal-text`).html(`<div class="app-loading-data-base-text">${baseTextLoading}</div>${preloaderPercentHtml}${progressLoading}`);
    });

    writeLocalStorage(`backup-db-restore-waiting-for-approval`, `1`);
    restoreDatabaseProcessing = false;
    newDatabaseWaitingToCheckHasPreviousBackup = false;

    // Run afterImportSqlToDb after restoreDatabaseProcessing changed to false
    await afterImportSqlToDb();

    swal.close();   

    try
    {
        const nowTime = new Date();

        // Set file backup time to now after restore
        await setParamToDB("LAST_DB_BACKUP", nowTime.getTime());
    }
    catch(setException)
    {
        console.log(`🔴 DB After Backup Restore Exception`);
        console.log(setException);
    }

    // Give a time before finish function
    await waitTime(1000);

    // Reload app after database restore
    // redirect(`index.html`);

}

async function checkTimeToBackupDatabase()
{
    var backupDone = false;

    if(backupDatabaseProcessing == true || backupDatabaseUploadProcessing == true || loginIsExpiredByServer == true)
    {
        return backupDone;
    }

    //const isEmptyMessages = await IsEmptyMessagesTable();
    /*
    if(isEmptyMessages == true)
    {
        // Only do backup if there is at least one message in DB
        console.log(`⚠️ Unable to backup when there is no message in DB`);
        return backupDone;
    }
*/

    backupDatabaseProcessing = true;

    const MAX_BACKUP_AGE_SECONDS = 60 * 1; // 1 minute

    let lastBackupTime = null;

    try
    {
        lastBackupTime = await getParamFromDB("LAST_DB_BACKUP");
    }
    catch(getLastTimeException)
    {

    }

    let doBackup = false;

    if(lastBackupTime == null)
    {
        doBackup = true;
    }
    else
    {
        try
        {
            const lastBackupDate = new Date(parseInt(lastBackupTime));
            const nowDate = new Date();
            const diff = diffInSeconds(lastBackupDate, nowDate);
            if(diff >= MAX_BACKUP_AGE_SECONDS)
            {
                doBackup = true;
            }
        }
        catch(timeCalculateException)
        {
            
        }
    }

    if(doBackup == true)
    {
        try
        {
            await backupDatabase();
            backupDone = true;
        }
        catch(backupException)
        {

        }
    }

    backupDatabaseProcessing = false;

    return backupDone;
}

async function backupDatabase()
{
    if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
    {
        if(dbFolderDetails.status == false)
        {
            return;
        }

        if(dbFileDetails.status == false)
        {
            return;
        }        
    }


    const loggedIn = isLoggedIn();
    if(loggedIn == false)
    {
        return;
    }

    // if(cordova.platformId == 'browser' || cordova.platformId == 'electron')
    // {
    //     return;
    // }

    let serverConnectionState = await hasServerConnection();

    if(serverConnectionState == false)
    {
        return;
    }


    const uploadResponse = await backupUploadFileToServer();
}

async function backupUploadFileToServer() 
{
    if(isLoggedIn() == false)
    {
        return;
    }

    if(backupDatabaseUploadProcessing == true)
    {
        return;
    }

    backupDatabaseUploadProcessing = true;

    const MAX_UPLOAD_LENGTH = 200000;
    const UPLOAD_CHUNK_SIZE = 200000;

    // const MAX_UPLOAD_LENGTH = 50000;
    // const UPLOAD_CHUNK_SIZE = 50000;

    const dbSQLDump = await exportDbToSql(database, false);

    let serverBackupResult = null;

    if(dbSQLDump.exportSQL.length <= MAX_UPLOAD_LENGTH)
    {
        console.log(`🏁 Full backup length: ${dbSQLDump.exportSQL.length}`);

        backupDatabaseUploadChunkStatus = 0;
        backupDatabaseUploadChunkLength = 0;

        const data = {
            "content": dbSQLDump.exportSQL,
            "mode": "full",
            "chunkindex": null,
            "chunklength": null
        };
            
        serverBackupResult = await callS(true, `POST`, `/services/appdbbackup`, data);
    }
    else
    {
        const dbSQLDumpChunkList = chunkString(dbSQLDump.exportSQL, UPLOAD_CHUNK_SIZE);

        console.log(`🏁 Chunk backup length: ${dbSQLDumpChunkList.length}`);

        for(let ixChunk = 0; ixChunk < dbSQLDumpChunkList.length; ixChunk++)
        {
            backupDatabaseUploadChunkStatus = ixChunk;
            backupDatabaseUploadChunkLength = dbSQLDumpChunkList.length;

            const dbSQLDumpChunk = dbSQLDumpChunkList[ixChunk];

            const data = {
                "content": dbSQLDumpChunk,
                "mode": "partial",
                "chunkindex": ixChunk,
                "chunklength": dbSQLDumpChunkList.length
            };

            console.log(`.... Chunk backup ${ixChunk+1}/${dbSQLDumpChunkList.length} checking device and server connection...`);
            const waitForConnectionResponse = await waitForDeviceAndServerConnectionWithAttempts(500, 60);
            console.log(`.... Chunk backup ${ixChunk+1}/${dbSQLDumpChunkList.length} device and server connection result: ${waitForConnectionResponse}`);

            if(waitForConnectionResponse == false)
            {
                // No connection timeout, release the backup
                console.log(`🔴 Chunk backup stopped by connection timeout, the system will try again when has connection`);
                const dbBackupDateTimeout = new Date();
                await setParamToDB("LAST_DB_BACKUP", dbBackupDateTimeout.getTime());
                backupDatabaseUploadProcessing = false;
                return;
            }
        
            console.log(`.... Chunk backup ${ixChunk+1}/${dbSQLDumpChunkList.length} uploading... `);
            let serverBackupPartialResult = await callS(true, `POST`, `/services/appdbbackup`, data);
            console.log(`.... Chunk backup ${ixChunk+1}/${dbSQLDumpChunkList.length} uploaded! `);

            if(serverBackupPartialResult.finished == true)
            {
                serverBackupResult = serverBackupPartialResult;
            }
        }

        backupDatabaseUploadChunkStatus = 0;
        backupDatabaseUploadChunkLength = 0;
    }


    if(serverBackupResult == null)
    {
        // reject('No backup response');
        const dbBackupDateFailure = new Date();
        await setParamToDB("LAST_DB_BACKUP", dbBackupDateFailure.getTime());
        return;
    }

    if(serverBackupResult.error != null)
    {
        // reject(serverBackupResult.error);
        const dbBackupDateErr = new Date();
        await setParamToDB("LAST_DB_BACKUP", dbBackupDateErr.getTime());
        return;
    }

    const dbBackupDate = new Date();
    await setParamToDB("LAST_DB_BACKUP", dbBackupDate.getTime());


    backupDatabaseUploadProcessing = false;

    console.log(`New data backup uploaded`);

    return serverBackupResult;
}

async function forceDBBackupIfDatabaseHasChanged()
{
    await waitBackupUploadProcessingToFinish();
    await waitBackupServiceProcessingToFinish();

    if(databaseDataChanged == true)
    {
        // Force DB Backup erasing last db backup parameter
        setParamToDB("LAST_DB_BACKUP", null);
        // await checkTimeToBackupDatabase();

        backupDatabaseProcessing = true;
        await backupDatabase();
        backupDatabaseProcessing = false;
    }
}

function waitRestoreDatabaseFinish()
{
    return new Promise((resolve, reject) =>{
        if(restoreDatabaseProcessing == false)
        {
            resolve();
            return;
        }

        var itvRestoringCheck = setInterval(function(){
            if(restoreDatabaseProcessing == false)
            {
                clearInterval(itvRestoringCheck);
                itvRestoringCheck = null;

                resolve();
                return;
            }
        }, 1000);
    })
}

function waitDatabasePreviousBackupCheck()
{
    return new Promise((resolve, reject) =>{
        if(newDatabaseWaitingToCheckHasPreviousBackup == false)
        {
            resolve();
            return;
        }

        var itvPreviousBackupCheck = setInterval(function(){
            if(newDatabaseWaitingToCheckHasPreviousBackup == false)
            {
                clearInterval(itvPreviousBackupCheck);
                itvPreviousBackupCheck = null;

                resolve();
                return;
            }
        }, 1000);
    })
}

function removeDatabase()
{
    return new Promise((resolve, reject) =>{

        if(itvDatabaseBackupService != null)
        {
            clearInterval(itvDatabaseBackupService);
        }

        writeLocalStorage(`backup-db-restore-waiting-for-approval`, `0`);
        backupDatabaseProcessing = false;
        restoreDatabaseProcessing = false;
        localDatabaseIsNew = false;
        newDatabaseWaitingToCheckHasPreviousBackup = false;
        localDatabaseIsRestored = false;
        databaseDataChanged = false;
        itvDatabaseBackupService = null;
        backupServiceProcessing = false;

        let databbaseOptions = {
            name: DB_NAME, 
            location: 'default'
        };
    
        window.sqlitePlugin.deleteDatabase(databbaseOptions, function() {
            console.log("DB Delete OK");
            resolve();
        }, function(error) {
            console.log(`DB Delete Error: ${error}`);
            resolve();
        });
    });

}

function dbRun(query, values)
{
    return new Promise(async (resolve, reject) =>{
        await waitRestoreDatabaseFinish();
        // if(restoreDatabaseProcessing == true)
        // {
        //     resolve(null);
        //     return;
        // }

        if(database == null)
        {
            resolve(null);
            return;
        }

        if(values == null)
        {
            values = [];
        }

        database.transaction(function(tr) {
            tr.executeSql(query, values, function(trRun, rs) {

                const queryToCheckChange = query.toUpperCase();
                if(
                    queryToCheckChange.indexOf(`INSERT INTO`) > -1 ||
                    (queryToCheckChange.indexOf(`UPDATE`) > -1 && queryToCheckChange.indexOf(`SET`) > -1) ||
                    queryToCheckChange.indexOf(`DELETE FROM`) > -1
                )
                {
                    if(isLoggedIn() == true)
                    {
                        console.log(`Generating new backup save for script: ${queryToCheckChange}`);
                        databaseDataChanged = true;
                    }
                }

                resolve(rs);
                // if(rs.rows.length > 0)
                // {
                //     console.log(`Got result: ${rs.rows.item(0).from} | ${rs.rows.item(0).to} | ${rs.rows.item(0).content} | ${rs.rows.item(0).time}`);
                // }
                // else
                // {
                //     console.log(`No result`);
                // }
            }, function(trRun, error) {
                console.log('SQL error: ' + error.message);

                if(error.message.toLowerCase() == DB_CORRUPT_MESSAGE.toLowerCase())
                {
                    showToastWithStyle(getTranslate("failed-to-read-local-data", `Failed to read local data`), 3000, toastDefaultClasses);

                    // setTimeout(function(){
                    //     forceDisconnect();
                    // }, 5000);
                }

                reject(error);
            });
        });
    });
}

function dbRunManyInSameTransaction(queryList, valueList)
{
    return new Promise((resolve, reject) =>{
        if(database == null)
        {
            resolve(null);
            return;
        }

        if(queryList.length != valueList.length)
        {
            reject();
            return;
        }

        database.transaction(async function(tr) {

            let resultList = [];
            for(let ix = 0; ix < queryList.length; ix++)
            {
                const query = queryList[ix];
                const values = valueList[ix];

                // const result = await dbRunUnderTransaction(tr, query, values);
                tr.executeSql(query, values, function(trRun, rs) {
                    // console.log('resultSet.insertId: ' + resultSet.insertId);
                    // console.log('resultSet.rowsAffected: ' + resultSet.rowsAffected);

                    if(databaseDataChanged == false)
                    {
                        const queryToCheckChange = query.toUpperCase();
                        if(
                            queryToCheckChange.indexOf(`INSERT INTO`) > -1 ||
                            (queryToCheckChange.indexOf(`UPDATE`) > -1 && queryToCheckChange.indexOf(`SET`) > -1) ||
                            queryToCheckChange.indexOf(`DELETE FROM`) > -1
                        )
                        {
                            if(isLoggedIn() == true)
                            {
                                console.log(`Generating new backup save for script: ${queryToCheckChange}`);
                                databaseDataChanged = true;
                            }
                        }
                    }

                    resultList.push(rs);

                    if(resultList.length >= valueList.length)
                    {
                        resolve(resultList);
                    }
                }, function(trRun, error) {
                    console.log('INSERT error: ' + error.message, query);
                    reject();
                });
            }
        }, function(error) {
            console.log('Transaction ERROR: ' + error.message);
        }, function() {
            // resolve(resultList);
        });
    });
}

async function createDatabaseObjectsIfNotExists()
{
    const createDBScriptList = [
        `CREATE TABLE IF NOT EXISTS Messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            messageId TEXT NOT NULL,
            fromId TEXT NOT NULL, 
            toId TEXT NOT NULL, 
            content TEXT NOT NULL, 
            protected INTEGER NOT NULL, 
            messageTime INTEGER NOT NULL,
            media TEXT NULL,
            mediaType INTEGER NULL,
            InReplyToMessageId TEXT NULL,
            toIsGroup INTEGER NULL,
            statusSent INTEGER NOT NULL,
            statusReceived INTEGER NOT NULL,
            statusRead INTEGER NOT NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS uix_Messages_MessageId ON Messages (messageId)`,
        `CREATE INDEX IF NOT EXISTS ix_Messages_FromId ON Messages (fromId)`,
        `CREATE INDEX IF NOT EXISTS ix_Messages_ToId ON Messages (toId)`,
        `CREATE INDEX IF NOT EXISTS ix_Messages_FromId_ToId ON Messages (fromId, toId)`,
        `CREATE INDEX IF NOT EXISTS ix_Messages_History ON Messages (fromId, toId, toIsGroup)`,
        `CREATE INDEX IF NOT EXISTS ix_Messages_HistoryGroup ON Messages (toId, toIsGroup)`,
        `CREATE INDEX IF NOT EXISTS ix_Messages_HistoryWithTime ON Messages (fromId, toId, toIsGroup, messageTime)`,
        `CREATE INDEX IF NOT EXISTS ix_Messages_HistoryGroupWithTime ON Messages (toId, toIsGroup, messageTime)`,
        `CREATE INDEX IF NOT EXISTS ix_Messages_MessageTime ON Messages (messageTime)`,

        `CREATE TABLE IF NOT EXISTS Parameters (
            pKey TEXT PRIMARY KEY NOT NULL, 
            pValue TEXT NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ix_Parameters_PKey ON Parameters (pKey)`,

        `CREATE TABLE IF NOT EXISTS MediaCache (
            mediaAddress TEXT PRIMARY KEY NOT NULL, 
            mediaThumbnailURL TEXT NULL,
            mediaViewURL TEXT NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ix_MediaCache_mediaAddress ON MediaCache (mediaAddress)`,

        `CREATE TABLE IF NOT EXISTS DeviceContactList (
            id TEXT NOT NULL,
            displayName TEXT NULL,
            firstName TEXT NULL,
            lastName TEXT NULL,

            phone1_NormalizedNumber TEXT NULL,
            phone1_Number TEXT NULL,
            phone1_Type TEXT NULL,

            phone2_NormalizedNumber TEXT NULL,
            phone2_Number TEXT NULL,
            phone2_Type TEXT NULL,

            phone3_NormalizedNumber TEXT NULL,
            phone3_Number TEXT NULL,
            phone3_Type TEXT NULL,
            
            phone4_NormalizedNumber TEXT NULL,
            phone4_Number TEXT NULL,
            phone4_Type TEXT NULL,

            phone5_NormalizedNumber TEXT NULL,
            phone5_Number TEXT NULL,
            phone5_Type TEXT NULL,

            phone6_NormalizedNumber TEXT NULL,
            phone6_Number TEXT NULL,
            phone6_Type TEXT NULL,

            phone7_NormalizedNumber TEXT NULL,
            phone7_Number TEXT NULL,
            phone7_Type TEXT NULL,

            phone8_NormalizedNumber TEXT NULL,
            phone8_Number TEXT NULL,
            phone8_Type TEXT NULL,

            phone9_NormalizedNumber TEXT NULL,
            phone9_Number TEXT NULL,
            phone9_Type TEXT NULL,

            phone10_NormalizedNumber TEXT NULL,
            phone10_Number TEXT NULL,
            phone10_Type TEXT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS ix_DeviceContactList_phone1_Number ON DeviceContactList (phone1_Number)`,

        `CREATE TABLE IF NOT EXISTS LinkedContacts (
            contact TEXT PRIMARY KEY NOT NULL, 
            nickname TEXT NULL,
            pin INTEGER NULL,
            name INTEGER NULL,
            privatekey TEXT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS ixLinkedContacts_Contact ON LinkedContacts (contact)`,

        `CREATE TABLE IF NOT EXISTS AudioInfo (
            fileId TEXT PRIMARY KEY NOT NULL, 
            lengthInSeconds TEXT NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ixAudioInfo_FileId ON AudioInfo (fileId)`,

        `CREATE TABLE IF NOT EXISTS AppGroups (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            GroupId TEXT NOT NULL,
            Name TEXT NOT NULL,
            Description TEXT NOT NULL,
            Photo TEXT NOT NULL,
            CreatorAdminLogin TEXT NOT NULL,
            PrivateKey TEXT NULL,
            HasGroupValidity INTEGER DEFAULT 0 NOT NULL,
            HasGroupValidityFromDate INTEGER DEFAULT 0 NOT NULL,
            ValidityFromDate INTEGER NULL,
            HasGroupValidityBetween INTEGER DEFAULT 0 NOT NULL,
            ValidityBetweenDateStart INTEGER NULL,
            ValidityBetweenDateEnd INTEGER NULL,
            HasGroupAccessHours INTEGER DEFAULT 0 NOT NULL,
            GroupAccessHoursStart INTEGER NULL,
            GroupAccessHoursEnd INTEGER NULL,
            CreationDate INTEGER NOT NULL,
            EditDate INTEGER NULL,
            InsertAction TEXT NULL,
            LastAction TEXT NULL,
            LastActionDate INTEGER NULL,
            ServerUpdateDate INTEGER NULL,
            AppUpdateDate INTEGER NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ixAppGroups_GroupId ON AppGroups (GroupId)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroups_Name ON AppGroups (Name)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroups_CreatorAdminLogin ON AppGroups (CreatorAdminLogin)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroups_HasGroupValidityFromDate ON AppGroups (GroupId, HasGroupValidityFromDate)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroups_HasGroupValidityBetween ON AppGroups (GroupId, HasGroupValidityBetween)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroups_HasGroupAcessHours ON AppGroups (GroupId,HasGroupAccessHours)`,

        `CREATE TABLE IF NOT EXISTS AppGroupMembers (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            GroupId TEXT NOT NULL,
            Login TEXT NOT NULL,
            IsAdmin INTEGER NOT NULL,
            MessagePermission INTEGER NOT NULL,
            HasUserValidity INTEGER DEFAULT 0 NOT NULL,
            HasUserValidityFromDate INTEGER DEFAULT 0 NOT NULL,
            UserValidityFromDate INTEGER NULL,
            HasUserValidityBetween INTEGER DEFAULT 0 NOT NULL,
            UserValidityBetweenDateStart INTEGER NULL,
            UserValidityBetweenDateEnd INTEGER NULL,
            WaitingLoginApproval INTEGER NOT NULL,
            LoginApproved INTEGER NOT NULL,
            Removed INTEGER NOT NULL,
            StatusDelivered INTEGER NOT NULL,
            CreationDate INTEGER NOT NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ixAppGroupMembers_GroupId_Login ON AppGroupMembers (GroupId, Login)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_GroupId ON AppGroupMembers (GroupId)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_Login ON AppGroupMembers (Login)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_WaitingLoginApproval ON AppGroupMembers (WaitingLoginApproval)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_LoginApproved ON AppGroupMembers (LoginApproved)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_GroupId_WA ON AppGroupMembers (GroupId, WaitingLoginApproval)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_GroupId_Login_WA ON AppGroupMembers (GroupId, Login, WaitingLoginApproval)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_GroupId_Login_LA ON AppGroupMembers (GroupId, Login, LoginApproved)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_GroupId_Login_UVF ON AppGroupMembers (GroupId, Login, HasUserValidityFromDate)`,
        `CREATE INDEX IF NOT EXISTS ixAppGroupMembers_GroupId_Login_UVB ON AppGroupMembers (GroupId, Login, HasUserValidityBetween)`,

        `CREATE TABLE IF NOT EXISTS AppGroupWaitingForServerStatusUpdate (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            GroupId TEXT NOT NULL,
            StatusTag INTEGER NOT NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ixAppGroupWaitingForServerStatusUpdate_MainIx ON AppGroupWaitingForServerStatusUpdate (GroupId, StatusTag)`,


        `CREATE TABLE IF NOT EXISTS ChatRoomCache (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            toId TEXT NOT NULL,
            htmlCode TEXT NOT NULL
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS ixChatRoomCache_toId ON ChatRoomCache (toId)`,

        `CREATE TABLE IF NOT EXISTS LinkedContactListCache (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            htmlCode TEXT NOT NULL
        )`,

        `CREATE TABLE IF NOT EXISTS PhoneContactCollectionCache (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            htmlCode TEXT NOT NULL
        )`,

        `CREATE TABLE IF NOT EXISTS AppTalkGroupMembersCache (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            GroupId TEXT NOT NULL,
            Login TEXT NOT NULL,
            LoginName TEXT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS ixAppTalkGroupMembersCache_GroupId ON AppTalkGroupMembersCache (GroupId)`,

        `CREATE TABLE IF NOT EXISTS Company (
            companyId TEXT PRIMARY KEY NOT NULL, 
            name TEXT NULL,
            isAdmin INTEGER NULL
        )`,
        `CREATE INDEX IF NOT EXISTS ixCompany_CompanyId ON Company (companyId)`,

        `CREATE TABLE IF NOT EXISTS ContactServedByCompany (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            contact TEXT NOT NULL,
            company TEXT NULL,
            savedOnTheServer INTEGER NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS ixContactServedByCompany_Contact ON ContactServedByCompany (contact)`,


        `CREATE TABLE IF NOT EXISTS AudioTranscriptionCache (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            mediaFile TEXT NOT NULL,
            transcription TEXT NOT NULL,
            duration INTEGER NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS ixAudioTranscriptionCache_mediaFile ON AudioTranscriptionCache (mediaFile)`,

        `CREATE TABLE IF NOT EXISTS CompanyMembers (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            CompanyId TEXT NOT NULL,
            Login TEXT NOT NULL,
            IsAdmin INTEGER NOT NULL,
            IsExternal INTEGER INTEGER DEFAULT 0 NOT NULL,
            MemberCompanyName TEXT NULL,
            Department TEXT NULL,
            Position TEXT NULL,
            IsServerUpdated INTEGER NULL,
            PendingToRemove INTEGER NULL,
            ServerUpdatedDate INTEGER NULL,
            InsertAction TEXT NOT NULL,
            LastAction TEXT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_CompanyId_IDX ON CompanyMembers (CompanyId)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_Login_IDX ON CompanyMembers (Login)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_CompanyId_Login_IDX ON CompanyMembers (CompanyId, Login)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_IsServerUpdated_IDX ON CompanyMembers (IsServerUpdated)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_IsExternal_IDX ON CompanyMembers (IsExternal)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_CompanyId_IsExternal_IDX ON CompanyMembers (CompanyId, IsExternal)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_MemberCompanyName_IDX ON CompanyMembers (MemberCompanyName)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_CompanyId_IsExternal_MemberCompanyName_IDX ON CompanyMembers (CompanyId, IsExternal, MemberCompanyName)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_Department_IDX ON CompanyMembers (Department)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_CompanyId_IsExternal_Department_IDX ON CompanyMembers (CompanyId, IsExternal,Department)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_CompanyId_IsExternal__MemberCompanyName_Department_IDX ON CompanyMembers (CompanyId, IsExternal,MemberCompanyName,Department)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_Department_IDX ON CompanyMembers (Position)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_CompanyId_IsExternal_Position_IDX ON CompanyMembers (CompanyId, IsExternal,Position)`,
        `CREATE INDEX IF NOT EXISTS CompanyMembers_CompanyId_IsExternal__MemberCompanyName_Position_IDX ON CompanyMembers (CompanyId, IsExternal,MemberCompanyName,Position)`,

        `CREATE TABLE IF NOT EXISTS PendingMsgToInformServerReceived (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            messageId TEXT NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS ixPendingMsgToInformServerReceived_messageId ON PendingMsgToInformServerReceived (messageId)`,

        `CREATE TABLE IF NOT EXISTS PendingMsgGroupToInformServerReceived (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            messageId TEXT NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS ixPendingMsgGroupToInformServerReceived_messageId ON PendingMsgGroupToInformServerReceived (messageId)`,

        `CREATE TABLE IF NOT EXISTS ContactSelectionCache (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            htmlCode TEXT NOT NULL
        )`,

        `CREATE TABLE IF NOT EXISTS ContactSelectionCacheList (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            list TEXT NOT NULL
        )`,
    ];

    const createDBScriptValueList = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,

        null,
        null,

        null,
        null,

        null,
        null,

        null,
        null,

        null,
        null,

        null,
        null,
        null,
        null,
        null,
        null,
        null,

        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,

        null,
        null,

        null,
        null,

        null,

        null,

        null,
        null,

        null,
        null,

        null,
        null,

        null,
        null,

        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,

        null,
        null,

        null,
        null,

        null,

        null
    ];

    const createResult = await dbRunManyInSameTransaction(createDBScriptList, createDBScriptValueList);
}

async function IsEmptyMessagesTable()
{
    const queryParam = `SELECT COUNT(*) AS Total FROM Messages`;
    const result = await dbRun(queryParam, null);

    if(result.rows.length == 0)
    {
        return true;
    }

    const record = result.rows.item(0);
    const total = record.Total;

    if(parseInt(total) == 0)
    {
        return true;
    }

    return false;
}

async function getParamFromDB(key)
{
    const queryParam = `SELECT pValue from Parameters WHERE pKey = ?`;
    const valuesParam = [key];
    const result = await dbRun(queryParam, valuesParam);

    if(result.rows.length == 0)
    {
        return null;
    }

    const record = result.rows.item(0);
    return record.pValue;
}

async function setParamToDB(key, value)
{
    const queryCheck = `SELECT pValue FROM Parameters WHERE pKey = ?`;
    const queryCheckValue = [key];
    const existingResult = await dbRun(queryCheck, queryCheckValue);
    let exists = false;
    if(existingResult != null)
    {
        if(existingResult.rows.length > 0)
        {
            exists = true;
        }
    }

    if(exists == true)
    {
        const currentRecord = existingResult.rows.item(0);
        const currentValue = currentRecord.pValue;

        if(currentValue != value)
        {
            const queryInsert = `UPDATE Parameters SET pValue = ? WHERE pKey = ?`;
            const valueInsert = [value, key];
            await dbRun(queryInsert, valueInsert);
        }
    }
    else
    {
        const queryUpdate = `INSERT INTO Parameters(pKey, pValue) VALUES(?, ?)`;
        const valueUpdate = [key, value];
        await dbRun(queryUpdate, valueUpdate);
    }
}




async function getMediaCacheFromDB(mediaAddress)
{
    const queryRequest = `SELECT mediaThumbnailURL, mediaViewURL from MediaCache WHERE mediaAddress = ?`;
    const valuesRequest = [mediaAddress];
    const result = await dbRun(queryRequest, valuesRequest);

    if(result.rows.length == 0)
    {
        return null;
    }

    const record = result.rows.item(0);

    const response = {
        "mediaThumbnailURL": record.mediaThumbnailURL,
        "mediaViewURL": record.mediaViewURL
    };

    return response;
}

async function setMediaCacheToDB(mediaAddress, mediaThumbnailURL, mediaViewURL)
{
    const queryCheck = `SELECT mediaAddress FROM MediaCache WHERE mediaAddress = ?`;
    const queryCheckValue = [mediaAddress];
    const existingResult = await dbRun(queryCheck, queryCheckValue);
    let exists = false;
    if(existingResult != null)
    {
        if(existingResult.rows.length > 0)
        {
            exists = true;
        }
    }

    if(exists == true)
    {
        const queryUpdate = `UPDATE MediaCache SET mediaThumbnailURL=?, mediaViewURL=? WHERE mediaAddress = ?`;
        const valuesUpdate = [mediaThumbnailURL, mediaViewURL, mediaAddress];
        await dbRun(queryUpdate, valuesUpdate);
    }
    else
    {
        const queryInsert = `
            INSERT INTO MediaCache(mediaAddress, mediaThumbnailURL, mediaViewURL) 
            VALUES(?, ?, ?)
        `;
        const valuesInsert = [
            mediaAddress, mediaThumbnailURL, mediaViewURL
        ];
        await dbRun(queryInsert, valuesInsert);
    }

}

function approveLastDBBackupRestore()
{
    writeLocalStorage(`backup-db-restore-waiting-for-approval`, `0`);
}

function keepLastDBBackupRestore()
{
    writeLocalStorage(`backup-db-restore-waiting-for-approval`, `0`);
}

function reproveLastDBBackupRestore()
{
    return new Promise((resolve, reject) =>{
        const title = getTranslate(`problems-restoring-backup`, `Problems restoring backup.`);
        const text = getTranslate(`which-action-to-take`, `Choose which action you want to take.`);
        const cancelButtonText = getTranslate(`keep-as-is`, `Keep as is`);
        const yesButtonText =  getTranslate(`try-new-backup-restore`, `Try new backup restore`);
    
        swal({
            title: title,
            text: text,
            icon: "warning",
            buttons: [
                cancelButtonText,
                yesButtonText
            ],
            dangerMode: true,
        }).then(function(isConfirm) {
            if (isConfirm) 
            {
                // Try new restore
                (async() =>{
                    try
                    {
                        await removeDatabase();
                        await initDatabase();
                        await runDBRestoreCheck();
    
                        resolve({restored: true, error: null});
                    }
                    catch(restoreException)
                    {
                        resolve({restored: false, error: restoreException});
                    }
                }) ();
            } 
            else 
            {
                // Keep as is
                keepLastDBBackupRestore();
                resolve({restored: false, error: null});
            }
        });

        setTimeout(function(){
            $(`.swal-footer`).addClass(`center`);

            $(`.swal-button--confirm`).css(`font-size`, `9pt`);
            $(`.swal-button--cancel`).css(`font-size`, `9pt`);

            $(`.swal-button--confirm`).css(`padding`, `10px`);
            $(`.swal-button--cancel`).css(`padding`, `10px`);
        }, 800);
    });

}

// function importSqlToDb(db, sql, progressCallback)
// {
//     // Matches statements based on semicolons outside of quotes
//     var statementRegEx = /(?!\s|;|$)(?:[^;"']*(?:"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*')?)*/g;

//     return new Promise((resolve, reject) =>{
//         db.transaction(function(tx) {
//             try 
//             {
//                 //Clean SQL + split into statements
//                 var totalCount, currentCount;
    
//                 var statements = removeSQLComments(sql).match(statementRegEx);
    
//                 if(statements === null || (Array.isArray && !Array.isArray(statements)))
//                 {
//                     statements = [];
//                 }
    
//                 function applyStatements() 
//                 {
//                     if (statements.length > 0) 
//                     {
//                         var statement = trimSQLWhitespace(statements.shift());

//                         // Avoid only android script to run in other platforms
//                         if(cordova.platformId != 'android')
//                         {
//                             if(statement.indexOf(`android_metadata`) > -1)
//                             {
//                                 currentCount++;

//                                 if(progressCallback != null)
//                                 {
//                                     progressCallback(currentCount, totalCount);
//                                     applyStatements();
//                                     return;
//                                 }
//                             }
//                         }

//                         // Only applied for browser or electron
//                         if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
//                         {
//                             if(
//                                 statement.indexOf(`PhoneContactCollectionCache`) > -1 ||
//                                 statement.indexOf(`ContactSelectionCache`) > -1 || 
//                                 statement.indexOf(`ContactSelectionCacheList`) > -1
//                             )
//                             {
//                                 currentCount++;

//                                 if(progressCallback != null)
//                                 {
//                                     progressCallback(currentCount, totalCount);
//                                     applyStatements();
//                                     return;
//                                 }
//                             }
//                         }
    
//                         // console.log(`⚡️ Running: ${statement}`);

//                         tx.executeSql(statement, [], function() {
//                             currentCount++;

//                             if(progressCallback != null)
//                             {
//                                 progressCallback(currentCount, totalCount);
//                             }
                            
//                             applyStatements();
//                         }, function (tx, error) {
//                             error.message = "Failed to import SQL; message="+ error.message;
//                             error.statement = statement;
//                             reject(error);
//                         });
//                     } 
//                     else
//                     {
//                         resolve(totalCount);
//                     }
//                 }
    
//                 // Strip empty statements
//                 for(var i = 0; i < statements.length; i++)
//                 {
//                     if(!statements[i])
//                     {
//                         delete statements[i];
//                     }
//                 }
    
//                 currentCount = 0;
//                 totalCount = statements.length;
//                 applyStatements();
//             } 
//             catch (e) 
//             {
//                 reject(e);
//             }
//         });
//     });
// }

function importSqlToDb(db, sql, progressCallback) {

    // Matches statements based on semicolons outside of quotes
    var statementRegEx = /(?!\s|;|$)(?:[^;"']*(?:"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*')?)*/g;

    return new Promise((resolve, reject) => {
        try {
            // Remove comments and split SQL into individual statements
            // const cleanedSql = removeSQLComments(sql).trim();
            // const statements = cleanedSql.split(";").map(stmt => stmt.trim())
            //     .filter(stmt => stmt); // Remove empty statements

            var statements = removeSQLComments(sql).match(statementRegEx);

            if(statements === null || (Array.isArray && !Array.isArray(statements)))
            {
                statements = [];
            }


            for(let ix = statements.length -1; ix >=0 ; ix--)
            {
                var stRead = statements[ix];
                if(cordova.platformId != 'android')
                {
                    if(stRead.indexOf(`android_metadata`) > -1)
                    {
                        // Remove android_metadata statement from non-android
                        statements.splice(ix, 1);
                    }
                }

                // Only applied for browser or electron
                if(cordova.platformId != 'browser' && cordova.platformId != 'electron')
                {
                    if(
                        stRead.indexOf(`PhoneContactCollectionCache`) > -1 ||
                        stRead.indexOf(`ContactSelectionCache`) > -1 || 
                        stRead.indexOf(`ContactSelectionCacheList`) > -1
                    )
                    {
                        statements.splice(ix, 1);
                    }
                }

                // Replace back new line
                statements[ix] = dbReplaceSymbolWithNewlines(statements[ix]);
            }

            const totalCount = statements.length;
            let currentCount = 0;

            if (totalCount === 0) {
                resolve(0);
                return;
            }

            // Execute statements in a batch
            db.sqlBatch(statements, function() {
                progressCallback(totalCount, totalCount);
                resolve(totalCount);
            }, function(error) {
                console.log('SQL batch ERROR: ' + error.message);
                reject(error);
            });

            // db.sqlBatch(
            //     statements.map(stmt => [stmt]),
            //     () => {
            //         if (progressCallback) {
            //             // Call progress callback with 100% completion
            //             progressCallback(totalCount, totalCount);
            //         }
            //         resolve(totalCount);
            //     },
            //     (error) => {
            //         error.message = `Failed to import SQL; message=${error.message}`;
            //         reject(error);
            //     }
            // );

            // Optionally call the progress callback per statement (if needed)
            // if (progressCallback) {
            //     statements.forEach(() => {
            //         currentCount++;
            //         progressCallback(currentCount, totalCount);
            //     });
            // }
        } catch (error) {
            reject(error);
        }
    });
}

function exportDbToSql(db, withDDL)
{
    if(withDDL == null)
    {
        withDDL = true;
    }

    return new Promise((resolve, reject) =>{
        var exportSQL = "";
        var statementCount = 0;
        var separator = ";\n";
    
        if (!db.transaction || !db.dbname)
        {
            var e = {}
            e.message = "There is no valid database"
            reject(e);
            return;
        }

        var exportTables = function (tables) {
            if (tables.n < tables.sqlTables.length) 
            {
                db.transaction(
                    function (tx) {
                        var tableName = sqlUnescape(tables.sqlTables[tables.n]), sqlStatement = "SELECT * FROM " + sqlEscape(tableName);
                        tx.executeSql(sqlStatement, [],
                            function (tx, rslt) {
                                if (rslt.rows) 
                                {
                                    for (var m = 0; m < rslt.rows.length; m++) 
                                    {
                                        var dataRow = rslt.rows.item(m);
                                        var _fields = [];
                                        var _values = [];
                                        for (col in dataRow) 
                                        {
                                            let vContent = dataRow[col];

                                            // Replace new line from content
                                            vContent = dbReplaceNewlinesWithSymbol(vContent);

                                            _fields.push(sqlEscape(col));
                                            _values.push(dataRow[col] === null ? "NULL" : "'" + sanitiseForSql(vContent) + "'");
                                        }
                                        exportSQL += "INSERT OR REPLACE INTO " + sqlEscape(tableName) + "(" + _fields.join(",") + ") VALUES (" + _values.join(",") + ")" + separator;
                                        statementCount++;
                                    }
                                }
                                tables.n++;
                                exportTables(tables);
                            }
                        );
                    }
                );
            }
            else
            {
                const resultOK = {
                    "exportSQL": exportSQL, 
                    "statementCount": statementCount
                };

                resolve(resultOK);
            }
        };
    
        db.transaction(
            function (transaction) {
                transaction.executeSql("SELECT sql FROM sqlite_master;", [],
                    function (transaction, results) {
                        var sqlStatements = [];

                        if(withDDL == true)
                        {
                            if (results.rows) 
                            {
                                for (var i = 0; i < results.rows.length; i++) 
                                {
                                    var row = results.rows.item(i);
                                    var shouldAdd = true;
                                    if (row.sql != null && row.sql.indexOf("__") == -1) 
                                    {
                                        if(row.sql.indexOf("CREATE TABLE") != -1)
                                        {
                                            var tableName = sqlUnescape(trimSQLWhitespace(trimSQLWhitespace(row.sql.replace("CREATE TABLE", "")).split(/ |\(/)[0]));
                                            if(!isReservedTable(tableName))
                                            {
                                                sqlStatements.push("DROP TABLE IF EXISTS " + sqlEscape(tableName));
                                            }
                                            else
                                            {
                                                shouldAdd = false;
                                            }
                                        }
                                        if(shouldAdd) sqlStatements.push(row.sql);
                                    }
                                }
                            }
                        }
    

    
                        for (var j = 0; j < sqlStatements.length; j++) 
                        {
                            if (sqlStatements[j] != null) 
                            {
                                exportSQL += sqlStatements[j].replace(/\s+/g," ") + separator;
                                statementCount++;
                            }
                        }
    
                        transaction.executeSql("SELECT tbl_name from sqlite_master WHERE type = 'table'", [],
                            function (transaction, res) {
                                var sqlTables = [];
                                for (var k = 0; k < res.rows.length; k++) 
                                {
                                    var tableName = res.rows.item(k).tbl_name;
                                    if (tableName.indexOf("__") == -1 && !isReservedTable(tableName)) 
                                    {
                                        sqlTables.push(tableName);
                                    }
                                }

                                exportTables({
                                    sqlTables: sqlTables,
                                    n: 0
                                });
                            }
                        );
                    }
                );
            }
        );
    });
}

function removeSQLComments (sql) 
{
    sql = sql.replace(/("(""|[^"])*")|('(''|[^'])*')|(--[^\n\r]*)|(\/\*[\w\W]*?(?=\*\/)\*\/)/gm, function(match){
        if (
            (match[0] === '"' && match[match.length - 1] === '"')
            || (match[0] === "'" && match[match.length - 1] === "'")
        ) return match;
        return '';
    });

    return sql;
}

function trimSQLWhitespace(str)
{
    return str.replace(/^\s+/,"").replace(/\s+$/,"");
}

function sqlUnescape(value){
    var matchesEscaped = value.match(/`([^`]+)`/);
    if(matchesEscaped)
    {
        value = matchesEscaped[1];
    }
    return value;
}

function sqlEscape(value)
{
    value = value.replaceAll('"','').replaceAll("'","");
    return value;
}

function isReservedTable(tableName)
{
    return !!tableName.match(/^sqlite_/);
}

function sanitiseForSql(value)
{
    if (value === null || value === undefined) 
    { 
        return null; 
    }

    return (value+"").replace(/'/g,"''");
}

async function afterImportSqlToDb()
{
    afterRestoreDatabaseProcessing = true;

    let scriptList = [];
    let scriptValues = [];

    // Check LinkedContacts table
    const linkedContactsHasColumns = await tableHasColumns(`LinkedContacts`, [`privatekey`]);
    const linkedContactsPrivateKeyStatus = linkedContactsHasColumns.find((item) =>{
        return item.column.toLowerCase() == `privatekey`
    });

    if(linkedContactsPrivateKeyStatus.exists == false)
    {
        scriptList.push(`ALTER TABLE LinkedContacts ADD COLUMN privatekey TEXT NULL`);
        scriptValues.push(null);
    }


    // Check Messages table
    const messagesHasColumns = await tableHasColumns(`Messages`, [`InReplyToMessageId`, `toIsGroup`]);

    // [::] InReplyToMessageId
    const messagesInReplyToMessageIdStatus = messagesHasColumns.find((item) =>{
        return item.column.toLowerCase() == `inreplytomessageid`
    });

    if(messagesInReplyToMessageIdStatus.exists == false)
    {
        scriptList.push(`ALTER TABLE Messages ADD COLUMN InReplyToMessageId TEXT NULL`);
        scriptValues.push(null);
    }

    // [::] toIsGroup
    const messagesToIsGroupStatus = messagesHasColumns.find((item) =>{
        return item.column.toLowerCase() == `toisgroup`
    });

    if(messagesToIsGroupStatus.exists == false)
    {
        scriptList.push(`ALTER TABLE Messages ADD COLUMN toIsGroup INTEGER NULL`);
        scriptValues.push(null);
    }

    // Check AppGroups table
    const appGroupHasColumns = await tableHasColumns(`AppGroups`, [`PrivateKey`]);
    const appGroupStatusPrivateKeyStatus = appGroupHasColumns.find((item) =>{
        return item.column.toLowerCase() == `privatekey`
    });

    if(appGroupStatusPrivateKeyStatus.exists == false)
    {
        scriptList.push(`ALTER TABLE AppGroups ADD COLUMN PrivateKey TEXT NULL`);
        scriptValues.push(null);
    }



    // Check AppGroupMembers table
    const appGroupMembersHasColumns = await tableHasColumns(`AppGroupMembers`, [`StatusDelivered`]);
    const appGroupMembersStatusDeliveredStatus = appGroupMembersHasColumns.find((item) =>{
        return item.column.toLowerCase() == `statusdelivered`
    });

    if(appGroupMembersStatusDeliveredStatus.exists == false)
    {
        scriptList.push(`ALTER TABLE AppGroupMembers ADD COLUMN StatusDelivered INTEGER NULL`);
        scriptValues.push(null);
    }

    // Create Message Indexes
    scriptList.push(`CREATE UNIQUE INDEX IF NOT EXISTS uix_Messages_MessageId ON Messages (messageId)`);
    scriptValues.push(null);

    scriptList.push(`CREATE INDEX IF NOT EXISTS ix_Messages_FromId ON Messages (fromId)`);
    scriptValues.push(null);

    scriptList.push(`CREATE INDEX IF NOT EXISTS ix_Messages_ToId ON Messages (toId)`);
    scriptValues.push(null);

    scriptList.push(`CREATE INDEX IF NOT EXISTS ix_Messages_FromId_ToId ON Messages (fromId, toId)`);
    scriptValues.push(null);

    scriptList.push(`CREATE INDEX IF NOT EXISTS ix_Messages_History ON Messages (fromId, toId, toIsGroup)`);
    scriptValues.push(null);

    scriptList.push(`CREATE INDEX IF NOT EXISTS ix_Messages_HistoryGroup ON Messages (toId, toIsGroup)`);
    scriptValues.push(null);

    scriptList.push(`CREATE INDEX IF NOT EXISTS ix_Messages_HistoryWithTime ON Messages (fromId, toId, toIsGroup, messageTime)`);
    scriptValues.push(null);

    scriptList.push(`CREATE INDEX IF NOT EXISTS ix_Messages_HistoryGroupWithTime ON Messages (toId, toIsGroup, messageTime)`);
    scriptValues.push(null);

    scriptList.push(`CREATE INDEX IF NOT EXISTS ix_Messages_MessageTime ON Messages (messageTime)`);
    scriptValues.push(null);

    // scriptList.push(`CREATE INDEX IF NOT EXISTS ix_CompanyMembers_Login_ModificationDate USING BTREE ON CompanyMembers (Login, ModificationDate)`);
    // scriptValues.push(null);



    // Message fix query
    const queryMessageTimeToFix = `SELECT COUNT(*) AS Total FROM Messages WHERE messageTime < 9999999999`;
    const resultMessageTimeToFix = await dbRun(queryMessageTimeToFix, null);

    if(resultMessageTimeToFix.rows.length > 0)
    {
        const recordMessageTimeToFixCount = resultMessageTimeToFix.rows.item(0);
        const totalMessageTimeToFix = recordMessageTimeToFixCount.Total;
    
        if(parseInt(totalMessageTimeToFix) > 0)
        {
            const messageTimeFixQuery = `UPDATE Messages SET messageTime = messageTime * 1000 WHERE messageTime < 9999999999`;
            scriptList.push(messageTimeFixQuery);
            scriptValues.push(null);                           
        }
    }


    if(scriptList.length > 0)
    {
        if(scriptList.length == scriptValues.length)
        {
            await dbRunManyInSameTransaction(scriptList, scriptValues);
        }
    }


    afterRestoreDatabaseProcessing = false;
}

async function tableHasColumns(tableName, columnList)
{

    let result = [];
    for(let ix = 0; ix < columnList.length; ix++)
    {
        result.push({
            "column": columnList[ix].toLowerCase().trim(),
            "exists": false
        })
    }

    const queryLinkedContacts = `SELECT * FROM pragma_table_info('${tableName}') as tblInfo`;
    const valuesLinkedContacts = [];
    const columnsOfLinkedContactsResponse = await dbRun(queryLinkedContacts, valuesLinkedContacts);

    if(columnsOfLinkedContactsResponse.rows.length > 0)
    {
        // const columnsOfLinkedContacts = [];
        for(let ix = 0; ix < columnsOfLinkedContactsResponse.rows.length; ix++)
        {
            const record = columnsOfLinkedContactsResponse.rows.item(ix);
            // columnsOfLinkedContacts.push(record);

            const columnName = record.name.toLowerCase().trim();

            const resultIndex = result.findIndex((item) =>{
                return item.column == columnName
            });

            if(resultIndex > -1)
            {
                result[resultIndex].exists = true;
            }
        }
    }

    return result;
}

/* DEBUG AREA */

async function dbQueryTable(sql)
{
    const result = await dbRun(sql, null);
    const data = [];
    for(let ix = 0; ix < result.rows.length; ix++)
    {
        const record = result.rows.item(ix);
        data.push(record);
    }
    console.table(data);
}

async function dbViewTable(tableName)
{    
    dbQueryTable(`SELECT * from ${tableName}`);   
}


async function dbTest()
{
    const dbTest1 = await dbRun(`SELECT fromId, toId, content, messageTime from Messages WHERE fromId = ?`, [`joao`]);
    console.log(dbTest1);

    const dbTest2 = await dbRun(`SELECT fromId, toId, content, messageTime from Messages`, null);
    console.log(dbTest2);

    const dbTest3 = await dbRun(`INSERT INTO Messages(fromId, toId, content, messageTime) VALUES(?, ?, ?, ?)`, [`joao`, `maria`, `olá`, new Date().getTime()]);
    console.log(dbTest3);

    const dbTest4 = await dbRun(`INSERT INTO Messages(fromId, toId, content, messageTime) VALUES(?, ?, ?, ?)`, [`maria`, `joao`, `eae!`, new Date().getTime()]);
    console.log(dbTest4);

    const dbTest5 = await dbRunManyInSameTransaction(
        [
            `INSERT INTO Messages(fromId, toId, content, messageTime) VALUES(?, ?, ?, ?)`,
            `INSERT INTO Messages(fromId, toId, content, messageTime) VALUES(?, ?, ?, ?)`
        ], 
        [
            [`joao`, `maria`, `falando junto com maria`, new Date().getTime()],
            [`maria`, `joao`, `falando junto com joao`, new Date().getTime()]
        ]
    );
    console.log(dbTest5);

    const dbTest6 = await dbRun(`SELECT fromId, toId, content, messageTime from Messages WHERE fromId = ?`, [`joao`]);
    console.log(dbTest6);

    const dbTest7 = await dbRun(`SELECT fromId, toId, content, messageTime from Messages`, null);
    console.log(dbTest7);
}

function dbReplaceNewlinesWithSymbol(inputString) 
{
    if(inputString == null)
    {
        return null;
    }

    if(typeof inputString != 'string')
    {
        return inputString;
    }

    // Replace all newline characters (\n) with the ASCII symbol ␍
    return inputString.replace(/\n/g, '␍');
}

function dbReplaceSymbolWithNewlines(inputString) 
{
    if(inputString == null)
    {
        return null;
    }

    if(typeof inputString != 'string')
    {
        return inputString;
    }

    // Replace all the ASCII symbol ␍ with newline characters (\n)
    return inputString.replace(/␍/g, '\n');
}
