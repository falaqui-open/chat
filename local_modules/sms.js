const axios         = require('axios');
const request       = require('request');
const { exec }      = require('child_process');

const userName = process.env.SMS_CLICKSEND_USERNAME;
const apiKey = process.env.SMS_CLICKSEND_APIKEY;

const authString = `${userName}:${apiKey}`;
const auth = `Basic ${Buffer.from(authString).toString('base64')}`;

const LIB_REQUEST   = 0;
const LIB_AXIOS     = 1;
const LIB_CURL      = 2;

const SEND_SMS_LIB = LIB_REQUEST;
// const SEND_SMS_LIB = LIB_AXIOS;
// const SEND_SMS_LIB = LIB_CURL;

const CLICKSEND_URL = process.env.SMS_CLICKSEND_URL;


module.exports = {
    send: (message, from, to) =>{
        return send(message, from, to);
    }
}

function send(message, from, to)
{
    /*
        EXAMPLE OF RESPONSE
        {
            "http_code": 200,
            "response_code": "SUCCESS",
            "response_msg": "Messages queued for delivery.",
            "data": {
                "total_price": 0,
                "total_count": 1,
                "queued_count": 1,
                "messages": [
                    {
                        "direction": "out",
                        "date": 1699187839,
                        "to": "+61411111111",
                        "body": "test message, please ignore",
                        "from": "+61422222222",
                        "schedule": 1699187839,
                        "message_id": "1EE7BD80-F28F-6D4A-B098-CB63CDB0DC73",
                        "message_parts": 0,
                        "message_price": "0.0000",
                        "from_email": null,
                        "list_id": null,
                        "custom_string": "",
                        "contact_id": null,
                        "user_id": 463662,
                        "subaccount_id": 526569,
                        "is_shared_system_number": false,
                        "country": "AU",
                        "carrier": "Optus",
                        "status": "SUCCESS"
                    }
                ],
                "_currency": {
                    "currency_name_short": "USD",
                    "currency_prefix_d": "$",
                    "currency_prefix_c": "¢",
                    "currency_name_long": "US Dollars"
                },
                "blocked_count": 0
            }
        }
    */
    return new Promise(async (resolve, reject) =>{

        if(SEND_SMS_LIB == LIB_REQUEST)
        {
            // console.log(`Sending using Request...`);

            // Send SMS using lib Request

            const data = {
                messages: [
                    {
                        body: message,
                        to: to, // "+61411111111",
                        from: from // "+61422222222"
                    }
                ]
            };
        
            const options = {
                url: CLICKSEND_URL,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': auth
                },
                body: JSON.stringify(data)
            };
        
            request(options, (error, response, body) => {
                if (error) {
                    reject(error);
                    return;
                }
        
                const responseData = JSON.parse(body);
        
                if (responseData.response_code) 
                {
                    if (responseData.response_code != `SUCCESS`) 
                    {
                        const messageError = responseData.response_msg;
                        reject(messageError);
                        return;
                    }
                }
        
                resolve(responseData);
            });
        }
        else if(SEND_SMS_LIB == LIB_AXIOS)
        {
            // console.log(`Sending using Axios...`);

            // Send SMS using lib Axios
            const data = JSON.stringify({
                "messages": [
                    {
                        "body": message,
                        "to": to, // "+61411111111",
                        "from": from // "+61422222222"
                    }
                ]
            });
    
            const config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: CLICKSEND_URL,
                headers: { 
                  'Content-Type': 'application/json', 
                  'Authorization': auth
                },
                data : data
            };
    
            axios.request(config).then((response) => {
                resolve(response.data);
            }).catch((error) => {
                reject(error);
            });
        }
        else if(SEND_SMS_LIB == LIB_CURL)
        {
            // console.log(`Sending using CURL...`);

            // Send SMS using lib CURL - through executeCurlCommand function
            const dataRequest = { 
                "messages": [
                    {
                        "body": message,
                        "to": to,
                        "from": from
                    }
                ]
            }; 

            const dataString = JSON.stringify(dataRequest).replace(/"/g, '\\"'); // Escape double quotes

            const curlCommand = `curl -s -X POST ${CLICKSEND_URL} -u ${authString} -H "Content-Type: application/json" -d "${dataString}"`;

            const response = await executeCurlCommand(curlCommand);
            const responseData = JSON.parse(response);
    
            if (responseData.response_code) 
            {
                if (responseData.response_code != `SUCCESS`) 
                {
                    const messageError = responseData.response_msg;
                    reject(messageError);
                    return;
                }
            }
            resolve(responseData);
        }

    });
}


// Auxiliar Functions

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