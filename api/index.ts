import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// Server-side initialization of GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// API route for Gemini Insights
app.post("/api/ai/insights", async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY environment variable is not configured on Vercel.",
      });
    }

    const { prompt, systemInstruction } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt || "Provide academic encouragement.",
      config: {
        systemInstruction: systemInstruction || "You are a professional academic advisor at Al-Suffa Science & Grammar Schools, Lahore. Provide structured, constructive, and highly encouraging advice in markdown format.",
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate AI response" });
  }
});

export default app;
