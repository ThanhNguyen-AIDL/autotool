
const trendingTokens = ['$ETH', '$SOL', '$DOGE', '$SHIB', '$BTC']; // example
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

async function postComment(page, postContent) {
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



module.exports = {
    canLogin,
    doLogin,
    checkSuspendedAcct,
    postComment
}