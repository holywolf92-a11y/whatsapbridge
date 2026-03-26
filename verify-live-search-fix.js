const puppeteer = require('./recruitment-portal-frontend/node_modules/puppeteer');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(page) {
  await page.goto('https://falishajobs.up.railway.app/', { waitUntil: 'networkidle2', timeout: 120000 });

  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.type('input[type="email"]', 'admin@falisha.com', { delay: 50 });
  await page.type('input[type="password"]', 'admin123', { delay: 50 });

  const signInButton = await page.$('button[type="submit"]');
  if (!signInButton) {
    throw new Error('Sign in button not found');
  }

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }).catch(() => null),
    signInButton.click(),
  ]);
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(120000);

    await login(page);
    await page.goto('https://falishajobs.up.railway.app/admin/candidates', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('input[role="searchbox"]', { timeout: 120000 });

    const inputSelector = 'input[role="searchbox"]';
    await page.click(inputSelector);

    const term = 'support';
    const snapshots = [];

    for (const char of term) {
      await page.type(inputSelector, char, { delay: 30 });
      await wait(700);

      const snapshot = await page.evaluate((selector) => {
        const input = document.querySelector(selector);
        const active = document.activeElement === input;
        const value = input ? input.value : null;
        const bodyText = document.body.innerText || '';
        const showsUpdating = bodyText.includes('Updating results...');
        const showsResult = bodyText.includes('QA Auto Poll 1774267481884') || bodyText.includes('support@falishajobs.com');
        return { active, value, showsUpdating, showsResult };
      }, inputSelector);

      snapshots.push({ char, ...snapshot });
    }

    const finalState = await page.evaluate((selector) => {
      const input = document.querySelector(selector);
      const bodyText = document.body.innerText || '';
      return {
        value: input ? input.value : null,
        active: document.activeElement === input,
        resultSummary: bodyText.includes('Showing 1 of 1 candidates'),
        resultEmail: bodyText.includes('support@falishajobs.com'),
        deleteButtonVisible: bodyText.includes('Delete Candidate'),
      };
    }, inputSelector);

    console.log(JSON.stringify({ snapshots, finalState, url: page.url() }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
