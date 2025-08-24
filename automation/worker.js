const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');
const dotenv = require('dotenv')
const { doLogin, checkSuspendedAcct, postComment} = require('./authCMC')
const logger = require('../middlewares/logger');
const ProfileRepository = require('../repositories/ProfileRepository');
dotenv.config()

async function launchCMCbyEmail({
  name,
  email,
  postContent = "",
  mainAccountTag = "",
  imageData = "",
}) {
  const profilePath = path.resolve(process.cwd(), 'profiles', name);
  const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

  // Ensure profile dir exists
  if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
  }

  let browser = await puppeteer.launch({
    headless: false,
    userDataDir: profilePath,
    executablePath: chromePath, // adjust for your OS
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
    logger.info({message:`Account suspended ${email}`})
    await ProfileRepository.deleteByEmail(email);

    if (fs.existsSync(profilePath)) {
      const stat = fs.lstatSync(profilePath);

      if (stat.isDirectory()) {
        // recursive remove for folder
        fs.rmSync(profilePath, { recursive: true, force: true });
        logger.info(`Removed folder: ${profilePath}`);
      } else {
        // remove single file
        fs.unlinkSync(profilePath);
        logger.info(`Removed file: ${profilePath}`);
      }
    } else {
      logger.info(`Path not found, skipping: ${profilePath}`);
    }
    await browser.close();
    
    return
  }

  return browser;
}




module.exports = {
  launchCMCbyEmail
};
