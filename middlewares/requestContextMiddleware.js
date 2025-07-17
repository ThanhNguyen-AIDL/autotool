// requestContextMiddleware.js
const { v4: uuidv4 } = require('uuid');
const { runWithContext } = require('./requestContext');

function requestContextMiddleware(req, res, next) {
  const actionId = uuidv4();
  runWithContext({ actionId, method: req.method, path: req.path }, () => {
    next();
  });
}

module.exports = requestContextMiddleware;
