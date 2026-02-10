const { firefox } = require('playwright'); 

// 設定執行間隔：10 分鐘
const INTERVAL = 10 * 60 * 1000;

async function boostTraffic() {
  const url = process.env.URL;

  const browser = await firefox.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: {
      width: 1280 + Math.floor(Math.random() * 100),
      height: 800 + Math.floor(Math.random() * 100),
    },
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
  });

  const page = await context.newPage();

  await page.addInitScript(() => {
    const originalOpen = window.open;
    window.open = function(url, ...args) {
      if (!url || url === 'about:blank') {
        console.log('阻止了約 about:blank 的開啟');
        return null;
      }
      return originalOpen.apply(this, [url, ...args]);
    };
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
    });
    
    try {
      const proto = window.location.constructor.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'href');
      if (desc && desc.set) {
        const origSet = desc.set;
        Object.defineProperty(proto, 'href', {
          ...desc,
          set(val) {
            if (val && val.includes('about:blank')) return;
            return origSet.call(this, val);
          }
        });
      }
    } catch (_) {}
  });

  try {
    console.log(`[${new Date().toLocaleTimeString()}] 開始模擬真人瀏覽 (Firefox)...`);

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`[資訊] 頁面載入完成，URL: ${page.url()}`);

    for (let i = 0; i < 3; i++) {
      await page.mouse.move(Math.random() * 800, Math.random() * 600, { steps: 10 });
      await page.waitForTimeout(500 + Math.random() * 1000);
    }

    const agreeBtn = page.locator('.statement-confirm');
    if (await agreeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await agreeBtn.click();
      console.log('已處理隱私聲明');
    }

    console.log('正在模擬閱讀物件資訊...');
    for (let i = 0; i < 5; i++) {
      const scrollY = 200 + Math.floor(Math.random() * 300);
      await page.mouse.wheel(0, scrollY);
      await page.waitForTimeout(1000 + Math.random() * 2000);
    }

    console.log('確認進入物件頁面，流量載入成功。');

    const stayTime = 10000 + Math.random() * 20000;
    console.log(`預計停留 ${(stayTime / 1000).toFixed(1)} 秒...`);
    await page.waitForTimeout(stayTime);

  } catch (error) {
    console.error(`執行過程中發生異常: ${error.message}`);
    console.error(`[除錯] 當時頁面 URL: ${page.url()}`);
    try { await page.screenshot({ path: `debug_${Date.now()}.png` }); } catch (_) {}
  } finally {
    await context.close();
    await browser.close();
    console.log(`[${new Date().toLocaleTimeString()}] 關閉瀏覽器...\n`);
  }
}

boostTraffic();

setInterval(() => {
  boostTraffic();
}, INTERVAL);