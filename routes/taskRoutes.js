const express = require('express');
const cooldownRepo = require('../repositories/CooldownRepository')
const { getProfileByOwner, markLastAction, getProfileByEmail } = require('../repositories/ProfileRepository');
const { getProfileByOwner: getSSLProfileByOwner, markLastAction: markSSLLastAction } = require('../repositories/SSLProfileRepository');
const {doPostArticleCMC } =require('../automation/cmcService')
const { doSSLOperation } =require('../automation/sslService')
const { createSSLAccount } = require('../automation/sslSignup');
const { launchProfile } =require('../automation/launcher')
const logger = require('../middlewares/logger');
const { launchProfileByUrl, launchCMCbyEmail } = require('../automation/worker');
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

router.post('/launchbyemail', async (req, res) => {
  const { email, url } = req.body;

  try {
    const emailInfo = await getProfileByEmail(email);
    if(emailInfo){      
        const name = emailInfo?.email.split('@')[0]
        await launchCMCbyEmail({ name, email});

      }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/signupssl', async (req, res) => {
  const { password, profileName, codeTimeoutMs } = req.body || {};

  try {
    // Extract computer name from profileName (format: "computerName-ssl-timestamp")
    let computerName = 'default';
    if (profileName) {
      const parts = profileName.split('-ssl-');
      if (parts.length > 0) {
        computerName = parts[0]; // Extract computer name before "-ssl-"
      }
    }

    logger.info({ step: 'ssl_signup_start', computerName, profileName });

    const created = await createSSLAccount({ password, profileName, codeTimeoutMs, computerName });
    logger.info({ step: 'ssl_signup', email: created.email, computerName });
    res.json({ success: true, ...created });
  } catch (e) {
    logger.error({ step: 'ssl_signup_failed', error: e.message });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
