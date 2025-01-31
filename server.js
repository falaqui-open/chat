require('dotenv').config();

console.log(`🟡 Initializing system packages...`);
const express = require('express')
const app = express()
const session           = require('express-session');
const FileStore         = require('session-file-store')(session);
const cors              = require('cors');
const compression       = require('compression');
const useragent         = require('express-useragent');
const fs                = require("fs");

console.log(`🟡 Initializing system environment...`);
const port              = parseInt(process.env.PORT);
const wssPort           = parseInt(process.env.WSSPORT);

console.log(`🟡 Initializing local packages...`);
const language          = require('./local_modules/language');
const security          = require('./local_modules/security');
const cache             = require('./local_modules/cache');

console.log(`🟡 Building routes...`);

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
const sessionSecret = process.env.SESSION_SECRET;
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


/*
Set a server public directory for static files
*/
const publicDir   = __dirname + '/public'
app.use(express.static(publicDir));


console.log(`🟡 Starting server...`);
// ... TODO

console.log(`🟢 Listening Server on port ${port}. Socket on port ${wssPort}`);