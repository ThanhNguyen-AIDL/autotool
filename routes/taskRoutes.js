const express = require('express');
const router = express.Router();

app.post('/api/task/postarticle', async (req, res) => {
  const { category, postContent } = req.body;

  try {
    await launchProfile({ name, url , postContent});

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;
