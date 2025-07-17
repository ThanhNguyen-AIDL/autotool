// logger.js
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const { getContext } = require('./requestContext');

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Get today's date string: 2025-07-17
const today = new Date().toISOString().slice(0, 10);
const logFilePath = path.join(logDir, `${today}.log`);

// Setup destination stream
const logStream = pino.destination({ dest: logFilePath, sync: false });

// Create logger
const baseLogger = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    log(obj) {
      return obj;
    },
  },
}, logStream);

// Wrapper to include context info
function log(level, obj) {
  const context = {
    actionId: getContext('actionId'),
    method: getContext('method'),
    path: getContext('path'),
  };


  baseLogger[level]({  ...context ,...obj });
}

module.exports = {
  info: (obj) => log('info', obj),
  error: (obj) => log('error', obj),
};
