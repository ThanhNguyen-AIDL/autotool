
async function findByText(page, text) {
    return await page.evaluateHandle((text) => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.find(el => el.textContent.includes(text));
    }, text);
}


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


async function doLogin(page) {
    const email = "badkil@bumba.sbs"
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
        console.error('Error logging in:', err.message);
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
      console.error('Error checking account:', err.message);
      return false;
    }
  }
}




module.exports = {
    canLogin,
    doLogin,
    checkSuspendedAcct
}