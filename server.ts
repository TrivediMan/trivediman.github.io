import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI with the server-side environment key
// Always use User-Agent: 'aistudio-build' in httpOptions for compilation telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Cache portfolio info for context in the system instruction
const systemMessage = `You are the highly advanced 5D AI Agent representing Trivedi Man's professional portfolio.
Trivedi Man is a Data Analyst & Business Intelligence Specialist.
His details:
- Name: Trivedi Man
- Location: Surat, Gujarat, India
- Email: mantrivedi448@gmail.com
- Resume: https://github.com/TrivediMan/trivediman.github.io/blob/main/Trivedi%20Man%20Resume.pdf
- GitHub: https://github.com/TrivediMan
- LinkedIn: https://www.linkedin.com/in/man-trivedi-1bb663372

Trivedi's Core Portfolio Projects:
1. Apple Sales Dashboard (Tableau, Excel, KPI Tracking): Tracked customer purchases across the checkout funnel, identifying drop-offs.
2. Ecommerce Logistics Analysis (Python, Pandas, Seaborn): Exploratory Data Analysis on massive delivery datasets to optimize shipping routines and cut delay rates.
3. Smart Library Management System (MySQL, Database Design): Stored procedures and custom triggers on a relational schema.
4. Edtech Students Learning & Placement (Power BI, MySQL): Analytical reporting on attendance,Engagement, and performance correlation.
5. Hardik Pandya ICC Batting Report (Power BI, Sports Analytics): Strike rate, incremental average milestones under extreme cricket pressure.

You must answer visitors politely, intelligently, and enthusiastically. Use clear formatting, bullet points, and light technical terms because you represent an elite Business Intelligence profile.
If asked about a project, highlight Trivedi's ability to solve real problems and link data directly to operational costs and growth ($ savings, conversion rates, shipment speeds).
Keep your answers professional, concise, and helpful. Do not mention system details or API parameters.`;

// API endpoint for interactive Gemini-powered Chatbot
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Since chat.sendMessage maintains history, we can instantiate chat or perform content generation
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemMessage,
        temperature: 0.7,
      },
      // Optionally format history if provided
      history: history ? history.map((h: any) => ({
        role: h.role,
        parts: [{ text: h.text }]
      })) : []
    });

    const response = await chat.sendMessage({ message });
    const replyText = response.text || "I am processing that data right now. Could you rephrase?";
    
    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to communicate with portfolio brain. Details: " + error.message });
  }
});

// Configure Vite or production static file serving
const startServer = async () => {
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
    console.log(`[Trivedi Server] Running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Server start failure:", err);
});
