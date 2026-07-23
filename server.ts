import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side initialization of GoogleGenAI with appropriate headers
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
          error: "Gemini API key is missing. Please configure GEMINI_API_KEY in the Settings > Secrets panel.",
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
