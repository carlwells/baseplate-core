var url = require('url');

/**
 * Common variables
 * Handy for mimicking SilverStripe templates
 */
module.exports = {
    absoluteLink: function (req) {
        return url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: req.originalUrl
        });
    },
    link: function (req) {
        return req.originalUrl;
    }
};
