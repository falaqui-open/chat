var db = require('./db');

module.exports = {
    getBasicInfo: function(login)
    {
        return getBasicInfo(login);
    },
    getBasicInfoDBCharTest: function()
    {
        return getBasicInfoDBCharTest();
    },
    resetForceLogoutForUser(login)
    {
        return resetForceLogoutForUser(login);
    }
}


async function getBasicInfo(login)
{
    const queryBasicInfo = `SELECT Name, LoginMode, TaxId, Email, MobilePhone, ForceLogout FROM Users WHERE Login = ?`;
    const queryBasicInfoValues = [login];
    const recordList = await db.RunWithValues(queryBasicInfo, queryBasicInfoValues);
    const record = recordList.length > 0 ? recordList[0] : null;

    // if(record != null)
    // {
    //     // WRONG: Basic info for Jos� Silva
    //     // CORRECT: Basic info for José Silva
    //     console.log(`Basic info for ${record.Name}`);
    // }

    return record;
}

async function resetForceLogoutForUser(login)
{
    const query = `UPDATE Users SET ForceLogout = NULL WHERE Login = ?`;
    const queryValues = [login];
    await db.RunWithValues(query, queryValues);
}

async function getBasicInfoDBCharTest()
{
    const queryBasicInfoTest = `SELECT 'a á e é i í o ó u ú - c ç a ã' AS TestChar WHERE 1 = ?`;
    const queryBasicInfoTestValues = ["1"];
    const recordList = await db.RunWithValues(queryBasicInfoTest, queryBasicInfoTestValues);
    const record = recordList.length > 0 ? recordList[0] : null;
    return record;
}