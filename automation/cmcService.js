const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const { doLogin, checkSuspendedAcct, postComment} = require('./authCMC')
const {canExecute, markExecuted} = require('./cooldownManager')
const logger = require('../middlewares/logger')
async function doPostArticleCMC({
  name,
  email,
  postContent = "",
}) {

  if(!canExecute('doPostArticleCMC', 600)){
    logger.info({message:"still cooldown CMC post 600s"})
    return
  }

  markExecuted("doPostArticleCMC");

  const profilePath = path.resolve(process.cwd(), 'profiles', name);

  // Ensure profile dir exists
  if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
  }

  let browser = await puppeteer.launch({
    headless: false,
    userDataDir: profilePath,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // adjust for your OS
    args: [
      '--start-maximized',
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto('https://coinmarketcap.com/', { waitUntil: 'domcontentloaded' });

  const loggedOn = await doLogin(page, email)
  
  if(!loggedOn){
      await browser.close()
  }

  const suspended = await checkSuspendedAcct(page);
  
  if(suspended){
    logger.info({message:"Account suspended"})
    await browser.close();
  }

  await page.goto("https://coinmarketcap.com/community", { waitUntil: 'domcontentloaded' });


  await postComment(page, postContent)

  await browser.close();

  return browser;
}

module.exports = {
  doPostArticleCMC
};
