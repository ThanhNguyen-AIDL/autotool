const fs = require('fs');
const path = require('path');
const readline = require('readline');
const express = require('express');
const router = express.Router();

const LOG_DIR = path.join(process.cwd(), 'logs');

// API 1: List all log files
router.get('/', (req, res) => {
  fs.readdir(LOG_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read log directory' });
    }

    const logFiles = files.filter(file => file.endsWith('.log'));
    res.json(logFiles);
  });
});

// API 2: Parse a selected log file
// API 2 (Improved): Parse log file from query parameter
router.get('/view', async (req, res) => {
  const filename = req.query.file;

  if (!filename || !filename.endsWith('.log')) {
    return res.status(400).json({ error: 'Missing or invalid log filename' });
  }

  const filePath = path.join(LOG_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Log file not found' });
  }

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream });

    const parsedLogs = [];

    for await (const line of rl) {
      try {
        const log = JSON.parse(line);
        const { time, pid, hostname, ...rest } = log;

        parsedLogs.push({
          time,
          pid,
          hostname,
          details: rest
        });
      } catch (err) {
        console.warn('Invalid JSON line:', line);
      }
    }

    res.json(parsedLogs.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse log file' });
  }
});



module.exports = router;
