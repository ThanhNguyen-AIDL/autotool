const express = require('express');
const cooldownRepo = require('../repositories/CooldownRepository')
const { getProfileByOwner, markLastAction } = require('../repositories/ProfileRepository');
const {doPostArticleCMC } =require('../automation/cmcService')
const logger = require('../middlewares/logger');
const router = express.Router();

router.post('/postcmc', async (req, res) => {
  const { owner, category, postContent } = req.body;
  logger.info({ step: 'validate_input', owner, category, postContent });

  try {
    const emailInfo = await getProfileByOwner(owner);
    if(emailInfo){
        logger.info({found_email:emailInfo?.email})
      
        const name = emailInfo?.email.split('@')[0]
        if(await (cooldownRepo.canExecute(category, owner))){

          await doPostArticleCMC({ name, email: emailInfo?.email, postContent});
          await cooldownRepo.markExecuted(category, owner)
          if(emailInfo?.email){
              await markLastAction(emailInfo?.email)
          }
        }

    }


    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;
