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
 * @param {string} category - Category for the post title
 * @param {string} title - Title for the post
 * @param {string} imageData - Base64 image data (optional)
 * @returns {Promise<boolean>} True if post successful
 */
async function postToTokenBar(page, postContent, category = '', title = '', imageData = '') {
  try {
    console.log('Starting TokenBar post process...');
    
    // Navigate to TokenBar page
    await page.goto('https://sosovalue.com/tokenbar', { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click on "Create post" button
    const createPostClicked = await page.evaluate(() => {
      // Look for any element containing "Create post" text
      const elements = Array.from(document.querySelectorAll('*'));
      const createPostElement = elements.find(el => el.textContent.trim() === 'Create post');
      if (createPostElement) {
        createPostElement.click();
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
    const titleFilled = await page.evaluate((category, title) => {
      // Create title in format: "category uppercase | title"
      const categoryUpper = category ? category.toUpperCase() : 'GENERAL';
      const titleText = title ? `${categoryUpper} | ${title}` : `${categoryUpper} | New Token Alert`;
      
      // Look for visible textarea (not the hidden one)
      const textareas = Array.from(document.querySelectorAll('textarea.MuiInputBase-input'));
      const visibleTextarea = textareas.find(textarea => 
        !textarea.hasAttribute('aria-hidden') && 
        textarea.style.visibility !== 'hidden' &&
        textarea.style.position !== 'absolute'
      );
      
      if (visibleTextarea) {
        // Focus on the textarea first
        visibleTextarea.focus();
        
        // Select all text and replace
        visibleTextarea.select();
        visibleTextarea.setRangeText(titleText, 0, visibleTextarea.value.length, 'select');
        
        // Trigger multiple events to ensure the form recognizes the change
        visibleTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        visibleTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        visibleTextarea.dispatchEvent(new Event('blur', { bubbles: true }));
        visibleTextarea.dispatchEvent(new Event('focus', { bubbles: true }));
        
        return true;
      }
      
      // Fallback: look for any textarea without aria-hidden
      const allTextareas = Array.from(document.querySelectorAll('textarea'));
      const nonHiddenTextarea = allTextareas.find(textarea => 
        !textarea.hasAttribute('aria-hidden') && 
        textarea.style.visibility !== 'hidden'
      );
      
      if (nonHiddenTextarea) {
        // Focus on the textarea first
        nonHiddenTextarea.focus();
        
        // Select all text and replace
        nonHiddenTextarea.select();
        nonHiddenTextarea.setRangeText(titleText, 0, nonHiddenTextarea.value.length, 'select');
        
        // Trigger multiple events to ensure the form recognizes the change
        nonHiddenTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        nonHiddenTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        nonHiddenTextarea.dispatchEvent(new Event('blur', { bubbles: true }));
        nonHiddenTextarea.dispatchEvent(new Event('focus', { bubbles: true }));
        
        return true;
      }
      
      return false;
    }, category, title);
    
    if (!titleFilled) {
      console.log('Title textarea not found');
      return false;
    }
    
    // Wait 2 seconds after filling title
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Fill in the body content (with image if provided)
    const bodyFilled = await page.evaluate((content, imageData) => {
      const bodyEditor = document.querySelector('.ProseMirror[contenteditable="true"]');
      if (bodyEditor) {
        if (imageData && imageData.trim() !== '') {
          bodyEditor.innerHTML = `<p>${content}</p><p><img src="${imageData}" style="max-width:100%;height:auto;" /></p>`;
        } else {
          bodyEditor.innerHTML = `<p>${content}</p>`;
        }
        bodyEditor.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, postContent, imageData);
    
    if (!bodyFilled) {
      console.log('Body editor not found');
      return false;
    }
    
    // Wait 2 seconds after filling body
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for and click the post button
    const postSubmitted = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      
      // Find exact "Post" button
      const postBtn = buttons.find(btn => btn.textContent.trim() === 'Post');
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
 * Upload image to the post using clipboard paste
 * @param {Object} page - Puppeteer page object
 * @param {string} imageData - Base64 image data
 * @returns {Promise<boolean>} True if image upload successful
 */
async function uploadImageToPost(page, imageData) {
  try {
    console.log('Starting image upload process using clipboard paste...');
    
    // Convert base64 to buffer and create temporary file
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');
    const tempFilePath = path.join(__dirname, 'temp_image.jpg');
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log('Temporary file created:', tempFilePath);
    
    // Focus on the body editor to ensure it's ready for paste
    const focusSuccess = await page.evaluate(() => {
      const bodyEditor = document.querySelector('.ProseMirror[contenteditable="true"]');
      if (bodyEditor) {
        bodyEditor.focus();
        console.log('Focused on ProseMirror editor');
        return true;
      }
      
      // Fallback: focus on any contenteditable element
      const contentEditableElements = Array.from(document.querySelectorAll('[contenteditable="true"]'));
      if (contentEditableElements.length > 0) {
        contentEditableElements[0].focus();
        console.log('Focused on contenteditable element');
        return true;
      }
      
      console.log('No editor found to focus on');
      return false;
    });
    
    if (!focusSuccess) {
      console.log('Could not focus on editor for paste');
      fs.unlinkSync(tempFilePath);
      return false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try a simpler approach: directly insert the image into the editor
    const insertSuccess = await page.evaluate((imageData) => {
      try {
        const bodyEditor = document.querySelector('.ProseMirror[contenteditable="true"]');
        if (bodyEditor) {
          // Create an img element
          const img = document.createElement('img');
          img.src = imageData;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          
          // Insert the image into the editor
          bodyEditor.appendChild(img);
          
          // Trigger input event to notify the editor
          bodyEditor.dispatchEvent(new Event('input', { bubbles: true }));
          
          console.log('Image inserted directly into editor');
          return true;
        }
        
        // Fallback: try any contenteditable element
        const contentEditableElements = Array.from(document.querySelectorAll('[contenteditable="true"]'));
        if (contentEditableElements.length > 0) {
          const editor = contentEditableElements[0];
          const img = document.createElement('img');
          img.src = imageData;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          
          editor.appendChild(img);
          editor.dispatchEvent(new Event('input', { bubbles: true }));
          
          console.log('Image inserted into fallback editor');
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error inserting image:', error);
        return false;
      }
    }, imageData);
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
    if (insertSuccess) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Image inserted successfully');
      return true;
    } else {
      console.log('Failed to insert image directly');
      return false;
    }
    
  } catch (error) {
    console.error('Error during image upload:', error.message);
    // Clean up temporary file if it exists
    try {
      const tempFilePath = path.join(__dirname, 'temp_image.jpg');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temporary file:', cleanupError.message);
    }
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
  category = "",
  title = "",
  imageData = "",
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
  
  // Wait 3-5 seconds before proceeding to profile operations
  const waitTime = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000; // Random time between 3-5 seconds
  await new Promise(resolve => setTimeout(resolve, waitTime));

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
      const postSuccess = await postToTokenBar(page, postContent, category, title, imageData);
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
  postToTokenBar,
  uploadImageToPost
}; 