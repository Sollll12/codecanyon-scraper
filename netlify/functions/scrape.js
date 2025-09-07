// Nayi aur behtar library istemal kar rahe hain
const chromium = require('@sparticuz/chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

exports.handler = async function(event, context) {
    const { url } = event.queryStringParameters;
    if (!url) {
        return { statusCode: 400, body: JSON.stringify({ error: 'URL is required.' }) };
    }
    
    let browser = null;

    try {
        // Headless browser ko tayyar karein
        browser = await puppeteer.launch({
            args: chromium.args,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });
        
        const page = await browser.newPage();
        
        // Page ko load hone ke liye poora time dein
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

        // Page ke andar se data nikalein
        const scrapedData = await page.evaluate(() => {
            const items = [];
            document.querySelectorAll('div[class^="ProductCard_container"]').forEach(element => {
                const titleElement = element.querySelector('h3 a');
                const reviewsElement = element.querySelector('span[class^="ProductCard_ratingCount"]');
                if (titleElement) {
                    items.push({
                        title: titleElement.innerText.trim(),
                        link: titleElement.href,
                        reviews: reviewsElement ? reviewsElement.innerText.trim().replace('(', '').replace(')', '') : 'N/A'
                    });
                }
            });
            return items;
        });

        return { 
            statusCode: 200, 
            body: JSON.stringify(scrapedData) 
        };

    } catch (error) {
        console.error("Puppeteer Error:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Puppeteer scrape karne mein masla hua.', details: error.message }) 
        };
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
};