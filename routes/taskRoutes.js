const express = require('express');
const cooldownRepo = require('../repositories/CooldownRepository')
const { getProfileByOwner, markLastAction } = require('../repositories/ProfileRepository');
const { getProfileByOwner: getSSLProfileByOwner, markLastAction: markSSLLastAction } = require('../repositories/SSLProfileRepository');
const {doPostArticleCMC } =require('../automation/cmcService')
const { doSSLOperation } =require('../automation/sslService')
const { launchProfile } =require('../automation/launcher')
const logger = require('../middlewares/logger');
const router = express.Router();

router.post('/postcmc', async (req, res) => {
  const { owner, category, postContent, mainAccountTag, imageData } = req.body;
  logger.info({ step: 'validate_input', owner, category, postContent, mainAccountTag, hasImage: !!imageData });

  try {
    const emailInfo = await getProfileByOwner(owner);
    if(emailInfo){
        logger.info({found_email:emailInfo?.email})
      
        const name = emailInfo?.email.split('@')[0]
        if(await (cooldownRepo.canExecute(category, owner))){

          await doPostArticleCMC({ name, email: emailInfo?.email, postContent, mainAccountTag, imageData});
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

/**
 * POST /api/task/postssl - Post content to Sosovalue platform
 * Similar to /postcmc but uses SSL-specific repository and service
 */
router.post('/postssl', async (req, res) => {
  const { owner, category, postContent, title, imageData } = req.body;
  logger.info({ step: 'ssl_validate_input', owner, category, postContent: postContent ? 'has content' : 'empty', title, hasImage: !!imageData });
  logger.info({ step: 'ssl_debug', postContentLength: postContent ? postContent.length : 0, postContentPreview: postContent ? postContent.substring(0, 100) + '...' : 'empty' });

  try {
    const emailInfo = await getSSLProfileByOwner(owner);
    if(emailInfo){
        logger.info({found_ssl_email:emailInfo?.email})
      
        const name = emailInfo?.email.split('@')[0]
        if(await (cooldownRepo.canExecute(category, owner))){

          await doSSLOperation({ name, email: emailInfo?.email, postContent, category, title, imageData, action: 'post'});
          await cooldownRepo.markExecuted(category, owner)
          if(emailInfo?.email){
              await markSSLLastAction(emailInfo?.email)
          }
        }

    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/launch', async (req, res) => {
  const { owner } = req.body;

  try {
    const emailInfo = await getProfileByOwner(owner);
    if(emailInfo){      
        const name = emailInfo?.email.split('@')[0]
        await launchProfile({ name});

      }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



module.exports = router;
