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
  
  // Log all input parameters
  logger.info({ 
    step: 'cmc_request_received', 
    owner, 
    category, 
    mainAccountTag,
    postContentLength: postContent ? postContent.length : 0,
    postContentPreview: postContent ? postContent.substring(0, 100) + '...' : 'empty',
    hasImage: !!imageData,
    imageDataLength: imageData ? imageData.length : 0
  });

  let emailInfo = null;

  try {
    // Step 1: Get CMC profile
    logger.info({ step: 'cmc_get_profile_start', owner });
    emailInfo = await getProfileByOwner(owner);
    
    if (!emailInfo) {
      logger.warn({ step: 'cmc_no_profile_found', owner });
      res.json({ success: false, reason: 'No available CMC profile found' });
      return;
    }
    
    logger.info({ 
      step: 'cmc_profile_found', 
      email: emailInfo.email,
      computername: emailInfo.computername,
      isverified: emailInfo.isverified,
      lastaction: emailInfo.lastaction
    });
      
    const name = emailInfo.email.split('@')[0];
    logger.info({ step: 'cmc_extract_name', name, email: emailInfo.email });
    
    // Step 2: Check cooldown
    logger.info({ step: 'cmc_check_cooldown_start', category, owner });
    const canExecute = await cooldownRepo.canExecute(category, owner);
    logger.info({ step: 'cmc_check_cooldown_result', category, owner, canExecute });
    
    if (canExecute) {
      // Step 3: Execute CMC operation
      logger.info({ 
        step: 'cmc_operation_start', 
        name, 
        email: emailInfo.email, 
        category,
        mainAccountTag,
        postContentLength: postContent.length
      });
      
      await doPostArticleCMC({ 
        name, 
        email: emailInfo.email, 
        postContent, 
        mainAccountTag, 
        imageData
      });
      
      logger.info({ step: 'cmc_operation_success', email: emailInfo.email, category });
      
      // Step 4: Mark cooldown
      logger.info({ step: 'cmc_mark_cooldown_start', category, owner });
      await cooldownRepo.markExecuted(category, owner);
      logger.info({ step: 'cmc_mark_cooldown_success', category, owner });
      
      // Step 5: Mark last action
      if (emailInfo.email) {
        logger.info({ step: 'cmc_mark_lastaction_start', email: emailInfo.email });
        await markLastAction(emailInfo.email);
        logger.info({ step: 'cmc_mark_lastaction_success', email: emailInfo.email });
      }
    } else {
      logger.info({ step: 'cmc_cooldown_not_ready', category, owner });
    }

    logger.info({ step: 'cmc_request_complete', owner, category, email: emailInfo?.email });
    res.json({ success: true });
    
  } catch (e) {
    logger.error({ 
      step: 'cmc_post_failed', 
      error: e.message, 
      errorStack: e.stack,
      email: emailInfo?.email,
      owner,
      category,
      mainAccountTag
    });
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/task/postssl - Post content to Sosovalue platform
 * Similar to /postcmc but uses SSL-specific repository and service
 */
router.post('/postssl', async (req, res) => {
  const { owner, category, postContent, title, imageData } = req.body;
  
  // Log all input parameters
  logger.info({ 
    step: 'ssl_request_received', 
    owner, 
    category, 
    title,
    postContentLength: postContent ? postContent.length : 0,
    postContentPreview: postContent ? postContent.substring(0, 100) + '...' : 'empty',
    hasImage: !!imageData,
    imageDataLength: imageData ? imageData.length : 0
  });

  let emailInfo = null;
  
  try {
    // Step 1: Get SSL profile
    const periodRange = parseInt(process.env.SSL_PROFILE_PERIOD_RANGE) || 86400; // Default 24 hours
    logger.info({ step: 'ssl_get_profile_start', owner, periodRange });
    emailInfo = await getSSLProfileByOwner(owner, periodRange);
    
    if (!emailInfo) {
      logger.warn({ step: 'ssl_no_profile_found', owner });
      res.json({ success: false, reason: 'No available SSL profile found' });
      return;
    }
    
    logger.info({ 
      step: 'ssl_profile_found', 
      email: emailInfo.email,
      computername: emailInfo.computername,
      ssl_isverified: emailInfo.ssl_isverified,
      ssl_lastaction: emailInfo.ssl_lastaction,
      domain: emailInfo.domain
    });
      
    const name = emailInfo.email.split('@')[0];
    logger.info({ step: 'ssl_extract_name', name, email: emailInfo.email });
    
    // Step 2: Check cooldown
    logger.info({ step: 'ssl_check_cooldown_start', category, owner });
    const canExecute = await cooldownRepo.canExecute(category, owner);
    logger.info({ step: 'ssl_check_cooldown_result', category, owner, canExecute });
    
    if (canExecute) {
      // Step 3: Execute SSL operation
      logger.info({ 
        step: 'ssl_operation_start', 
        name, 
        email: emailInfo.email, 
        category, 
        title,
        action: 'post',
        postContentLength: postContent.length
      });
      
      await doSSLOperation({ 
        name, 
        email: emailInfo.email, 
        postContent, 
        category, 
        title, 
        imageData, 
        action: 'post'
      });
      
      logger.info({ step: 'ssl_operation_success', email: emailInfo.email, category });
      
      // Step 4: Mark cooldown
      logger.info({ step: 'ssl_mark_cooldown_start', category, owner });
      await cooldownRepo.markExecuted(category, owner);
      logger.info({ step: 'ssl_mark_cooldown_success', category, owner });
      
      // Step 5: Mark last action
      if (emailInfo.email) {
        logger.info({ step: 'ssl_mark_lastaction_start', email: emailInfo.email });
        await markSSLLastAction(emailInfo.email);
        logger.info({ step: 'ssl_mark_lastaction_success', email: emailInfo.email });
      }
    } else {
      logger.info({ step: 'ssl_cooldown_not_ready', category, owner });
    }

    logger.info({ step: 'ssl_request_complete', owner, category, email: emailInfo?.email });
    res.json({ success: true });
    
  } catch (e) {
    logger.error({ 
      step: 'ssl_post_failed', 
      error: e.message, 
      errorStack: e.stack,
      email: emailInfo?.email,
      owner,
      category,
      title
    });
    
    // If posting failed and we have an email, mark account as unverified
    if (emailInfo?.email) {
      try {
        logger.info({ step: 'ssl_marking_account_failed_start', email: emailInfo.email });
        const ProfileEmail = require('../models/ProfileEmail');
        await ProfileEmail.update(
          { ssl_isverified: false },
          { where: { email: emailInfo.email } }
        );
        logger.info({ step: 'ssl_account_marked_failed', email: emailInfo.email });
      } catch (updateError) {
        logger.error({ 
          step: 'ssl_account_mark_failed_error', 
          error: updateError.message,
          errorStack: updateError.stack,
          email: emailInfo.email
        });
      }
    }
    
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

  // Log all input parameters
  logger.info({ 
    step: 'ssl_signup_request_received', 
    profileName,
    hasPassword: !!password,
    codeTimeoutMs: codeTimeoutMs || 'default'
  });

  try {
    // Extract computer name from profileName (format: "computerName-ssl-timestamp")
    let computerName = 'default';
    if (profileName) {
      const parts = profileName.split('-ssl-');
      if (parts.length > 0) {
        computerName = parts[0]; // Extract computer name before "-ssl-"
      }
    }

    logger.info({ 
      step: 'ssl_signup_start', 
      computerName, 
      profileName,
      extractedComputerName: computerName
    });

    const created = await createSSLAccount({ 
      password, 
      profileName, 
      codeTimeoutMs, 
      computerName 
    });
    
    logger.info({ 
      step: 'ssl_signup_success', 
      email: created.email, 
      computerName,
      domain: created.email.split('@')[1]
    });
    
    res.json({ success: true, ...created });
    
  } catch (e) {
    logger.error({ 
      step: 'ssl_signup_failed', 
      error: e.message,
      errorStack: e.stack,
      profileName,
      computerName: profileName ? profileName.split('-ssl-')[0] : 'default'
    });
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
