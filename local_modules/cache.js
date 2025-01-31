var redis = require('redis');

var redisClient = redis.createClient();

// const CACHE_SYSTEM_PREFIX = `FLQ_`;
const CACHE_SYSTEM_PREFIX = process.env.CACHE_PREFIX;

module.exports = {
    init: function()
    {
        return init();
    },
    disconnect: function()
    {
        return disconnect();
    },
	set: function(key, value, secondsToExpire)
	{
        return set(key, value, secondsToExpire);
    },
	remove: function(key)
	{
        return remove(key);
    },
	get: function(key)
	{
        return get(key);
    }
}

async function init()
{
    if(isWindows() == true)
    {
        return;
    }

    await connectIfIsDisconnected();

    if(redisClient.isReady == false)
    {
        console.log(`Unable to connect Redis`);
        return;
    }
}

async function disconnect()
{
    if(isWindows() == true)
    {
        return;
    }

    if(redisClient.isReady == true)
    {
        await redisClient.disconnect();
    }

    if(redisClient.isReady == false)
    {
        // console.log(`Redis Disconnected!`)
    }
}

async function set(key, value, secondsToExpire)
{
    if(isWindows() == true)
    {
        return;
    }

    await connectIfIsDisconnected();

    if(redisClient.isReady == false)
    {
        console.log(`Unable to set cache value when Redis is disconnected.`)
    }

    key = `${CACHE_SYSTEM_PREFIX}${key}`;

    await redisClient.set(key, value);
    if(typeof secondsToExpire != `undefined`)
    {
        if(secondsToExpire != null)
        {
            if(isNaN(secondsToExpire) == false)
            {
                redisClient.expire(key, secondsToExpire);
            }
        }
    }
}

async function remove(key)
{
    if(isWindows() == true)
    {
        return;
    }

    await connectIfIsDisconnected();

    if(redisClient.isReady == false)
    {
        console.log(`Unable to set cache value when Redis is disconnected.`)
    }

    key = `${CACHE_SYSTEM_PREFIX}${key}`;
    await redisClient.del(key);
}

async function get(key)
{
    if(isWindows() == true)
    {
        return null;
    }

    key = `${CACHE_SYSTEM_PREFIX}${key}`;

    const storedItem = await redisClient.get(key);
    return storedItem;
}

async function connectIfIsDisconnected()
{
    if(isWindows() == true)
    {
        return;
    }

    if(redisClient.isReady == false)
    {
        // console.log(`Connecting Redis...`)
        await redisClient.connect();

        if(redisClient.isReady == true)
        {
            // console.log(`Redis Connected!`)
        }
    }
}

function isWindows() 
{  
    return process.platform === 'win32' || process.platform === 'win64'
}