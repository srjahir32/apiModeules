var winston = require('winston');
var chalk = require('chalk');


winston.info(chalk.green("loading production  env db ....", process.env.NODE_ENV));

if (process.env.NODE_ENV == 'production') {
    module.exports = {
        "secret": "errorfound",

    };
} else if (process.env.NODE_ENV == 'development') {
    module.exports = {

        "secret": "errorfound",

    };

}