var times = require('lodash/times');
var random = require('lodash/random');

module.exports = (min, max, block) => times(random(min, max), i => block.fn(i)).join(' ');
