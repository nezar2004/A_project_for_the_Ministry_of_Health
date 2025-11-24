import express from "express";
import bodyParser from "body-parser";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(bodyParser.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY // المفتاح يكون فقط على السيرفر
});

app.post("/api/chat", async (req, res) => {
  const question = req.body.question;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ text: question }],
    });
    const answer = response.candidates[0].content.parts[0].text;
    res.json({ answer });
  } catch (e) {
    console.error("AI ERROR:", e);
    res.json({ answer: "خطأ في الاتصال بالسيرفر." });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
