'use strict';

var test = require('ava');
var tempWrite = require('temp-write');
var templateData = require('../lib/templateData.js');

test('templateData', t => {
    var files = [
        tempWrite.sync(JSON.stringify({temp: 'value one'}), 'one.json'),
        tempWrite.sync(JSON.stringify({temp: 'value two'}), 'two.json')
    ];
    t.same(templateData(files), {
        one: {temp: 'value one'},
        two: {temp: 'value two'}
    });
});
