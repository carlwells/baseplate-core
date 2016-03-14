'use strict';

var express = require('express');
var path = require('path');
var find = require('lodash/find');

var collections = require('../lib/collections');
var helpers = require('../helpers');

module.exports = function (sectionConfig, directory, items, partials, data, clientDir) {
    var router = new express.Router({
        mergeParams: true
    });

    function getCollections() {
        return collections.patterns(items, {
            directory: directory,
            partials: partials,
            ordering: sectionConfig.ordering,
            usage: sectionConfig.showUsage,
            helpers: helpers,
            data: data
        });
    }

    router.get('/', function (req, res) {
        res.render(path.resolve(clientDir, 'collection'), {
            basePath: sectionConfig.path,
            groups: getCollections()
        });
    });

    router.get('/:group', function (req, res) {
        let group = {};
        let locals = res.app.locals;
        let collections = getCollections();
        group[req.params.group] = find(collections, (_, key) => key === req.params.group);
        res.render(path.resolve(locals.clientDir, 'collection'), {
            basePath: sectionConfig.path,
            groups: group
        });
    });

    router.get('/:group/:id?', function (req, res) {
        let locals = res.app.locals;
        let collections = getCollections();
        let match = find(collections, (_, key) => key.toLowerCase() === req.params.group);
        let item = find(match, x => x.id === req.params.id);
        if (item) {
            res.render(path.resolve(locals.clientDir, 'standalone'), {item: item});
        } else {
            res.sendStatus(404);
        }
    });

    return router;
};
