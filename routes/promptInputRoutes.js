const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const PromptInput = require('../models/PromptInput');

// 📥 Create a new prompt input
router.post('/', async (req, res) => {
  try {
    const prompt = await PromptInput.create(req.body);
    res.status(201).json(prompt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📋 Get all prompt inputs (optionally filter by category)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const where = category
      ? {
          // Case-insensitive match using LOWER()
          category: {
            [Op.iLike]: category.toLowerCase()
          }
        }
      : {};
    const prompts = await PromptInput.findAll({ where });
    res.json(prompts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});


// ❌ Delete a prompt input
router.delete('/:id', async (req, res) => {
  try {
    const prompt = await PromptInput.findByPk(req.params.id);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found' });

    await prompt.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

module.exports = router;
