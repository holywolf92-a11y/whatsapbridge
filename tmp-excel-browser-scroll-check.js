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

    await page.goto('https://falishajobs.up.railway.app/admin/excel-browser', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('button', { timeout: 120000 });
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find((el) =>
        (el.textContent || '').includes('Detailed View')
      );
      if (button instanceof HTMLElement) {
        button.click();
      }
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const info = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).map((b) => (b.textContent || '').trim()).filter(Boolean);
      const tableContainer = Array.from(document.querySelectorAll('div')).find((el) => {
        const cls = el.className;
        return typeof cls === 'string' && cls.includes('overflow-auto') && el.querySelector('table');
      });
      const mainScroll = Array.from(document.querySelectorAll('div')).find((el) => {
        const cls = el.className;
        return typeof cls === 'string' && cls.includes('overflow-y-auto') && el.textContent?.includes('Candidate Browser');
      });
      const bodyText = document.body.innerText.slice(0, 2000);
      function dims(el) {
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          clientWidth: el.clientWidth,
          scrollWidth: el.scrollWidth,
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          className: el.className,
        };
      }
      return {
        bodyText,
        buttons,
        tableContainer: dims(tableContainer),
        mainScroll: dims(mainScroll),
      };
    });

    console.log(JSON.stringify(info, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
