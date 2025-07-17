const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(process.cwd(), 'method_state.json');

// Load full state (all keys)
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return {};
}

// Save full state
function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * Check if a method can run based on cooldown.
 * @param {string} key - Unique key for the method/action.
 * @param {number} cooldownSeconds - Cooldown period in seconds.
 * @returns {boolean} true if allowed, false if still in cooldown.
 */
function canExecute(key, cooldownSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const state = loadState();
  const lastExecuted = state[key] || 0;

  return now - lastExecuted >= cooldownSeconds;
}

/**
 * Updates the last executed time for a given key.
 * @param {string} key
 */
function markExecuted(key) {
  const now = Math.floor(Date.now() / 1000);
  const state = loadState();
  state[key] = now;
  saveState(state);
}


module.exports={
    canExecute,
    markExecuted
}