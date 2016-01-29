import express from 'express';
import find from 'lodash/find';
import path from 'path';

import collections from '../lib/collections';
import helpers from '../helpers';

var router = new express.Router({
    mergeParams: true
});

function getItems(locals) {
    return collections.pages(locals.templates.pages, {
        partials: locals.templates.partials,
        helpers: helpers,
        data: locals.tmplData
    });
}

router.get('/', function (req, res) {
    let locals = res.app.locals;
    res.render(path.resolve(locals.clientDir, 'list'), {
        basePath: 'pages',
        items: getItems(locals)
    });
});

router.get('/:id?', function (req, res) {
    let locals = res.app.locals;
    let page = find(getItems(locals), page => page.id === req.params.id);
    if (page) {
        res.render(path.resolve(locals.clientDir, 'standalone'), page);
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;
