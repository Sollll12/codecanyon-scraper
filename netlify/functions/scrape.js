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
        // ===== CHANGE #1: User-Agent Header Add Kiya Gaya Hai =====
        // Yeh CodeCanyon ko batata hai ke hum ek real browser hain, taake woh humein block na kare.
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const scrapedData = [];

        // ===== CHANGE #2: Selectors Ko Update Kiya Gaya Hai =====
        // CodeCanyon ne apna design badal diya hai, isliye naye selectors zaruri hain.
        $('div[class^="ProductCard_container"]').each((index, element) => {
            const titleElement = $(element).find('h3 a');
            const title = titleElement.text().trim();
            const productLink = titleElement.attr('href');
            
            // Reviews ka selector alag ho sakta hai
            const reviews = $(element).find('span[class^="ProductCard_ratingCount"]').text().trim();

            if (title && productLink) {
                scrapedData.push({
                    title: title,
                    reviews: reviews.replace('(', '').replace(')', ''), // Extra characters ( ) saaf karne ke liye
                    link: productLink
                });
            }
        });

        // Agar koi data na mile to message bhejein
        if (scrapedData.length === 0) {
             return {
                statusCode: 200,
                body: JSON.stringify([{ title: "Koi item nahi mila.", reviews: "Ho sakta hai CodeCanyon ne design badal diya ho, ya yeh page khali hai.", link: "#" }])
            };
        }

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