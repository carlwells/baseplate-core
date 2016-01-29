import path from 'path';
import keyBy from 'lodash/keyBy';
import mapValues from 'lodash/mapValues';

module.exports = function (files) {
    var keyedFiles = keyBy(files, file => path.basename(file, path.extname(file)));
    return mapValues(keyedFiles, file => require(file));
};
