const express = require('express');
const { getProfileByOwner } = require('../repositories/ProfileRepository');
const router = express.Router();

app.post('/api/task/postarticle', async (req, res) => {
  const { owner, category, postContent } = req.body;

  try {
    const emailInfo =await getProfileByOwner(owner);
    

    await launchProfile({ name, url , postContent});

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;
