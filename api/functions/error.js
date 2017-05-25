var logger = require('./log');
var constants = require('./constants.json');
var URL = require('../../app.js');

function EmptyBody(res) {
    console.log("*** Redirecting: Parameters should not be empty.")
    res.json(constants.error.msg_empty_param);
    return;
}

exports.EmptyBody = function(res) {
    console.log('*** Redirecting: No apropiate data available ***');
    res.json({ 'code': 200, 'status': 'Error', 'Message': 'No apropiate data available' });
    logger.error('*** Redirecting: No apropiate data available ***');
    return;
}


exports.Connection_Error = function(res) {
    console.log('Connection Error...', URL.url);
    res.json(constants.error.msg_connection_fail);
    logger.error('URL=', URL.url, 'Responce=', '******Connection Error...******');
    return;
}

exports.SelectUserError = function(res, err) {
    console.log('Error for Selecting data from user table', err);
    res.json({ 'code': 200, 'status': 'Error', 'message': 'Error for updating data' });
    logger.error('URL', URL.url, 'Responce=', 'Error for Selecting data from user table');
    return;
}