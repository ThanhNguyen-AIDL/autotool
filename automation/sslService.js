const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const dotenv = require('dotenv')

dotenv.config()

const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// SSL Configuration
const SSL_PASSWORD = 'TopOne1990@';

/**
 * Post content to TokenBar page
 * @param {Object} page - Puppeteer page object
 * @param {string} postContent - Content to post in the body
 * @returns {Promise<boolean>} True if post successful
 */
async function postToTokenBar(page, postContent) {
  try {
    console.log('Starting TokenBar post process...');
    
    // Navigate to TokenBar page
    await page.goto('https://sosovalue.com/tokenbar', { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click on "Create post" button
    const createPostClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createPostBtn = buttons.find(btn => btn.textContent.trim() === 'Create post');
      if (createPostBtn) {
        createPostBtn.click();
        return true;
      }
      return false;
    });
    
    if (!createPostClicked) {
      console.log('Create post button not found');
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fill in the title
    const titleFilled = await page.evaluate(() => {
      const titleTextarea = document.querySelector('textarea[aria-label*="screen reader"]');
      if (titleTextarea) {
        titleTextarea.value = 'Hi everyone, I found new x100 ico coin';
        titleTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    });
    
    if (!titleFilled) {
      console.log('Title textarea not found');
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill in the body content
    const bodyFilled = await page.evaluate((content) => {
      const bodyEditor = document.querySelector('.ProseMirror[contenteditable="true"]');
      if (bodyEditor) {
        bodyEditor.innerHTML = `<p>${content}</p>`;
        bodyEditor.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, postContent);
    
    if (!bodyFilled) {
      console.log('Body editor not found');
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for and click the post button
    const postSubmitted = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const postBtn = buttons.find(btn => 
        btn.textContent.trim().toLowerCase().includes('post') ||
        btn.textContent.trim().toLowerCase().includes('publish') ||
        btn.textContent.trim().toLowerCase().includes('submit')
      );
      if (postBtn) {
        postBtn.click();
        return true;
      }
      return false;
    });
    
    if (postSubmitted) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('TokenBar post submitted successfully');
      return true;
    } else {
      console.log('Post button not found');
      return false;
    }
    
  } catch (error) {
    console.error('Error during TokenBar post process:', error.message);
    return false;
  }
}

/**
 * Check if user is already logged in by looking for profile button
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} True if already logged in
 */
async function isAlreadyLoggedIn(page) {
  try {
    const profileButton = await page.$('#go_profile');
    if (profileButton) {
      console.log('User is already logged in (profile button found)');
      return true;
    }
    console.log('User is not logged in (profile button not found)');
    return false;
  } catch (error) {
    console.log('Error checking login status:', error.message);
    return false;
  }
}

/**
 * Perform login to Sosovalue
 * @param {Object} page - Puppeteer page object
 * @param {string} email - Email address for login
 * @returns {Promise<boolean>} True if login successful
 */
async function performLogin(page, email) {
  try {
    console.log('Starting login process...');
    
    // Refresh the page before login to ensure clean state
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Click Log In button (converted from Playwright recording)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtn = buttons.find(btn => btn.textContent.trim().toLowerCase() === 'log in');
      if (loginBtn) {
        loginBtn.click();
        return true;
      }
      return false;
    });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Fill email field (email comes from database)
    await page.click('input[placeholder*="email"], input[name*="email"], input[type="email"]');
    await page.type('input[placeholder*="email"], input[name*="email"], input[type="email"]', email);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fill password field (using constant defined at top)
    await page.click('input[type="password"], input[placeholder*="password"], input[name*="password"]');
    await page.type('input[type="password"], input[placeholder*="password"], input[name*="password"]', SSL_PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click on the form area to ensure focus
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const formElement = elements.find(el => el.textContent.includes('EmailPhone NumberEmailEmailLogin with verification codePasswordForgot password?'));
      if (formElement) {
        formElement.click();
        return true;
      }
      return false;
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Look for login/submit button and click it
    console.log('Looking for login submit button...');
    
    // First, let's see what buttons are available
    const availableButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => btn.textContent.trim());
    });
    console.log('Available buttons:', availableButtons);

    const loginSubmitted = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      // Find all Log In buttons and use the last one (likely the submit button)
      const logInButtons = buttons.filter(btn => btn.textContent.trim() === 'Log In');
      if (logInButtons.length > 0) {
        const submitBtn = logInButtons[logInButtons.length - 1]; // Use the last Log In button
        console.log('Found Log In button, clicking...');
        submitBtn.click();
        return true;
      }
      return false;
    });

    if (loginSubmitted) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('Login submitted successfully');
      
      // Verify login was successful
      const isLoggedIn = await isAlreadyLoggedIn(page);
      if (isLoggedIn) {
        console.log('Login verification successful - user is now logged in');
        return true;
      } else {
        console.log('Login verification failed - user is not logged in');
        return false;
      }
    } else {
      console.log('Login button not found, login failed');
      return false;
    }

  } catch (error) {
    console.error('Error during login process:', error.message);
    return false;
  }
}

/**
 * SSL Service for Sosovalue platform
 * Simple copy of launcher.js logic to avoid captcha issues
 * Added login functionality based on Playwright recording
 */
async function doSSLOperation({
  name,
  email,
  postContent = "",
}) {
  const profilePath = path.resolve(process.cwd(), 'profiles', name);
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
    // Check if already logged in
    const isLoggedIn = await isAlreadyLoggedIn(page);
    
    if (isLoggedIn) {
      console.log('User is already logged in, skipping login process');
    } else {
      console.log('User is not logged in, performing login...');
      const loginSuccess = await performLogin(page, email);
      if (!loginSuccess) {
        console.log('Login failed, but continuing with operation...');
      }
    }

    // Post to TokenBar if postContent is provided
    if (postContent && postContent.trim() !== '') {
      console.log('Posting content to TokenBar...');
      const postSuccess = await postToTokenBar(page, postContent);
      if (postSuccess) {
        console.log('TokenBar post completed successfully');
      } else {
        console.log('TokenBar post failed, but operation continues...');
      }
    } else {
      console.log('No post content provided, skipping TokenBar post');
    }

  } catch (err) {
    console.error('Error during SSL operation:', err.message);
    // Continue execution even if login fails
  } finally {
    // Keep browser open for further operations
    // Don't close here - let the caller decide when to close
  }

  return browser;

}

module.exports = {
  doSSLOperation,
  isAlreadyLoggedIn,
  performLogin,
  postToTokenBar
}; 