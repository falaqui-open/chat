const { exec }      = require('child_process');
const { google }    = require('googleapis');
const fbAdmin       = require("firebase-admin");

const CERT_FILENAME = process.env.FIREBASE_ADMIN_SDK_FILE_NAME;
const CERT_FILE = `${__dirname}/../../app_support_files/${CERT_FILENAME}`

const fbAdminServiceAccount = require(CERT_FILE);
fbAdmin.initializeApp({
    credential: fbAdmin.credential.cert(fbAdminServiceAccount)
});

module.exports = {
    send: function(deviceToken, notificationBody, notificationTitle, notificationImage, data, androidNotificationIcon, badgeCount)
	{
        return send(deviceToken, notificationBody, notificationTitle, notificationImage, data, androidNotificationIcon, badgeCount);
    },
    broadcastToTopic: function(topic, notificationBody, notificationTitle, notificationImage, data)
    {
        return broadcastToTopic(topic, notificationBody, notificationTitle, notificationImage, data);
    },
    subscribeToATopic: function(deviceTokenList, topicName)
    {
        return subscribeToATopic(deviceTokenList, topicName);
    },
    unsubscribeFromATopic: function(deviceTokenList, topicName)
    {
        return unsubscribeFromATopic(deviceTokenList, topicName);
    }
}

/**
 * Authorize with service account and get jwt client
 *
 */
async function authorize() 
{
    const serviceAccount = require(CERT_FILE);

    const scopes = [
        "https://www.googleapis.com/auth/firebase.messaging"
    ];

    // Authenticate a JWT client with the service account.
    const jwtClient = new google.auth.JWT(
        serviceAccount.client_email,
        null,
        serviceAccount.private_key,
        scopes
    );

    const tokens = await jwtClient.authorize();
    return tokens;
}

async function send(deviceToken, notificationBody, notificationTitle, notificationImage, data, androidNotificationIcon, badgeCount)
{
    const authTokens = await authorize();
    const accessToken = authTokens.access_token;

    const serviceAccount = require(CERT_FILE);

    const PROJECT_ID = serviceAccount.project_id;
    const CALL_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

    let payloadObject = {
        "message": {
            "notification": {
                "title": notificationTitle,
                "body": notificationBody
            },
            "apns": {
                "payload": {
                    "aps": {
                        "mutable-content": 1,
                        "badge": badgeCount
                    },
                },
                "fcm_options": {}
            },
            "android": {
                "notification": {
                    "notificationCount": badgeCount
                },
                "data": {
                    "badge": badgeCount.toString() // This is a common convention to handle badge count in Android apps
                }
            },
            "webpush":{
                "headers":{}
            },
            "data": data,
            "token": deviceToken
        }
    }

    if(notificationImage != null)
    {
        // General notification image (all platforms)
        payloadObject.message.notification.image = notificationImage;

        // Android notification image
        payloadObject.message.android.notification.image = notificationImage;

        // APNS notification image
        payloadObject.message.apns.fcm_options.image = notificationImage;

        // Webpush notification image
        payloadObject.message.webpush.headers.image = notificationImage;
    }

    if(androidNotificationIcon != null)
    {
        payloadObject.message.android.notification.icon = androidNotificationIcon;
    }

    const payloadString = JSON.stringify(payloadObject).replace(/"/g, '\\"'); // Escape double quotes

    const curlCommand = `curl -s -X POST ${CALL_URL} -H "Authorization: Bearer ${accessToken}" -H 'Content-Type: application/json' -d "${payloadString}"`;
    const curlResponse = await executeCurlCommand(curlCommand);
    const parsedResponse = JSON.parse(curlResponse);

    if (parsedResponse.error) 
    {
        console.log(`Error from node: ${parsedResponse.error.message}`);
        // throw new Error(`Error from node: ${parsedResponse.error.message}`);
        // return null;
    }

    return parsedResponse;
}


async function broadcastToTopic(topic, notificationBody, notificationTitle, notificationImage, data)
{
    const authTokens = await authorize();
    const accessToken = authTokens.access_token;

    const serviceAccount = require(CERT_FILE);

    const PROJECT_ID = serviceAccount.project_id;
    const CALL_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

    let payloadObject = {
        "message": {
            "notification": {
                "title": notificationTitle,
                "body": notificationBody
            },
            "android": {
                "notification": {
                }
            },
            "data": data,
            "topic": topic
        }
    }

    if(notificationImage != null)
    {
        payloadObject.message.android.notification.image = notificationImage;
    }

    const payloadString = JSON.stringify(payloadObject).replace(/"/g, '\\"'); // Escape double quotes

    const curlCommand = `curl -s -X POST ${CALL_URL} -H "Authorization: Bearer ${accessToken}" -H 'Content-Type: application/json' -d "${payloadString}"`;
    const curlResponse = await executeCurlCommand(curlCommand);
    const parsedResponse = JSON.parse(curlResponse);

    if (parsedResponse.error) 
    {
        console.log(`Error from node: ${parsedResponse.error.message}`);
        // throw new Error(`Error from node: ${parsedResponse.error.message}`);
        // return null;
    }

    return parsedResponse;
}


async function subscribeToATopic(deviceTokenList, topicName) 
{
    if(Array.isArray(deviceTokenList) == false)
    {
        deviceTokenList = [deviceTokenList];
    }

    // These registration tokens come from the client FCM SDKs.
    const registrationTokens = deviceTokenList;
  
    // Subscribe the devices corresponding to the registration tokens to the
    // topic.
    const response = await fbAdmin.messaging().subscribeToTopic(registrationTokens, topicName);

    return response;
}

async function unsubscribeFromATopic(deviceTokenList, topicName) 
{
    if(Array.isArray(deviceTokenList) == false)
    {
        deviceTokenList = [deviceTokenList];
    }

    // These registration tokens come from the client FCM SDKs.
    const registrationTokens = deviceTokenList;
  
    // Unsubscribe the devices corresponding to the registration tokens from
    // the topic.
    const response = await fbAdmin.messaging().unsubscribeFromTopic(registrationTokens, topicName);

    return response;
}


function executeCurlCommand(command) 
{
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) 
            {
                reject(error);
                return;
            }
            
            if (stderr) 
            {
                reject(stderr);
                return;
            }

            resolve(stdout);
        });
    });
}