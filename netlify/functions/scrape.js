// Zaruri packages
const axios = require('axios');
const cheerio = require('cheerio');

// Yeh Netlify ka function handler hai
exports.handler = async function(event, context) {
    // Frontend se URL get karein
    const { url } = event.queryStringParameters;

    if (!url) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'URL is required.' })
        };
    }

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const scrapedData = [];
        // IMPORTANT: Yeh selectors aapko CodeCanyon par ja kar Inspect karke aSLI wale nikalne honge.
        $('.product-item').each((index, element) => {
            const title = $(element).find('h3.product-title a').text().trim();
            const reviews = $(element).find('.review-count').text().trim();
            const productLink = $(element).find('h3.product-title a').attr('href');

            if (title) {
                scrapedData.push({
                    title: title,
                    reviews: reviews,
                    link: productLink
                });
            }
        });

        // Data JSON format mein wapis bhejein
        return {
            statusCode: 200,
            body: JSON.stringify(scrapedData)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Data scrape karne mein masla hua.', details: error.message })
        };
    }
};