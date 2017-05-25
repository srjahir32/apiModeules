var winston = require('winston');
const env = process.env.NODE_ENV;
const logDir = 'logs';
const fs = require('fs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const now = new Date();

var logger = new(winston.Logger)({
    transports: [

        new winston.transports.File({
            name: 'error-file',
            filename: './logs/exceptions.log',
            level: 'error',
            json: false
        }),

        new(require('winston-daily-rotate-file'))({
            filename: `${logDir}/-apimodules.log`,
            timestamp: now,
            datePattern: 'dd-MM-yyyy',
            prepend: true,
            json: false,
            level: env === 'development' ? 'verbose' : 'info'
        })
    ],
    exitOnError: false
});

//logger.remove('error-file');
module.exports = logger;
module.exports.stream = {
    write: function(message, encoding) {
        logger.info(message);
        console.log('message=', message);
    }
};

/*var winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
   // new (winston.transports.Console)({ json: false,  timestamp: true }),
    new winston.transports.File({
		name:'info-file',
		filename: './logs/apimodules.log',
		level:'info',
		datePattern: '.dd-MM-yyyy',
		json: false
	}),

	new winston.transports.File({
		name:'error-file',
		filename: './logs/exceptions.log' ,
		level:'error',
		json:false
		})
    ],
	exitOnError: false
});

//logger.remove('error-file');
module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
		console.log('message=',message);
	}
};
*/