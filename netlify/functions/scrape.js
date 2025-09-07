// Nayi aur powerful libraries
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

exports.handler = async function(event, context) {
    // Frontend se URL get karein
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

        // Naya page kholein
        const page = await browser.newPage();
        
        // Is se hum browser ko ek aam insan ki tarah dikhayeinge
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // CodeCanyon ke page par jayein
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Page ka poora HTML content get karein
        const html = await page.content();
        
        // Ab Cheerio ki zarurat nahi, hum browser ke andar hi data nikalenge
        const scrapedData = await page.evaluate(() => {
            const items = [];
            // Naye selectors jo page par JavaScript chalne ke baad kaam karte hain
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
        console.error(error); // Error ko log karein taake hum Netlify par dekh sakein
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Data scrape karne mein masla hua.', details: error.message })
        };
    } finally {
        // Browser ko hamesha band karein
        if (browser !== null) {
            await browser.close();
        }
    }
};