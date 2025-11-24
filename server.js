const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ربط الـ API KEY مباشرة
const client = new OpenAI({
    apiKey: "sk-AIzaSyBiAd1bsc-PAGZfodjm3wQo0svWeXYN-V4"  // حطي مفتاح OpenAI الصحيح هنا
});

app.post("/api/chat", async (req, res) => {
    const question = req.body.question?.trim();

    if (!question) {
        return res.json({ answer: "لم يتم استلام أي سؤال." });
    }

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "أنت مساعد ذكي وودود، أجب على أي سؤال يطرحه المستخدم." },
                { role: "user", content: question }
            ]
        });

        res.json({ answer: completion.choices[0].message.content });

    } catch (e) {
        console.error("AI ERROR:", e);
        res.json({ answer: "خطأ في الاتصال بالسيرفر." });
    }
});

// مهم جداً للـ Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
