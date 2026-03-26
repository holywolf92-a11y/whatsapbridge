const puppeteer = require('./recruitment-portal-frontend/node_modules/puppeteer');

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  try {
    await page.goto('https://falishajobs.up.railway.app/', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.type('input[type="email"]', 'admin@falisha.com', { delay: 20 });
    await page.type('input[type="password"]', 'admin123', { delay: 20 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 120000 }).catch(() => null),
      page.click('button[type="submit"]'),
    ]);
    await page.goto('https://falishajobs.up.railway.app/admin/candidates', { waitUntil: 'networkidle2', timeout: 120000 });
    await new Promise((resolve) => setTimeout(resolve, 15000));
    const state = await page.evaluate(() => ({
      bodyText: document.body.innerText.slice(0, 5000),
      rootHtmlLength: document.getElementById('root')?.innerHTML.length || 0,
    }));
    console.log(JSON.stringify(state, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
