module.exports = {
	sign: function(payload, secretOrPrivateKey, options)
	{
        return sign(payload, secretOrPrivateKey, options);
    },
    verify: function(token, secretOrPublicKey, callback)
    {
        return verify(token, secretOrPublicKey, callback);
    }
}

function sign(payload, secretOrPrivateKey, options)
{
    
    const DEFAULT_EXPIRE_MS = 86400000 * 365; // 1 year
    const FALLBACK_SECRET = `7%UecT23Q-!3`;

    if(payload == null)
    {
        payload = {};
    }

    if(options == null)
    {
        options = {
            expiresIn: DEFAULT_EXPIRE_MS
        }
    }

    if(typeof options.expiresIn == `undefined`)
    {
        options.expiresIn = DEFAULT_EXPIRE_MS;
    }

    if(options.expiresIn == null)
    {
        options.expiresIn = DEFAULT_EXPIRE_MS;
    }

    if(secretOrPrivateKey == null)
    {
        secretOrPrivateKey = FALLBACK_SECRET;
    }

    const nowMilliseconds = new Date().getTime();
    payload.__jwt_expiry_timestamp = nowMilliseconds + options.expiresIn;

    const payloadStr = stringify(payload);
    const token = encode(payloadStr, secretOrPrivateKey);
    return token;
}

// Example of use: jwt.verify(loginToken, secret, (err, authData) =>{
function verify(token, secretOrPublicKey, callback)
{
    let err = null;
    let decodedStr;
    try
    {
        decodedStr = decode(token, secretOrPublicKey);
    }
    catch(tokenDecodeException)
    {
        err = "Invalid token string";
        callback(err, null)
        return;
    }

    let payload = jsonParse(decodedStr);
    payload.exp = parseInt(payload.__jwt_expiry_timestamp/1000); // To keep compatibility with jsonwebtoken

    const nowMilliseconds = new Date().getTime();
    if(payload.__jwt_expiry_timestamp < nowMilliseconds)
    {
        err = "Expired token";
    }

    delete payload.__jwt_expiry_timestamp;
    callback(err, payload);
}

/* IMPLEMENTATION */
function encodeBase64(str) 
{
    return Buffer.from(str).toString('base64').toString("utf-8");
}

function decodeBase64(str) 
{
    return Buffer.from(str, 'base64').toString("utf-8");
}

function stringify(obj) 
{
    return JSON.stringify(obj);
}

function jsonParse(str)
{
    return JSON.parse(str);
}

// The adapted checkSumGen function
function checkSumGen(head, body, key) 
{
    var checkSumStr = head + "." + body;
    var checksum = xorHMAC(key, checkSumStr);  // Use our XOR-HMAC function
    return checksum;
}

function encode(obj, key)
{
    var result = "";
    const alg = {"alg": "HS256", "typ": "JWT"};
    var header = encodeBase64(stringify(alg));
    // console.log(header);

    result += header.trim() + ".";
    var body = encodeBase64(stringify(obj));
    // console.log(body);

    result += body.trim() + ".";

    var checkSum = checkSumGen(header,body, key);
    result += checkSum.trim(); 

    result = stringCompress_lzw64(result);
    return result;
}

function decode(str, key)
{
    str = stringDecompress_lzw64(str);

    var jwtArr = str.split("."); 
    var head = jwtArr[0].trim();
    var body = jwtArr[1].trim();
    var hash = jwtArr[2].trim();
    var checkSum = checkSumGen(head, body, key); 

    if(hash === checkSum) 
    {
        // console.log('JWT was authenticated');

        // console.log("jwt key: " + key);
        // console.log("jwt head: " + head);
        // console.log("jwt body: " + body);

        // console.log("jwt hash: " + hash);
        // console.log("gen hash: " + checkSum);
        return JSON.parse(decodeBase64(body));
    } 
    else 
    {
        console.log('JWT was not authenticated');

        console.log("jwt key: " + key);
        console.log("jwt head: " + head);
        console.log("jwt body: " + body);

        console.log("jwt hash: " + hash);
        console.log("gen hash: " + checkSum);
        return false;
    }
}

function stringCompress_lzw64(s)
{
    if (!s) return s;
    var b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    var d=new Map();
    var s=unescape(encodeURIComponent(s)).split("");
    var word=s[0];
    var num=256;
    var key;
    var o=[];
    function out(word,num) {
        key=word.length>1 ? d.get(word) : word.charCodeAt(0);
        o.push(b64[key&0x3f]);
        o.push(b64[(key>>6)&0x3f]);
        o.push(b64[(key>>12)&0x3f]);
    }
    for (var i=1; i<s.length; i++) {
        var c=s[i];
        if (d.has(word+c)) {
            word+=c;
        } else {
            d.set(word+c,num++);
            out(word,num);
            word=c;
            if(num==(1<<18)-1) {
                d.clear();
                num=256;
            }
        }
    }
    out(word);
    return o.join("");
}

function stringDecompress_lzw64(s)
{
    var b64="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    var b64d={};
    for(var i=0; i<64; i++){
        b64d[b64.charAt(i)]=i;
    }
    var d=new Map();
    var num=256;
    var word=String.fromCharCode(b64d[s[0]]+(b64d[s[1]]<<6)+(b64d[s[2]]<<12));
    var prev=word;
    var o=[word];
    for(var i=3; i<s.length; i+=3) {
        var key=b64d[s[i]]+(b64d[s[i+1]]<<6)+(b64d[s[i+2]]<<12);
        word=key<256 ? String.fromCharCode(key) : d.has(key) ? d.get(key) : word+word.charAt(0);
        o.push(word);
        d.set(num++, prev+word.charAt(0));
        prev=word;
        if(num==(1<<18)-1) {
            d.clear();
            num=256;
        }
    }
    return decodeURIComponent(escape(o.join("")));
}

// Simple SHA-256 function for hashing
function sha256(str) 
{
    function rightRotate(value, amount) 
    {
        return (value >>> amount) | (value << (32 - amount));
    }

    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = 'length';
    var i, j; 
    var result = '';

    var words = [];
    var strBitLength = str[lengthProperty] * 8;

    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k[lengthProperty];

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) 
    {
        if (!isComposite[candidate]) 
        {
            for (i = 0; i < 313; i += candidate) 
            {
                isComposite[i] = candidate;
            }

            hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }

    str += '\x80'; 
    while (str[lengthProperty] % 64 - 56) str += '\x00'; 
    
    for (i = 0; i < str[lengthProperty]; i++) 
    {
        j = str.charCodeAt(i);
        if (j >> 8) return;
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }

    words[words[lengthProperty]] = (strBitLength / maxWord) | 0;
    words[words[lengthProperty]] = strBitLength;

    for (j = 0; j < words[lengthProperty];) 
    {
        var w = words.slice(j, j += 16);
        var oldHash = hash;
        hash = hash.slice(0, 8);

        for (i = 0; i < 64; i++) 
        {
            var w15 = w[i - 15], w2 = w[i - 2];

            var a = hash[0], e = hash[4];
            var temp1 = hash[7]
                + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                + ((e & hash[5]) ^ ((~e) & hash[6]))
                + k[i]
                + (w[i] = (i < 16) ? w[i] : (
                    w[i - 16]
                    + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                    + w[i - 7]
                    + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                ) | 0);

            var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
        }

        for (i = 0; i < 8; i++) 
        {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }

    for (i = 0; i < 8; i++) 
    {
        for (j = 3; j + 1; j--) 
        {
            var b = (hash[i] >> (j * 8)) & 255;
            result += ((b < 16) ? 0 : '') + b.toString(16);
        }
    }
    return result;
}

// XOR-based HMAC-like function
function xorHMAC(key, message) 
{
    var blockSize = 64; // In bytes for SHA-256
    var oKeyPad = [];
    var iKeyPad = [];
    var keyBytes = key.split('').map(c => c.charCodeAt(0));

    // Keys longer than the block size are hashed down
    if (keyBytes.length > blockSize) 
    {
        keyBytes = sha256(key).split('').map(c => c.charCodeAt(0));
    }

    // Zero-pad the keys
    for (var i = 0; i < blockSize; i++) 
    {
        var keyByte = keyBytes[i] || 0;
        oKeyPad[i] = keyByte ^ 0x5c;
        iKeyPad[i] = keyByte ^ 0x36;
    }

    // Inner hash: hash(i_key_pad + message)
    var innerHash = sha256(String.fromCharCode(...iKeyPad) + message);

    // Outer hash: hash(o_key_pad + inner_hash)
    var finalHash = sha256(String.fromCharCode(...oKeyPad) + innerHash);

    return finalHash;
}