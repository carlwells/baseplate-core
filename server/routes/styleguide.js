'use strict';

var path = require('path');
var express = require('express');
var swatches = require('../lib/swatches');
var styleguideDefaults = require('../styleguide-defaults.json');

var router = new express.Router({
    mergeParams: true
});

router.get('/', function (req, res) {
    let locals = req.app.locals;
    let styleguide = Object.assign(
        styleguideDefaults,
        locals.styleguideOptions
    );
    res.render(path.resolve(locals.clientDir, 'styleguide'), {
        intro: styleguide.intro,
        colors: swatches(styleguide.colors),
        fontStacks: styleguide.fontStacks
    });
});

module.exports = router;
