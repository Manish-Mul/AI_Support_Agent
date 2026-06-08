import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import chatRouter from "./routes/chat";
import { errorHandler, notFound } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

// Middleware

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "50kb" })); // prevent large payload attacks

// Rate limit: 60 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});
app.use(limiter);

// Routes 

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/chat", chatRouter);

// Error handling

app.use(notFound);
app.use(errorHandler);

// Start

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      "⚠️ GEMINI_API_KEY is not set — LLM calls will fail."
    );
  }
  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL is not set — DB calls will fail.");
  }
});

export default app;
