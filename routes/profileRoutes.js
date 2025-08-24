const express = require('express');
const router = express.Router();
const ProfileRepo = require('../repositories/ProfileRepository.js');

router.get('/computernames', async (req, res) => {
    try {
      const list = await ProfileRepo.getCompunterNames();
      res.json(list);
    } catch (error) {
        res.status(500).json({ error: "Error occurs: " + error.message });
    }
});

router.get('/', async (req, res) => {
    try {
      const profiles = await ProfileRepo.getAll();
      res.json(profiles);
       
    } catch (error) {
        res.status(500).json({ error: "Error occurs: " + error.message });
    }
});

router.get('/mainList', async (req, res) => {
    try {
      const { owner } = req.query;

      const profiles = await ProfileRepo.getMainAcctByOwner(owner);
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
