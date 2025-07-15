const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const { doLogin, checkSuspendedAcct} = require('./authCMC')
const { generateContent } = require('../routes/contentOpenAI')
async function launchProfile({
  name,
  url = 'https://example.com',
  extensionRelativePath = 'extensions/unpacked-metamask',
  webstoreUrl = 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en-US&utm_source=ext_sidebar',
  verifySelector = '#extension-element-id' // Optional: use if your extension injects DOM
}) {
  const profilePath = path.resolve(process.cwd(), 'profiles', name);
  const extensionPath = path.resolve(process.cwd(), extensionRelativePath);

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
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const loggedOn = await doLogin(page)
  
  if(!loggedOn){
      await browser.close()
  }

  const suspended = await checkSuspendedAcct(page);
  
  if(suspended){
    console.log('Suspended:', name);
    await browser.close();
  }

  const postContent = await generateContent("write short content limited 500 text for current influencers like Mike Strategy, return content only limited 500 text, no extra content needed ")

  console.log('postContent', postContent)



  return browser;
}

module.exports = {
  launchProfile
};
