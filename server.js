// ================= Node.js Server =================
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve frontend

// Gemini API endpoint
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`;

// POST endpoint for pronunciation
app.post("/convert", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text missing" });
  
  const prompt = `
  তুমি একজন বাংলা ফনেটিক উচ্চারণ রোবট।
  শুধুমাত্র বাংলা উচ্চারণ দেবে। কোনো ব্যাখ্যা নয়।
  ইংরেজি শব্দ: "${text}"
  আউটপুট শুধু বাংলা উচ্চারণ:
  `;
  
  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const data = await response.json();
    const output = data?.candidates?.[0]?.content?.parts?.[0]?.text || "উচ্চারণ পাওয়া যায়নি";
    
    res.json({ output });
    
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));