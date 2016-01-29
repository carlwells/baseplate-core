'use strict';

const _ = require('lodash');
const color = require('color');

module.exports = function (swatches) {
    return _.map(swatches, function (swatch) {
        let swatchColour = color(swatch.color);
        return _.extend(swatch, {
            hex: swatchColour.hexString(),
            rgb: swatchColour.rgbString(),
            hsl: swatchColour.hslString()
        });
    });
};
