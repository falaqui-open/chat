const crypto = require('crypto');

const bcrypt    = require('bcrypt');
const openpgp   = require('openpgp');

const JSEncrypt = require('node-jsencrypt');

module.exports = {
    clientInfoMiddleware: function(req, res, next)
    {
        return clientInfoMiddleware(req, res, next);
    },
    hashText: function(value)
    {
        return hashText(value);
    },
    hashTextCompare: function(value, hash)
    {
        return hashTextCompare(value, hash);
    },
    loginSecret: function()
    {
        const secret = process.env.TOKEN_SECRET;
        return secret;
    },
    pgpGetKeys: function(uidList)
    {
        return pgpGetKeys(uidList);
    },
    encryptMessageText: function(privateKey, content)
    {
        return encryptMessageText(privateKey, content);
    },
    decryptMessageText: function(privateKey, encryptedContent)
    {
        return decryptMessageText(privateKey, encryptedContent);
    },
    cv2GetKeys: function(uidList)
    {
        return cv2GetKeys(uidList);
    },
    cv2EncryptMessageText: function(privateKey, content)
    {
        return cv2EncryptMessageText(privateKey, content);
    },
    cv2DecryptMessageText: function(privateKey, encryptedContent)
    {
        return cv2DecryptMessageText(privateKey, encryptedContent);
    },
    cv2GetPublicKeyFromPrivateKey: function(privateKey)
    {
        return cv2GetPublicKeyFromPrivateKey(privateKey);
    }
}

function clientInfoMiddleware(req, res, next)
{
    var lang = req.headers["accept-language"];
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if(ip == null)
    {
        ip =  "127.0.0.1";
    }
    
    if(ip.indexOf(',') > -1)
    {
        ip = ip.split(',')[1].trim();
    }

    if(ip.indexOf('::ffff:') > -1)
    {
        ip = ip.replace('::ffff:', '').trim();
    }

    let clientinfo = JSON.parse(JSON.stringify(req.useragent));
    clientinfo.lang = lang;
    clientinfo.ip = ip;

    req.clientinfo = clientinfo;
    next();
}

function hashText(value)
{
    return new Promise((resolve, reject) =>{
        const saltRounds = 10;
        bcrypt.hash(value, saltRounds, function(err, hash) {
            resolve(hash);
        });
    })
}

function hashTextCompare(value, hash)
{
    return new Promise((resolve, reject) =>{
        
        // Load hash from the db, which was preivously stored 
        bcrypt.compare(value, hash, function(err, res) {
            // if res == true, password matched
            // else wrong password

            if(res == true)
            {
                resolve(true);
            }
            else
            {
                resolve(false);
            }
        });
    })
}

async function pgpGetKeys(uidList)
{
    const env = require(`./config/env.json`);

    const ENCRYPT_PASSPHRASE = env.encrypt_passphrase;

    const uidsObjectList = [];

    for(let ix = 0; ix < uidList.length; ix++)
    {
        const uid = uidList[ix];

        uidsObjectList.push({
            "uid": uid
        })
    }

    var options = {
        userIDs: uidsObjectList,
        type: 'ecc',
        curve: 'curve25519',
        passphrase: ENCRYPT_PASSPHRASE, // protects the private key
        format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
    }

    const generatedKeys = await openpgp.generateKey(options);

    const privateKey = generatedKeys.privateKey;
    const publicKey = generatedKeys.publicKey;
    const revocationCertificate = generatedKeys.revocationCertificate;


    const extractedPublicKey = await getPublicKeyFromPrivateKey(privateKey);

    const result = {
        "privateKey": privateKey,
        "publicKey": publicKey,
        "revocationCertificate": revocationCertificate
    }

    // console.log(result);

    return result;
}

async function getPublicKeyFromPrivateKey(privateKeyArmored) 
{
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
    const publicKey = privateKey.toPublic();

    // console.log('Extracted Public Key:', publicKey.armor());
    return publicKey.armor();
}


async function encryptMessageText(privateKey, content)
{
    const env = require(`./config/env.json`);

    const ENCRYPT_PASSPHRASE = env.encrypt_passphrase;

    const publicKeyValue = await getPublicKeyFromPrivateKey(privateKey);
    const publicKeyInstance = await openpgp.readKey({ armoredKey: publicKeyValue });

    const privateKeyInstance = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: ENCRYPT_PASSPHRASE
    });

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: content }), // input as Message object
        encryptionKeys: publicKeyInstance,
        signingKeys: privateKeyInstance // optional
    });

    return encrypted;
}

async function decryptMessageText(privateKey, encryptedContent)
{
    const env = require(`./config/env.json`);
    
    const ENCRYPT_PASSPHRASE = env.encrypt_passphrase;

    const BEGIN_ENCRYPTED_MESSAGE = `-----BEGIN PGP MESSAGE-----`;
    const END_ENCRYPTED_MESSAGE = `-----END PGP MESSAGE-----`;

    if(encryptedContent.trim().startsWith(BEGIN_ENCRYPTED_MESSAGE) == false || encryptedContent.trim().endsWith(END_ENCRYPTED_MESSAGE) == false)
    {
        // Not encrypted
        return encryptedContent;
    }

    const message = await openpgp.readMessage({
        armoredMessage: encryptedContent // parse armored message
    });

    const publicKeyValue = await getPublicKeyFromPrivateKey(privateKey);
    const publicKeyInstance = await openpgp.readKey({ armoredKey: publicKeyValue });

    const privateKeyInstance = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase: ENCRYPT_PASSPHRASE
    });

    const decrypted = await openpgp.decrypt({
        message,
        config: {
            allowInsecureDecryptionWithSigningKeys: true, // To avoid error Session key decryption failed.
        },
        verificationKeys: publicKeyInstance, // optional
        decryptionKeys: privateKeyInstance
    });

    const chunks = [];
    for await (const chunk of decrypted.data) 
    {
        chunks.push(chunk);
    }

    const plaintext = chunks.join('');

    return plaintext;
}


// 1. Generate Keys
function cv2GetKeys() {
    const env = require(`./config/env.json`);
    const ENCRYPT_PASSPHRASE = env.encrypt_passphrase;

    // Generate RSA keys
    const { privateKey: encryptedPrivateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: ENCRYPT_PASSPHRASE,
        },
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
    });

    // Create a non-encrypted private key for browser compatibility
    const privateKeyObject = crypto.createPrivateKey({
        key: encryptedPrivateKey,
        format: 'pem',
        passphrase: ENCRYPT_PASSPHRASE,
    });
    const nonEncryptedPrivateKey = privateKeyObject.export({
        type: 'pkcs8',
        format: 'pem',
    });

    return {
        encryptedPrivateKey: encryptedPrivateKey, // For secure environments
        privateKey: nonEncryptedPrivateKey, // For browser
        publicKey: publicKey,
    };
}

// 2. Encrypt Message
function cv2EncryptMessageText(privateKey, content) 
{
    // const publicKey = cv2GetPublicKeyFromPrivateKey(privateKey);
    // const buffer = Buffer.from(content, 'utf8');
    // const encrypted = crypto.publicEncrypt({
    //     key: publicKey,
    //     padding: crypto.constants.RSA_PKCS1_PADDING,
    // }, buffer);
    // return encrypted.toString('base64');

    const publicKey = cv2GetPublicKeyFromPrivateKey(privateKey);
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(publicKey); // Set the public key
    const encrypted = encryptor.encrypt(content); // Encrypt the message
    return encrypted;
}

// 3. Decrypt Message
function cv2DecryptMessageText(privateKey, encryptedContent) 
{
    // const env = require(`./config/env.json`);
    // const ENCRYPT_PASSPHRASE = env.encrypt_passphrase;
    
    // const buffer = Buffer.from(encryptedContent, 'base64');
    // const decrypted = crypto.privateDecrypt(
    //     {
    //         key: privateKey,
    //         padding: crypto.constants.RSA_PKCS1_PADDING,
    //         passphrase: ENCRYPT_PASSPHRASE,
    //     },
    //     buffer
    // );
    // return decrypted.toString('utf8');

    // Decrypt using JSEncrypt (note: no passphrase handling here)
    const decryptor = new JSEncrypt();
    decryptor.setPrivateKey(privateKey);
    const decrypted = decryptor.decrypt(encryptedContent);
    return decrypted;
}

// 4. Get Public Key from Private Key
function cv2GetPublicKeyFromPrivateKey(privateKey) 
{
    // const env = require(`./config/env.json`);
    // const ENCRYPT_PASSPHRASE = env.encrypt_passphrase;
    
    // const privateKeyObject = crypto.createPrivateKey({
    //     key: privateKey,
    //     format: 'pem',
    //     passphrase: ENCRYPT_PASSPHRASE,
    // });

    // const publicKeyObject = crypto.createPublicKey(privateKeyObject);

    // return publicKeyObject.export({ type: 'spki', format: 'pem' });

    const encryptor = new JSEncrypt();
    encryptor.setPrivateKey(privateKey);
    const publicKey = encryptor.getPublicKey();
    return publicKey;
}