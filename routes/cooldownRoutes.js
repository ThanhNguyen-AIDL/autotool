const express = require('express');
const router = express.Router();
const cooldownRepo = require('../repositories/CooldownRepository')
/**
 * GET /cooldown/:key
 * Query param: cooldown (in seconds)
 * Example: /cooldown/myTask?cooldown=60
 */
router.get('/check', async (req, res) => {
    const pcName = req.query.pcName || "";
    const category = req.query.category || "";

    // Do your actual work here if needed
    return res.json({ allowed: (await cooldownRepo.canExecute(category, pcName)) });

});


router.get('/sync', async (req, res) => {
    const pcName = req.query.pcName || "";
    await cooldownRepo.syncCooldowns(pcName)

    res.status(200).send();
});

router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const updateData = req.body;

    try {
        const updated = await cooldownRepo.update(id, updateData);
        if (!updated) {
            return res.status(404).json({ error: 'Cooldown record not found' });
        }
        res.json(updated);
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update cooldown record' });
    }
});



router.get('/', async (req, res) => {
    const pcName = req.query.pcName || "";

    const list = await cooldownRepo.getAll(pcName)

    // Do your actual work here if needed
    return res.json(list);

});


router.delete('/:id', async (req, res) => {
    await cooldownRepo.delete(req.params.id)
    res.json({ message: 'Deleted' });
});


module.exports = router;
