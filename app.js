
/**
 * Module dependencies.
 */

//This is a promotion from [channel name]. Twitch does not sponsor or endorse broadcaster promotions and is not responsible for them.

var express = require('express');
var http = require('http');
var path = require('path');
var passport = require('passport');
var models = require('./models');
var session = require('express-session');

var app = express();

require('./config/passport')(passport); // pass passport for configuration

var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

// all environments
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('models', require('./models'));
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(session({ secret: 'superdupersecret' })); // session secret
app.use(express.bodyParser()); // get information from html forms
app.use(express.cookieParser()); // read cookies (needed for auth)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// required for passport
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(app.router);


// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

// routes ======================================================================
require('./routes/routes.js')(app,passport); // load our routes and pass in our app and fully configured passport


http.createServer(app).listen(port, ipaddress, function () {
    console.log('Express server listening on port ' + port);
});
