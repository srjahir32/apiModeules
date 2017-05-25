var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var config = require('./config/config.js')
var mongoUrl = process.env.MONGO_URL;

exports.connect = function(callback) {
    MongoClient.connect(mongoUrl, function(err, db) {
        if (err) {
            callback(false);
        } else {
            callback(db);
            // db.close();
        }
    });
};