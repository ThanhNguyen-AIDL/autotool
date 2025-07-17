// requestContext.js
const async_hooks = require('async_hooks');

const store = new Map();

const asyncHook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    if (store.has(triggerAsyncId)) {
      store.set(asyncId, store.get(triggerAsyncId));
    }
  },
  destroy(asyncId) {
    store.delete(asyncId);
  }
});

asyncHook.enable();

function setContext(key, value) {
  const asyncId = async_hooks.executionAsyncId();
  const current = store.get(asyncId) || {};
  current[key] = value;
  store.set(asyncId, current);
}

function getContext(key) {
  const asyncId = async_hooks.executionAsyncId();
  const context = store.get(asyncId);
  return context?.[key];
}

function runWithContext(contextObj, fn) {
  const asyncId = async_hooks.executionAsyncId();
  store.set(asyncId, contextObj);
  return fn();
}

module.exports = {
  setContext,
  getContext,
  runWithContext
};
