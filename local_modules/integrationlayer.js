const db            = require('./db');
const security      = require('./security');
const cache         = require('./cache');

module.exports = {
	addContactIfNotAdded: function(uid, contactId, retrieveUpdatedContactList)
	{
        return addContactIfNotAdded(uid, contactId, retrieveUpdatedContactList);
    },
    groupPK: function(groupId)
    {
        return groupPK(groupId);
    }
}

async function addContactIfNotAdded(uid, contactId, retrieveUpdatedContactList)
{
    // console.log(`🤝 LINKED CONTACTS: Waiting for process ${uid} x ${contactId}`);
    await waitContactLinkProcessingFinish(uid, contactId);

    // console.log(`🤝 LINKED CONTACTS: Registering process for ${uid} x ${contactId}`);
    const CACHE_KEY_PROCESSING = `LINK_CONTACTS_${uid}_${contactId}`;
    const CACHE_KEY_PROCESSING_SECONDS_TO_EXPIRE = 300;
    await cache.set(CACHE_KEY_PROCESSING, "1", CACHE_KEY_PROCESSING_SECONDS_TO_EXPIRE);

    const queryExists = `SELECT Contact, PrivateKey FROM Contacts WHERE User = ? AND Contact = ?`;
    const valuesExists = [uid, contactId];
    const recordExistsList = await db.RunWithValues(queryExists, valuesExists);

    let exists = false;
    if(recordExistsList.length > 0)
    {
        exists = true;
    }


    // Check Previous Created Private Key: Get reverse relationship (User = contactId AND Contact = uid) to check if has previous generated privatekey
    const queryExistingPrivateKeyFromContact = `SELECT PrivateKey from Contacts where User = ? and Contact = ?`;
    const valuesExistingPrivateKeyFromContact = [contactId, uid];
    const recordsExistingPrivateKeyFromContact = await db.RunWithValues(queryExistingPrivateKeyFromContact, valuesExistingPrivateKeyFromContact);
    var privateKey = null;
    if(recordsExistingPrivateKeyFromContact.length > 0)
    {
        if(recordsExistingPrivateKeyFromContact[0].PrivateKey != null)
        {
            privateKey = recordsExistingPrivateKeyFromContact[0].PrivateKey;
        }
    }

    var newPkCreated = false;

    if(privateKey == null)
    {
        // Generate new Private Key
        const uidList = [uid, contactId]
        // const newKeys = await security.pgpGetKeys(uidList);
        const newKeys = security.cv2GetKeys(uidList);
        privateKey = newKeys.privateKey;

        newPkCreated = true;
    }


    const queryDeleteRepeated = `DELETE c1
        FROM Contacts c1
        LEFT JOIN (
            SELECT MIN(id) AS min_id
            FROM Contacts
            GROUP BY User, Contact
        ) c2
        ON c1.id = c2.min_id
        WHERE c2.min_id IS NULL;
    `;


    if(exists == false)
    {
        try
        {
            // console.log(`🤝 LINKED CONTACTS: Insert Link Contact User ${uid} x ${contactId}`)
            const queryAddContact = `INSERT INTO Contacts(User, Contact, Nickname, Pin, PrivateKey) VALUES(?, ?, NULL, 0, ?)`;
            const queryAddContactValues = [uid, contactId, privateKey];
            await db.RunWithValues(queryAddContact, queryAddContactValues);

            // Remove repeated inserted records by User and Contacts and retrieves the smallest id (oldest record) for each group.
            // console.log(`🤝 LINKED CONTACTS: Insert Link - Removing repeated records`);
            await db.Run(queryDeleteRepeated);

            // console.log(`🤝 LINKED CONTACTS: After insert link, retrieving key for ${uid} x ${contactId}`);
            var recordsExistingPK = await db.RunWithValues(queryExists, valuesExists);
            if(recordsExistingPK.length > 0)
            {
                if(recordsExistingPK[0].PrivateKey != null)
                {
                    privateKey = recordsExistingPK[0].PrivateKey;
                }
            }
        

            if(newPkCreated == true)
            {
                // Set new PK to another contact (reverse read) if it exists
                // console.log(`🤝 LINKED CONTACTS: After insert link, updating PK for another side ${contactId} x ${uid}`)
                const queryUpdatePK = `UPDATE Contacts SET PrivateKey = ? WHERE User = ? AND Contact = ?`;
                const valuesUpdatePK = [privateKey, contactId, uid];
                await db.RunWithValues(queryUpdatePK, valuesUpdatePK);
            }
    
        }
        catch(insertContactException)
        {
            console.log(`Link Contacts Exception: ${insertContactException}`);
        }
    }
    else
    {
        if(recordExistsList[0].PrivateKey == null)
        {
            try
            {
                // Remove repeated inserted records by User and Contacts and retrieves the smallest id (oldest record) for each group.
                // console.log(`🤝 LINKED CONTACTS: Update Existing Link - Removing repeated records`);
                await db.Run(queryDeleteRepeated);
            }
            catch(deleteRepeatedException)
            {
                console.log(`Update Delete Repeated Contacts Exception: ${deleteRepeatedException}`);
            }

            try
            {
                // console.log(`🤝 LINKED CONTACTS: Update Existing Link - retrieving key for ${uid} x ${contactId} if exists`);
                var recordsExistingPK = await db.RunWithValues(queryExists, valuesExists);
                if(recordsExistingPK.length > 0)
                {
                    if(recordsExistingPK[0].PrivateKey != null)
                    {
                        privateKey = recordsExistingPK[0].PrivateKey;
                    }
                }
    

                // Has not private key, udpate to create
                // console.log(`🤝 LINKED CONTACTS: Update Existing Link - for ${uid} x ${contactId} and ${contactId} x ${uid}`);
                const queryUpdatePK = `
                    UPDATE Contacts SET 
                        PrivateKey = ? 
                    WHERE 
                        (
                            User = ? AND 
                            Contact = ? AND 
                            PrivateKey IS NULL
                        ) 
                        OR 
                        (
                            User = ? AND 
                            Contact = ? AND 
                            PrivateKey IS NULL
                        )
                `;
                
                const valuesUpdatePK = [privateKey, uid, contactId, contactId, uid];
                await db.RunWithValues(queryUpdatePK, valuesUpdatePK);
            }
            catch(updateException)
            {
                console.log(`Update Contacts Exception: ${deleteRepeatedException}`);
            }
        }
    }

    // try a new query to get a already inserted private key
    // console.log(`🤝 LINKED CONTACTS: After all execution, retrieving key for ${uid} x ${contactId}`);
    var recordsExistingPKCheck = await db.RunWithValues(queryExists, valuesExists);
    if(recordsExistingPKCheck.length > 0)
    {
        if(recordsExistingPKCheck[0].PrivateKey != null)
        {
            privateKey = recordsExistingPKCheck[0].PrivateKey;
        }
    }


    let result = {
        "updated": exists == false ? true : false,
        "list": null,
        "privateKey": privateKey
    };

    if(retrieveUpdatedContactList == false)
    {
        // console.log(`🤝 LINKED CONTACTS: Release process for ${uid} x ${contactId}`);
        cache.remove(CACHE_KEY_PROCESSING);
    
        return result;
    }

    const recordList = await getChatContactList(uid);
    result.list = recordList;

    // console.log(`🤝 LINKED CONTACTS: Release process for ${uid} x ${contactId}`);
    cache.remove(CACHE_KEY_PROCESSING);

    // console.log(`🤝 LINKED CONTACTS: Send result of ${uid} x ${contactId}`);
    return result;
}

async function getChatContactList(uid)
{
    const queryList = `SELECT 
                        C.Contact, C.Nickname, C.Pin, U.Name 
                        FROM Contacts C
                        LEFT JOIN Users U on C.Contact = U.Login
                        WHERE C.User = ?`;
    const valuesList = [uid];
    const recordList = await db.RunWithValues(queryList, valuesList);

    return recordList;
}

async function groupPK(groupId)
{
    const query = `SELECT PrivateKey FROM AppGroups WHERE GroupId = ?`;
    const values = [groupId];
    const recordList = await db.RunWithValues(query, values);

    let pk = null;

    let hasGroupRecord = false;

    if(recordList.length > 0)
    {
        hasGroupRecord = true;
        pk = recordList[0].PrivateKey;
    }

    if(pk != null)
    {
        if(pk.trim().length == 0)
        {
            pk = null;
        }
    }

    if(pk == null)
    {
        if(hasGroupRecord == true)
        {
            // Generate new Private Key
            const uidList = [groupId]
            // const newKeys = await security.pgpGetKeys(uidList);
            const newKeys = security.cv2GetKeys(uidList);
            let newPrivateKey = newKeys.privateKey;

            // Add new Private Key
            const queryUpdate = `UPDATE AppGroups SET PrivateKey = ? WHERE GroupId = ?`;
            const queryUpdateValues = [newPrivateKey, groupId];
            await db.RunWithValues(queryUpdate, queryUpdateValues);

            pk = newPrivateKey;
        }
    }

    return pk;
}

function waitContactLinkProcessingFinish(uid, contactId)
{
    return new Promise(async (resolve, reject) =>{
        const CACHE_KEY_PROCESSING = `LINK_CONTACTS_${uid}_${contactId}`;
        var cacheProcessingValue = await cache.get(CACHE_KEY_PROCESSING);
    
        if(cacheProcessingValue == null)
        {
            resolve();
            return;
        }
    
        var itvProcessingLinkContact = setInterval(async function(){
            cacheProcessingValue = await cache.get(CACHE_KEY_PROCESSING);

            if(cacheProcessingValue == null)
            {
                clearInterval(itvProcessingLinkContact);
                itvProcessingLinkContact = null;
                resolve();
                return;
            }
        }, 1000);
    });
}