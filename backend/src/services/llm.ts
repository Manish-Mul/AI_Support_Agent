import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { Message } from "../db/repository";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const MAX_HISTORY_MESSAGES = 20; // cap context window for cost control
const MAX_TOKENS = 512;

// Store FAQ / domain knowledge here. Could be moved to DB in future.
const SYSTEM_PROMPT = `You are a friendly and professional customer support agent for "Spark & Co.", a small e-commerce store that sells premium home goods and lifestyle accessories.

STORE KNOWLEDGE BASE:
---
🚚 SHIPPING POLICY
- Standard shipping: 5-7 business days (free on orders over ₹999 / $15)
- Express shipping: 2-3 business days (₹299 / $5 flat fee)
- International shipping: 10-15 business days (rates vary by country)
- We ship to India, USA, UK, Canada, Australia, and most EU countries.
- Orders placed before 2 PM IST on weekdays are dispatched same day.

↩️ RETURN & REFUND POLICY
- Returns accepted within 30 days of delivery for unused, original-condition items.
- To initiate a return, email returns@sparkandco.store with your order number.
- Refunds are processed within 5-7 business days after we receive the item.
- Sale/clearance items are final sale — no returns.
- Damaged or defective items: we'll send a replacement at no charge, no return needed.

🕐 SUPPORT HOURS
- Monday-Friday: 9 AM - 6 PM IST
- Saturday: 10 AM - 2 PM IST
- Sunday & public holidays: Closed
- Average response time: under 2 hours during business hours.
- After-hours queries are answered the next business day.

💳 PAYMENT
- We accept all major credit/debit cards, UPI, net banking, and PayPal.
- EMI available on orders over ₹2,999 via select banks.

📦 ORDER TRACKING
- Tracking link is emailed within 24 hours of dispatch.
- You can also track at: sparkandco.store/track

❓ CONTACT
- Email: support@sparkandco.store
- Phone: +91-80-4567-8901 (business hours only)
---

GUIDELINES:
- Be warm, concise, and helpful. Don't be robotic.
- If you don't know something specific, say so honestly and offer to escalate.
- Never make up order details, tracking numbers, or policies not listed above.
- Keep answers short and scannable (use bullet points when listing multiple items).
- If a question is outside your knowledge, say: "I don't have that information handy — please email support@sparkandco.store and our team will help you within 2 hours."`;

// ---------------------------------------------------------------------------

type GeminiRole = "user" | "model";

interface GeminiHistoryEntry {
  role: GeminiRole;
  parts: { text: string }[];
}

function formatHistoryForGemini(messages: Message[]): GeminiHistoryEntry[] {
  const recent = messages.slice(-MAX_HISTORY_MESSAGES);
  return recent.map((msg) => ({
    role: msg.sender === "user" ? "user" : "model",
    parts: [{ text: msg.text }],
  }));
}

export async function generateReply(
  history: Message[],
  userMessage: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        temperature: 0.7,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const chat = model.startChat({
      history: formatHistoryForGemini(history),
    });

    const result = await chat.sendMessage(userMessage);
    const text = result.response.text().trim();

    if (!text) throw new Error("Empty response from Gemini");
    return text;
  } catch (err: unknown) {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();

      if (msg.includes("api_key_invalid") || msg.includes("api key not valid") || msg.includes("401")) {
        throw new Error("LLM_AUTH");
      }
      if (msg.includes("quota") || msg.includes("429") || msg.includes("resource_exhausted")) {
        throw new Error("LLM_RATE_LIMIT");
      }
      if (msg.includes("timeout") || msg.includes("etimedout")) {
        throw new Error("LLM_TIMEOUT");
      }
      if (msg.includes("500") || msg.includes("503") || msg.includes("unavailable")) {
        throw new Error("LLM_SERVER_ERROR");
      }
    }
    throw new Error("LLM_UNKNOWN");
  }
}
