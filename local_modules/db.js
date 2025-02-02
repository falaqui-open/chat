const helper = require(`./helper`);

const USE_MYSQL2_LIB = false;
// const mysql = USE_MYSQL2_LIB == false ? require('mysql') : require('mysql2'); // Commented, call require when use

// const CONNECTION_CHARSET = `utf8mb4`;
// const CONNECTION_CHARSET = `utf8mb4_0900_ai_ci`;
// const CONNECTION_CHARSET = `utf8mb4_unicode_ci`;

const mysql = USE_MYSQL2_LIB == false ? require('mysql') : require('mysql2');

console.log(`Initializing DB module...`);

const config = getConfig();
var pool  = mysql.createPool(config);

// pool.on('connection', (connection) => {
//     console.log(`New connection established with ID: ${connection.threadId}`);
// });

// pool.on('acquire', (connection) => {
//     console.log(`Connection ${connection.threadId} acquired`);
// });

// pool.on('release', (connection) => {
//     console.log(`Connection ${connection.threadId} released`);
// });

var customPool = {};

module.exports = {
    
    Run: (textQuery) => {
        return new Promise((resolve, reject) =>{
            run(textQuery, (err, result) =>{
                if(err != null)
                {
                    reject(err);
                }
                else
                {
                    resolve(result);
                }
            });
        });
    },
    RunWithValues: (textQuery, values) => {
        return new Promise((resolve, reject) =>{
            runWithValues(textQuery, values, (err, result) =>{
                if(err != null)
                {
                    reject(err);
                }
                else
                {
                    resolve(result);
                }
            });
        });
    },

    RunWithValuesCustomConnection: (host, port, user, password, database, textQuery, values) => {
        return new Promise((resolve, reject) =>{
            runWithValuesCustomConnection(host, port, user, password, database, textQuery, values, (err, result) =>{
                if(err != null)
                {
                    reject(err);
                }
                else
                {
                    resolve(result);
                }
            });
        });
    },


    StartTransaction: () =>{
        return startTransaction();
    },
    CommmitTransaction: (dbConn) =>{
        return commmitTransaction(dbConn);
    },
    RollbackTransaction: (dbConn) =>{
        return rollbackTransaction(dbConn);
    },
    RunUnderTransaction: (transaction, textQuery) =>{
        return runUnderTransaction(transaction, textQuery);
    },
    RunUnderTransactionWithValues: (transaction, textQuery, values) =>{
        return runUnderTransactionWithValues(transaction, textQuery, values);
    },
    CheckForForceRollback: (rolledBackStatus, dbConn) =>{
        return checkForForceRollback(rolledBackStatus, dbConn);
    }
}

function run(textQuery, callback)
{
    // const mysql = USE_MYSQL2_LIB == false ? require('mysql') : require('mysql2');

    // const config = getConfig();
    // var pool  = mysql.createPool(config);
        
    pool.getConnection(function(err, connection) {
        //if (err) throw err; // not connected!

        if(err != null)
        {
            console.log(`DB Error result: ${err}`);
            callback(`SERVER CONNECTION ERROR`, null);
            return;
        }

        if(isConnectionReady(connection) == false)
        {
            callback('SERVER DOWN', null);
            return;
        }

        // Ensure UTF-8 encoding is set
        const presetQuery = getPresetQuery();
        connection.query(presetQuery, function (err) {
            if (err) {
                connection.release();
                connection.destroy();
                callback('SET NAMES ERROR', null);
                return;
            }

            // Use the connection after setting the character set
            connection.query(textQuery, function (error, results, fields) {
                connection.release();
                connection.destroy();
                callback(error, results);
            });
        });


        // // Use the connection
        // connection.query(textQuery, function (error, results, fields) {
        //     // When done with the connection, release it.
        //     //connection.release();

        //     // When done with the connection, close it (destroy).
        //     connection.destroy();

        //     //Prepara para retornar da mesma maneira que o SQL-Server e manter a compatibilidade de leitura entre bases
        //     callback(error, results);
        // });
    });
}

function runWithValues(textQuery, values, callback)
{
    // const mysql = USE_MYSQL2_LIB == false ? require('mysql') : require('mysql2');

    // const config = getConfig();
    // var pool  = mysql.createPool(config);
        
    pool.getConnection(function(err, connection) {
        //if (err) throw err; // not connected!

        if(err != null)
        {
            console.log(`DB Error result: ${err}`);
            callback('SERVER CONNECTION ERROR', null);
            return;
        }

        if(isConnectionReady(connection) == false)
        {
            callback('SERVER DOWN', null);
            return;
        }
        
        // Debug mode
        // const queryDebugResult = mysql.format(textQuery, values);
        // console.log(queryDebugResult);


        // Ensure UTF-8 encoding is set
        const presetQuery = getPresetQuery();
        connection.query(presetQuery, function (err) {
            if (err) {
                connection.release();
                connection.destroy();
                return;
            }

            // Use the connection after setting the character set
            connection.query(textQuery, values, function (error, results, fields) {
                connection.release();
                connection.destroy();
                callback(error, results);
            });
        });

        // // Use the connection
        // connection.query(textQuery, values, function (error, results, fields) {
        //     // When done with the connection, release it.
        //     //connection.release();

        //     // When done with the connection, close it (destroy).
        //     connection.destroy();

        //     //Prepara para retornar da mesma maneira que o SQL-Server e manter a compatibilidade de leitura entre bases
        //     callback(error, results);
        // });
    });
}

function runWithValuesCustomConnection(host, port, user, password, database, textQuery, values, callback)
{
    const mysql = USE_MYSQL2_LIB == false ? require('mysql') : require('mysql2');

    const multipleStatements    = helper.str2Bool(process.env.DB_MULTIPLE_STATEMENTS);
    const connectTimeout        = parseInt(process.env.DB_CONNECT_TIMEOUT);
    const connectionLimit       = parseInt(process.env.DB_CONNECTION_LIMIT);
    const acquireTimeout        = parseInt(process.env.DB_ACQUIRE_TIMEOUT);
    const waitForConnections    = helper.str2Bool(process.env.DB_WAIT_FOR_CONNECTIONS);
    const queueLimit            = parseInt(process.env.DB_QUEUE_LIMIT);
    const charset               = process.env.CONNECTION_CHARSET;

    const customConfig = {
        "host"                : host,
        "port"                : port,
        "user"                : user,
        "password"            : password,
        "database"            : database,
        "multipleStatements"  : multipleStatements,
        "connectTimeout"      : connectTimeout,
        "connectionLimit"     : connectionLimit,
        "acquireTimeout"      : acquireTimeout,
        "waitForConnections"  : waitForConnections,
        "queueLimit"          : queueLimit,
        "charset"             : charset
    }

    if(USE_MYSQL2_LIB == true)
    {
        delete customConfig.acquireTimeout;
    }

    let existsPoolForHostPortDB = false;

    const customPoolKey = `${host}_${port}_${database}`;
    if(customPool[customPoolKey] == null)
    {
        existsPoolForHostPortDB = false;
    }
    else
    {
        existsPoolForHostPortDB = true;
    }

    if(existsPoolForHostPortDB == false)
    {
        customPool[customPoolKey] = mysql.createPool(customConfig);
    }
    
        
    // customPool[customPoolKey].on('connection', (connection) => {
    //     console.log(`CUSTOM POOL: New connection established with ID: ${connection.threadId}`);
    // });
    
    // customPool[customPoolKey].on('acquire', (connection) => {
    //     console.log(`CUSTOM POOL: Connection ${connection.threadId} acquired`);
    // });
    
    // customPool[customPoolKey].on('release', (connection) => {
    //     console.log(`CUSTOM POOL: Connection ${connection.threadId} released`);
    // });

    customPool[customPoolKey].getConnection(function(err, connection) {
        //if (err) throw err; // not connected!

        if(err != null)
        {
            callback(`CUSTOM SERVER CONNECTION ERROR: ${err}`, null);
            return;
        }

        if(isConnectionReady(connection) == false)
        {
            callback('CUSTOM SERVER DOWN', null);
            return;
        }
        
        // Debug mode
        // const queryDebugResult = mysql.format(textQuery, values);
        // console.log(queryDebugResult);

        // Ensure UTF-8 encoding is set
        const presetQuery = getPresetQuery();
        connection.query(presetQuery, function (err) {
            if (err) {
                connection.release();
                connection.destroy();
                callback('SET NAMES ERROR', null);
                return;
            }

            // Use the connection after setting the character set
            connection.query(textQuery, values, function (error, results, fields) {
                connection.release();
                connection.destroy();
                callback(error, results);
            });
        });

        // Use the connection
        // connection.query(textQuery, values, function (error, results, fields) {
        //     // When done with the connection, release it.
        //     //connection.release();

        //     // When done with the connection, close it (destroy).
        //     connection.destroy();

        //     //Prepara para retornar da mesma maneira que o SQL-Server e manter a compatibilidade de leitura entre bases
        //     callback(error, results);
        // });
    });
}

function startTransaction()
{
    return new Promise((resolve, reject) =>{
        const mysql = USE_MYSQL2_LIB == false ? require('mysql') : require('mysql2');
        const config = getConfig();

        var transConnectionConfig = JSON.parse(JSON.stringify(config));
        var connection = mysql.createConnection(transConnectionConfig);
    
        connection.beginTransaction(function(err) {
            if(err != null)
            {
                reject(err);
                return;    
            }
    
            if(connection.state === 'disconnected')
            {
                reject("Disconnected");
                return;    
            }
    
            resolve(connection);
        });
    
    });

}

function commmitTransaction(dbConn)
{
    return new Promise((resolve, reject) =>{
        dbConn.commit(function(err) {
            if (err) 
            {
                reject(err);

                // Return without destroy, another process should do rollback and then destroy
                return;
            }
            else
            {
                dbConn.destroy(); //After commit destroy connection
                resolve();
            }
        });
    });

}

function rollbackTransaction(dbConn)
{
    return new Promise((resolve, reject) =>{
        dbConn.rollback(function() {
            try
            {
                dbConn.destroy();
            }
            catch(exceptionDestroy)
            {
    
            }
    
            resolve();
        });
    });
}

function runUnderTransaction(transaction, textQuery)
{
    return new Promise((resolve, reject) =>{
        transaction.query(textQuery, function (error, results, fields) {
            if(error) 
            {
                reject(error);
                return;
            }
            else
            {
                //Prepara para retornar da mesma maneira que o SQL-Server e manter a compatibilidade de leitura entre bases
                resolve(results);
                return;
            }
        });
    });

}

function runUnderTransactionWithValues(transaction, textQuery, values)
{
    return new Promise((resolve, reject) =>{

        //Debug mode
        //const mysql = USE_MYSQL2_LIB == false ? require('mysql') : require('mysql2');
        //const queryDebugResult = mysql.format(textQuery, values);
        //console.log(queryDebugResult);

        transaction.query(textQuery, values, function (error, results, fields) {
            if(error) 
            {
                reject(error);
                return;
            }
            else
            {
                //Prepara para retornar da mesma maneira que o SQL-Server e manter a compatibilidade de leitura entre bases
                resolve(results);
                return;
            }
        });
    });
}

async function checkForForceRollback(rolledBackStatus, dbConn)
{
    if(rolledBackStatus == false)
    {
        await rollbackTransaction(dbConn);
    }
}

function isConnectionReady(connection)
{
    let result = true;

    if(connection.state === 'disconnected')
    {
        //server down
        result = false;
    }

    return result;
}

function getConfig()
{   
    const config = {
        host                : process.env.DB_HOST,
        user                : process.env.DB_USER,
        password            : process.env.DB_PASSWORD,
        database            : process.env.DB_NAME,
        multipleStatements  : helper.str2Bool(process.env.DB_MULTIPLE_STATEMENTS),
        connectTimeout      : parseInt(process.env.DB_CONNECT_TIMEOUT),
        connectionLimit     : parseInt(process.env.DB_CONNECTION_LIMIT),
        acquireTimeout      : parseInt(process.env.DB_ACQUIRE_TIMEOUT),
        waitForConnections  : helper.str2Bool(process.env.DB_WAIT_FOR_CONNECTIONS),
        queueLimit          : parseInt(process.env.DB_QUEUE_LIMIT),
        charset             : process.env.CONNECTION_CHARSET
    }
 
    if(USE_MYSQL2_LIB == true)
    {
        delete config.acquireTimeout;
    }

    return config;
}

function getPresetQuery()
{
    // const PRESET_QUERY = `
    // SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci';
    // SET @charset = "utf8mb4";
    // SET @NAMES = "utf8mb4";
    // SET @collate = "${CONNECTION_CHARSET}";
    // SET character_set_client='utf8mb4';
    // SET character_set_connection='utf8mb4';
    // SET character_set_results='utf8mb4';
    // `;

    const PRESET_QUERY = `
    SET NAMES utf8mb4;
    SET CHARACTER SET utf8mb4;
    SET character_set_connection=utf8mb4;
    `;

    return PRESET_QUERY;
}