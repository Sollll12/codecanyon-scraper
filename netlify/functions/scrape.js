const axios = require('axios');

exports.handler = async function(event, context) {
    // Netlify ki tijori se API key nikalein
    const apiKey = process.env.ENVATO_API_KEY;

    // Agar API key nahi hai to error dein
    if (!apiKey) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Server par API key set nahi hai.' }) };
    }
    
    // Envato API ka URL (CodeCanyon ke popular items ke liye)
    const apiUrl = 'https://api.envato.com/v3/market/popular?site=codecanyon.net';

    try {
        // API ko request bhejein, saath mein key bhi
        const response = await axios.get(apiUrl, {
            headers: {
                // API key ko is tarah "Bearer Token" ke taur par bhejna zaroori hai
                'Authorization': `Bearer ${apiKey}`
            }
        });

        // API se jo data mila hai, usay saaf suthra karein taake hamara dashboard usay samjh sake
        const items = response.data.popular.items_last_week;
        
        const apiData = items.map(item => ({
            title: item.name,
            reviews: String(item.rating.count), // Rating count ko string banayein
            link: item.url
        }));
        
        // Data ko frontend par bhej dein
        return {
            statusCode: 200,
            body: JSON.stringify(apiData)
        };

    } catch (error) {
        // Agar API se data lene mein koi masla ho to, isay handle karein
        console.error("API Error:", error.response ? error.response.data : error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Envato API se data lene mein masla hua. Key theek hai?' })
        };
    }
};