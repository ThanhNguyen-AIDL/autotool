// logger.js
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { getContext } = require('./requestContext');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

let currentDate = null;
let logStream = null;
let baseLogger = null;

function getLogger() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentDate) {
    // rotate log file
    currentDate = today;
    const logFilePath = path.join(logDir, `${today}.log`);
    logStream = pino.destination({ dest: logFilePath, sync: false });
    baseLogger = pino(
      {
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          log(obj) {
            return obj;
          },
        },
      },
      logStream
    );
  }
  return baseLogger;
}

function log(level, obj) {
  const context = {
    actionId: getContext('actionId'),
    method: getContext('method'),
    path: getContext('path'),
  };
  getLogger()[level]({ ...context, ...obj });
}

module.exports = {
  info: (obj) => log('info', obj),
  error: (msg) => log('error', {msg}),
};
