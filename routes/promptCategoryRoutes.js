const express = require('express');
const router = express.Router();
const PromptCategory = require('../models/PromptCategory');
const { Op } =require("sequelize");

// Create
router.post('/', async (req, res) => {
  try {
    const promt = await PromptCategory.create(req.body);
    res.status(201).json(promt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read All
router.get('/', async (req, res) => {
  try {
    const { owner } = req.query; // ?owner=alice

    const where = owner
      ? {
          [Op.or]: [
            { owner: null },
            { owner }
          ]
        }
      : { owner: null }; // if no input, just null

    const list = await PromptCategory.findAll({ where });

    res.json(list);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Delete
router.delete('/:id', async (req, res) => {
  const promt = await PromptCategory.findByPk(req.params.id);
  if (!promt) return res.status(404).json({ error: 'Not found' });

  await promt.destroy();
  res.json({ message: 'Deleted' });
});

module.exports = router;
