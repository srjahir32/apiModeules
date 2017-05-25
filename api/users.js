var validator = require('validator');
var bcrypt = require('bcrypt-nodejs'); //For encryption
var jwt = require("jsonwebtoken");
var fs = require("fs");
var busboy = require('connect-busboy');
var URL = require('../app.js');
var pool = require('./db.js');
var Errors = require('./functions/error.js');
var logger = require('./functions/log.js');
var config = require('./config/config');
var fun = require('./functions/function.js');
// Sign up

exports.signup = function(req, res) {
    logger.info('*** Requested for Creating New User... ***');
    receivedValues = req.body
    if (JSON.stringify(receivedValues) === '{}') {
        Errors.EmptyBody(res);
    } else {
        console.log("*** Validating User Details... ");
        usercolumns = ["firstname", "lastname", "dob", "email", "phone", "password", "createdAt", "status"];
        var dbValues = [];

        var formData = {};
        var checkProfessional = false;
        for (var iter = 0; iter < usercolumns.length; iter++) {
            columnName = usercolumns[iter];
            if (columnName == 'email') {
                email1 = req.body.email;
                if (validator.isEmail(email1)) {
                    console.log('Email is vaild');
                } else {
                    console.log('Email is not valid');
                    res.json({ "code": 200, "status": "Error", "message": "Email is not Valid" });
                    logger.error('URL', URL.url, 'Responce=', 'Email is not valid');
                    return;
                }
            }
            if (columnName == 'status') {
                receivedValues[columnName] = 'active'
            }
            if (columnName == 'createdAt') {
                receivedValues[columnName] = new Date()
            }
            if ((receivedValues[columnName] == undefined || receivedValues[columnName] == "") && (columnName == 'email' || columnName == 'password')) {
                console.log("*** Redirecting: ", columnName, " field is required");
                res.json({ "code": 200, "status": "Error", "message": columnName + " field is undefined" });
                logger.error('*** Redirecting: ', columnName, ' field is required');
                return;
            } else if (receivedValues[columnName] !== undefined && receivedValues[columnName] !== "" && columnName == 'password') {
                var validpassword = req.checkBody('password', 'Password length should be minimum 6 digit').len(6, 100).validationErrors.length
                if (validpassword) {
                    console.log("*** Redirecting: Password length should be minimum 6 digit");
                    res.json({ "code": 200, "status": "Error", "message": "Password length should be minimum 6 digit" });
                    logger.error('URL', URL.url, 'Responce=', 'Password length should be minimum 6 digit');
                    return;
                } else {
                    receivedValues.password = bcrypt.hashSync(receivedValues.password, bcrypt.genSaltSync(8))
                }
            }

            if (receivedValues[columnName] == undefined || receivedValues[columnName] == "") {
                dbValues[iter] = '';
            } else {
                dbValues[iter] = receivedValues[columnName];
            }

            formData[usercolumns[iter]] = dbValues[iter];

        }

        //CREATING CONNECTION
        pool.connect(function(db) {
            if (db) {
                users = db.collection('users');

                users.find({ $or: [{ email: req.body.email }, { phone: req.body.phone }] }).toArray(
                    function(err, rows) {
                        if (!err) {
                            console.log('rows', rows.length);
                            if (rows.length > 0) {
                                res.json({ 'code': 200, 'status': 'success', 'message': 'User alredy created with email or phone' });
                                return;
                            } else {
                                console.log('create user');
                                users.insert(formData, function(err, userRes) {
                                    if (!err) {
                                        res.json({ 'code': 200, 'status': 'success', 'message': 'User created successfully' });
                                        return;
                                    } else {
                                        res.json({ 'code': 200, 'status': 'error', 'message': err });
                                        return;
                                    }
                                });
                            }
                        } else {
                            res.json({ 'code': 200, 'status': 'error', 'message': 'Error for selecting user data' });
                            console.log('error', err);
                            return;
                        }
                    });
            } else {
                Errors.Connection_Error(res);
                console.log('Error');
            }
        });
    }
}

exports.signin = function(req, res) {
    logger.info('*** Requested for Authenticating User... ***');
    receivedValues = req.body //RESPONSE FROM WEB

    if (JSON.stringify(receivedValues) === '{}') {
        Errors.EmptyBody(res);
    } else {
        usercolumns = ["email", "password", "phone"];
        for (var iter = 0; iter < usercolumns.length; iter++) {
            columnName = usercolumns[iter];
            if (columnName == "email" || "phone") {
                if (receivedValues[columnName] == undefined && (columnName == 'password')) {
                    res.json({ "code": 200, "status": "Error", "message": columnName + " field is undefined" });
                    logger.error('*** Redirecting: ', columnName, ' field is required');
                    return;
                } else if (receivedValues[columnName] !== undefined || receivedValues[columnName] !== "") {
                    if (columnName == 'password') {
                        var validpassword = req.checkBody('password', 'Password length should be minimum 6 digit').len(6, 100).validationErrors.length;
                        if (validpassword) {
                            logger.error('url=', URL.url, 'Responce=', 'Password length should be minimum 6 digit', 'Email id=', req.body.email);
                            console.error('Password length should be minimum 6 digit');
                            res.json({
                                "code": 200,
                                "status": "Error",
                                "message": "Password length should be minimum 6 digit"
                            });
                            return;
                        }
                    }
                }
            } else {
                res.json({ "code": 200, "status": "Error", "message": "email or phone field is undefined" });
                logger.error('*** Redirecting: email or phone field is required');
                return;
            }
        }
        //connection
        pool.connect(function(db) {
            if (db) {
                users = db.collection('users');
                users.find({ $and: [{ 'status': 'active' }, { $or: [{ email: req.body.email }, { phone: req.body.phone }] }] }).toArray(function(err, rows) {
                    if (!err) {
                        console.log('rows', rows);
                        if (rows.length == 1) {
                            if (bcrypt.compareSync(req.body.password, rows[0].password)) {
                                var userid = rows[0].id;
                                var tokendata = (receivedValues, userid);
                                var token = jwt.sign(receivedValues, config.secret, {
                                    expiresIn: 1440 * 60 * 30 // expires in 1440 minutes
                                });
                                var alldata = {
                                    "firstname": rows[0].firstname,
                                    "lastname": rows[0].lastname,
                                    "dob": rows[0].dob,
                                    "email": rows[0].email,
                                    "phone": rows[0].phone,
                                    "createdAt": rows[0].createdAt
                                }
                                res.json({
                                    "code": 200,
                                    "status": "Success",
                                    "token": token,
                                    "userData": alldata,
                                    "message": "Authorised User!"
                                });
                                return;
                            } else {
                                if (rows[0].updated) {
                                    fun.diffBetweenDate(rows[0].updated, function(time) {
                                        var message = "Your password was changed before " + time;
                                        res.json({ "code": 200, "status": "Error", "message": message });
                                        logger.error('URL', URL.url, 'Responce=', '*** Redirecting: Your password is incorrect.');
                                        return;
                                    });
                                } else {
                                    res.json({ "code": 200, "status": "Error", "message": "Your password is incorrect." });
                                    logger.error('URL', URL.url, 'Responce=', '*** Redirecting: Your password is incorrect.');
                                    return;
                                }
                            }
                        } else {
                            console.error("*** Redirecting: No User found with provided name");
                            res.json({
                                "code": 200,
                                "status": "Error",
                                "message": "No User found with provided name"
                            });
                            logger.error('url=', URL.url, 'Responce=', 'No User found with provided name');
                            return;
                        }
                    } else {
                        Errors.SelectUserError(res, err);
                    }
                });
            } else {
                console.log('err', err);
                return;
            }
        });
    }
}
exports.edit = function(req, res) {
    logger.info('*** Requested for EDITING/UPDATING User... ***');
    receivedValues = req.body //DATA FROM WEB
    if (JSON.stringify(receivedValues) === '{}') {
        Errors.EmptyBody(res);
    } else {
        var updateString = "";
        console.log("*** Validating User Details... ");
        usercolumns = ["firstname", "lastname", "dob", "email", "phone", "password", "createdAt", "status"];
        var dbValues = [];

        var formData = {};
        var tmpcolumnName = [];
        var is_update = false;
        //FOR VALIDATING VALUES BEFORE SUBMISSION
        for (var iter = 0; iter < usercolumns.length; iter++) {
            columnName = usercolumns[iter];

            if (receivedValues[columnName] != undefined) {
                dbValues[iter] = receivedValues[columnName];
                tmpcolumnName[iter] = usercolumns[iter];
                if (updateString == "") {
                    updateString = columnName + "='" + receivedValues[columnName] + "'";
                } else {
                    updateString = updateString + "," + columnName + "='" + receivedValues[columnName] + "'";
                }

                formData[usercolumns[iter]] = dbValues[iter];
            }
        }

        pool.connect(function(db) {
            if (db) {
                users = db.collection('users');

                users.find({ email: req.user.email }).toArray(
                    function(err, rows) {
                        if (!err) {
                            console.log('rows', rows);
                            if (rows.length > 0) {
                                users.update({ "_id": rows[0]._id }, { $set: formData }, function(err, updated) {
                                    if (!err) {
                                        console.log('User details updated successfully', updated);
                                        res.json({ 'code': 200, 'status': 'success', 'message': 'User details updated successfully' });
                                        return;
                                    } else {
                                        console.log('error', err);
                                        res.json({ 'code': 200, 'status': 'error', 'message': 'Error for user details updated' });
                                        return;
                                    }
                                });
                            } else {
                                console.log('no user found with email');
                                res.json({ 'code': 200, 'status': 'error', 'message': 'no user found with email' });
                                return;
                            }
                        } else {
                            console.log('error', err);
                            res.json({ 'code': 200, 'message': 'Error for getting user' })
                            return;
                        }
                    });
            } else {
                console.log('Connection error', err);
                res.json({ 'code': 500, 'status': 'error', 'message': 'Connection error' });
                return;
            }
        });
    }
}
exports.ForgotPassword = function(req, res) {
    logger.info('*** Requested for ForgotPassword... ***');
    receivedValues = req.body //RESPONSE FROM WEB

    if (JSON.stringify(receivedValues) === '{}') {
        Errors.EmptyBody(res);
    } else {
        pool.connect(function(db) {
            if (db) {
                //DB collection
                users = db.collection('users');
                otp = db.collection('otp');
                var email = req.body.email;
                users.find({ email: email }).toArray(
                    function(err, rows) {
                        if (!err) {
                            if (rows.length > 0) {
                                var otpCode = Math.floor(1000 + Math.random() * 9000);
                                //Send otpCode ad Mail to email from here
                                console.log('Send OTP', otpCode);
                                otp.find({ 'email': email }).toArray(function(err, otpData) {
                                    if (!err) {
                                        console.log('otpData', otpData);
                                        var data = {
                                            "email": email,
                                            "otp": otpCode,
                                            "createdAt": new Date()
                                        }
                                        if (otpData.length > 0) {
                                            //old otp found
                                            console.log('old otp found');
                                            otp.update({ "_id": otpData[0]._id }, { $set: data });
                                        } else {
                                            //no any otp
                                            console.log('no any otp');
                                            otp.insert(data);
                                        }
                                        res.json({ 'code': 200, 'status': 'success', 'message': 'OPT send successfully' });
                                        return;
                                    } else {
                                        res.json({ 'code': 200, 'status': 'Error for find otpData' });
                                        console.log('Error for find otpData');
                                        return;
                                    }
                                })
                            } else {
                                res.json({ 'code': 200, 'status': 'No user found with email id' });
                                return;
                            }
                        } else {
                            res.json({ 'code': 200, 'status': 'Error for get user data' });
                            return;
                        }
                    }
                )
            } else {
                res.json({ 'code': 200, 'status': 'Connection Error' });
                return;
            }
        });
    }
}

exports.resetPassword = function(req, res) {
    //Email will be from token same for password too
    var email = req.user.email;
    logger.info('*** Requested for Reset Password... ***');
    receivedValues = req.body //RESPONSE FROM WEB

    if (JSON.stringify(receivedValues) === '{}') {
        Errors.EmptyBody(res);
    } else {
        usercolumns = ["password", "newpassword"];
        for (var iter = 0; iter < usercolumns.length; iter++) {
            columnName = usercolumns[iter];
            if (receivedValues[columnName] == undefined && (columnName == 'password' || columnName == 'newpassword')) {
                res.json({ "code": 200, "status": "Error", "message": columnName + " field is empty" });
                logger.error('*** Redirecting: ', columnName, ' field is required');
                return;
            } else if (receivedValues[columnName] !== undefined || receivedValues[columnName] !== "") {
                if (columnName == 'password') {
                    var validpassword = req.checkBody('password', 'Password length should be minimum 6 digit').len(6, 100).validationErrors.length;
                    if (validpassword) {
                        logger.error('url=', URL.url, 'Responce=', 'Password length should be minimum 6 digit', 'Email id=', email);
                        res.json({
                            "code": 200,
                            "status": "Error",
                            "message": "Password length should be minimum 6 digit"
                        });
                        return;
                    }
                }
                if (columnName == 'newpassword') {
                    var validpassword = req.checkBody('newpassword', 'New Password length should be minimum 6 digit').len(6, 100).validationErrors.length;
                    if (validpassword) {
                        logger.error('url=', URL.url, 'Responce=', 'New Password length should be minimum 6 digit', 'Email id=', email);
                        res.json({
                            "code": 200,
                            "status": "Error",
                            "message": "New Password length should be minimum 6 digit"
                        });
                        return;
                    }
                }

            }
        }
    }
    var password = req.body.password;
    var newpassword = req.body.newpassword;

    pool.connect(function(db) {
        if (db) {
            users = db.collection('users');
            users.find({ email: email }).toArray(
                function(err, rows) {
                    if (!err) {
                        console.log('rows', rows.length);
                        if (rows.length > 0) {
                            if (bcrypt.compareSync(password, rows[0].password)) {
                                users.update({ "_id": rows[0]._id }, { $set: { "password": bcrypt.hashSync(newpassword, bcrypt.genSaltSync(8)), "updated": new Date() } }, function(err, updatePass) {
                                    if (!err) {
                                        res.json({ 'code': 200, 'status': 'success', 'message': 'Password successfully changed' });
                                        return;
                                    } else {
                                        res.json({ 'code': 200, 'status': 'error', 'message': 'Error for change password' });
                                        return;
                                    }
                                });
                            } else {
                                console.log('Wrong password');
                                res.json({ 'code': 200, 'status': 'error', 'message': 'Old password not match' });
                                return;
                            }
                        } else {
                            console.log('User');
                            res.json({ 'code': 200, 'status': 'error', 'message': 'User not found ' });
                            return;
                        }
                    } else {
                        console.log('error', err);
                        res.json({ 'code': 200, 'status': 'error', 'message': 'Error for get user' });
                        return;
                    }
                });
        } else {
            console.log('Error', err);
        }
    });
}

exports.deactivate = function(req, res) {
    var email = req.user.email;
    logger.info('*** Requested for Deactivate User... ***');
    receivedValues = req.body

    if (JSON.stringify(receivedValues) === '{}') {
        Errors.EmptyBody(res);
    } else {
        usercolumns = ["password"];
        for (var iter = 0; iter < usercolumns.length; iter++) {
            columnName = usercolumns[iter];
            if (receivedValues[columnName] == undefined && (columnName == 'password')) {
                res.json({ "code": 200, "status": "Error", "message": columnName + " field is empty" });
                logger.error('*** Redirecting: ', columnName, ' field is required');
                return;
            } else if (receivedValues[columnName] !== undefined || receivedValues[columnName] !== "") {
                if (columnName == 'password') {
                    var validpassword = req.checkBody('password', 'Password length should be minimum 6 digit').len(6, 100).validationErrors.length;
                    if (validpassword) {
                        logger.error('url=', URL.url, 'Responce=', 'Password length should be minimum 6 digit', 'Email id=', email);
                        res.json({
                            "code": 200,
                            "status": "Error",
                            "message": "Password length should be minimum 6 digit"
                        });
                        return;
                    }
                }
            }
        }
    }
    var password = req.body.password;

    pool.connect(function(db) {
        if (db) {
            users = db.collection('users');
            users.find({ email: email }).toArray(
                function(err, rows) {
                    if (!err) {
                        console.log('rows', rows.length);
                        if (rows.length > 0) {
                            if (bcrypt.compareSync(password, rows[0].password)) {
                                users.update({ "_id": rows[0]._id }, { $set: { "status": "deactive" } }, function(err, updatePass) {
                                    if (!err) {
                                        res.json({ 'code': 200, 'status': 'success', 'message': 'Account deactive' });
                                        return;
                                    } else {
                                        res.json({ 'code': 200, 'status': 'error', 'message': 'Error for Account deactive' });
                                        return;
                                    }
                                });
                            } else {
                                console.log('Wrong password');
                                res.json({ 'code': 200, 'status': 'error', 'message': 'password not match' });
                                return;
                            }
                        } else {
                            console.log('User');
                            res.json({ 'code': 200, 'status': 'error', 'message': 'User not found ' });
                            return;
                        }
                    } else {
                        console.log('error', err);
                        res.json({ 'code': 200, 'status': 'error', 'message': 'Error for get user' });
                        return;
                    }
                });
        } else {
            console.log('Error', err);
        }
    });
}

exports.logout = function(req, res) {
    console.log('Log out');
}