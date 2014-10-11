'use strict';
/**
 * Module dependencies.
 */

// global.packageInfo = require('./package.json');
global.rootpath = __dirname;

require('./lib/array.extend');

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path');

var publicPath = path.join(__dirname, 'public');

var app = express();
var expressUglify = require('express-uglify');

app.use(expressUglify.middleware({
    src: publicPath
}));

app.set('port', process.argv[2] || 8088);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
// app.use(require('stylus').middleware(publicPath));
app.use(express.static(publicPath));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);

app.get('/users/:postno', user.list);
app.get('/server/version', user.version);
app.get('/template/my-table.html', routes.table);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
