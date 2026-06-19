const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

app.post('/api/check-network', async (req, res) => {
    const { url, username, password } = req.body;
    let browser = null;

    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });

        const page = await browser.newPage();
        // زيادة المهلة لتضمن تحميل كامل الصفحة
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });

        // تسجيل الدخول
        await page.waitForSelector('input[name="user"]');
        await page.type('input[name="user"]', username);
        await page.type('input[name="pwd"]', password);
        await page.click('button[type="submit"]');

        // ننتظر تحميل الصفحة الرئيسية بعد تسجيل الدخول
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        // سحب البيانات: نبحث عن الصفوف التي تحتوي على الكلاس disabled
        // ونستخرج النص الموجود في العمود الخاص بالاسم (عادة يكون أول أو ثاني عمود)
        const disconnected = await page.evaluate(() => {
            const rows = document.querySelectorAll('tr.disabled');
            return Array.from(rows).map(row => {
                // نأخذ النص من أول خلية أو ثاني خلية في الجدول
                const nameCell = row.querySelector('td') || row;
                return nameCell.innerText.trim();
            });
        });

        await browser.close();
        res.json({ success: true, data: disconnected });

    } catch (error) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(process.env.PORT || 3000, () => console.log('السيرفر يعمل الآن...'));