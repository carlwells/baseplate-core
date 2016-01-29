import random from 'lodash/random';
import capitalize from 'lodash/capitalize';
import loremIpsum from 'lorem-ipsum';

module.exports = (min, max) => {
    return capitalize(loremIpsum({
        count: random(min, max),
        units: 'words'
    }));
};
