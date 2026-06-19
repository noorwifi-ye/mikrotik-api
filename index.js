const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
app.use(express.json());

app.post('/api/check-network', async (req, res) => {
    const { url, username, password } = req.body;
    try {
        // سحب كود الصفحة مباشرة (أخف من المتصفح)
        const response = await axios.get(url, {
            auth: { username, password },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);
        let disconnected = [];

        // البحث عن الصفوف المعطلة في الـ HTML مباشرة
        $('tr.disabled').each((i, el) => {
            disconnected.push($(el).text().trim());
        });

        res.json({ success: true, data: disconnected });
    } catch (error) {
        res.status(500).json({ success: false, error: "فشل سحب البيانات: " + error.message });
    }
});

app.listen(process.env.PORT || 3000);