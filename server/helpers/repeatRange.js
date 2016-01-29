import times from 'lodash/times';
import random from 'lodash/random';

module.exports = (min, max, block) => times(random(min, max), i => block.fn(i)).join(' ');
