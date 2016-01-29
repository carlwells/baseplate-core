import test from 'ava';
import 'babel-register';

import tempWrite from 'temp-write';
import templateData from '../lib/templateData.js';

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
