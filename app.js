var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var router = express.Router();
var apiRoutes = express.Router();
var jwt = require("jsonwebtoken");
var fs = require("fs");
var winston = require('winston');
var chalk = require('chalk');
var apiurl = express.Router();
var multipart = require('connect-multiparty');
var multer = require('multer');
var busboy = require('connect-busboy');

var config = require('./api/config/config');
var looper = require('kumbhanialex');

if (process.env.NODE_ENV == "production") {
    looper.debug(false)
}

//Path
var users = require(__dirname + '/api/users.js');

app.get('/', function(req, res) {
    res.end('Welcome to apimodeules');
    return;
})
app.set('port', process.env.PORT || 3000);

app.use(bodyParser.urlencoded({
    limit: '500mb',
    extended: true,
    parameterLimit: 50000
}));
app.use(function(req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,token');
    //res.setHeader('*');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(expressValidator());
app.use(bodyParser.json());
app.use(busboy());
app.use(express.static(__dirname + '/public'));

// API

router.post('/user/signup', users.signup);
router.post('/user/signin', users.signin);
router.post('/user/forgotpassword', users.ForgotPassword);

// Api with token
apiRoutes.use(function(req, res, next) {

    var token = req.body.token || req.query.token || req.headers['token'];

    if (token) {
        jwt.verify(token, config.secret, function(err, decoded) {
            if (err) {
                return res.json({ "code": 200, "status": "Error", "message": "Failed to authenticate token" });
            } else {
                console.log('decoded', decoded);
                req.user = decoded;
                next();
            }
        });
    } else {
        return res.json({ "code": 200, "status": "Error", "message": "No token provided" });
    }
});

// if use api it will require token auth
app.use('/api', apiRoutes);

router.post('/api/user/edit', users.edit);

router.post('/api/user/resetpassword', users.resetPassword);
router.post('/api/user/logout', users.logout);
router.post('/api/user/deactivate', users.deactivate);

app.use('/', router);
app.listen(app.get('port'));
console.log("apimodules Started on Port No. ", app.get('port'));