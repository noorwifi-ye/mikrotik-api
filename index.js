const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// مسار الفحص
app.post('/api/check-network', async (req, res) => {
    const { url, username, password } = req.body;

    if (!url || !username || !password) {
        return res.status(400).json({ error: 'بيانات ناقصة' });
    }

    let browser;
    try {
        console.log(`\n=============================`);
        console.log(`جاري فحص: ${url}`);

        // استخدام متصفح كروم المثبت في جهازك الويندوز
       // استبدل الجزء الخاص بالـ launch في index.js بهذا الكود:
       browser = await puppeteer.launch({
           headless: "new",
           args: [
               '--no-sandbox',
               '--disable-setuid-sandbox',
               '--disable-dev-shm-usage', // مهم جداً للاستضافات السحابية
               '--disable-gpu'            // لمنع أخطاء كرت الشاشة
           ]
       });

        const page = await browser.newPage();

        console.log("-> فتح الصفحة...");
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        console.log("-> إدخال بيانات الدخول...");
        await page.type('input[type="text"]', username);
        await page.type('input[type="password"]', password);
        await page.click('button');

        console.log("-> انتظار استقرار الجلسة...");
        await page.waitForTimeout(5000);

        const interfacesUrl = url.split('#')[0] + '#Interfaces';
        await page.goto(interfacesUrl, { waitUntil: 'networkidle2' });

        console.log("-> انتظار تحميل الجدول (8 ثواني)...");
        await page.waitForTimeout(8000);

        console.log("-> سحب البيانات...");
        const disconnectedUsers = await page.evaluate(() => {
            let results = [];
            let rows = document.querySelectorAll('tr');
            rows.forEach(row => {
                let text = row.textContent.toLowerCase();
                if (text.includes('pppoe')) {
                    if (!text.includes('r') && !text.includes('x')) {
                        results.push(row.textContent.trim().replace(/\s+/g, ' '));
                    }
                }
            });
            return results;
        });

        console.log(`-> تم العثور على ${disconnectedUsers.length} مفصولين.`);
        res.json({ success: true, count: disconnectedUsers.length, data: disconnectedUsers });

    } catch (error) {
        console.error("حدث خطأ:", error.message);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 الخادم الوسيط يعمل بنجاح ومستعد لاستقبال الطلبات على المنفذ ${PORT}`);
});