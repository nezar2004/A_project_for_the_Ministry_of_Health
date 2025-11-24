import express from "express";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";

const app = express();

// السماح للواجهة الأمامية بالاتصال من أي مكان
app.use(cors());
app.use(bodyParser.json());

// تحميل مفتاح API من Render environment
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY
});

// API endpoint
app.post("/api/chat", async (req, res) => {
  const question = req.body.question;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { parts: [{ text: question }] }
      ]
    });

    const answer =
      response.candidates?.[0]?.content?.parts?.[0]?.text ||
      "لم يصلني رد من الذكاء الاصطناعي.";

    res.json({ answer });

  } catch (err) {
    console.error("AI ERROR:", err);
    res.json({ answer: "خطأ في الاتصال بالسيرفر." });
  }
});

// Render uses PORT from the environment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
