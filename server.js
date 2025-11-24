import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

// এনভায়রনমেন্ট ভেরিয়েবল কনফিগারেশন
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ES Module এ __dirname সেটআপ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// মিডলওয়্যার (Middleware)
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // স্ট্যাটিক ফাইল সার্ভ করার জন্য

// রুট রাউট (Root Route)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API এন্ডপয়েন্ট: টেক্সট কনভারশন
app.post('/convert', async (req, res) => {
    try {
        const { text } = req.body;

        // ইনপুট ভ্যালিডেশন
        if (!text) {
            return res.status(400).json({ error: 'দয়া করে কিছু টেক্সট লিখুন।' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'সার্ভারে API Key কনফিগার করা নেই।' });
        }

        // Gemini API কল করার জন্য প্রম্পট সেটআপ
        // আমরা চাচ্ছি ইনপুট টেক্সটের বাংলা উচ্চারণ (Transliteration/Pronunciation)
        const prompt = `
        কাজ: নিচের টেক্সটটির সঠিক বাংলা উচ্চারণ (Bangla Pronunciation) লিখুন।
        নিয়ম: 
        ১. অন্য কোনো কথা বলবেন না, শুধু উচ্চারণ আউটপুট দেবেন।
        ২. ইমোজি থাকলে তা রেখে দেবেন।
        ৩. আউটপুটটি খুব সহজবোধ্য বাংলা বানানে হতে হবে।
        
        টেক্সট: "${text}"
        `;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        // এরর হ্যান্ডলিং (API থেকে এরর আসলে)
        if (data.error) {
            throw new Error(data.error.message);
        }

        // রেসপন্স এক্সট্রাকশন
        const resultText = data.candidates[0].content.parts[0].text;

        res.json({ result: resultText.trim() });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'দুঃখিত, প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।' });
    }
});

// সার্ভার চালু করা
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
