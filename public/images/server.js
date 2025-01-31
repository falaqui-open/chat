var express = require('express');
var app =  express();

var session         = require('express-session');
var FileStore       = require('session-file-store')(session);

var useragent       = require('express-useragent');

const https         = require('https');
const fs            = require("fs");
// const bodyParser    = require('body-parser')
var cors            = require('cors');
var compression     = require('compression');

var usingLocalSSL = false;

if(process.argv != null)
{
    if(process.argv.length >= 3)
    {
        if(process.argv[2] == `ssl`)
        {
            usingLocalSSL = true;
        }
    }
}

const language        = require('./local_modules/language');
const security        = require('./local_modules/security');
const cache           = require('./local_modules/cache');
const ports           = require('./local_modules/config/ports.json');

const portRecord = ports.find((item) =>{
    return item.sysid == 'flq';
});

/**
* Prepare to understand Pug Templates - app.set('view engine', 'pug');
*
* After the view engine is set, you don’t have to specify the engine or 
* load the template engine module in your app; Express loads the module 
* internally
*
*Create a Pug template file (ex. named index.pug) in the views directory.
*/
app.set('view engine', 'pug');

/**
* Parse the bodies of all incoming requests
*
*/
// app.use(bodyParser.json({limit: '500mb'}));
// app.use(bodyParser.urlencoded({ extended: false, limit: '500mb' }));
app.use(express.json({limit: '500mb'}));
app.use(express.urlencoded({limit: '500mb', extended: true}));

/**
* Allow Cross-Origin Resource Sharing (CORS) to app 
*
*/
app.use(cors());

/**
* Compress responses
*/
app.use(compression());

/**
* Set User Agent Information for req
*/
app.use(useragent.express());

/**
 * Security layer under application
*/
app.enable('trust proxy'); //Express know that app are behing the Nginx or another reverse proxy

/**
 * It parses incoming JSON requests and puts the parsed data in req.body
*/
app.use(express.json());

/**
 * Session storage
 */
var sessionSecret = "U2h71gS7w7YB4UoP";
var sess = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false //,
        //maxAge: (1000*60*60*24*7) // 7 days: Time is in miliseconds
    },
    store: new FileStore({
         path: './session-store',
         logFn: function(){} //supress warning messages from session filestore
    })
}

app.use(session(sess));

/*
Set Language/Country by IP address
*/
app.use(language.i18nMiddleware);

/*
Set Request Client Information
*/
app.use(security.clientInfoMiddleware);

let publicSafe  = __dirname + '/publicsafe'
let publicDev   = __dirname + '/public'
if (fs.existsSync(publicSafe)) 
{
    global.SYS_SAFE = true;
    app.use(express.static(publicSafe));
    console.log('\x1b[36m%s\x1b[0m', `Starting using secure public...`);
}
else
{
    global.SYS_SAFE = false;
    app.use(express.static(publicDev));
    console.log('\x1b[31m%s\x1b[0m', `Starting using non-secure public...`);
}

var rtIndex             = require('./routes/index');
var rtServices          = require('./routes/services');
var rtFileStorage       = require('./routes/filestorage');
var rtAppStoreServices  = require('./routes/appstoreservices');

app.use('/',                    rtIndex);
app.use('/services',            rtServices);
app.use('/fs',                  rtFileStorage);
app.use('/appstoreservices',    rtAppStoreServices);

// Checked against https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers
const port = portRecord.srv_port; 
const wsPort = portRecord.wss_port;

if(usingLocalSSL == false)
{
    app.listen(port, function() {
        console.log(`Listening FLQ on port ${port}`);
        afterStart();
    });
}
else
{
    const key = fs.readFileSync('./ssl-localhost-files/ssl-files/key.pem');
    const cert = fs.readFileSync('./ssl-localhost-files/ssl-files/cert.pem');
    const server = https.createServer({key: key, cert: cert }, app);
    const serverLoad = server.listen(port, function() { 
        console.log(`HTTPS Listening FLQ on port ${port}`);
        afterStart(app);
    });
}


async function afterStart(app)
{
    // Jobs, services, etc.

    // console.log('Process Lang ENV:', process.env.LANG, process.env.LC_ALL);

    let args = "";
    for(let ix = 0; ix < process.argv.length; ix++)
    {
        // Skip node and main js script
        if(ix == 0 || ix == 1)
        {
            continue;
        }

        if(args.length > 0)
        {
            args += " ";
        }

        args += process.argv[ix];
    }
    console.log('Arguments:', args);

    // Websocket Server Start
    var wss = null;
    const appWebsocketService = require(`./websocket/app-ws`);
    // const wsKey = fs.readFileSync('./ssl-localhost-files/ssl-files/key.pem');
    // const wsCert = fs.readFileSync('./ssl-localhost-files/ssl-files/cert.pem');

    const wsKey = fs.readFileSync('./ssl-beeders/beeders.key');
    const wsCert = fs.readFileSync('./ssl-beeders/beeders.pem');

    const wsServer = https.createServer({key: wsKey, cert: wsCert }, app);
    const wsServerLoad = wsServer.listen(wsPort, function() { 
        console.log(`Listening FLQ Websocket on port ${wsPort}`);
        wss = appWebsocketService.init(wsServerLoad, wsCallback);
    });

    const wsCallback = function(tag, payload) {
        // console.log(`WS Callback: ${tag}`);
        // console.log(`WS Callback payload: ${JSON.stringify(payload)}`);

        if(tag == `NEW_MESSAGE`)
        {
            const wsRequest = payload.ws;
            const uid = payload.id;

            let dataObject = getStrAsJson(payload.data);
            if(dataObject == null)
            {
                // Text message
                return;
            }

            //Object message

            const messageContent = getStrAsJson(dataObject.text);

            if(messageContent == null)
            {
                // Raw text message content
                return;
            }
            
            if(messageContent.request == `CONTACT_LIST_STATUS`)
            {
                const contactListToProcess = messageContent.params[0];
                appWebsocketService.sendContactStatus(wsRequest, contactListToProcess);
            }
            else if(messageContent.request == `CHAT_MESSAGE_SEND`)
            {
                const messageBody = messageContent.params[0];

                if(messageBody.fromId == messageBody.toId)
                {
                    console.log(`🔴 BLOCKED IN SERVER: Trying to send message with same from and to`);
                    return;
                }

                if(messageBody.fromId != wsRequest.id)
                {
                    console.log(`🔴 BLOCKED IN SERVER: Sender is not the owner of socket`);
                    return;
                }

                appWebsocketService.postChatMessageToCarrier(wsRequest, messageBody);

                if(typeof messageBody.toIsGroup == `undefined`)
                {
                    messageBody.toIsGroup = 0;
                }

                if(messageBody.toIsGroup == 0)
                {
                    appWebsocketService.linkContacts(wsRequest, messageBody.toId);
                }

                // At the end add this to datalake
                appWebsocketService.dataLakeMesageStore(wsRequest, messageBody);

            }
            else if(messageContent.request == `CHAT_MESSAGE_WAS_RECEIVED_AND_RECORDED`)
            {
                const messageId = messageContent.params[0];
                appWebsocketService.informServerMessageWasReceived(wsRequest, messageId);
            }
            else if(messageContent.request == `CHAT_MESSAGE_GROUP_WAS_RECEIVED_AND_RECORDED`)
            {
                const messageId = messageContent.params[0];
                appWebsocketService.informServerMessageGroupWasReceived(wsRequest, messageId);
            }
            else if(messageContent.request == `SET_USER_COMPANY`)
            {
                const messageBody = messageContent.params[0];
                const company = messageBody.company;
                appWebsocketService.setUserCompany(wsRequest, company);
            }
            else if(messageContent.request == `CONTACT_SERVED_BY_COMPANY_UPDATE`)
            {
                const messageBody = messageContent.params[0];
                const contact = messageBody.contact;
                const company = messageBody.company;
                appWebsocketService.setUserContactServedByCompany(wsRequest, contact, company);
            }
            else if(messageContent.request == `COMPANY_MEMBER_SYNC`)
            {
                const messageBody = messageContent.params[0];
                appWebsocketService.companyMemberSync(wsRequest, messageBody);

            }
            else if(messageContent.request == `GROUP_UPDATED`)
            {
                const messageBody = messageContent.params[0];
                const groupId = messageBody.groupId;
                const action = messageBody.action;
                appWebsocketService.groupUpdated(wsRequest, groupId, action);
            }
            else if(messageContent.request == `SET_UPDATED_GROUP_DELIVERED`)
            {
                const messageBody = messageContent.params[0];
                const groupUpdateList = messageBody.groupUpdateList;
                appWebsocketService.changeToUpdatedGroupDelivered(wsRequest, groupUpdateList);
            }
            else if(messageContent.request == `OWBGXD`)
            {
                const reqBody = messageContent.params[0];
                appWebsocketService.owbgxd(wsRequest, reqBody);
                // env
            }
            else if(messageContent.request == 'GROUP_MEMBER_DELETED')
            {
                const messageBody = messageContent.params[0];
                const action = messageBody.action;
                const groupId = messageBody.groupId;
                const deletedLogin = messageBody.deletedLogin;
                appWebsocketService.groupMemberDeleted(action, groupId, deletedLogin);
            }
            else if(messageContent.request == 'SET_UPDATED_GROUP_MEMBER_DELETE_DELIVERED')
            {
                const messageBody = messageContent.params[0];
                const groupMemberDeleteList = messageBody.groupMemberDeleteList;
                appWebsocketService.changeToUpdatedGroupMemberDeleteDelivered(wsRequest, groupMemberDeleteList);
            }
            else if(messageContent.request == 'GROUP_DELETED_ASMEMBER')
            {
                const messageBody = messageContent.params[0];
                const groupId = messageBody.groupId;
                const loginDeleted = messageBody.deletedLogin;
                appWebsocketService.groupDeletedAsMember(wsRequest, loginDeleted, groupId);
            }
            else if(messageContent.request == 'SET_UPDATED_GROUP_DELETED_ASMEMBER_DELIVERED')
            {
                const messageBody = messageContent.params[0];
                const groupListDeletedAsMember = messageBody.groupListDeletedAsMember;
                appWebsocketService.changeToUpdatedGroupDeletedAsMemberDelivered(wsRequest,groupListDeletedAsMember);
            }

            else if(messageContent.request == 'GROUP_EXITED_MEMBER')
            {
                const messageBody = messageContent.params[0]
                appWebsocketService.deleteExitedMember(wsRequest, messageBody.groupId)
            }

            else if(messageContent.request == 'SET_GROUP_EXITED_MEMBER_DELIVERED')
            {
                const messageBody = messageContent.params[0];
                appWebsocketService.changeToUpdatedGroupExitedMemberDelivered(wsRequest, messageBody.groupIds)
            }

            else if(messageContent.request == 'GROUP_DELETED')
            {
                const messageBody = messageContent.params[0]
                appWebsocketService.groupDeleted(messageBody.groupId)
            }

            else if(messageContent.request == 'SET_GROUP_DELETED_DELIVERED')
            {
                const messageBody = messageContent.params[0];
                appWebsocketService.changeToUpdatedGroupDeletedDelivered(wsRequest, messageBody.groupIds)
            }
            else if (messageContent.request == 'MESSAGES_GET_CONTENT')
            {
                const messageBody = messageContent.params[0];
                const messageIdList = messageBody.list;
                appWebsocketService.sendMessagesContent(wsRequest, messageIdList);
            }

        }
    }


    // On server finish actions
    process.on("exit", async function(){
        await cache.disconnect();

        terminateWebsocket(wss);
    });

    process.on('SIGINT', async function() {
        await cache.disconnect();
        terminateWebsocket(wss);
        
        process.exit();
    });

    // Redis connection initialize
    cache.init();

    setTimeout(async function(){
        // Test area

        // const db = require('./local_modules/db');
        // const fcm = require('./local_modules/push-notification/fcm');
        // console.log(`Preparing notification...`);
        // const loginNotification = `5511998755184`;
        // const fcmQuery = `SELECT FCMToken, Platform, BadgeCount FROM UserDeviceInfo WHERE Login = ?`;
        // const fcmQueryValues = [loginNotification];
        // const fcmDeviceResponse = await db.RunWithValues(fcmQuery, fcmQueryValues);
        // const fcmDeviceRecord = fcmDeviceResponse[0];
        // const fcmToken = fcmDeviceRecord.FCMToken;
        // const devicePlatform = fcmDeviceRecord.Platform;
        // const badgeCount = fcmDeviceRecord.BadgeCount != null ? fcmDeviceRecord.BadgeCount + 1 : 1;
        // const notificationBody = "AVISO Você tem uma nova mensagem";
        // const notificationTitle = "Uma Nova Mensagem";
        // // const notificationImage = `https://flq.beeders.com/images/logo512.png`;
        // // const notificationImage = `https://flq.beeders.com/images/contacts-tiny.png`;
        // const notificationImage = `https://flq.beeders.com/services/userphotoraw/${loginNotification}`;
        // // const notificationImage = null;
        // // const androidNotificationIcon = "@drawable/ic_notification";
        // const androidNotificationIcon = null;

        // // const notificationData = { title: notificationTitle, body: notificationBody, image: notificationImage, source: "userX", content: "Hi there", notificationCount: badgeCount.toString(), badge: badgeCount.toString() };
        // const notificationData = { source: "userX", content: "Hi there", notificationCount: badgeCount.toString(), badge: badgeCount.toString() };
        // console.log(`Sending notification to ${devicePlatform} device...`);
        // const sendResponse = await fcm.send(fcmToken, notificationBody, notificationTitle, notificationImage, notificationData, androidNotificationIcon, badgeCount);

        // console.log(`Notification sent!`);
        // console.log(sendResponse);

        // let queryUpdateBadge = `UPDATE UserDeviceInfo SET BadgeCount = ? WHERE Login = ?`;
        // let queryUpdateBadgeValues = [badgeCount, loginNotification];
        // await db.RunWithValues(queryUpdateBadge, queryUpdateBadgeValues);

        // console.log(`Notification done!`);







        // console.log(`Preparing notification broadcast...`);
        // const fcm = require('./local_modules/push-notification/fcm');
        // const notificationBroadcastTopic = `falaqui-news`;
        // const notificationBroadcastBody = "Novidades na plataforma";
        // const notificationBroadcastTitle = "Agora você pode renegociar suas pendências.";
        // const notificationBroadcastData = { source: "userX", content: "Hi there" };
        // const notificationnBroadcastImage = `https://flq.beeders.com/images/logo512.png`;
        // // const notificationnBroadcastImage = null;

        // console.log(`Sending notification broadcast to ${notificationBroadcastTopic} topic...`);
        // await fcm.broadcastToTopic(notificationBroadcastTopic, notificationBroadcastBody, notificationBroadcastTitle, notificationnBroadcastImage, notificationBroadcastData);

        // console.log(`Notification broadcast sent!`);







        // console.log(`Preparing topic subscription...`);
        // const db = require('./local_modules/db');
        // const fcm = require('./local_modules/push-notification/fcm');
        // const loginNotification = `5511998755184`;
        // const notificationBroadcastTopic = `group-x`;

        // const fcmQuery = `SELECT FCMToken, Platform, BadgeCount FROM UserDeviceInfo WHERE Login = ?`;
        // const fcmQueryValues = [loginNotification];
        // const fcmDeviceResponse = await db.RunWithValues(fcmQuery, fcmQueryValues);
        // const fcmDeviceRecord = fcmDeviceResponse[0];
        // const fcmToken = fcmDeviceRecord.FCMToken;


        // console.log(`Subscribing user to ${notificationBroadcastTopic} topic...`);
        // const subscriptionResponse = await fcm.subscribeToATopic(fcmToken, notificationBroadcastTopic);
        // console.log(`Subscription done: ${JSON.stringify(subscriptionResponse)}`);


        // const notificationBroadcastBody = "Message to Group X";
        // const notificationBroadcastTitle = "Check this message you into group X";
        // const notificationBroadcastData = { source: "userX", content: "Hi there" };
        // const notificationnBroadcastImage = null;

        // console.log(`Broadcasting...`);
        // await fcm.broadcastToTopic(notificationBroadcastTopic, notificationBroadcastBody, notificationBroadcastTitle, notificationnBroadcastImage, notificationBroadcastData);
        // console.log(`Notification broadcast sent!`);


        // console.log(`Unsubscribing user from ${notificationBroadcastTopic} topic...`);
        // const unsubscribeResponse = await fcm.unsubscribeFromATopic(fcmToken, notificationBroadcastTopic);
        // console.log(`Unsubscribe done: ${JSON.stringify(unsubscribeResponse)}`);

        // const notification2BroadcastBody = "Message 2 to Group X";
        // const notification2BroadcastTitle = "Check this message 2 you into group X";
        // const notification2BroadcastData = { source: "userX", content: "Hi there" };
        // const notificationn2BroadcastImage = null;

        // console.log(`Broadcasting (without user)...`);
        // await fcm.broadcastToTopic(notificationBroadcastTopic, notification2BroadcastBody, notification2BroadcastTitle, notificationn2BroadcastImage, notification2BroadcastData);
        // console.log(`Notification broadcast (without user) sent!`);






        // const sms = require(`./local_modules/sms`);
        // console.log(`Sending SMS...`);
        // await sms.send("SMS Test Message", "", "+5511998755184");
        // console.log(`SMS Sent!`);

    }, 1000);
}

function terminateWebsocket(wss)
{
    if(wss != null)
    {
        console.log(`\nTerminating websocket...`);

        for(const client of wss.clients)
        {
            client.close();
        }

        console.log(`Websocket connections closed!`);

        // wss.clients.forEach((socket) => {
        //     socket.close();
        // });

        // setTimeout(() => {
        //     // Second sweep, hard close
        //     // for everyone who's left
        //     wss.clients.forEach((socket) => {
        //         if ([socket.OPEN, socket.CLOSING].includes(socket.readyState)) {
        //             socket.terminate();
        //         }
        //     });
        // }, 10000);
    }
}

function getStrAsJson(str) 
{
    let result = null;
    try 
    {
        result = JSON.parse(str);
    } 
    catch (e) 
    {
        result = null;
    }
    return result;
}
