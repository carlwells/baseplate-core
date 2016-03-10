'use strict';

var _ = require('lodash');
var path = require('path');
var express = require('express');

var collections = require('../lib/collections');
var helpers = require('../helpers');

var router = new express.Router({
    mergeParams: true
});

function getPatterns(locals) {
    return collections.patterns(locals.templates.patterns, {
        directory: locals.partials.patterns,
        partials: locals.templates.partials,
        ordering: locals.config.ordering,
        usage: locals.config.showUsage,
        helpers: helpers,
        data: locals.tmplData
    });
}

router.get('/', function (req, res) {
    let locals = res.app.locals;
    res.render(path.resolve(locals.clientDir, 'patterns'), {
        patternGroups: getPatterns(locals)
    });
});

router.get('/:group', function (req, res) {
    let group = {};
    let locals = res.app.locals;
    let patterns = getPatterns(locals);
    group[req.params.group] = _.find(patterns, (pattern, key) => key === req.params.group);
    res.render(path.resolve(locals.clientDir, 'patterns'), {
        patternGroups: group
    });
});

router.get('/:group/:id?', function (req, res) {
    let locals = res.app.locals;
    let patterns = getPatterns(locals);
    let pattern = _.chain(patterns)
        .find((pattern, key) => key.toLowerCase() === req.params.group)
        .find(pattern => pattern.id === req.params.id).value();

    if (pattern) {
        res.render(path.resolve(locals.clientDir, 'standalone'), pattern);
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
