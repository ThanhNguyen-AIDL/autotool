const express = require('express');
const { getProfileByOwner, markLastAction } = require('../repositories/ProfileRepository');
const {doPostArticleCMC } =require('../automation/cmcService')
const router = express.Router();

router.post('/postcmc', async (req, res) => {
  const { owner, category, postContent } = req.body;

  try {
    const emailInfo = await getProfileByOwner(owner);
    if(emailInfo){

        const name = emailInfo?.email.split('@')[0]
        await doPostArticleCMC({ name, postContent});
        if(emailInfo?.email){
            await markLastAction(emailInfo?.email)
        }

    }


    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;
