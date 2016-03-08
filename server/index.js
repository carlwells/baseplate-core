'use strict';

var express = require('express');
var expressHbs = require('express-handlebars');
var auth = require('http-auth');
var path = require('path');
var glob = require('glob');
var routes = require('./routes');
var helpers = require('./helpers');
var templateData = require('./lib/templateData');
var values = require('lodash/values');
var includes = require('lodash/includes');
var assign = require('lodash/assign');

var AUTH_USER = process.env.AUTH_USER;
var AUTH_PASSWORD = process.env.AUTH_PASSWORD;

var app = express();

if (includes(['production'], process.env.NODE_ENV)) {
    let basicAuth = auth.basic({
        realm: 'Preview'
    }, function (username, password, callback) {
        callback(username === AUTH_USER && password === AUTH_PASSWORD);
    });

    app.use(auth.connect(basicAuth));
}

app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('errorhandler')());

module.exports = function (styleguideOptions, options) {
    const config = assign({
        ext: 'html',
        port: process.env.PORT || 4444,
        staticPaths: ['static', 'examples'],
        ordering: undefined,
        showUsage: true,
        dataDir: 'data',
        componentsDir: 'components',
        viewsDir: 'views',
        layoutTmpl: 'layout'
    }, options);

    const viewsDir = path.resolve(process.cwd(), config.viewsDir);
    const clientDir = path.resolve(path.resolve(__dirname, '..'), 'client');
    const componentsDir = path.resolve(process.cwd(), config.componentsDir);
    const pagesDir = path.resolve(componentsDir, 'pages');

    const partials = {
        layout: path.resolve(clientDir, 'partials'),
        layoutUser: path.resolve(viewsDir, 'partials'),
        patterns: path.resolve(componentsDir, 'patterns')
    };

    const hbs = expressHbs.create({
        defaultLayout: config.layoutTmpl,
        layoutsDir: viewsDir,
        extname: `.${config.ext}`,
        partialsDir: values(partials),
        helpers: helpers
    });

    app.locals.config = config;
    app.locals.clientDir = clientDir;
    app.locals.styleguideOptions = styleguideOptions;
    app.locals.partials = partials;
    app.locals.tmplData = (function () {
        let dataDir = path.resolve(process.cwd(), config.dataDir);
        let dataFiles = glob.sync(`${dataDir}/*.json`);
        return templateData(dataFiles);
    })();

    app.set('port', config.port);
    app.engine(config.ext, hbs.engine);
    app.set('view engine', config.ext);
    app.set('views', componentsDir);

    app.use('/baseplate', express.static(path.resolve(clientDir, 'static')));

    config.staticPaths.forEach(function (path) {
        app.use('/' + path, express.static(path));
    });

    return new Promise(function (resolve) {
        return Promise.all([
            hbs.getTemplates(pagesDir),
            hbs.getTemplates(partials.patterns),
            hbs.getPartials()
        ]).then(function (results) {
            let pages = results[0];
            let patterns = results[1];
            let partials = results[2];

            app.locals.templates = {
                pages,
                patterns,
                partials
            };

            app.use('/', routes.styleguide);
            app.use('/pages', routes.pages);
            app.use('/patterns', routes.patterns);
        }).then(function () {
            resolve({
                app: app,
                start: function () {
                    return app.listen(app.get('port'), function () {
                        console.info('Server started on port %s', app.get('port'));
                    });
                }
            });
        }).catch(err => console.error(err.stack));
    });
};
