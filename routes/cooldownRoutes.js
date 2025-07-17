const express = require('express');
const router = express.Router();
const { canExecute, markExecuted } = require('../automation/cooldownManager'); // adjust path as needed

/**
 * GET /cooldown/:key
 * Query param: cooldown (in seconds)
 * Example: /cooldown/myTask?cooldown=60
 */
router.get('/:key', (req, res) => {
    const key = req.params.key;
    const cooldownSeconds = parseInt(req.query.cooldown, 10) || 600;


    // Do your actual work here if needed
    return res.json({ allowed: canExecute(key, cooldownSeconds) });

});

module.exports = router;
