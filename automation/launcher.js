const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

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

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: profilePath,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // adjust for your OS
    args: [
      '--start-maximized',
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto(url);

  return browser;
}

module.exports = {
  launchProfile
};
