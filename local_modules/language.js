var countryLanguage = require('@ladjs/country-language');
var geo             = require('./geo');
var phoneCodes      = require('./config/phonecodes.json');

module.exports = {
    i18nMiddleware: function(req, res, next)
    {
        return i18nMiddleware(req, res, next);
    }
}

async function i18nMiddleware(req, res, next)
{
    var lang = req.headers["accept-language"];
    //var ip = req.connection.remoteAddress || req.headers['x-forwarded-for'];
    // var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    let ips = (
        req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress || ''
    ).split(',');

    var ip = ips[0].trim();
    // ip = "211.50.135.67"; // KO

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

    var geodata = geo.getByIP(ip);   
    req.geo = geodata != null ? geodata : {"range":[],"country":"XX","region":"Not identified","eu":"0","timezone":"","city":"Not identified","ll":[],"metro":0,"area":0};

    req.clientip = ip;

    var langCountry = req.geo.country;

    if(langCountry == `XX`)
    {
        langCountry = "";

        if(req.headers.host.indexOf(`127.0.0.1`) > -1 || req.headers.host.indexOf(`localhost`) > -1)
        {
            // Dev
            langCountry = "BR";
            req.geo.country = langCountry;
        }
    }

    const forcedCountryCode = req.headers['x-fcc'];
    if(forcedCountryCode != null)
    {
        if(forcedCountryCode.trim().length > 0)
        {
            langCountry = forcedCountryCode;
        }
    }

    var clientPhoneCode = {
        "name": "",
        "dial_code": "",
        "emoji": "",
        "code": ""
    };

    if(langCountry.length > 0)
    {
        req.languages = await getByCountry(langCountry);
        let readPhoneCode = phoneCodes.find((item) => { return item.code.trim().toUpperCase() == langCountry.trim().toUpperCase() });
        if(readPhoneCode != null)
        {
            clientPhoneCode = readPhoneCode;
        }
        else
        {
            // Auto-set as BR
            clientPhoneCode = {
                "name": "Brazil",
                "dial_code": "+55",
                "emoji": "🇧🇷",
                "code": "BR"
            };
        }
    }
    else
    {
        // Auto-set as BR
        clientPhoneCode = {
            "name": "Brazil",
            "dial_code": "+55",
            "emoji": "🇧🇷",
            "code": "BR"
        };
    }

    req.phonecode = clientPhoneCode;

    next();
}

function getByCountry(countryCode)
{
    return new Promise((resolve, reject) =>{
        countryLanguage.getCountry(countryCode, function (err, country) {
            if (err) 
            {
                reject(err);
            } 
            else 
            {
                var languagesInCode = country.languages;
                resolve(languagesInCode)
            }
        });    
    });
}