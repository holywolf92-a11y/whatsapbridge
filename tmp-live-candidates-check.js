const puppeteer = require('./recruitment-portal-frontend/node_modules/puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const events = [];

  page.on('console', (msg) => {
    events.push({ type: 'console', level: msg.type(), text: msg.text() });
  });

  page.on('pageerror', (error) => {
    events.push({ type: 'pageerror', text: error.message, stack: error.stack || null });
  });

  page.on('requestfailed', (request) => {
    events.push({
      type: 'requestfailed',
      url: request.url(),
      errorText: request.failure() ? request.failure().errorText : 'unknown',
    });
  });

  const responses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/assets/index-')) {
      responses.push({ url, status: response.status() });
    }
  });

  try {
    await page.goto('https://falishajobs.up.railway.app/', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.type('input[type="email"]', 'admin@falisha.com', { delay: 20 });
    await page.type('input[type="password"]', 'admin123', { delay: 20 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ]);

    await page.goto('https://falishajobs.up.railway.app/admin/candidates', { waitUntil: 'networkidle2', timeout: 120000 });

    const snapshots = [];
    for (const waitMs of [1000, 3000, 8000, 15000]) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      const snapshot = await page.evaluate((elapsed) => ({
        elapsed,
        url: location.href,
        title: document.title,
        bodyText: document.body.innerText.slice(0, 1200),
        rootHtmlLength: document.getElementById('root')?.innerHTML.length || 0,
      }), waitMs);
      snapshots.push(snapshot);
    }

    console.log(JSON.stringify({ snapshots, events, responses }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
