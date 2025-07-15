const express = require('express');
const { generateContent } = require('./contentOpenAI');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
      const { promt } = req.body;
        const content = await generateContent(promt)
      res.json({data: content});
  } catch (error) {
      res.status(500).json({ error: "Error occurs: " + error.message });
  }
});

module.exports = router;
