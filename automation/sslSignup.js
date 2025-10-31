const path = require('path');
const fs = require('fs');
const axios = require('axios');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const logger = require('../middlewares/logger');

puppeteer.use(StealthPlugin());

const GUERRILLA_BASE = 'https://www.guerrillamail.com/ajax.php';
const DEFAULT_PASSWORD = process.env.SSL_SIGNUP_PASSWORD || 'TopOne1990@';

/**
 * Simple delay helper.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Request a new temporary GuerrillaMail inbox.
 * @returns {Promise<{ email: string, sidToken: string }>}
 */
async function createTempInbox() {
  const { data } = await axios.get(GUERRILLA_BASE, {
    params: {
      f: 'get_email_address',
      ip: '127.0.0.1',
      agent: 'Mozilla/5.0',
    },
    timeout: 10000,
  });

  if (!data?.sid_token || !data?.email_addr) {
    throw new Error('Failed to obtain temporary email address');
  }

  const email = data.email_addr;
  const sidToken = data.sid_token;

  logger.info({ message: 'Temporary email acquired', email });

  return { email, sidToken };
}

/**
 * Fetch the full email body for a given GuerrillaMail message.
 * @param {string} sidToken
 * @param {number|string} emailId
 * @returns {Promise<string>}
 */
async function fetchEmailBody(sidToken, emailId) {
  const { data } = await axios.get(GUERRILLA_BASE, {
    params: {
      f: 'fetch_email',
      sid_token: sidToken,
      email_id: emailId,
    },
    timeout: 10000,
  });

  return data?.mail_body || '';
}

/**
 * Poll GuerrillaMail for a verification code.
 * @param {string} sidToken
 * @param {object} [options]
 * @param {number} [options.timeoutMs=120000]
 * @param {number} [options.pollIntervalMs=5000]
 * @param {RegExp} [options.codePattern=/\b(\d{4,8})\b/]
 * @returns {Promise<string>}
 */
async function waitForVerificationCode(
  sidToken,
  {
    timeoutMs = 120000,
    pollIntervalMs = 5000,
    codePattern = /\b(\d{4,8})\b/,
  } = {},
) {
  const start = Date.now();
  const seenMailIds = new Set();

  while (Date.now() - start < timeoutMs) {
    const { data } = await axios.get(GUERRILLA_BASE, {
      params: {
        f: 'get_email_list',
        sid_token: sidToken,
        offset: 0,
      },
      timeout: 10000,
    });

    const list = data?.list || [];
    for (const mail of list) {
      if (seenMailIds.has(mail.mail_id)) {
        continue;
      }

      seenMailIds.add(mail.mail_id);

      const body = await fetchEmailBody(sidToken, mail.mail_id);
      // Prefer Sosovalue-styled code highlight first
      const styledMatch = body.match(/color:\s*#ff4f20[^>]*>(\d{4,8})/i);
      if (styledMatch) {
        const code = styledMatch[1];
        logger.info({ message: 'Verification code (styled) received', code });
        return code;
      }

      const match = body.match(codePattern);
      if (match) {
        const code = match[1] || match[0];
        logger.info({ message: 'Verification code received', code });
        return code;
      }
    }

    await delay(pollIntervalMs);
  }

  throw new Error('Timed out while waiting for verification email');
}

/**
 * Fill a multi-input verification code form if needed.
 * @param {import('puppeteer').Page} page
 * @param {string} code
 */
async function fillVerificationCode(page, code) {
  // Try direct inputs first
  const singleInput = await page.$('input[placeholder*="code" i], input[name*="code" i], input[autocomplete*="one-time-code" i]');
  if (singleInput) {
    await singleInput.click({ clickCount: 3 });
    await singleInput.type(code, { delay: 50 });
    return;
  }

  const digitInputs = await page.$$('input[maxlength="1"], input[data-testid*="otp"], input[aria-label*="digit" i]');
  if (digitInputs.length >= code.length) {
    for (let i = 0; i < code.length; i += 1) {
      await digitInputs[i].type(code[i], { delay: 80 });
    }
    return;
  }

  // Sosovalue renders an invisible input in the container
  const otpContainer = await page.$('.flex.gap-2');
  if (otpContainer) {
    const hiddenInput = await otpContainer.$('input');
    if (hiddenInput) {
      await hiddenInput.focus();
      await hiddenInput.evaluate((el) => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await hiddenInput.type(code, { delay: 80 });
      return;
    }

    const spanDigits = await otpContainer.$$('span');
    if (spanDigits.length >= code.length) {
      try {
        await spanDigits[0].click({ clickCount: 1 });
      } catch (e) {
        // ignore
      }
      await page.keyboard.type(code, { delay: 80 });
      return;
    }
  }

  throw new Error('Unable to locate verification code input fields');
}

/**
 * Attempt to click a button (button/a) whose text matches the provided pattern.
 * @param {import('puppeteer').Page} page
 * @param {RegExp} pattern
 * @returns {Promise<boolean>}
 */
async function clickByText(page, pattern, { preferLast = false, timeout = 30000 } = {}) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const clicked = await page.evaluate(({ patternSource, flags, preferLast: prefLast }) => {
      const regex = new RegExp(patternSource, flags || 'i');
      const candidates = Array.from(document.querySelectorAll('button, a, span, div'));

      if (prefLast) {
        for (let i = candidates.length - 1; i >= 0; i -= 1) {
          const el = candidates[i];
          if (regex.test(el.textContent || '')) {
            el.click();
            return true;
          }
        }
        return false;
      }

      const target = candidates.find((el) => regex.test(el.textContent || ''));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, { patternSource: pattern.source, flags: pattern.flags, preferLast });

    if (clicked) {
      return true;
    }

    await page.waitForTimeout(250);
  }

  return false;
}

/**
 * Create a Sosovalue account using a temporary GuerrillaMail inbox.
 * @param {object} [options]
 * @param {string} [options.password] Password to use (default from env or fallback)
 * @param {string} [options.profileName] Puppeteer profile folder name
 * @param {number} [options.codeTimeoutMs] Max time to wait for verification email
 * @returns {Promise<{ email: string, password: string }>}
 */
async function createSSLAccount({
  password = DEFAULT_PASSWORD,
  profileName = `ssl-signup-${Date.now()}`,
  codeTimeoutMs = 120000,
} = {}) {
  const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const profilePath = path.resolve(process.cwd(), 'profiles', profileName);

  if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
  }

  const { email, sidToken } = await createTempInbox();

  const browser = await puppeteer.launch({
    userDataDir: profilePath,
    executablePath: chromePath,
    headless: false,
    args: ['--start-maximized'],
    defaultViewport: null,
  });

  try {
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // Approach Sosovalue the same way the posting automation does to reduce captcha prompts
    await page.goto('https://sosovalue.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000);
    await page.goto('https://sosovalue.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await delay(2000);
    await page.goto('https://sosovalue.com', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const waitTime = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000; // 3-5 seconds
    await delay(waitTime);
    

    const signUpClicked = await clickByText(page, /Sign Up/i, { preferLast: true, timeout: 40000 });
    if (!signUpClicked) {
      throw new Error('Sign Up button not found on Sosovalue landing page');
    }
    await delay(5000);

    const emailInput = await page.waitForSelector(
      'input[placeholder="Enter email"]',
      { visible: true, timeout: 30000 },
    );
    if (!emailInput) {
      throw new Error('Email input not found on Sosovalue signup form');
    }
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(email, { delay: 50 });

    const passwordInput = await page.waitForSelector(
      'input[type="password"][placeholder*="password" i]',
      { visible: true, timeout: 30000 },
    );
    if (!passwordInput) {
      throw new Error('Password input not found on Sosovalue signup form');
    }
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(password, { delay: 50 });

    await delay(5000);

    // confirm password input
    const confirmSelectors = [
      'input[autocomplete="new-password"][placeholder*="password" i]',
      'input[placeholder*="confirm password" i]',
      'input[name*="confirm" i][type="password"]',
      'input[placeholder*="re-enter" i]',
      'input[placeholder*="repeat password" i]',
    ];
    const combinedConfirmSelector = confirmSelectors.join(',');
    await page.waitForSelector(combinedConfirmSelector, { visible: true, timeout: 30000 });
    const confirmPasswordInputs = await page.$$(combinedConfirmSelector);

    const confirmPasswordInput = confirmPasswordInputs[0];

    // If there are multiple confirm inputs, fill all of them (leave the first to be handled below)
    if (confirmPasswordInputs.length > 1) {
      // for (let i = 1; i < confirmPasswordInputs.length; i += 1) {
      try {
        await confirmPasswordInputs[1].click({ clickCount: 3 });
        await confirmPasswordInputs[1].type(password, { delay: 50 });
      } catch (e) {
        // ignore errors for individual inputs
      }
      // }
    }

    // if (!confirmPasswordInput) {
    //   throw new Error('Confirm password input not found on Sosovalue signup form');
    // }
    // await confirmPasswordInput.click({ clickCount: 3 });
    // await confirmPasswordInput.type(password, { delay: 50 });

    await delay(5000);
    // Try to submit the signup form — look for common labels including "Next"
    // const submitClicked = await clickByText(page, /Next/i);
    const submitClicked = await clickByText(page, /Next/i, { preferLast: true, timeout: 40000 });
    if (!submitClicked) {
      throw new Error('Unable to locate Next button on signup form');
    }
    

    const codePromise = waitForVerificationCode(sidToken, { timeoutMs: codeTimeoutMs });

    // await page.waitForSelector(
    //   'input[placeholder*="code" i], input[name*="code" i], input[autocomplete*="one-time-code" i], input[maxlength="1"]',
    //   { visible: true, timeout: 60000 },
    // );

    const verificationCode = await codePromise;

    await fillVerificationCode(page, verificationCode);

    const verifyClicked = await clickByText(page, /verify|confirm|submit/i);
    if (!verifyClicked) {
      // If there is no explicit verify button, try submitting via Enter key
      await page.keyboard.press('Enter');
    }

    logger.info({ message: 'SSL account created successfully', email });
    return { email, password };
  } finally {
    if (browser && browser.isConnected()) {
      await browser.close();
    }
  }
}

module.exports = {
  createSSLAccount,
  createTempInbox,
  waitForVerificationCode,
};
