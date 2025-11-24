import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(express.json());

const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.post("/api/chat", async (req, res) => {
  try {
    const question = req.body.question;

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    const result = await model.generateContent(question);

    const answer = result.response.text();

    res.json({ answer });
  } catch (e) {
    console.error("AI ERROR:", e);
    res.json({ answer: "خطأ في الاتصال بالسيرفر" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
