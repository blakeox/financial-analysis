import puppeteer from '@cloudflare/puppeteer';

interface RenderPageToHtmlOptions {
  binding: Fetcher;
  url: string;
  keepAliveMs?: number;
}

export async function renderPageToHtml({
  binding,
  url,
  keepAliveMs = 60_000,
}: RenderPageToHtmlOptions): Promise<string> {
  const browser = await puppeteer.launch(binding, { keep_alive: keepAliveMs });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (compatible; FanalyxBrowserRender/1.0; +https://fanalyx.com)'
    );
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30_000,
    });
    return await page.content();
  } finally {
    await browser.close();
  }
}
