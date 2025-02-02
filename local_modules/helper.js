module.exports = {
    getServerSessionConfig: function(session)
    {
        return getServerSessionConfig(session);
    },
    str2Bool: function(value)
    {
        return str2Bool(value);
    }
}

function getServerSessionConfig(session)
{
    const FileStore = require('session-file-store')(session);

    const sessionSecret = process.env.SESSION_SECRET;
    const sessionConfig = {
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
    };

    return sessionConfig;
}

function str2Bool(value)
{
    if(value == null)
    {
        value = "";
    }

    const result = (String(value).toLowerCase() === 'true');
    return result;
}