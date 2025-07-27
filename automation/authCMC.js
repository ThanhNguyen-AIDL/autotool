
const path = require('path');
const fs = require('fs');
const trendingTokens = ['$ETH', '$SOL', '$USDT', '$BTC']; // example
const repostText = ['Nice project!', 'Check this out!', 'Bullish on this.', '🔥🔥🔥'];
const logger = require('../middlewares/logger')

async function canLogin(page) {
    let browser;
    try {
        // Wait for the "Log In" button to appear (text-based XPath)
        const [loginButton] = await page.$$("xpath/.//*[text()='Log In']");

        if (loginButton) {
            return true;
        } else {
            return false;
        }
    } catch (err) {
        console.error('Error:', err.message);
        return true; // same as original fallback behavior
    } finally {
        if (browser) await browser.close();
    }
}


async function doLogin(page, email) {
    const password = 'TopOne1990@'
    try {
        if (await canLogin(page)) {
            const [loginButton] = await page.$$("xpath/.//*[text()='Log In']");
            if (loginButton) {
                await loginButton.click();

                // Wait for login form and enter email
                await page.waitForSelector('input[type="email"]', { timeout: 20000 });
                await page.type('input[type="email"]', email, { delay: 50 });

                // Enter password
                await page.waitForSelector('input[type="password"]', { timeout: 10000 });
                await page.type('input[type="password"]', password, { delay: 50 });

                await page.keyboard.press('Enter');
                await new Promise(resolve => setTimeout(resolve, 5000));
                return true
            }
        }
        else{
            return true;
        }
    }
    catch (err) {
        logger.error({message:'Error logging in: '+ err.message});
        return false;
    }
}

async function checkSuspendedAcct(page) {
  try {
    // Wait for user avatar dropdown button to be visible and click
    await page.waitForSelector("[class^='UserDropdown_user-avatar']", { visible: true, timeout: 20000 });
    await page.click("[class^='UserDropdown_user-avatar']");

    // Wait for user email/name button and click it
    await page.waitForSelector("[class^='AvatarDropdownHeader_user-name']", { visible: true, timeout: 20000 });
    await page.click("[class^='AvatarDropdownHeader_user-name']");

    // Wait until page contains "Account suspended"
    const isSuspended = await page.waitForFunction(
      () => document.body.innerText.includes('Account suspended'),
      { timeout: 10000 }
    );

    return !!isSuspended;
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return false; // Timeout = not suspended
    } else {
        logger.error({message:'Error logging in: '+ err.message});

      return false;
    }
  }
}

async function postComment(page, postContent, mainAccountTag = "", imageData = "") {
    let editorInputsCommunity, baseEditor, editElement;

    try {
        // Wait for ".editor.inputs.community"
        editorInputsCommunity = await page.waitForSelector('.editor.inputs.communityHomepage', { timeout: 10000 });
        if (!editorInputsCommunity) {
        throw new Error("Could not find element with classes 'editor inputs community'.");
        }
    } catch (e) {
        throw new Error("Could not find element with classes 'editor inputs community'.");
    }

    try {
        // Find child: .base-editor
        baseEditor = await editorInputsCommunity.$('.base-editor');
        if (!baseEditor) throw new Error("Could not find '.base-editor' inside editor inputs");

        // Find [role="textbox"] inside baseEditor
        editElement = await baseEditor.$('[role="textbox"]');
        if (!editElement) throw new Error("Could not find [role='textbox']");

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Random sample 2 coins
        await page.keyboard.press('Enter');
        const coins = shuffle(trendingTokens).slice(0, 2);
        for (const coin of coins) {
            await editElement.type(" ", { delay: 100 });
            await editElement.type(coin, { delay: 100 });
            await new Promise(resolve => setTimeout(resolve, 2000));
            await page.keyboard.press('Enter');
            
        }
        await page.keyboard.press('Enter');
        
        // Add main account tag if provided
        if (mainAccountTag && mainAccountTag.trim()) {
            const tagText = `follow our channel at ${mainAccountTag}`;
            await editElement.type(" ", { delay: 100 });
            await editElement.type(tagText, { delay: 100 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.keyboard.press('Enter');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Add image if provided (before text content)
        if (imageData && imageData.trim()) {
            await uploadImageToCMCPost(page, imageData);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        await editElement.type(postContent, { delay: 50 });
        
        const postButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => btn.textContent.trim().toLowerCase() === 'post');
        });

        if (postButton) {
            logger.info({message:'POST CLICKED'});

            await postButton.click();
            await new Promise(resolve => setTimeout(resolve, 10000));

        }
    } catch (e) {
        console.error(`Failed to enter text: ${e.message}`);
    }

}

// Helper: random array element
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: shuffle array
function shuffle(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

/**
 * Upload image to CMC post using file input
 * @param {Object} page - Puppeteer page object
 * @param {string} imageData - Base64 image data
 * @returns {Promise<boolean>} True if image upload successful
 */
async function uploadImageToCMCPost(page, imageData) {
  try {
    console.log('Starting CMC image upload process...');
    
    // Convert base64 to buffer and create temporary file
    const buffer = Buffer.from(imageData.split(',')[1], 'base64');
    const tempFilePath = path.join(__dirname, 'temp_image.jpg');
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log('Temporary file created:', tempFilePath);
    
    // First, try to find a file input element
    let fileInput = await page.$('input[type="file"]');
    
    // If no file input found, look for upload buttons
    if (!fileInput) {
      console.log('No file input found, looking for upload buttons...');
      
      // Look for buttons with image/upload related text or aria-labels
      const uploadButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => {
          const text = btn.textContent.toLowerCase();
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const className = btn.className.toLowerCase();
          
          return text.includes('image') || text.includes('upload') || text.includes('attach') ||
                 ariaLabel.includes('image') || ariaLabel.includes('upload') || ariaLabel.includes('attach') ||
                 className.includes('image') || className.includes('upload') || className.includes('attach');
        });
      });
      
      if (uploadButton) {
        console.log('Found upload button, clicking...');
        await uploadButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to find file input again after clicking the button
        fileInput = await page.$('input[type="file"]');
      }
    }
    
    // If we found a file input, upload the file
    if (fileInput) {
      console.log('Found file input, uploading image...');
      await fileInput.uploadFile(tempFilePath);
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Image uploaded successfully');
      
      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
      return true;
    } else {
      console.log('No file input found for image upload');
      
      // Clean up temporary file
      fs.unlinkSync(tempFilePath);
      return false;
    }
    
  } catch (error) {
    console.error('Error during CMC image upload:', error.message);
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



module.exports = {
    canLogin,
    doLogin,
    checkSuspendedAcct,
    postComment,
    uploadImageToCMCPost
}