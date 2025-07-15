const express = require('express');
const router = express.Router();
const ProfileRepo = require('../repositories/ProfileRepository.js');

router.get('/', async (req, res) => {
    try {
      const profiles = await ProfileRepo.getAll();
      res.json(profiles);
       
    } catch (error) {
        res.status(500).json({ error: "Error occurs: " + error.message });
    }
});

router.post('/', async (req, res) => {
  try {
      const profile = await ProfileRepo.create(req.body);
      res.json(profile);
  } catch (error) {
      res.status(500).json({ error: "Error occurs: " + error.message });
  }
});

router.put('/:id', async (req, res) => {
  const profile = await ProfileRepo.update(req.params.id, req.body);
  res.json(profile);
});

router.delete('/:id', async (req, res) => {
  await ProfileRepo.delete(req.params.id);
  res.json({ success: true });
});

module.exports = router;
