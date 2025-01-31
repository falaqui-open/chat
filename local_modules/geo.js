var geoip = require('geoip-lite');

module.exports = {
	getByIP: function(ipAddress)
	{
        return getByIP(ipAddress);
    }
}

function getByIP(ipAddress)
{
    var geoData = geoip.lookup(ipAddress);
    return geoData;
}