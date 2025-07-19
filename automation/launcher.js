const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const dotenv = require('dotenv')

dotenv.config()

const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const { doLogin, checkSuspendedAcct, postComment} = require('./authCMC')
async function launchProfile({
  name,
  postContent = "",
  url = 'https://example.com',
  extensionRelativePath = 'extensions/unpacked-metamask',
  webstoreUrl = 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en-US&utm_source=ext_sidebar',
  verifySelector = '#extension-element-id' // Optional: use if your extension injects DOM
}) {
  const profilePath = path.resolve(process.cwd(), 'profiles', name);
  const extensionPath = path.resolve(process.cwd(), extensionRelativePath);
  const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

  // Ensure profile dir exists
  if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
  }

  const browser = await puppeteer.launch({
    userDataDir: profilePath,
    executablePath: chromePath,
    headless: false,
    args: ['--start-maximized'],
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.goto("https://sosovalue.com", { waitUntil: 'domcontentloaded' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.goto("https://sosovalue.com", { waitUntil: 'domcontentloaded' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.goto("https://sosovalue.com", { waitUntil: 'domcontentloaded' });

  try {
        // Wait for the "Log In" button to appear (text-based XPath)
        const signUpBtn = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => btn.textContent.trim().toLowerCase() === 'sign up');
        });

        if (signUpBtn) {

            await signUpBtn.click();
            await new Promise(resolve => setTimeout(resolve, 10000));

        }
    } catch (err) {
        console.error('Error:', err.message);
        return true; // same as original fallback behavior
    } finally {
        if (browser) await browser.close();
    }

  return browser;

}

module.exports = {
  launchProfile
};
