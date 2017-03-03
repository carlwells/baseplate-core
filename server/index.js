'use strict';

var path = require('path');
var glob = require('glob');
var auth = require('http-auth');
var express = require('express');
var expressHbs = require('express-handlebars');
var del = require('del');
var copydir = require('copy-dir');

var fs = require('fs')

var assign = require('lodash/assign');
var defaults = require('lodash/defaults');
var dropRight = require('lodash/dropRight');
var flatten = require('lodash/flatten');
var includes = require('lodash/includes');
var last = require('lodash/last');
var first = require('lodash/first');

var routes = require('./routes');
var helpers = require('./helpers');
var plugins = require('./lib/plugins');
var templateData = require('./lib/templateData');
var styleguideDefaults = require('./styleguide-defaults.json');
var collections = require('./lib/collections');


var app = express();

var APP_DIR = path.dirname(require.main.filename);

if (
    includes(['production'], process.env.NODE_ENV) &&
    process.env.AUTH_USER &&
    process.env.AUTH_PASSWORD
) {
    app.use(auth.connect(auth.basic({
        realm: 'Preview'
    }, function (username, password, callback) {
        callback(
            username === process.env.AUTH_USER &&
            password === process.env.AUTH_PASSWORD
        );
    })));
}

app.use(require('morgan')('dev'));
app.use(require('compression')());
app.use(require('errorhandler')());

var CONFIG = {
    ext: 'html',
    port: process.env.PORT || 4444,
    staticPaths: ['static', 'examples'],
    dataDir: 'data',
    distDir: 'dist',
    componentsDir: 'components',
    viewsDir: 'views',
    layoutTmpl: 'layout',
    sections: [{
        type: 'list',
        title: 'Pages',
        path: '/pages',
        directory: 'pages',
        partials: false
    }, {
        type: 'collection',
        title: 'Patterns',
        path: '/patterns',
        directory: 'patterns',
        partials: true,
        showUsage: true,
        showSource: false,
        ordering: null
    }]
};

let server = function (options, helperPlugins) {
    const config = defaults(options.config, CONFIG);

    const viewsDir = path.resolve(APP_DIR, config.viewsDir);
    const clientDir = path.resolve(path.resolve(__dirname, '..'), 'client');
    const componentsDir = path.resolve(APP_DIR, config.componentsDir);
    const distDir = path.resolve(APP_DIR, config.distDir);

    const defaultPartialsDirs = [{
        namespace: 'baseplate',
        dir: path.resolve(clientDir, 'partials')
    }, {
        namespace: 'partials',
        dir: path.resolve(viewsDir, 'partials')
    }];

    const partialsDirs = config.sections
        .filter(item => item.partials === true)
        .map(function (item) {
            return {
                namespace: item.directory,
                dir: path.resolve(componentsDir, item.directory)
            };
        });

    plugins.register(
        helpers,
        helperPlugins
    );

    const hbs = expressHbs.create({
        defaultLayout: config.layoutTmpl,
        layoutsDir: viewsDir,
        extname: `.${config.ext}`,
        partialsDir: defaultPartialsDirs.concat(partialsDirs),
        helpers: plugins.getHelpers()
    });

    app.locals.config = config;
    app.locals.clientDir = clientDir;

    app.locals.tmplData = (function () {
        let dataDir = path.resolve(APP_DIR, config.dataDir);
        let dataFiles = glob.sync(`${dataDir}/*.json`);
        return templateData(dataFiles);
    })();

    app.set('port', config.port);
    app.engine(config.ext, hbs.engine);
    app.set('view engine', config.ext);
    app.set('views', componentsDir);

    app.use('/baseplate', express.static(path.resolve(clientDir, 'static'), {
        maxAge: '120s'
    }));

    config.staticPaths.forEach(function (staticPath) {
        app.use('/' + staticPath, express.static(path.resolve(APP_DIR, staticPath), {
            maxAge: includes(['production'], process.env.NODE_ENV) ? '90s' : '0'
        }));
    });

    /**
     * Documentation
     * @type {[type]}
     */
    var docFiles = glob.sync(`${path.resolve(APP_DIR, 'docs')}/*.md`);
    if (docFiles && docFiles.length > 0) {
        app.locals.hasDocs = true;
        app.use('/docs', routes.docs(docFiles));
    }

    return new Promise(function (resolve) {
        /**
         * Index route: Styleguide template
         */
        app.use('/', routes.styleguide(assign(
            {},
            styleguideDefaults,
            options.styleguide
        )));

        var promises = config.sections.map(section => {
            let tmpls = hbs.getTemplates(path.resolve(componentsDir, section.directory));
            return Promise.all([tmpls].concat([hbs.getPartials()])).then(function (results) {

                var resultItems = flatten(dropRight(results));
                var resultPartials = last(results);

                let route;
                if (section.type === 'collection') {
                    route = routes.generateCollection(
                        section,
                        path.resolve(componentsDir, section.directory),
                        resultItems[0],
                        resultPartials,
                        app.locals.tmplData,
                        clientDir
                    );
                } else {
                    route = routes.generateList(
                        section,
                        resultItems[0],
                        resultPartials,
                        app.locals.tmplData,
                        clientDir
                    );
                }

                app.use(section.path, route);
            });
        });

        return Promise.all(promises).then(function () {
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

let buildHtml = function(options, helperPlugins){

  var APP_DIR = './';
  const config = defaults(options.config, CONFIG);
  const viewsDir = path.resolve(APP_DIR, config.viewsDir);
  const clientDir = path.resolve(path.resolve(__dirname, '..'), 'client');
  const componentsDir = path.resolve(APP_DIR, config.componentsDir);
  const distDir = path.resolve(APP_DIR, config.distDir);
  const defaultPartialsDirs = [{
      namespace: 'baseplate',
      dir: path.resolve(clientDir, 'partials')
  }, {
      namespace: 'partials',
      dir: path.resolve(viewsDir, 'partials')
  }];

  const partialsDirs = config.sections
      .filter(item => item.partials === true)
      .map(function (item) {
          return {
              namespace: item.directory,
              dir: path.resolve(componentsDir, item.directory)
          };
      });

  plugins.register(
      helpers,
      helperPlugins
  );

  const hbs = expressHbs.create({
      defaultLayout: config.layoutTmpl,
      layoutsDir: viewsDir,
      extname: `.${config.ext}`,
      partialsDir: defaultPartialsDirs.concat(partialsDirs),
      helpers: plugins.getHelpers()
  });


  let localData = (function () {
      let dataDir = path.resolve(APP_DIR, config.dataDir);
      let dataFiles = glob.sync(`${dataDir}/*.json`);
      return templateData(dataFiles);
  })();
//npm run build-js && npm run build-css && npm run build-html-task
  var pages = config.sections.map(section => {
    if ( section.directory === 'pages') {
      let templates = hbs.getTemplates(path.resolve(componentsDir, section.directory),{precompiled: false});
      templates.then((res)=>{
      });
      let p = Promise.all([templates].concat([hbs.getPartials()]));
      p.then(function(resultsData){
        let pageTemplates = first(resultsData);
        var resultPartials = last(resultsData);
        var data = collections.pages(pageTemplates, {
          partials: resultPartials,
          helpers: plugins.getHelpers(),
          data: localData
        });

        let files = data.map((body)=>{
          var data = {body:body.content, title:body.label};
          return {
            title: body.id,
            label: body.label,
            content: hbs.render(viewsDir + '/' + hbs.defaultLayout + '.html', data)
          }
        });

        var indexData = files.reduce((arr,file)=>{
          arr += '<li><a href="/'+file.title+'.html">'+file.label+'</a></li>';
          return arr;
        },'');

        files.push({
          title: 'index',
          label: 'index',
          content: hbs.render(viewsDir + '/' + hbs.defaultLayout + '.html',
          {body:'<ul>'+indexData+'</ul>'})
        })

        del([distDir+'/*.html']).then(function(paths) {
        	console.log('Deleted:\n', paths.join('\n'));
          files.map((file)=>{
            file.content.then((content)=>{
              var title = file.title+'.html';
              fs.writeFile(distDir+'/'+title, content, (err) => {
                if (err) throw err;
                console.log('Created:' + title + '\n');
              });
            })
          });
          config.staticPaths.map((dir)=>{
            var srcDir = path.resolve(APP_DIR, dir);

            copydir(srcDir, distDir + '/' + dir, function(stat, filepath, filename){

              if (stat === 'directory' && filename === 'stylesheets') {
                return false;
              }
              if (stat === 'directory' && filename === 'javascripts') {
                return false;
              }
              if (stat === 'file' && filename === 'manifest.json') {
                return false;
              }

              return true;
            }, function(err){
              console.warn(err);
            });
          });
        });

      })

    }
  });
}
module.exports = {server:server,build: buildHtml};
