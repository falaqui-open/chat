var express             = require('express');
var router              = express.Router();

const path              = require('path');
const fs                = require('fs');
const readline          = require('readline');
const stream            = require('stream');
const multer            = require('multer'); // Middleware for handling multipart/form-data

const jwt               = require('../local_modules/jwt');
const db                = require('../local_modules/db');
const appLangList       = require('../local_modules/config/applanglist.json');
const appTexts          = require('../local_modules/config/apptexts.json');
const security          = require('../local_modules/security');
const mediaPhoto        = require('../local_modules/media/photo');
const cache             = require('../local_modules/cache');
const userInfo          = require('../local_modules/userinfo');
const sms               = require('../local_modules/sms');
const integrationLayer  = require('../local_modules/integrationlayer');

/**
 * GET /services/version
 * No parameters
 * Send current version
*/
router.get('/version', (req, res) => {

    const countryCode = getCountryCodeFromRequest(req);

    const forcedCountryCode = req.headers['x-fcc'];

    let forwardForIP = req.headers['x-forwarded-for'];
    if(forwardForIP == null)
    {
        forwardForIP = "";
    }

    if(forwardForIP.length > 0)
    {
        forwardForIP = forwardForIP.split(`,`);
        for(let ix = 0; ix < forwardForIP.length; ix++)
        {
            const forwardForIpInfo = mountInfoFromIP(forwardForIP[ix].trim());
            forwardForIP[ix] = forwardForIpInfo;
        }    
    }
    else
    {
        forwardForIP = [];
    }
   
    var data = {
        "version": 1,
        "subversion": 0,
        "rc": 0,
        "country": countryCode,
        "fcc": forcedCountryCode,
        "geo": req.geo,
        "clientinfo": req.clientinfo,
        "clientip": {
            "default": mountInfoFromIP(req.clientip),
            "cf_connecting_ip": mountInfoFromIP(req.headers['cf-connecting-ip']),
            "x_real_ip": mountInfoFromIP(req.headers['x-real-ip']),
            "x_forwarded_for_ip": forwardForIP,
            "remote_address_ip": req.connection != null ? mountInfoFromIP(req.connection.remoteAddress) : ""
        },
        "phonecode": req.phonecode,
        "supportedphonecodelist": phoneCodes,
        "languages": req.languages,
    };
    res.status(200);
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.send(data);
});

/**
 * GET /services/chartest
 * No parameters
 * Send char test result
*/
router.get('/chartest', async (req, res) => {
    const infoBasicTest = await userInfo.getBasicInfoDBCharTest();
    const servicesTest = await servicesDBCharTest();
    const servicesInlineSetNamesTest = await servicesDBCharTestInlineSetNames();
    const servicesCharsetResults = await servicesDBCharsetResults();
    const data = {
        "basicinfo": infoBasicTest,
        "services": servicesTest,
        "servicesInlineSetNamesTest": servicesInlineSetNamesTest,
        "charsetResults": servicesCharsetResults
    }

    res.status(200);
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.send(data);
});

/**
 * POST /services/ping
*/
router.post('/ping', async (req, res) =>{

    const countryCode = getCountryCodeFromRequest(req);
    const appInfo = await getAppInfo(req);

    if(req.body.code != 'M-IOS' && req.body.code != 'M-ANDROID' && req.body.code != 'M-WV')
    {
        res.status(403);
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.send({
            "status": "nok",
            "time": new Date(),
            "country": countryCode,
            "loginExpirationDate": 0,
            "uid": "",
            "uinfo": null,
            "ainfo": appInfo,
            "dup": false
        });

        return;
    }

    let uid = req.body.uid;

    if(uid == null)
    {
        uid = "";
    }

    if(uid.length == 0)
    {
        res.status(200);
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.send({
            "status": "ok",
            "time": new Date(),
            "country": countryCode,
            "loginExpirationDate": 0,
            "uid": "",
            "uinfo": null,
            "ainfo": appInfo,
            "dup": false
        });

        return;
    }

    let isLoggedIn = false;
    let tokenExpirationDate = 0;
    if(req.body.logintoken != null)
    {
        const loginTokenValidation = await validateJWTLoginToken(req.body.logintoken);
        if(loginTokenValidation.valid == true)
        {
            tokenExpirationDate = loginTokenValidation.expirationDate;
            const tokenContent = loginTokenValidation.tokenContent;

            if(tokenContent != null)
            {
                if(tokenContent.uid != null)
                {
                    if(uid.trim().toLowerCase() == tokenContent.uid.trim().toLowerCase())
                    {
                        if(countryCode == tokenContent.country)
                        {
                            if(req.clientinfo.browser == tokenContent.browser)
                            {
                                if(req.clientinfo.os == tokenContent.os)
                                {
                                    if(req.clientinfo.platform == tokenContent.platform)
                                    {
                                        if(req.clientinfo.isMobile == tokenContent.is_mobile)
                                        {
                                            isLoggedIn = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
    }

    if(isLoggedIn == false)
    {
        res.status(200);
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.send({
            "status": "ok",
            "time": new Date(),
            "country": countryCode,
            "loginExpirationDate": 0,
            "uid": "",
            "uinfo": null,
            "ainfo": appInfo,
            "dup": false
        });

        return;
    }

    const DEVICE_SESSION_CACHE_ID = `device_session_${uid}`;
    const DEVICE_UUID = req.headers['x-uuid'];
    const DEVICE_BROWSER = req.clientinfo.browser;
    const DEVICE_OS = req.clientinfo.os;
    const DEVICE_PLATFORM = req.clientinfo.platform;
    const DEVICE_ISMOBILE = req.clientinfo.isMobile;
    const DEVICE_IDENTIFICATION = `${DEVICE_UUID}_${DEVICE_BROWSER}_${DEVICE_OS}_${DEVICE_PLATFORM}_${DEVICE_ISMOBILE}`;

    const cachedSession = await cache.get(DEVICE_SESSION_CACHE_ID);
    if(cachedSession != null)
    {
        if(cachedSession.trim().length > 0)
        {
            if(cachedSession != DEVICE_IDENTIFICATION)
            {
                // Different session, logout request (dup = true)
                res.status(200);
                res.set('Content-Type', 'application/json; charset=utf-8');
                res.send({
                    "status": "ok",
                    "time": new Date(),
                    "country": countryCode,
                    "loginExpirationDate": 0,
                    "uid": "",
                    "uinfo": null,
                    "ainfo": appInfo,
                    "dup": true
                });
        
                return;
            }
        }
    }


    const DEVICE_SESSION_CACHE_SECONDS_TO_EXPIRE = 120;
    await cache.set(DEVICE_SESSION_CACHE_ID, DEVICE_IDENTIFICATION, DEVICE_SESSION_CACHE_SECONDS_TO_EXPIRE);

    const userInfoBasic = await userInfo.getBasicInfo(uid);
    const userInfoData = {
        "basicinfo": userInfoBasic
    }

    // console.log(`Returning Basic Info: ${JSON.stringify(userInfoBasic)}`);

    res.status(200);
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.send({
        "status": "ok",
        "time": new Date(),
        "country": countryCode,
        "loginExpirationDate": tokenExpirationDate,
        "uid": uid,
        "uinfo": userInfoData,
        "ainfo": appInfo,
        "dup": false
    });


});

/**
 * GET /services/texts
 * No parameters
 * Send app texts translation
*/
router.get('/texts', (req, res) => {
    const result = {
        "texts": appTexts,
        "langList": appLangList
    }

    res.status(200).json(result);
});

/**
 * GET /services/hasuserbyphone/:phone
 * Send if has user by phone
*/
router.get('/hasuserbyphone/:phone', async (req, res) => {
    const mobilePhone = req.params.phone;
    const phoneCode = req.phonecode;
    const mobilePhoneDialCode = phoneCode.dial_code;

    const mobilePhoneFull = `${mobilePhoneDialCode}${mobilePhone}`;
    const mobilePhoneOnlyNumbers = String(mobilePhoneFull).replace(/[^\d]/g, '');
    const mobilePhoneInStandardFormat = `+${mobilePhoneOnlyNumbers}`;

    const hasUser = await getHasUserByPhone(mobilePhoneInStandardFormat);

    res.status(200).json({"found": hasUser});
});

/**
 * GET /services/hasuserbyuid/:uid
 * Send if has user by uid
*/
router.get('/hasuserbyuid/:uid', async (req, res) => {
    const uid = req.params.uid;

    const hasUser = await getHasUserByLogin(uid);

    res.status(200).json({"found": hasUser});
});


/**
 * POST /services/register
*/
router.post('/register', validDeviceRequest, async (req, res) => {
    const bodyForm = req.body;

    const validatedResponse = await validatedServerSignUp(bodyForm);

    if(validatedResponse.valid == false)
    {
        console.log(`Invalid Request: ${validatedResponse.message}`);

        res.status(500).json({code: 'INVREQ', message: `Invalid Request: ${validatedResponse.message}`});
        return;
    }
  
    const password = validatedResponse.body.password;
    var passwordHash = ``;
    if(password.trim().length > 0)
    {
        passwordHash = await security.hashText(password);
    }
    
    const login = validatedResponse.body.login;    
    const loginMode = "MOBPHONE";
    const fullName = validatedResponse.body.name;
    const mobilePhone = validatedResponse.body.mobilePhone;

    var countryCode = validatedResponse.body.countryCode.toUpperCase().trim();

    // If country code didn't come from client, try getting from the geo in request
    if(countryCode.length == 0)
    {
        countryCode = getCountryCodeFromRequest(req);
    }

    if(countryCode.trim().length == 0)
    {
        res.status(500).json({code: 'REQCC', message: 'Required Country'});
        return;
    }

    if(countryCode.trim().length != 2)
    {
        res.status(500).json({code: 'ICF', message: 'Invalid Country Format'});
        return;        
    }

    const queryCheckLogin = `SELECT id FROM Users WHERE Login = ?`;
    const queryCheckLoginValues = [login];
    const checkLoginList = await db.RunWithValues(queryCheckLogin, queryCheckLoginValues);
    if(checkLoginList.length > 0)
    {
        res.status(500).json({code: 'LAR', message: 'Login already registered'});
        return;
    }


    const queryCheckMobilePhone = `SELECT id FROM Users WHERE MobilePhone = ?`;
    const queryCheckMobilePhoneValues = [mobilePhone];
    const checkMobilePhoneList = await db.RunWithValues(queryCheckMobilePhone, queryCheckMobilePhoneValues);
    if(checkMobilePhoneList.length > 0)
    {
        res.status(500).json({code: 'PAR', message: 'Phone already registered'});
        return;
    }

    const subQueryTermsOfUse = `''`;
    const subQueryAntiMoneyLaundering = `''`;
    const subQueryPrivacyPolicy = `''`;
    const subQueryInformationSecurity = `''`;

    const initialPhotoTemplatePath = path.resolve(`${__dirname}/../local_modules/media/initial-photo.png`);
    const initialPhotoUser = path.resolve(`${__dirname}/../local_modules/media/initial-photo-${makeid(6)}.png`);
    mediaPhoto.makeCopy(initialPhotoTemplatePath, initialPhotoUser);
    await mediaPhoto.resize(initialPhotoUser, 80, 80);
    await mediaPhoto.reduceSize(initialPhotoUser);
    const initialPhoto = mediaPhoto.getBinaryData(initialPhotoUser);
    await mediaPhoto.remove(initialPhotoUser);

    const phoneValidationCode = makeidnum(6).toUpperCase();

    const taxId = "";
    const email = "";

    const queryRegister = `
    INSERT INTO Users
        (Login, LoginMode, Password, TaxId, Name, Photo, MobilePhone, Email, CountryCode, BirthDate, TermsOfUseVersion, AntiMoneyLaunderingTerroristFinancingPolicyVersion, PrivacyPolicyVersion, InformationSecurityPolicyVersion, ResetPasswordCode, PhoneValidationCode, CreationDate, Locked)
        VALUES
        (?, ?, ?, ?, ?, BINARY(?), ?, ?, ?, NULL, ${subQueryTermsOfUse}, ${subQueryAntiMoneyLaundering}, ${subQueryPrivacyPolicy}, ${subQueryInformationSecurity}, '', ?, NOW(), 0)
    `;

    const queryRegisterValues = [login, loginMode, passwordHash, taxId, fullName, initialPhoto, mobilePhone, email, countryCode, phoneValidationCode];

    try
    {
        await db.RunWithValues(queryRegister, queryRegisterValues)
    }
    catch(registerDBException)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    const tokenLogin = getLoginToken(countryCode, req, login);
    res.status(200).json({"code": "OK", "message": "Registration completed successfully", "auth": tokenLogin, "uid": login});
});

/**
 * POST /services/login
*/
router.post('/login', async (req, res) => {
    const countryCode = getCountryCodeFromRequest(req);
    const bodyForm = req.body;

    const login = bodyForm.login;
    const password = bodyForm.password;


    var valid = false;

    const queryLogin = `SELECT Login, Password, Locked, PhoneValidationCode FROM Users WHERE Login = ?`;
    const queryLoginValues = [login];

    const recordList = await db.RunWithValues(queryLogin, queryLoginValues);
    const record = recordList.length > 0 ? recordList[0] : null;

    if(record != null)
    {
        const storedPasswordHash = record.Password;
        const passwordMatch = await security.hashTextCompare(password, storedPasswordHash);

        if(passwordMatch == true)
        {
            valid = true;
        }
    }

    if(valid == false)
    {
        res.status(401).json({message: 'Unauthorized'});
        return;
    }

    if(parseInt(record.Locked) > 0)
    {
        res.status(423).json({message: 'Locked'});
        return;
    }

    const tokenLogin = getLoginToken(countryCode, req, login);

    res.status(200).json({"auth": tokenLogin, "uid": login});
});



/**
 * POST /services/changeuserphoto
 * Change Login Photo
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
const storageChangeUserPhoto = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve(`${__dirname}/../local_modules/upload`);
        cb(null, uploadDir); // Store uploaded files in the 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Retain original filename
    }
});

const uploadChangeUserPhoto = multer({ storage: storageChangeUserPhoto });

router.post('/changeuserphoto', validLoginToken, uploadChangeUserPhoto.single('file'), async (req, res) =>{
    const file = req.file;
  
    if(!file)
    {
        return res.status(400).send({"status": "NOK", "error": "No file uploaded"});
    }

    const uploadedFilePath = file.path;

    const login = req.clientinfo.uid;

    await mediaPhoto.resize(uploadedFilePath, 80, 80);

    if(uploadedFilePath.toLowerCase().trim().endsWith(".png") == true)
    {
        await mediaPhoto.reduceSize(uploadedFilePath);
    }

    const binaryPhoto = mediaPhoto.getBinaryData(uploadedFilePath);

    const queryUpdate = `UPDATE Users SET Photo = BINARY(?) WHERE Login = ?`;
    const queryUpdateValues = [binaryPhoto, login];

    let uploadDone = false;
    try
    {
        await db.RunWithValues(queryUpdate, queryUpdateValues);
        uploadDone = true;
    }
    catch(registerDBException)
    {
        uploadDone = false;
    }

    if(uploadDone == false)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    await mediaPhoto.remove(uploadedFilePath);
    res.status(200).json({code: 'OK', message: 'Registration completed successfully'});
});


/**
 * POST /services/setinitialphoto
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/setinitialphoto', validLoginToken, async (req, res) => {

    const login = req.clientinfo.uid;

    const initialPhotoTemplatePath = path.resolve(`${__dirname}/../local_modules/media/initial-photo.png`);
    const initialPhotoUser = path.resolve(`${__dirname}/../local_modules/media/initial-photo-${makeid(6)}.png`);
    mediaPhoto.makeCopy(initialPhotoTemplatePath, initialPhotoUser);
    await mediaPhoto.resize(initialPhotoUser, 80, 80);
    await mediaPhoto.reduceSize(initialPhotoUser);
    const initialPhoto = mediaPhoto.getBinaryData(initialPhotoUser);
    await mediaPhoto.remove(initialPhotoUser);


    const queryUpdate = `UPDATE Users SET Photo = BINARY(?) WHERE Login = ?`;
    const queryUpdateValues = [initialPhoto, login];

    let uploadDone = false;
    try
    {
        await db.RunWithValues(queryUpdate, queryUpdateValues);
        uploadDone = true;
    }
    catch(registerDBException)
    {
        uploadDone = false;
    }

    if(uploadDone == false)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    // await mediaPhoto.remove(uploadedFilePath);
    res.status(200).json({code: 'OK', message: 'Registration completed successfully'});

});



/**
 * POST /services/changeusername
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/changeusername', validLoginToken, async (req, res) => {

    const login = req.clientinfo.uid;
    const newName = req.body.name;

    // console.log(`New user name: ${newName} for login ${login}`);

    const queryUpdateLogin = `UPDATE Users SET Name = ? WHERE Login = ?`;
    const queryUpdateLoginValues = [newName, login];

    await db.RunWithValues(queryUpdateLogin, queryUpdateLoginValues);

    res.status(200).json({"status": "OK"});
});

/**
 * POST /services/resetuserforcelogout
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/resetuserforcelogout', validLoginToken, async (req, res) => {
    const login = req.clientinfo.uid;
    await userInfo.resetForceLogoutForUser(login);
    res.status(200).json({"status": "OK"});
});

/**
 * GET /services/loginexp
 * Return the login expire date
* Authenticated route (login can be read from req.clientinfo.uid and JWT can be read from req.jwt)
*/
router.get('/loginexp', validLoginToken, async (req, res) => {
    const DEVICE_UUID = req.headers['x-uuid'];
    var bearerHeader = req.headers['x-auth'];
    var bearerHeaderLegacy = req.headers['authorization'];
    if(typeof bearerHeader == 'undefined' && typeof bearerHeaderLegacy == 'undefined')
    {
        bearerHeader = `Bearer ${req.query.access_token}`;
    }

    // console.log(`Device UUID: ${DEVICE_UUID}`);
    // console.log(`Bearer Header: ${bearerHeader}`);
    // console.log(`Bearer Header Legacy: ${bearerHeaderLegacy}`);

    if(typeof bearerHeader == 'undefined')
    {
        bearerHeader = bearerHeaderLegacy;
    }

    if(typeof bearerHeader == null)
    {
        bearerHeader = bearerHeaderLegacy;
    }

    // console.log(`Bearer Header Fix: ${bearerHeader}`);

    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    // console.log(`Bearer Token: ${bearerToken}`);

    // const secret = security.loginSecret();
    // console.log(`Sec K: ${secret}`);

    const loginTokenValidation = await validateJWTLoginToken(bearerToken);
    // console.log(`JWT Valid: ${loginTokenValidation.valid}`);
    // console.log(`JWT Exp Date: ${loginTokenValidation.expirationDate}`);
    

    const expDate = req.jwt.expirationDate;
    const expTs = req.jwt.expirationTimestamp;
    res.status(200).json({"exp": expTs, "expDate": expDate});
});

/**
 * GET /services/validatedphone
 * Check if the phone is validated
* Authenticated route (login can be read from req.clientinfo.uid)
*/
router.get('/validatedphone', validLoginToken, async (req, res) => {
    const uid = req.clientinfo.uid;

    const queryLogin = `SELECT Login, PhoneValidationCode, MobilePhone FROM Users WHERE Login = ?`;
    const queryLoginValues = [uid];

    const recordList = await db.RunWithValues(queryLogin, queryLoginValues);
    const record = recordList.length > 0 ? recordList[0] : null;
    let phoneValidationCode = "";
    let phoneNumber = "";

    if(record != null)
    {
        phoneValidationCode = record.PhoneValidationCode;
        phoneNumber = record.MobilePhone;
    }

    const isValid = phoneValidationCode == null ? true : (phoneValidationCode.trim().length == 0 ? true : false);

    res.status(200).json({"valid": isValid, "phone": phoneNumber});
});

/**
 * GET /services/checkphoneverificationcode/:code
 * Check phone verification code
* Authenticated route (login can be read from req.clientinfo.uid)
*/
router.get('/checkphoneverificationcode/:code', validLoginToken, async (req, res) => {
    const uid = req.clientinfo.uid;
    const code = req.params.code.toUpperCase().trim();

    const queryCountUsers = `SELECT COUNT(*) As Total FROM Users WHERE Login = ? AND PhoneValidationCode = ?`;
    
    const queryCountUsersValues = [uid, code];
    const countUsers = await db.RunWithValues(queryCountUsers, queryCountUsersValues);

    let isValid = false;
    if(countUsers != null)
    {
        if(countUsers.length > 0)
        {
            if(countUsers[0].Total > 0)
            {
                isValid = true;
            }
        }
    }


    res.status(200).json({"valid": isValid});
});

/**
 * POST /services/setphonevalidationok
 * Set user phone validation to ok (NULL or Empty PhoneValidationCode column)
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/setphonevalidationok', validLoginToken, async (req, res) => {

    const login = req.clientinfo.uid;

    const queryUpdateLogin = `UPDATE Users SET PhoneValidationCode = NULL WHERE Login = ?`;
    const queryUpdateLoginValues = [login];

    await db.RunWithValues(queryUpdateLogin, queryUpdateLoginValues);

    res.status(200).json({"status": "OK"});
});

/**
 * POST /services/sendsmsphonevalidationcode
 * Send the phone validation code to phone number
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/sendsmsphonevalidationcode', validLoginToken, async (req, res) => {
    const uid = req.clientinfo.uid;
    const countryCode = getCountryCodeFromRequest(req);

    const queryPhoneLogin = `SELECT MobilePhone, PhoneValidationCode FROM Users WHERE Login = ?`;
    const queryPhoneLoginValues = [uid];

    const dbResult = await db.RunWithValues(queryPhoneLogin, queryPhoneLoginValues);

    if(dbResult != null)
    {
        if(dbResult.length > 0)
        {
            const record = dbResult[0];
            if(record.MobilePhone.trim().length > 0)
            {
                if(record.PhoneValidationCode != null)
                {
                    if(record.PhoneValidationCode.trim().length > 0)
                    {
                        let smsText = getTranslateServer(countryCode, `validation-phone-code-sms-message`, `FalaQui: Your phone verification code is: XXXXXX`);
                        smsText = replaceAll(smsText, `XXXXXX`, record.PhoneValidationCode);

                        const SMS_SEND_FLAG = true; // Disable for development purposes, Enable when production mode

                        if(SMS_SEND_FLAG == true)
                        {
                            try
                            {
                                await sms.send(smsText, "", record.MobilePhone);
                            }
                            catch(sendError)
                            {
                                console.log(`Failed to send SMS`);
                                console.log(sendError);
                                res.status(200).json({"status": "NOK"});
                                return;
                            }
                        }
                        else
                        {
                            console.log(`*** Disabled SMS Send ****`);
                            console.log(`   SMS Text: ${smsText}`);
                            console.log(`   SMS Number: ${record.MobilePhone}`);
                        }
                    }
                }
            }
        }
    }

    res.status(200).json({"status": "OK"});
});

/**
 * POST /services/registeruserdevice
 * Register the device FCM token
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/registeruserdevice', validLoginToken, async (req, res) => {
    const DEVICE_UUID = req.headers['x-uuid'];
    const fcmToken = req.body.fcmdevicetoken;
    const platform = req.body.platform;
    const userLogin = req.clientinfo.uid;

    // console.log(`Device UUID: ${DEVICE_UUID} | Device FCM Token: ${fcmToken}`);

    const queryCheck = `SELECT id FROM UserDeviceInfo WHERE Login = ?`;
    const queryCheckValues = [userLogin];
    const checkResult = await db.RunWithValues(queryCheck, queryCheckValues);

    let querySave = null;
    let querySaveValues = null;
    if(checkResult.length == 0)
    {
        querySave = `INSERT INTO UserDeviceInfo(Login, DeviceUUID, Platform, FCMToken) VALUES(?, ?, ?, ?)`;
        querySaveValues = [userLogin, DEVICE_UUID, platform, fcmToken];
    }
    else
    {
        querySave = `UPDATE UserDeviceInfo SET DeviceUUID = ?, Platform = ?, FCMToken = ? WHERE Login = ?`;
        querySaveValues = [DEVICE_UUID, platform, fcmToken, userLogin];
    }

    // console.log(querySave);
    // console.log(querySaveValues.toString());

    await db.RunWithValues(querySave, querySaveValues);

    res.status(200).json({code: 'OK', message: 'Registration ok'});
});

/**
 * POST /services/clearbackendnotifications
 * Clear notifications at backend
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/clearbackendnotifications', validLoginToken, async (req, res) => {
    const uid = req.clientinfo.uid;

    const queryClearBadge = `UPDATE UserDeviceInfo SET BadgeCount = NULL WHERE Login = ?`;
    const queryClearBadgeValues = [uid];
    await db.RunWithValues(queryClearBadge, queryClearBadgeValues);

    res.status(200).json({"status": "OK"});
});


/**
 * POST /services/retrivecontactliststatus
 * Get all phone contact list status
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/retrivecontactliststatus', validLoginToken, async (req, res) => {
    const uid = req.clientinfo.uid;
    const contactList = req.body.list != null ? JSON.parse(req.body.list) : [];

    // Comma separated into single quotes
    const queryInValues = `'${contactList.join("', '")}'`;
    
    const queryUserStatus = `SELECT Login, Name FROM USERS WHERE Login IN (${queryInValues})`;
    const result = await db.Run(queryUserStatus);

    res.status(200).json({"result": result});
});

/**
 * GET /services/userphotoraw/:login
 * Send Login Photo (open raw)
*/
router.get('/userphotoraw/:login', async (req, res) => {
    const login = req.params.login;
    let result = await getUserPhotoByLogin(login);

    if(result.photo == null)
    {
        res.status(404).json({code: 'NOK', message: 'Photo not found'});
        return;
    }

    const img = Buffer.from(result.photo, "base64");
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
    });
    res.end(img);
    // res.send(img);
});

/**
 * GET /services/userphotodownload/:login
 * Download Login Photo
 * Eg.: https://localhost:24011/services/userphotodownload/5511998755184
*/
router.get('/userphotodownload/:login', async (req, res) => {
    const login = req.params.login;
    let result = await getUserPhotoByLogin(login);

    const file404 = path.resolve(`${__dirname}/../local_modules/media/404.png`);


    if(result.photo == null)
    {
        res.download(file404); 
        return;
    }

    const img = Buffer.from(result.photo, "base64");
    var readStream = new stream.PassThrough();
    readStream.end(img);

    const fileName = `profile-${login}.png`;
    res.set('Content-disposition', 'attachment; filename=' + fileName);
    res.set('Content-Type', 'image/png');

    readStream.pipe(res);
});


/*
 * ***** APP DB BACKUP ROUTE *****
 * POST /services/appdbbackup
 * Upload DB Script
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/appdbbackup', validLoginToken, async (req, res) => {
    const fileContent = req.body.content;
    let mode = req.body.mode;
    const chunkIndex = req.body.chunkindex;
    const chunkLength = req.body.chunklength;
    const login = req.clientinfo.uid;

    if(mode == null)
    {
        mode = "full";
    }

    const backupDir = path.resolve(`${__dirname}/../local_modules/upload/db-phone-backup/`);

    if (fs.existsSync(backupDir) == true)
    {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const OLD_MINUTES = 10;
    await deleteOldFilesByExtension(backupDir, `.sqlpart`, OLD_MINUTES);

    if(mode.toLowerCase() == `full`)
    {
        const backupFileName = `${login}.sql`;
        const backupFilePath = path.join(backupDir, backupFileName);
    
        fs.writeFileSync(backupFilePath, fileContent, 'utf8');

        await writeBackupToDB(login, backupFilePath);

        // Remove backup file after write into database
        fs.unlinkSync(backupFilePath);
    
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.status(200).send({"status": "OK", "error": null});
        return;
    }
    else
    {
        const backupFileName = `${login}.sqlpart`;
        const backupFilePath = path.join(backupDir, backupFileName);

        let isTheFirstPart = false;
        if(chunkIndex == 0)
        {
            isTheFirstPart = true;
        }

        let isTheLastPart = false;
        if(chunkIndex == chunkLength -1)
        {
            isTheLastPart = true;
        }

        if(isTheFirstPart == true)
        {
            // Clear any previous before start
            if (fs.existsSync(backupFilePath) == true)
            {
                fs.unlinkSync(backupFilePath);

                // Give some time for OS after remove file
                await waitATime(100);

            }

            if (fs.existsSync(backupFilePath) == true)
            {
                console.log(`Previous file could not be removed: ${backupFilePath}, trying to remove into...`);
                const fileIsRemoved = await tryToRemoveFile(backupFilePath, 10, 1000);

                if(fileIsRemoved == true)
                {
                    console.log(`File removed: ${backupFilePath}`);
                }
                else
                {
                    if (fs.existsSync(backupFilePath) == false)
                    {
                        console.log(`PANIC: Unable to remove file in several attempts`);
                    }
                    else
                    {
                        console.log(`File seems to be removed: ${backupFilePath}`);
                    }
                }
            }

            // Create new file
            fs.writeFileSync(backupFilePath, fileContent, 'utf8');
        }
        else
        {
            fs.appendFileSync(backupFilePath, fileContent, 'utf8');
        }
    
        if(isTheLastPart == true)
        {
            // Mount the file

            const partialBackupFileName = `${login}.sqlpart`;
            const partialBackupFilePath = path.join(backupDir, partialBackupFileName);
            
            const backupFileName = `${login}.sql`;
            const backupFilePath = path.join(backupDir, backupFileName);
    
            // Remove previous backup file
            if (fs.existsSync(backupFileName) == true)
            {
                fs.unlinkSync(backupFileName);

                // Give some time for OS after remove file
                await waitATime(100);
            }

            // Move completed partial to backup file name
            fs.renameSync(partialBackupFilePath, backupFilePath);

            await writeBackupToDB(login, backupFilePath);

            // Remove backup file after write into database
            fs.unlinkSync(backupFilePath);

            res.set('Content-Type', 'application/json; charset=utf-8');
            res.status(200).send({"status": "OK", "error": null, "chunkindex": chunkIndex, "chunklength": chunkLength, "finished": true});
            return;
        }
        else
        {
            // Give some time before inform client
            await waitATime(100);

            res.set('Content-Type', 'application/json; charset=utf-8');
            res.status(200).send({"status": "OK", "error": null, "chunkindex": chunkIndex, "chunklength": chunkLength, "finished": false});
            return;
        }
    }

});

/**
 * GET /services/downloadappbackup
 * Get app database backup file
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.get('/downloadappbackup', validLoginToken, async (req, res) => {
    const login = req.clientinfo.uid;

    const content = await getBackupFromDB(login);

    // console.log(`Content: ${content}`);

    res.set('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send({"status": "OK", "content": content});
});



/**
 * POST /services/setgroupphoto
 * Set a Group Photo
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
const storageSetGroupPhoto = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve(`${__dirname}/../local_modules/upload`);
        cb(null, uploadDir); // Store uploaded files in the 'uploads' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Retain original filename
    }
});

const uploadSetGroupPhoto = multer({ storage: storageSetGroupPhoto });

router.post('/setgroupphoto', validLoginToken, uploadSetGroupPhoto.single('file'), async (req, res) =>{
    const file = req.file;
  
    // console.log(`Group photo upload request...`);

    if(!file)
    {
        return res.status(400).send({"status": "NOK", "error": "No file uploaded"});
    }

    const uploadedFilePath = file.path;

    const login = req.clientinfo.uid;
    // const groupId = req.headers["x-groupid"];
    const groupId = req.body.groupid;

    // console.log(`Group photo upload resize...`);

    await mediaPhoto.resize(uploadedFilePath, 80, 80);

    if(uploadedFilePath.toLowerCase().trim().endsWith(".png") == true)
    {
        // console.log(`Group photo upload reduce...`);
        await mediaPhoto.reduceSize(uploadedFilePath);
    }

    // console.log(`Group photo upload binary data...`);
    const binaryPhoto = mediaPhoto.getBinaryData(uploadedFilePath);

    const queryUpdate = `UPDATE AppGroups SET Photo = BINARY(?) WHERE GroupId = ?`;
    const queryUpdateValues = [binaryPhoto, groupId];

    let uploadDone = false;
    try
    {
        // console.log(`Group photo upload saving to group id ${groupId}...`);
        await db.RunWithValues(queryUpdate, queryUpdateValues);
        uploadDone = true;
    }
    catch(registerDBException)
    {
        console.log(`Group photo upload error ${registerDBException}`);
        uploadDone = false;
    }

    if(uploadDone == false)
    {
        console.log(`Group photo upload error done`);
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    // console.log(`Group photo upload removing file...`);
    await mediaPhoto.remove(uploadedFilePath);

    // console.log(`Group photo upload done!`);
    res.status(200).json({code: 'OK', message: 'Registration completed successfully'});
});

/**
 * GET /services/groupphotoexists/:groupid
 * Send Group Photo Exists
*/
router.get('/groupphotoexists/:groupid', async (req, res) => {
    const groupId = req.params.groupid;
    let result = await getGroupPhotoByGroupId(groupId);

    let exists = result == null ? false : (result.photo == null ? false : true);
    let photo = result == null ? null : result.photo;
    let name = result == null ? null : result.name;

    res.status(200).json({"exists": exists, "photo": photo, "name": name});
});


/**
 * GET /services/hasgroupphotoimagetodownload/:groupid
 * Check if has download Group Photo file
 * Eg.: https://localhost:24011/services/hasgroupphotoimagetodownload/xpto
*/
router.get('/hasgroupphotoimagetodownload/:groupid', async (req, res) => {
    const groupId = req.params.groupid;
    let result = await getGroupPhotoByGroupId(groupId);

    let hasPhoto = false;

    if(result.photo == null)
    {
        hasPhoto = false;
    }
    else
    {
        hasPhoto = true;
    }

    res.status(200).json({"result": hasPhoto});
});


/**
 * GET /services/groupphotoimagedownload/:groupid
 * Download Group Photo
 * Eg.: https://localhost:24011/services/groupphotoimagedownload/xpto
*/
router.get('/groupphotoimagedownload/:groupid', async (req, res) => {
    const groupId = req.params.groupid;
    let result = await getGroupPhotoByGroupId(groupId);

    const file404 = path.resolve(`${__dirname}/../local_modules/media/404.png`);


    if(result.photo == null)
    {
        res.download(file404); 
        return;
    }

    const img = Buffer.from(result.photo, "base64");
    var readStream = new stream.PassThrough();
    readStream.end(img);

    const fileName = `group-${groupId}.png`;
    res.set('Content-disposition', 'attachment; filename=' + fileName);
    res.set('Content-Type', 'image/png');

    readStream.pipe(res);
});

/**
 * GET /services/groupphotoraw/:groupid
 * Send Group Photo (open raw)
*/
router.get('/groupphotoraw/:groupid', async (req, res) => {
    const groupId = req.params.groupid;
    let result = await getGroupPhotoByGroupId(groupId);

    if(result.photo == null)
    {
        res.status(404).json({code: 'NOK', message: 'Photo not found'});
        return;
    }

    const img = Buffer.from(result.photo, "base64");
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': img.length
    });
    res.end(img);
    // res.send(img);
});


/**
 * POST /services/savegroup
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/savegroup', validLoginToken, async (req, res) => {
    const bodyForm = req.body;

    const uid = req.clientinfo.uid;

    const groupId           = bodyForm.groupId != null              ? bodyForm.groupId : "";
    const name              = bodyForm.name != null                 ? bodyForm.name : "";
    const description       = bodyForm.description != null          ? bodyForm.description : "";
    const creatorAdminLogin = bodyForm.creatorAdminLogin != null    ? bodyForm.creatorAdminLogin : "";
    const creationDate      = bodyForm.creationDate != null         ? bodyForm.creationDate : "";   

    const nullVAlue  = null;
    const editDate          = bodyForm.editDate != null  && bodyForm.editDate != '' ? bodyForm.editDate : nullVAlue;
    
    const hasGroupValidity          = bodyForm.hasGroupValidity != null             ? bodyForm.hasGroupValidity : 0;
    const hasGroupValidityFromDate  = bodyForm.hasGroupValidityFromDate != null     ? bodyForm.hasGroupValidityFromDate : 0;
    
    const hasGroupValidityBetween   = bodyForm.hasGroupValidityBetween != null      ? bodyForm.hasGroupValidityBetween : 0;
    
    const hasGroupAccessHours       = bodyForm.hasGroupAccessHours != null          ? bodyForm.hasGroupAccessHours : 0;

    const groupAccessHoursStart     = bodyForm.groupAccessHoursStart != ''        ? parseInt(bodyForm.groupAccessHoursStart) : nullVAlue;
    const groupAccessHoursEnd       = bodyForm.groupAccessHoursEnd != ''          ? parseInt(bodyForm.groupAccessHoursEnd) : nullVAlue;

    const validityFromDate          = bodyForm.validityFromDate != ''             ? getTimestampValueFromDate(bodyForm.validityFromDate) : nullVAlue;
    const validityBetweenDateStart  = bodyForm.validityBetweenDateStart != ''     ? getTimestampValueFromDate(bodyForm.validityBetweenDateStart) : nullVAlue;
    const validityBetweenDateEnd    = bodyForm.validityBetweenDateEnd != ''       ? getTimestampValueFromDate(bodyForm.validityBetweenDateEnd) : nullVAlue;

    var members             = bodyForm.members != null              ? bodyForm.members : "[]";
    const updateMembers     = bodyForm.updateMembers != null        ? bodyForm.updateMembers.toString() == 'true' : false;

    if(groupId.length == 0)
    {
        res.status(500).json({code: 'REQGI', message: 'Required Group Id'});
        return;
    }

    if(name.length == 0)
    {
        res.status(500).json({code: 'REQNM', message: 'Required Name'});
        return;
    }

    if(description.length == 0)
    {
        res.status(500).json({code: 'REQDS', message: 'Required Description'});
        return;
    }

    if(creatorAdminLogin.length == 0)
    {
        res.status(500).json({code: 'REQAL', message: 'Adm Login'});
        return;
    }

    if(creationDate.length == 0)
    {
        res.status(500).json({code: 'REQCD', message: 'Creation Date'});
        return;
    }

    if(groupId.length > 100)
    {
        res.status(500).json({code: 'TOOLGI', message: 'Too Long Group Id'});
        return;
    }

    if(name.length > 100)
    {
        res.status(500).json({code: 'TOOLNM', message: 'Too Long Name'});
        return;
    }

    if(description.length > 100)
    {
        res.status(500).json({code: 'TOOLDS', message: 'Too Long Description'});
        return;
    }

    if(updateMembers == true)
    {
        members = JSON.parse(members);
        if(Array.isArray(members) == false)
        {
            res.status(500).json({code: 'INVMEM', message: 'Invalid Members'});
            return;
        }
    
        if(members.length == 0)
        {
            res.status(500).json({code: 'EMPMEM', message: 'Empty Members'});
            return;
        }    
    }

    const queryCheckGroup = `SELECT id FROM AppGroups WHERE GroupId = ?`;
    const queryCheckGroupValues = [groupId];
    const checkGroupList = await db.RunWithValues(queryCheckGroup, queryCheckGroupValues);

    let groupExists = false;
    if(checkGroupList.length > 0)
    {
        groupExists = true;
    }


    // Start DB Transaction
    const dbTransaction = await db.StartTransaction();

    let generatedPrivateKey = null;
    let serverUpdateDate = null;

    if(groupExists == false)
    {
        const initialPhotoTemplatePath = path.resolve(`${__dirname}/../local_modules/media/initial-group.png`);
        const initialPhotoGroup = path.resolve(`${__dirname}/../local_modules/media/initial-group-${makeid(6)}.png`);
        mediaPhoto.makeCopy(initialPhotoTemplatePath, initialPhotoGroup);
        await mediaPhoto.resize(initialPhotoGroup, 80, 80);
        await mediaPhoto.reduceSize(initialPhotoGroup);
        const initialPhoto = mediaPhoto.getBinaryData(initialPhotoGroup);
        await mediaPhoto.remove(initialPhotoGroup);  

        const uidList = [groupId]
        // const newKeys = await security.pgpGetKeys(uidList);
        const newKeys = security.cv2GetKeys(uidList);
        const privateKey = newKeys.privateKey;
        generatedPrivateKey = privateKey;

        const queryInsert = `
            INSERT INTO AppGroups (
                GroupId, 
                Name, 
                Description, 
                Photo, 
                CreatorAdminLogin, 
                PrivateKey, 
                CreationDate, 
                HasGroupValidity, 
                HasGroupValidityFromDate,
                ValidityFromDate, 
                HasGroupValidityBetween, 
                ValidityBetweenDateStart, 
                ValidityBetweenDateEnd, 
                HasGroupAccessHours, 
                GroupAccessHoursStart, 
                GroupAccessHoursEnd
            )
            VALUES
            (
                ?, 
                ?, 
                ?, 
                BINARY(?), 
                ?, 
                ?, 
                FROM_UNIXTIME(?), 
                ?, 
                ?, 
                FROM_UNIXTIME(?), 
                ?, 
                FROM_UNIXTIME(?), 
                FROM_UNIXTIME(?), 
                ?, 
                ?, 
                ?
            )
        `;

        const queryInsertValues = [
            groupId, 
            name, 
            description, 
            initialPhoto, 
            creatorAdminLogin, 
            privateKey, 
            creationDate, 
            hasGroupValidity, 
            hasGroupValidityFromDate, 
            validityFromDate, 
            hasGroupValidityBetween,
            validityBetweenDateStart, 
            validityBetweenDateEnd, 
            hasGroupAccessHours, 
            groupAccessHoursStart, 
            groupAccessHoursEnd
        ];

        try
        {
            await db.RunUnderTransactionWithValues(dbTransaction, queryInsert, queryInsertValues)
        }
        catch(registerDBException)
        {
            await db.RollbackTransaction(dbTransaction);
            console.log(`Error on queryInsert and groupExists false groupId: ${groupId}`);
            console.log(registerDBException.sql);
            console.log(registerDBException.sqlMessage);
            res.status(500).json({code: 'EOR', message: 'Error on Register'});
            return;
        }
    }
    else
    {
        const queryUpdate = `UPDATE AppGroups SET 
                                Name = ?, 
                                Description = ?, 
                                ModificationDate = FROM_UNIXTIME(?), 
                                UpdatedDate = FROM_UNIXTIME(?), 
                                UpdateLogin = ?, 
                                HasGroupValidity = ?, 
                                HasGroupValidityFromDate = ?,
                                ValidityFromDate = FROM_UNIXTIME(?), 
                                HasGroupValidityBetween = ?, 
                                ValidityBetweenDateStart = FROM_UNIXTIME(?), 
                                ValidityBetweenDateEnd = FROM_UNIXTIME(?), 
                                HasGroupAccessHours = ?, 
                                GroupAccessHoursStart = ?, 
                                GroupAccessHoursEnd = ? 
                            WHERE 
                                GroupId = ?
                            `;

        const queryUpdateValues = [
            name, 
            description, 
            editDate, 
            editDate, 
            uid, 
            hasGroupValidity, 
            hasGroupValidityFromDate, 
            validityFromDate, 
            hasGroupValidityBetween,
            validityBetweenDateStart, 
            validityBetweenDateEnd, 
            hasGroupAccessHours, 
            groupAccessHoursStart, 
            groupAccessHoursEnd, 
            groupId
        ];

        try
        {
            await db.RunUnderTransactionWithValues(dbTransaction, queryUpdate, queryUpdateValues)
        }
        catch(updateDBException)
        {
            // console.log(updateDBException);
            console.log(`Error on queryUpdate and groupExists else groupId: ${groupId}`);
            console.log(updateDBException.sql);
            console.log(updateDBException.sqlMessage);
            await db.RollbackTransaction(dbTransaction);
            res.status(500).json({code: 'EOR', message: 'Error on Register'});
            return;
        }
    }

    // Save members
    if(updateMembers == true)
    {
        for(let ix = 0; ix < members.length; ix++)
        {
            const memberRecord = members[ix];

            let queryMemberSave;
            let queryMemberSaveValues;

            const newMemberHasUserValidity = memberRecord.HasUserValidity != null                           ? memberRecord.HasUserValidity : 0;
            const newMemberHasUserValidityFromDate = memberRecord.HasUserValidityFromDate != null           ? memberRecord.HasUserValidityFromDate: 0;
            
            const newMemberHasUserValidityBetween = memberRecord.HasUserValidityBetween != null             ? memberRecord.HasUserValidityBetween: 0;
            const newMemberStatusDelivered = memberRecord.Login == uid                                      ? 1 : 0; 

            const newMemberUserValidityFromDate = memberRecord.UserValidityFromDate != null &&  memberRecord.UserValidityFromDate != ''                        ? getTimestampValueFromDate(memberRecord.UserValidityFromDate): nullVAlue;
            const newMemberUserValidityBetweenDateStart = memberRecord.UserValidityBetweenDateStart != null && memberRecord.UserValidityBetweenDateStart != '' ? getTimestampValueFromDate(memberRecord.UserValidityBetweenDateStart): nullVAlue;
            const newMemberUserValidityBetweenDateEnd = memberRecord.UserValidityBetweenDateEnd != null &&  memberRecord.UserValidityBetweenDateEnd != ''      ? getTimestampValueFromDate(memberRecord.UserValidityBetweenDateEnd): nullVAlue;
            
             // Check if member exists
             const queryCheckGroupMember = `SELECT * FROM AppGroupMembers WHERE GroupId = ? AND Login = ?`;
             const queryCheckGroupMemberValues = [groupId, memberRecord.Login];
             const checkGroupMember = await db.RunWithValues(queryCheckGroupMember, queryCheckGroupMemberValues);

             let groupMemberExists = false;

             if(checkGroupMember.length > 0)
             {
                 groupMemberExists = true;
             }

             if(groupMemberExists == true)
             {
                 // Update each member
                 queryMemberSave = `UPDATE AppGroupMembers SET IsAdmin = ?, MessagePermission = ?, StatusDelivered = ?, hasUserValidity = ?, 
                 hasUserValidityFromDate = ?, userValidityFromDate =  FROM_UNIXTIME(?), hasUserValidityBetween = ?, userValidityBetweenDateStart = FROM_UNIXTIME(?), 
                 userValidityBetweenDateEnd = FROM_UNIXTIME(?) WHERE GroupId = ? AND Login = ?`;
                 queryMemberSaveValues = [
                     memberRecord.IsAdmin,
                     memberRecord.MessagePermission,
                     newMemberStatusDelivered,
                     newMemberHasUserValidity,
                     newMemberHasUserValidityFromDate,
                     newMemberUserValidityFromDate,
                     newMemberHasUserValidityBetween,
                     newMemberUserValidityBetweenDateStart,
                     newMemberUserValidityBetweenDateEnd,
                     groupId,
                     memberRecord.Login
                 ];
            }
            else
            {
                // Insert members

                const newMemberWaitingApproval = 1;
                const newMemberLoginApproved = 0;
                const newMemberRemoved = 0;                
                const memberCreationDate = memberRecord.CreationDate;

                if(groupExists == true) // if groupExist update InsertDate
                {
                    queryMemberSave = `INSERT INTO AppGroupMembers (GroupId, Login, IsAdmin, MessagePermission, WaitingLoginApproval, LoginApproved, Removed, StatusDelivered, CreationDate, InsertDate,
                    hasUserValidity, hasUserValidityFromDate, userValidityFromDate, hasUserValidityBetween, userValidityBetweenDateStart, userValidityBetweenDateEnd )                 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?), ?, ?, FROM_UNIXTIME(?), ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?))`;
                    queryMemberSaveValues = [
                        groupId,
                        memberRecord.Login,
                        memberRecord.IsAdmin,
                        memberRecord.MessagePermission,
                        newMemberWaitingApproval,
                        newMemberLoginApproved,
                        newMemberRemoved,
                        newMemberStatusDelivered,
                        memberCreationDate,
                        memberCreationDate,
                        newMemberHasUserValidity,
                        newMemberHasUserValidityFromDate,
                        newMemberUserValidityFromDate,
                        newMemberHasUserValidityBetween,
                        newMemberUserValidityBetweenDateStart,
                        newMemberUserValidityBetweenDateEnd
                    ];
                }
                else
                {
                    queryMemberSave = `INSERT INTO AppGroupMembers (GroupId, Login, IsAdmin, MessagePermission, WaitingLoginApproval, LoginApproved, Removed, StatusDelivered, CreationDate, 
                    hasUserValidity, hasUserValidityFromDate, userValidityFromDate, hasUserValidityBetween, userValidityBetweenDateStart, userValidityBetweenDateEnd )                 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), ?, ?, FROM_UNIXTIME(?), ?, FROM_UNIXTIME(?), FROM_UNIXTIME(?))`;
                    queryMemberSaveValues = [
                        groupId,
                        memberRecord.Login,
                        memberRecord.IsAdmin,
                        memberRecord.MessagePermission,
                        newMemberWaitingApproval,
                        newMemberLoginApproved,
                        newMemberRemoved,
                        newMemberStatusDelivered,
                        memberCreationDate,
                        newMemberHasUserValidity,
                        newMemberHasUserValidityFromDate,
                        newMemberUserValidityFromDate,
                        newMemberHasUserValidityBetween,
                        newMemberUserValidityBetweenDateStart,
                        newMemberUserValidityBetweenDateEnd
                    ];   
                }
                
            }

            try
            {
                await db.RunUnderTransactionWithValues(dbTransaction, queryMemberSave, queryMemberSaveValues)
            }
            catch(updateDBException)
            {
                // console.log(updateDBException);
                console.log(`GroupMembers Update groupMemberExists:${groupMemberExists} and groupExists: ${groupExists} groupId: ${groupId}`);
                console.log(updateDBException.sql);
                console.log(updateDBException.sqlMessage);
                await db.RollbackTransaction(dbTransaction);
                res.status(500).json({code: 'EOR', message: 'Error on Register'});
                return;
            }
        }
    }

    await db.CommmitTransaction(dbTransaction);
    // console.log(`Group Registration Done`);
    const updateServerDate = new Date();
    serverUpdateDate = updateServerDate.getTime();
    res.status(200).json({"code": "OK", "message": "Registration completed successfully", "groupId": groupId, "privatekey": generatedPrivateKey, "serverUpdateDate": serverUpdateDate});
});

/**
 * POST /services/cleargroupphoto
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/cleargroupphoto', validLoginToken, async (req, res) => {
    const groupId = req.body.groupid;

    const initialPhotoTemplatePath = path.resolve(`${__dirname}/../local_modules/media/initial-group.png`);
    const initialPhotoGroup = path.resolve(`${__dirname}/../local_modules/media/initial-group-${makeid(6)}.png`);
    mediaPhoto.makeCopy(initialPhotoTemplatePath, initialPhotoGroup);
    await mediaPhoto.resize(initialPhotoGroup, 80, 80);
    await mediaPhoto.reduceSize(initialPhotoGroup);
    const initialPhoto = mediaPhoto.getBinaryData(initialPhotoGroup);
    await mediaPhoto.remove(initialPhotoGroup);  

    const queryUpdate = `UPDATE AppGroups SET Photo = BINARY(?) WHERE GroupId = ?`;
    const queryUpdateValues = [initialPhoto, groupId];

    let clearOK = false;
    try
    {
        // console.log(`Group photo clear saving to group id ${groupId}...`);
        await db.RunWithValues(queryUpdate, queryUpdateValues);
        clearOK = true;
    }
    catch(registerDBException)
    {
        console.log(`Group photo clear error ${registerDBException}`);
        clearOK = false;
    }

    res.status(200).json({code: clearOK == true ? 'OK' : 'NOK', message: 'Clear completed'});

});

/**
 * POST /services/groups
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/groups', validLoginToken, async (req, res) => {
    const login = req.clientinfo.uid;
    let groupList = req.body.grouplist;
    if(groupList == null)
    {
        groupList = "";
    }

    const groupListValue = groupList.split(',');

    const queryGroupList = `
    SELECT 
        id, 
        GroupId, 
        Name, 
        Description, 
        CreatorAdminLogin, 
        PrivateKey,
        HasGroupValidity,
        HasGroupValidityFromDate,
        UNIX_TIMESTAMP(ValidityFromDate) AS ValidityFromDate,
        HasGroupValidityBetween,
        UNIX_TIMESTAMP(ValidityBetweenDateStart) AS ValidityBetweenDateStart,
        UNIX_TIMESTAMP(ValidityBetweenDateEnd) AS ValidityBetweenDateEnd,
        HasGroupAccessHours,
        GroupAccessHoursStart,
        GroupAccessHoursEnd,
        DeleteDate,
        UNIX_TIMESTAMP(CreationDate) AS CreationDate
    FROM AppGroups 
    WHERE 
        GroupId IN (?)
    `;

    const queryGroupListValues = [groupListValue];
    const responseGroupList = await db.RunWithValues(queryGroupList, queryGroupListValues);

    
    const queryGroupMembers = `
    SELECT 
        id, 
        GroupId, 
        Login, 
        IsAdmin, 
        MessagePermission, 
        HasUserValidity,
        HasUserValidityFromDate,
        UNIX_TIMESTAMP(UserValidityFromDate) AS UserValidityFromDate,
        HasUserValidityBetween,
        UNIX_TIMESTAMP(UserValidityBetweenDateStart) AS UserValidityBetweenDateStart,
        UNIX_TIMESTAMP(UserValidityBetweenDateEnd) AS UserValidityBetweenDateEnd,
        WaitingLoginApproval, 
        LoginApproved, 
        Removed, 
        StatusDelivered, 
        CreationDate 
    FROM AppGroupMembers 
    WHERE 
        GroupId IN (?)
    `;
    
    const queryGroupMembersValues = [groupListValue];
    const responseGroupMembers = await db.RunWithValues(queryGroupMembers, queryGroupMembersValues);

    const result = {
        "groups": responseGroupList,
        "members": responseGroupMembers
    }

    res.status(200).json(result);
});

/**
 * GET /services/contactprivatekey
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.get('/contactprivatekey/:contact', validLoginToken, async (req, res) => {
    const login = req.clientinfo.uid;
    const contact = req.params.contact;

    const resultUser = await integrationLayer.addContactIfNotAdded(login, contact, true);
    const linkedContactList = resultUser.list;
    const privateKey = resultUser.privateKey;

    const result = {
        "linkedContactList": linkedContactList,
        "privateKey": privateKey
    }

    res.status(200).json(result);

});


/**
 * GET /services/groupprivatekey
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.get('/groupprivatekey/:groupid', validLoginToken, async (req, res) => {
    const login = req.clientinfo.uid;
    const groupid = req.params.groupid;

    const resultValue = await integrationLayer.groupPK(groupid);

    const result = {
        "value": resultValue
    }

    res.status(200).json(result);
});



/**
 * POST /services/userlistinfo
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/userlistinfo', validLoginToken, async (req, res) => {
    const login = req.clientinfo.uid;
    let userList = req.body.users;

    const result = {
        "list": []
    }

    if(userList == null)
    {
        res.status(200).json(result);
        return;
    }

    userList = JSON.parse(userList);

    const queryInValues = `'${userList.join("', '")}'`;
    const query = `SELECT Login, Name AS LoginName FROM Users WHERE Login IN (${queryInValues})`
    const queryResult = await db.Run(query);

    result.list = queryResult;

    res.status(200).json(result);
});


/**
 * DELETE /services/removeuser
 * Remove user from platform
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.delete('/removeuser', validLoginToken, async (req, res) => {

    const login = req.clientinfo.uid;

    // Start DB Transaction
    const dbTransaction = await db.StartTransaction();


    // Remove from Users table
    const queryRemoveLogin = `DELETE FROM Users WHERE Login = ?`;
    const queryRemoveLoginValues = [login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemoveLogin, queryRemoveLoginValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORU', message: 'Error on Remove User'});
        return;
    }


    // Remove from Contacts table
    const queryRemoveContacts = `DELETE FROM Contacts WHERE User = ? OR Contact = ?`;
    const queryRemoveContactsValues = [login, login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemoveContacts, queryRemoveContactsValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORC', message: 'Error on Remove Contacts'});
        return;
    }



    // Remove from MessageCarrier table
    const queryRemoveMessageCarrier = `DELETE FROM MessageCarrier WHERE FromId = ? OR ToId = ?`;
    const queryRemoveMessageCarrierValues = [login, login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemoveMessageCarrier, queryRemoveMessageCarrierValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORM', message: 'Error on Remove Messages'});
        return;
    }



    // Remove from PendingReceiveMessageFromGroup table
    const queryRemovePendingReceiveMessageFromGroup = `DELETE FROM PendingReceiveMessageFromGroup WHERE Login = ?`;
    const queryRemovePendingReceiveMessageFromGroupValues = [login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemovePendingReceiveMessageFromGroup, queryRemovePendingReceiveMessageFromGroupValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORPMG', message: 'Error on Remove Pending Messages From Group'});
        return;
    }



    // Remove from UserDeviceInfo table
    const queryRemoveUserDeviceInfo = `DELETE FROM UserDeviceInfo WHERE Login = ?`;
    const queryRemoveUserDeviceInfoValues = [login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemoveUserDeviceInfo, queryRemoveUserDeviceInfoValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORDI', message: 'Error on Remove Device Info'});
        return;
    }



    // Remove from ImageFileStorage table
    const queryRemoveImageFileStorage = `DELETE FROM ImageFileStorage WHERE Login = ?`;
    const queryRemoveImageFileStorageValues = [login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemoveImageFileStorage, queryRemoveImageFileStorageValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORIFS', message: 'Error on Remove Image File Storage'});
        return;
    }



    // Remove from AudioFileStorage table
    const queryRemoveAudioFileStorage = `DELETE FROM AudioFileStorage WHERE Login = ?`;
    const queryRemoveAudioFileStorageValues = [login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemoveAudioFileStorage, queryRemoveAudioFileStorageValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORAFS', message: 'Error on Remove Audio File Storage'});
        return;
    }


    // Remove from AppGroupMembers table
    const queryRemoveAppGroupMembers = `DELETE FROM AppGroupMembers WHERE GroupId IN (SELECT GroupId FROM AppGroups WHERE CreatorAdminLogin = ?)`;
    const queryRemoveAppGroupMembersValues = [login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemoveAppGroupMembers, queryRemoveAppGroupMembersValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORAGM', message: 'Error on Remove App Group Members'});
        return;
    }


    // Remove from AppGroups table
    const queryRemoveAppGroups = `DELETE FROM AppGroups WHERE CreatorAdminLogin = ?`;
    const queryRemoveAppGroupsValues = [login];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryRemoveAppGroups, queryRemoveAppGroupsValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(registerDBException);
        res.status(500).json({code: 'EORAG', message: 'Error on Remove App Groups'});
        return;
    }


    // Remove user directories
    try
    {
        const IMAGE_UPLOAD_DIRECTORY = path.resolve(`${__dirname}/../local_modules/upload/filestorage/${login}`);
        const AUDIO_UPLOAD_DIRECTORY = path.resolve(`${__dirname}/../local_modules/upload/filestorage/${login}`);
        
        const imageFileStorageDir = path.resolve(IMAGE_UPLOAD_DIRECTORY);
        const audioFileStorageDir = path.resolve(AUDIO_UPLOAD_DIRECTORY);
    
        if (fs.existsSync(imageFileStorageDir) == true)
        {
            // fs.rmdirSync(imageFileStorageDir, { recursive: true });
            fs.rm(imageFileStorageDir, { recursive: true });
        }
    
        if (fs.existsSync(audioFileStorageDir) == true)
        {
            // fs.rmdirSync(audioFileStorageDir, { recursive: true });
            fs.rm(audioFileStorageDir, { recursive: true });
        }    
    }
    catch(fileRemoveException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(fileRemoveException);
        res.status(500).json({code: 'EODR', message: 'Error on Directories Remove'});
        return;
    }

    await db.CommmitTransaction(dbTransaction);

    res.status(200).json({code: 'OK', message: ''});
});

/**
 * POST /services/leavegroup
 * User Leaves Group
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.post('/leavegroup', validLoginToken, async(req, res) => {
    const login = req.clientinfo.uid;
    let groupId = req.body.groupId;

    // Start DB Transaction
    const dbTransaction = await db.StartTransaction();

    // Set user as exited
    const queryLeaveGroup = `UPDATE AppGroupMembers SET GroupExited = 1 WHERE Login = ? AND groupId = ?`;
    const queryLeaveGroupValues = [login, groupId];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryLeaveGroup, queryLeaveGroupValues)
    }
    catch(registerDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(`Error on queryLeaveGroup for Login: ${login} GroupId: ${groupId}`);
        console.log(registerDBException.sql);
        console.log(registerDBException.sqlMessage);
        res.status(500).json({code: 'EOLG', message: 'Error on Leave Group'});
        return;
    }

    // Update other users
    const updateOtherUsers = `UPDATE AppGroupMembers SET ExitedStatusDelivered = 0 WHERE Login != ? AND groupId = ?`;
    const updateOtherUsersValues = [login, groupId];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, updateOtherUsers, updateOtherUsersValues)
    }
    catch(updateDBException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(`Error on updateOtherUsers for Login !=: ${login} GroupId: ${groupId}`);
        console.log(updateDBException.sql);
        console.log(updateDBException.sqlMessage);

        res.status(500).json({code: 'EOUOS', message: 'Error on Update Other Users'});
        return;
    }


    // Commit DB Transaction
    await db.CommmitTransaction(dbTransaction);

    res.status(200).json({success: true})
});


/**
 * DELETE /services/deletegroup
 * Group Saved as Deleted
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.delete('/deletegroup/:groupId', validLoginToken, async(req, res) => {
    const login = req.clientinfo.uid;
    let groupId = req.params.groupId;

    // Start DB Transaction
    const dbTransaction = await db.StartTransaction();

    // Set group as deleted
    const queryDeleteGroup = `UPDATE AppGroups SET DeleteDate = now(), DeleteLogin = ? WHERE groupId = ?`;
    const queryDeleteGroupValues = [login, groupId];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, queryDeleteGroup, queryDeleteGroupValues)
    }
    catch(updtException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(`Error on queryDeleteGroup GroupId: ${groupId} with Login: ${login} `);
        console.log(updtException.sql);
        console.log(updtException.sqlMessage);
        res.status(500).json({code: 'EODG', message: 'Error on Delete Group'});
        return;
    }

    // Update members
    const updateMembers = `UPDATE AppGroupMembers SET GroupDelStatusDelivered = 0 WHERE groupId = ?`;
    const updateMembersValues = [groupId];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, updateMembers, updateMembersValues)
    }
    catch(updtException)
    {
        await db.RollbackTransaction(dbTransaction);
        console.log(`Error on updateMembers for Delete Group GroupId: ${groupId}`);
        console.log(updtException.sql);
        console.log(updtException.sqlMessage);

        res.status(500).json({code: 'EOUMDG', message: 'Error on Update Members Delete Group'});
        return;
    }


    // Commit DB Transaction
    await db.CommmitTransaction(dbTransaction);

    res.status(200).json({success: true, code: 'OK', message: ''});
});

/**
 * GET /services/companylist
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
router.get('/companylist', validLoginToken, async (req, res) => {
    const login = req.clientinfo.uid;

    const result = {
        "list": []
    }

    const query = `
        SELECT 
            CompanyId, 
            Name,
            AdminLogin, 
            0 as Login,
            0 as IsAdmin, 
            0 as Updated,
            0 as Removed,
            0 as IsExternal,
            '' as MemberCompanyName,
            '' as Department,
            '' as Position
        FROM Company 
        WHERE 
            AdminLogin= ? AND 
            ExternalEndpoint =0
        UNION
        SELECT 
            C.CompanyId, 
            C.Name,             
            0 as AdminLogin, 
            Login,
            IsAdmin, 
            Updated,
            Removed,
            IsExternal,
            MemberCompanyName,
            Department,
            Position
        FROM Companymembers CM, Company C
        WHERE 
            C.CompanyId =  CM.CompanyId  AND 
            ExternalEndpoint = 0 AND 
            Login = ?`;

    const queryValues = [login, login];    

    const queryResult = await db.RunWithValues(query, queryValues);
    result.list = queryResult;

    res.status(200).json(result);
});

/**
 * GET /services/externalcompanyconnectionbyaccesscode/:accesscode
*/
router.get('/externalcompanyconnectionbyaccesscode/:accesscode', async (req, res) => {

    const accessCode = req.params.accesscode;

    const result = {
        "CompanyId": null,
        "Name": null,
        "AdminLogin": null,
        "AccessCode": null,
        "Endpoint": null,
        "SocketEndpoint": null
    }

    const query = `
        SELECT 
            CompanyId,
            Name, 
            AdminLogin, 
            AccessCode,
            Endpoint,
            SocketEndpoint
        FROM Company
        WHERE 
            AccessCode = ?
    `;

    const queryValues = [accessCode];

    const queryResult = await db.RunWithValues(query, queryValues);

    if(queryResult != null)
    {
        if(queryResult.length > 0)
        {
            result.CompanyId        = queryResult[0].CompanyId;
            result.Name             = queryResult[0].Name;
            result.AdminLogin       = queryResult[0].AdminLogin;
            result.AccessCode       = queryResult[0].AccessCode;
            result.Endpoint         = queryResult[0].Endpoint;
            result.SocketEndpoint   = queryResult[0].SocketEndpoint;
        }
    }

    res.status(200).json(result);
});

/**
 * POST /services/retrievecompanylogo
*/
router.post('/retrievecompanylogo', async (req, res) => {

    const companyId = req.body.companyId;

    const sqlCompanyLogo = `SELECT LogoURL FROM CompanyLogo WHERE CompanyId = ?`;
    const sqlCompanyLogoValues = [companyId];
    const queryCompanyLogoResult = await db.RunWithValues(sqlCompanyLogo, sqlCompanyLogoValues);
    
    let companyLogo = null;

    if(queryCompanyLogoResult != null)
    {
        if(queryCompanyLogoResult.length > 0)
        {
            companyLogo = queryCompanyLogoResult[0].LogoURL;
        }
    }

    const result = {
        "logo": companyLogo
    }

    res.status(200).json(result);
});



/**
 * GET /services/srvmessagestatus/:messageId/:companyId
 * Authenticated route (login can be read from req.clientinfo.uid)
*/
// router.get('/srvmessagestatus/:messageId/:companyId', validLoginToken, async (req, res) => {
router.post('/srvmessagestatus', validLoginToken, async (req, res) => {
    // const login = req.clientinfo.uid;

    const messageId = req.body.messageId;
    const companyId = req.body.companyId;


    const sqlMessageCarrier = `SELECT id FROM MessageCarrier WHERE MessageId = ?`;
    const sqlMessageCarrierValues = [messageId];
    const queryMessageCarrierResult = await db.RunWithValues(sqlMessageCarrier, sqlMessageCarrierValues);
    let messageInCarrier = false;
    if(queryMessageCarrierResult != null)
    {
        if(queryMessageCarrierResult.length > 0)
        {
            messageInCarrier = true;
        }
    }


    // select * from pendingreceivemessagefromgroup where MessageId='ETkoEyscm24P'
    const sqlHasGroupPendingMembersToReceive = `SELECT COUNT(*) as TotalGroupMembersPendingToReceive FROM PendingReceiveMessageFromGroup WHERE MessageId = ?`;
    const sqlHasGroupPendingMembersToReceiveValues = [messageId];
    const queryGroupPendingMembersToReceiveResult = await db.RunWithValues(sqlHasGroupPendingMembersToReceive, sqlHasGroupPendingMembersToReceiveValues);
    let totalGroupMembersPendingToReceive = 0;
    if(queryGroupPendingMembersToReceiveResult != null)
    {
        if(queryGroupPendingMembersToReceiveResult.length > 0)
        {
            totalGroupMembersPendingToReceive = queryGroupPendingMembersToReceiveResult[0].TotalGroupMembersPendingToReceive;
        }
    }


    const existsInDatalake = await getDatalakeMessageInfo(companyId, messageId);

    const result = {
        "server_queue": messageInCarrier,
        "group_members_pending_to_receive": totalGroupMembersPendingToReceive,
        "stored_in_datalake": existsInDatalake
    }

    res.status(200).json(result);
});



/**
 * POST /services/generatepasswordresetcode
 * Generate a Password Reset Code
*/
router.post('/generatepasswordresetcode', async (req, res) => {
    const countryCode = getCountryCodeFromRequest(req);

    let login = req.body.login;
    const phoneCode = req.phonecode;
    const mobilePhoneDialCode = phoneCode.dial_code;

    login = String(login).replace(/[^\d]/g, '');
    const mobilePhoneLogin = `${mobilePhoneDialCode}${login}`;

    const passwordResetCode = makeidnum(6).toLocaleUpperCase();

    const queryUpdate = `UPDATE Users SET ResetPasswordCode = ? WHERE Login = ? OR MobilePhone = ?`;
    const queryUpdateValues = [passwordResetCode, login, mobilePhoneLogin];

    try
    {
        await db.RunWithValues(queryUpdate, queryUpdateValues)
    }
    catch(registerDBException)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    const queryPhoneLogin = `SELECT MobilePhone, ResetPasswordCode FROM Users WHERE ResetPasswordCode = ?`;
    const queryPhoneLoginValues = [passwordResetCode];
    const dbResult = await db.RunWithValues(queryPhoneLogin, queryPhoneLoginValues);

    if(dbResult != null)
    {
        if(dbResult.length > 0)
        {
            const record = dbResult[0];
            if(record.MobilePhone.trim().length > 0)
            {
                if(record.ResetPasswordCode != null)
                {
                    if(record.ResetPasswordCode.trim().length > 0)
                    {
                        let smsText = getTranslateServer(countryCode, `reset-password-code-sms-message`, `FalaQui: Your reset password code is: XXXXXX`);
                        smsText = replaceAll(smsText, `XXXXXX`, record.ResetPasswordCode);

                        const SMS_SEND_FLAG = true; // Disable for development purposes, Enable when production mode

                        if(SMS_SEND_FLAG == true)
                        {
                            try
                            {
                                await sms.send(smsText, "", record.MobilePhone);
                            }
                            catch(sendError)
                            {
                                console.log(`Failed to send SMS`);
                                console.log(sendError);
                                res.status(200).json({"status": "NOK", message: 'SMS Send Error'});
                                return;
                            }
                        }
                        else
                        {
                            console.log(`*** Disabled SMS Send ****`);
                            console.log(`   SMS Text: ${smsText}`);
                            console.log(`   SMS Number: ${record.MobilePhone}`);
                        }
                    }
                }
            }
        }
    }

    res.status(200).json({code: 'OK', message: 'Reset Code OK'});
});


/**
 * GET /services/validpasswordresetcode/:login/:code
 * Send Is Valid Password Reset Code
*/
router.get('/validpasswordresetcode/:login/:code', async (req, res) => {
    let login = req.params.login;
    let code = req.params.code;

    const phoneCode = req.phonecode;
    const mobilePhoneDialCode = phoneCode.dial_code;

    login = String(login).replace(/[^\d]/g, '');
    const mobilePhoneLogin = `${mobilePhoneDialCode}${login}`;

    const queryLogin = `SELECT Login FROM Users WHERE (Login = ? OR MobilePhone = ?) AND ResetPasswordCode = ?`;
    const queryLoginValues = [login, mobilePhoneLogin, code];

    const recordList = await db.RunWithValues(queryLogin, queryLoginValues);

    if(recordList.length == 0)
    {
        res.status(200).json({"valid": false});
        return;
    }

    res.status(200).json({"valid": true});
});

/**
 * POST /services/passwordupdate
 * Change a Password by Reset Code
*/
router.post('/passwordupdate', async (req, res) => {
    const resetCode = req.body.code;
    const newPassword = req.body.password;

    if(resetCode == null)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    if(resetCode.toString().length == 0)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }


    if(newPassword == null)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    if(newPassword.length == 0)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    const passwordHash = await security.hashText(newPassword);

    const queryRegister = `UPDATE Users SET Password = ?, ResetPasswordCode = NULL WHERE ResetPasswordCode = ?`;

    const queryRegisterValues = [passwordHash, resetCode];

    try
    {
        await db.RunWithValues(queryRegister, queryRegisterValues)
    }
    catch(registerDBException)
    {
        res.status(500).json({code: 'EOR', message: 'Error on Register'});
        return;
    }

    res.status(200).json({code: 'OK', message: 'Registration completed successfully'});

});


/**
 * POST /services/versionnews/:version
 * Get news for app version
*/
router.post('/versionnews', validLoginToken, async (req, res) => {
    const version = req.body.version;
    const countryCode = req.body.countryCode;

    const query = `SELECT * FROM VersionNews WHERE Version = ? `;

    const queryValues = [version];    

    const queryResult = await db.RunWithValues(query, queryValues);
    
    const record = queryResult.length > 0 ? queryResult : null;

    let content = [];

    if(record !=null)
    {
        let allContentText = record[0].Content;
        if(allContentText.length > 0)
        {
            allContentText = allContentText.replace(/\r?\n|\r/g, "");
            const allContent = JSON.parse(allContentText);
            
            if(allContent[countryCode] != null)
            {
                content = allContent[countryCode];
            }
            else
            {
                if(allContent.default != null)
                {
                    content = allContent.default;
                }
            }
        }
    }

    res.status(200).json(content);
});



/**
 * GET /services/companymembers
 * GET Company Members for CompanyId
*/
router.get('/companymembers', async(req, res) => {

    const ids = req.query.ids;
    const queryInValues = `'${ids.join("', '")}'`;

    // const query = 'SELECT * FROM CompanyMembers WHERE CompanyId IN (?)';
    // const queryResult = await db.RunWithValues(query, queryInValues);

    const query = `SELECT * FROM CompanyMembers WHERE CompanyId IN (${queryInValues})`;
    const queryResult = await db.Run(query);
    
    res.status(200).json(queryResult);
});


/**
 * GET /services/hasuseraccesspermission/:phone
 * Send if has user by phone
*/
router.get('/hasuseraccesspermission/:uid', async (req, res) => {
    const uid = req.params.uid;
    const hasPermission = await getHasUserAccessPermission(uid);

    res.status(200).json({"permission": hasPermission});
});

/**
 * POST /services/groupmemberremove
 * Update member removed from group and groups members
*/
router.post('/groupmemberremove', validLoginToken, async(req, res) => {
    const groupId = req.body.groupId;
    const userId = req.body.userId;

    const dbTransaction = await db.StartTransaction();

    const removeQuery = 'UPDATE AppGroupMembers SET Removed = 1  WHERE Login =? AND GroupId = ?';
    const removeValues = [userId, groupId];

    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, removeQuery, removeValues)
    }
    catch(updateRemoveException)
    {
        await db.RollbackTransaction(dbTransaction);
        res.status(500).json({'success': false, code: 'EOUR', message: 'Error on Update Member as Removed'});
        return;
    }    

    const statusQuery = 'UPDATE AppGroupMembers SET DeleteStatusDelivered = 0 WHERE GroupId = ? AND Removed = 0 AND Login NOT IN(SELECT CreatorAdminLogin FROM AppGroups WHERE groupId = ?)';
    const statusValues = [groupId, groupId];
    
    try
    {
        await db.RunUnderTransactionWithValues(dbTransaction, statusQuery, statusValues)
    }
    catch(updateMembersExeption)
    {
        await db.RollbackTransaction(dbTransaction);
        res.status(500).json({'success': false, code: 'EOUM', message: 'Error on Update Members'});
        return;
    }
    

    await db.CommmitTransaction(dbTransaction);

    res.status(200).json({ 'success': true });
})

// *** EXPORTING THE ROUTER ***
module.exports = router;
// *** EXPORTING THE ROUTER ***











async function validLoginToken(req, res, next)
{
    const DEVICE_UUID = req.headers['x-uuid'];
    if(DEVICE_UUID == null)
    {
        // console.log(`Invalid Request Origin when device UUID is empty`);

        res.status(403).json({code: 'IRO', message: 'Invalid Request Origin'});
        return;
    }

    var bearerHeader = req.headers['x-auth'];
    var bearerHeaderLegacy = req.headers['authorization'];

    if(typeof bearerHeader == 'undefined' && typeof bearerHeaderLegacy == 'undefined')
    {
        bearerHeader = `Bearer ${req.query.access_token}`;
    }

    if(typeof bearerHeader == 'undefined')
    {
        bearerHeader = bearerHeaderLegacy;
    }

    if(typeof bearerHeader == null)
    {
        bearerHeader = bearerHeaderLegacy;
    }

    if(typeof bearerHeader == 'undefined')
    {
        // console.log(`Empty bearer token`);
        res.status(403).json({code: 'FBD', message: 'Forbidden', expDate: null});
        return;
    }

    const bearer = bearerHeader.split(' ');
    if(bearer.length <= 1)
    {
        // console.log(`Invalid bearer token size`);
        res.status(403).json({code: 'FBD', message: 'Forbidden', expDate: null});
        return;
    }

    const bearerToken = bearer[1];
    const secret = security.loginSecret();

    const loginTokenValidation = await validateJWTLoginToken(bearerToken);

    if(loginTokenValidation.valid == false || loginTokenValidation.expirationDate == null)
    {
        // console.log(`Invalid login token`);
        // console.log(`Invalid login token ${bearerToken} | Sec K: ${secret} | ${JSON.stringify(loginTokenValidation)}`);
        res.status(403).json({code: 'FBD', message: 'Forbidden', expDate: loginTokenValidation.expirationDate});
        return;
    }

    const tokenContent = loginTokenValidation.tokenContent;

    req.clientinfo.uid = tokenContent.uid;
    req.jwt = loginTokenValidation;

    next();
}

function validDeviceRequest(req, res, next)
{
    const DEVICE_UUID = req.headers['x-uuid'];
    if(DEVICE_UUID == null)
    {
        console.log(`Invalid request origin`);
        res.status(403).json({code: 'IRO', message: 'Invalid Request Origin'});
        return;
    }

    next();
}


function getCountryCodeFromRequest(req)
{
    const forcedCountryCode = req.headers['x-fcc'];

    if(forcedCountryCode != null)
    {
        if(forcedCountryCode.trim().length > 0)
        {
            return forcedCountryCode.toUpperCase().trim();
        }
    }

    var countryCode = "";

    if(countryCode.length == 0)
    {
        if(req.geo != null)
        {
            if(req.geo.country != null)
            {
                if(req.geo.country != `XX`)
                {
                    countryCode = req.geo.country.toUpperCase().trim();
                }
            }
        }    
    }

    // If country code is still empty, try getting from the lang in request
    if(countryCode.length == 0)
    {
        if(countryCode.length == 0)
        {
            if(req.clientinfo != null)
            {
                let clientLang = req.clientinfo.lang;

                if(clientLang != null)
                {
                    if(clientLang.indexOf(`,`) > -1)
                    {
                        clientLang = clientLang.split(`,`)[0];
                    }

                    if(clientLang.indexOf(`-`) > -1)
                    {
                        let reqLangParts = clientLang.split(`-`);
                        if(reqLangParts.length > 1)
                        {
                            if(reqLangParts[1].trim().length > 0)
                            {
                                countryCode = reqLangParts[1].toUpperCase().trim();
                            }
                        }
                    }
                }
            }
        }
    }

    return countryCode.toUpperCase().trim();
}

function mountInfoFromIP(ipAddress)
{
    const emptyResult = {
        "ip": ipAddress,
        "geo": null
    };

    if(ipAddress == null)
    {
        return emptyResult;
    }

    if(ipAddress.trim().length == 0)
    {
        return emptyResult;
    }

    const geodata = geo.getByIP(ipAddress);
    const result = {
        "ip": ipAddress,
        "geo": geodata
    }

    return result;
}

function validateJWTLoginToken(loginToken)
{
    return new Promise((resolve, reject) =>{
        const secret = security.loginSecret();
        // console.log(`Validating over secret ${secret} token ${loginToken}`)
        jwt.verify(loginToken, secret, (err, authData) =>{
            let expirationDate = null;
            let expirationTimestamp = null;

            if(authData != null)
            {
                if(typeof authData.exp != `undefined`)
                {
                    expirationTimestamp = authData.exp;
                    expirationDate = new Date(authData.exp * 1000);
                }        
            }

            if(err)
            {
                // console.log(`Error on token validation ${err}`);
                resolve({
                    "valid": false,
                    "tokenContent": authData,
                    "expirationDate": expirationDate,
                    "expirationTimestamp": expirationTimestamp
                });
            }
            else
            {
                // console.log(`Token validation OK`);
                // var expirationDate = new Date(authData.exp * 1000);
                resolve({
                    "valid": true,
                    "tokenContent": authData,
                    "expirationDate": expirationDate,
                    "expirationTimestamp": expirationTimestamp
                });
            }
        });
    });
}

function makeid(size) 
{
    var text = "";
    var possible = "0123456789ABCDEFGHIJKLMNOPQRSTUVXWYZabcdefghijklmnopqrstuvxwyz";
  
    for (var i = 0; i < size; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

function makeidnum(size) 
{
    var text = "";
    var possible = "0123456789";
  
    for (var i = 0; i < size; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

async function getAppInfo(req)
{
    const countryCode = getCountryCodeFromRequest(req);

    let marketId = `WORLD`;
    if(countryCode.toUpperCase() == `BR`)
    {
        marketId = `BR`;
    }

    const query = `SELECT MinVersionNumber, MinVersionNumberANDROID, MinVersionNumberIOS, GooglePlayURL, AppleStoreURL, Website, HideSensitiveStoreDeploy FROM AppConfig WHERE MarketId = ?`;
    const values = [marketId];
    const recordList = await db.RunWithValues(query, values);
    const record = recordList.length > 0 ? recordList[0] : null;
    return record;
}

async function getHasUserByPhone(phone)
{
    const queryCountUsersByPhone = `SELECT COUNT(*) As Total FROM Users WHERE MobilePhone = ?`;
    
    const queryCountUsersByPhoneValues = [phone];
    const countUsersByPhone = await db.RunWithValues(queryCountUsersByPhone, queryCountUsersByPhoneValues);

    let hasUser = false;
    if(countUsersByPhone != null)
    {
        if(countUsersByPhone.length > 0)
        {
            if(countUsersByPhone[0].Total > 0)
            {
                hasUser = true;
            }
        }
    }

    return hasUser;
}

async function getHasUserByLogin(uid)
{
    const queryCountUsersByLogin = `SELECT COUNT(*) As Total FROM Users WHERE Login = ?`;
    
    const queryCountUsersByLoginValues = [uid];
    const countUsersByLogin = await db.RunWithValues(queryCountUsersByLogin, queryCountUsersByLoginValues);

    let hasUser = false;
    if(countUsersByLogin != null)
    {
        if(countUsersByLogin.length > 0)
        {
            if(countUsersByLogin[0].Total > 0)
            {
                hasUser = true;
            }
        }
    }

    return hasUser;
}

async function getHasUserAccessPermission(uid)
{
    const queryGetAccessPermission = `SELECT 
            CompanyId, 
            Name,            
            AdminLogin, 
            0 as Login,
            0 as IsAdmin, 
            0 as Updated,
            0 as Removed 
        FROM Company 
        WHERE 
            AdminLogin= ? AND 
            ExternalEndpoint = 0
        UNION
        SELECT 
            C.CompanyId, 
            C.Name,             
            0 as AdminLogin, 
            Login,
            IsAdmin, 
            Updated,
            Removed 
        FROM Companymembers CM, Company C
        WHERE 
            C.CompanyId =  CM.CompanyId  AND 
            ExternalEndpoint = 0 AND 
            Removed =0  AND
            Login = ?`;
    
    const queryGetAccessPermissionValues = [uid,uid];
    const resultQueryAcesssPermission = await db.RunWithValues(queryGetAccessPermission, queryGetAccessPermissionValues);

    let hasPermission = false;
    if(resultQueryAcesssPermission != null)
    {
        if(resultQueryAcesssPermission.length > 0)
        {            
            hasPermission = true;            
        }
    }

    return hasPermission;
}

async function getUserPhotoByLogin(login)
{
    const queryLogin = `SELECT Name, REPLACE(REPLACE(TO_BASE64(photo), '\r', ''), '\n', '') AS Base64Photo FROM Users WHERE Login = ?`;
    const queryLoginValues = [login];

    const recordList = await db.RunWithValues(queryLogin, queryLoginValues);
    const record = recordList.length > 0 ? recordList[0] : null;

    let result = {
        "name": null,
        "photo": null
    };

    if(record != null)
    {
        result.name = record.Name;

        if(record.Base64Photo != null)
        {
            result.photo = record.Base64Photo;
        }
    }

    return result;
}

async function getGroupPhotoByGroupId(groupId)
{
    const queryGroup = `SELECT Name, REPLACE(REPLACE(TO_BASE64(Photo), '\r', ''), '\n', '') AS Base64Photo FROM AppGroups WHERE GroupId = ?`;
    const queryGroupValues = [groupId];

    const recordList = await db.RunWithValues(queryGroup, queryGroupValues);
    const record = recordList.length > 0 ? recordList[0] : null;

    let result = {
        "name": null,
        "photo": null
    };

    if(record != null)
    {
        result.name = record.Name;

        if(record.Base64Photo != null)
        {
            result.photo = record.Base64Photo;
        }
    }

    return result;
}

function validatedServerSignUp(requestBody)
{
    return new Promise((resolve, reject) =>{
        const mobilePhoneDialCode   = requestBody.mobilePhoneDialCode;
        const mobilePhone           = requestBody.mobilePhone;
        const name                  = requestBody.name;
        const password              = requestBody.password;
        const countryCode           = requestBody.countryCode;


        if(mobilePhoneDialCode.trim().length == 0)
        {
            resolve({"valid": false, "body": null, "message": "Required Mobile Phone Dial Code"});
            return;
        }

        if(mobilePhone.trim().length == 0)
        {
            resolve({"valid": false, "body": null, "message": "Required Mobile Phone Number"});
            return;
        }

        if(name.trim().length == 0)
        {
            resolve({"valid": false, "body": null, "message": "Required Full Name"});
            return;
        }


        if(password.trim().length == 0)
        {
            resolve({"valid": false, "body": null, "message": "Required Password"});
            return;
        }

        const mobilePhoneFull = mobilePhone;
        const mobilePhoneOnlyNumbers = String(mobilePhoneFull).replace(/[^\d]/g, '');

        if(password.length < 6)
        {
            resolve({"valid": false, "body": null, "message": "Password too short. Please enter at least 6 characters."});
            return;
        }

        var loginId = requestBody.uid;
        var loginMode = "MOBPHONE";

        const validatedBody = {
            "mobilePhoneDialCode"           : mobilePhoneDialCode,
            "mobilePhone"                   : mobilePhone,
            "name"                          : name,
            "password"                      : password,
            "countryCode"                   : countryCode,
            "login"                         : loginId
        };

        resolve({"valid": true, "body": validatedBody, "message": "OK"});
    });
}

function getLoginToken(countryCode, req, uid)
{
    // New Token Generation
    const tokenObjectInfo = {
        "lang"          :   req.clientinfo.lang,
        "country"       :   countryCode,
        "browser"       :   req.clientinfo.browser,
        "os"            :   req.clientinfo.os,
        "platform"      :   req.clientinfo.platform,
        "is_mobile"     :   req.clientinfo.isMobile,
        "uid"           :   uid
    }

    const tokenExpiresInSeconds = 86400 * 365; // 1 year
    const tokenExpiresInMS = tokenExpiresInSeconds * 1000;
    const secret = security.loginSecret();
    const jwtToken = jwt.sign(tokenObjectInfo, secret, {expiresIn: tokenExpiresInMS});

    return jwtToken;
}

function getTranslateServer(countryCode, key, fallbackText)
{
    var defaultCountryCode = countryCode;
    if(defaultCountryCode == null)
    {
        defaultCountryCode = "GB";
    }

    var filtered = appTexts.filter(function (el) {
        return el.id == key
    });

    var text = fallbackText;
    if(filtered.length > 0)
    {
        text = filtered[0][defaultCountryCode];
        if(text == null)
        {
            text = filtered[0]["default"];
        }

        if(text == null)
        {
            text = fallbackText;
        }
    }

    return text;
}

function replaceAll(str, find, replace) 
{
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(string) 
{
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

async function servicesDBCharTest()
{
    const queryBasicInfoTest = `SELECT 'a á e é i í o ó u ú - c ç a ã' AS TestChar WHERE 1 = ?`;
    const queryBasicInfoTestValues = ["1"];
    const recordList = await db.RunWithValues(queryBasicInfoTest, queryBasicInfoTestValues);
    const record = recordList.length > 0 ? recordList[0] : null;
    return record;
}

async function servicesDBCharTestInlineSetNames()
{
    const queryBasicInfoTest = `SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'; SELECT 'a á e é i í o ó u ú - c ç a ã' AS TestChar WHERE 1 = ?`;
    const queryBasicInfoTestValues = ["1"];
    const recordList = await db.RunWithValues(queryBasicInfoTest, queryBasicInfoTestValues);
    const record = recordList.length > 1 ? recordList[1] : null;
    return record;
}

async function servicesDBCharsetResults()
{
    const query = `SHOW VARIABLES LIKE "character_set_results";`;
    const recordList = await db.Run(query);
    const record = recordList.length > 0 ? recordList[0] : null;
    return record;
}

function waitATime(ms)
{
    return new Promise((resolve, reject) =>{
        setTimeout(function(){
            resolve();
        }, ms);
    })
}

function tryToRemoveFile(path, maxAttempt, msTimeToWaitOnTry)
{
    return new Promise((resolve, reject) =>{
        var attemptCount = 0;

        var itvRemoveTry = setInterval(function(){
            attemptCount++;

            try
            {
                fs.unlinkSync(path);
            }
            catch(removeException)
            {
                console.log(`Unable to remove file (attempt ${attemptCount} of ${maxAttempt}): ${path}`);
            }
    
    
            if (fs.existsSync(backupFilePath) == false)
            {
                clearInterval(itvRemoveTry);
                itvRemoveTry = null;
                resolve(true);
                return
            }

            if(attemptCount >= maxAttempt)
            {
                clearInterval(itvRemoveTry);
                itvRemoveTry = null;
                resolve(false);
                return;
            }
        }, msTimeToWaitOnTry);
    });

}

function deleteOldFilesByExtension(dir, extension, ageMinutes) 
{
    return new Promise((resolve, reject) =>{
        const now = Date.now();
        const ageLimit = ageMinutes * 60 * 1000; // Convert minutes to milliseconds
    
        fs.readdir(dir, (err, files) => {
            if (err) 
            {
                console.error(`Error reading directory: ${err}`);
                resolve();
                return;
            }
    
            files.forEach(file => {
                const filePath = path.join(dir, file);
    
                if (path.extname(file) === extension) 
                {
                    fs.stat(filePath, (err, stats) => {
                        if (err) 
                        {
                            console.error(`Error retrieving stats for file: ${err}`);
                            return;
                        }
    
                        const fileAge = now - stats.mtimeMs;
                        if (fileAge > ageLimit) 
                        {
                            // console.log(`Removing old file: ${filePath}`);

                            fs.unlink(filePath, err => {
                                if (err) 
                                {
                                    console.error(`Error deleting file: ${err}`);
                                    return;
                                }

                                // console.log(`Deleted: ${filePath}`);
                            });
                        }
                    });
                }
            });

            setTimeout(function(){
                resolve();
            }, 50);
        });
    });

}


function getDateFromTimestampValue(timeValue) 
{
    const today = new Date(); // Reference for the current/today date

    if (timeValue === null || timeValue <= 0) 
    {
        return today;
    }

    if (timeValue instanceof Date) 
    {
        return isNaN(timeValue.getTime()) ? today : timeValue;
    }

    if (typeof timeValue !== 'number') 
    {
        timeValue = Number(timeValue);
        if (isNaN(timeValue)) 
        {
            return today; // Handle non-numeric conversion failure
        }
    }

    timeValue = Math.round(timeValue);

    if (timeValue < 0) 
    {
        return today;
    }

    // Adjust timestamp for Unix format without milliseconds
    if (timeValue < 100000000000) // Rough check for Unix format
    { 
        timeValue *= 1000;
    }

    const resultDate = new Date(timeValue);

    if (isNaN(resultDate.getTime()) || resultDate.getFullYear() > 2999) 
    {
        return today;
    }

    return resultDate; // Valid date
}

function getTimestampValueFromDate(dateValue)
{
    // Check: If dateValue is null, return the current Unix timestamp.
    if (dateValue === null) 
    {
        return Math.floor(Date.now() / 1000);
    }

    // Check: If dateValue is a number, handle Unix Timestamp or JavaScript Date time number.
    if (typeof dateValue === 'number') 
    {
        // If it's a Unix timestamp (value less than 99999999999), use it directly
        if (dateValue <= 99999999999) 
        {
            // It's already a valid Unix timestamp, return it directly
            if (dateValue >= -5364662400 && dateValue <= 32503679999) 
            {
                return Math.floor(dateValue);  // Return it as integer
            }
        } 
        else 
        {
            // It's a JavaScript Date time number, convert to Unix timestamp by dividing by 1000
            const unixTimestamp = Math.floor(dateValue / 1000);
            if (unixTimestamp >= -5364662400 && unixTimestamp <= 32503679999) 
            {
                return unixTimestamp;
            }
        }
    }

    // Check: If dateValue is a Date object, convert it to timestamp and apply checks.
    if (dateValue instanceof Date) 
    {
        const timeValue = dateValue.getTime();  // Get milliseconds
        if (isNaN(timeValue)) 
        {
            return Math.floor(Date.now() / 1000);  // Invalid Date, return current timestamp
        }

        // Convert milliseconds to Unix timestamp (seconds)
        const unixTimestamp = Math.floor(timeValue / 1000);

        // Apply range checks for valid Unix timestamp
        if (unixTimestamp >= -5364662400 && unixTimestamp <= 32503679999) 
        {
            return unixTimestamp;
        }
    }

    // Check: If dateValue is a string representing a valid number, convert it to number
    if (typeof dateValue === 'string' && !isNaN(Number(dateValue))) 
    {
        return getTimestampValueFromDate(Number(dateValue));
    }

    // For any other invalid inputs, return current timestamp
    return Math.floor(Date.now() / 1000);
}

async function writeBackupToDB(login, backupFilePath)
{
    // Start DB Transaction
    // const dbTransaction = await db.StartTransaction();

    // Remove existing records of user login
    try
    {
        const queryDelete = `DELETE FROM UserBackup WHERE Login = ?`;
        const querDeleteValues = [login];
        // await db.RunUnderTransactionWithValues(dbTransaction, queryDelete, querDeleteValues)
        await db.RunWithValues(queryDelete, querDeleteValues);
    }
    catch(registerDBException)
    {
        // await db.RollbackTransaction(dbTransaction);
        console.log(`Error on replacement delete backup for user: ${login}`);
        console.log(registerDBException.sql);
        console.log(registerDBException.sqlMessage);
        return;
    }

    // Open file to Insert new backup records
    try 
    {
        // Open the file as a readable stream
        const fileStream = fs.createReadStream(backupFilePath);

        // Create a readline interface
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity // Recognize all instances of CR LF as a single line break
        });

        // Iterate through each line

        const separator = ");";
        
        let instruction = "";
        let instructionUnderMultilineProcessing = false;

        for await (const line of rl) 
        {
            instruction += line;

            if(instructionUnderMultilineProcessing == false)
            {
                if(instruction.trim().startsWith(`INSERT OR REPLACE INTO`) == false)
                {
                    console.log(`Not starts with INSERT OR REPLACE INTO: ${instruction}`);
                    instruction = "";
                    continue;
                }        
            }
            
            // // Replace all newline characters with the markable string
            // instruction = instruction.replace(/\n/g, "¬*¬");

            if(instruction.trim().endsWith(separator) == true)
            {
                instructionUnderMultilineProcessing = false;

                try
                {
                    const queryInsert = `INSERT INTO UserBackup(Login, Instruction) VALUES(?, ?)`;
                    const querInsertValues = [login, instruction];
                    // await db.RunUnderTransactionWithValues(dbTransaction, queryInsert, querInsertValues)
                    await db.RunWithValues(queryInsert, querInsertValues)
                }
                catch(instructionException)
                {
                    // await db.RollbackTransaction(dbTransaction);
                    console.log(`Error on insert backup instruction for user: ${login}`);
                    console.log(instructionException.sql);
                    console.log(instructionException.sqlMessage);
                    return;
                }

                instruction = "";
            }
            else
            {
                instructionUnderMultilineProcessing = true;
            }
        }

        // console.log('Backup file processing complete.');
    } 
    catch (err) 
    {
        console.error('Backup error reading the file:', err.message);
    }

    // await db.CommmitTransaction(dbTransaction);

}

async function getBackupFromDB(login)
{
    try 
    {
        const queryInstructions = `SELECT Instruction FROM UserBackup WHERE Login = ?`;
        const queryInstructionsValues = [login];
        const instructionsList = await db.RunWithValues(queryInstructions, queryInstructionsValues);

        let content = "";

        if (instructionsList.length === 0) 
        {
            return content;  // No instructions found for the given login
        }
    
        
        // Iterate through instructions and write them to the file
        for (let ix = 0; ix < instructionsList.length; ix++) 
        {
            let instruction = instructionsList[ix].Instruction;

            // // Replace occurrences of ¬*¬ with \n
            // instruction = instruction.replace(/¬\*¬/g, "\n");           

            content += instruction + '\n'; // Add newline after each instruction
        }
    
        return content;

    } 
    catch (err) 
    {
        // Handle any unexpected errors
        // return Promise.reject(new Error('Error during DB operation: ' + err.message));
        return "";
    }
}

async function getDatalakeMessageInfo(companyId, messageId)
{
    let result = false;

    const companyConnectionQuery = `SELECT DataLakeHost, DataLakePort, DataLakeUser, DataLakePassword, DataLakeDBName FROM company WHERE CompanyId = ? AND ExternalEndpoint = 0`;
    const companyConnectionValues = [companyId];
    const companyConnectionResponse = await db.RunWithValues(companyConnectionQuery, companyConnectionValues);

    if(companyConnectionResponse == null)
    {
        // console.log(`No Corporate Connection Response of Data Lake Company`);
        return result;
    }

    if(companyConnectionResponse.length == 0)
    {
        // console.log(`Empty Corporate Connection Response of Data Lake Company`);
        return result;
    }

    const companyConnectionRecord = companyConnectionResponse[0];
    
    if(
        companyConnectionRecord.DataLakeHost == null ||
        companyConnectionRecord.DataLakePort == null ||
        companyConnectionRecord.DataLakeUser == null ||
        companyConnectionRecord.DataLakePassword == null ||
        companyConnectionRecord.DataLakeDBName == null
    )
    {
        // console.log(`Missing Connection Parameters of Data Lake Company`);
        return result;
    }


    if(
        companyConnectionRecord.DataLakeHost.toString().trim().length == 0 ||
        companyConnectionRecord.DataLakePort.toString().trim().length == 0 ||
        companyConnectionRecord.DataLakeUser.toString().trim().length == 0 ||
        companyConnectionRecord.DataLakePassword.toString().trim().length == 0 ||
        companyConnectionRecord.DataLakeDBName.toString().trim().length == 0
    )
    {
        // console.log(`🔴 Empty Required Connection Parameters of Data Lake Company`);
        return result;
    }

    const query = `SELECT MessageId FROM Messages WHERE MessageId = ?`;
    const values = [messageId];
    let dbResult = null;

    try
    {
        dbResult = await db.RunWithValuesCustomConnection(
            companyConnectionRecord.DataLakeHost,
            companyConnectionRecord.DataLakePort,
            companyConnectionRecord.DataLakeUser,
            companyConnectionRecord.DataLakePassword,
            companyConnectionRecord.DataLakeDBName,
            query,
            values
        );
    }
    catch(dataLakeSelectException)
    {
        console.log(`🔴 Error on Data Lake Message Search: ${dataLakeSelectException.toString()}`);
        return result;
    }

    if(dbResult != null)
    {
        if(dbResult.length > 0)
        {
            result = true;
        }
    }

    return result;
}
