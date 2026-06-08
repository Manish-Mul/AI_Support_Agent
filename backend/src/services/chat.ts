import {
  createConversation,
  getConversation,
  getMessages,
  insertMessage,
} from "../db/repository";
import { generateReply } from "./llm";

const MAX_MESSAGE_LENGTH = 2000;

const LLM_ERROR_MESSAGES: Record<string, string> = {
  LLM_AUTH:
    "Our AI assistant is temporarily unavailable (configuration issue). Please contact support@sparkandco.store.",
  LLM_RATE_LIMIT:
    "We're experiencing high demand right now. Please try again in a moment.",
  LLM_SERVER_ERROR:
    "Our AI assistant is having trouble right now. Please try again shortly.",
  LLM_TIMEOUT:
    "The request took too long. Please check your connection and try again.",
  LLM_UNKNOWN:
    "Something went wrong on our end. Please try again or email support@sparkandco.store.",
};

export async function handleChat(
  userMessage: string,
  sessionId?: string
): Promise<{ reply: string; sessionId: string }> {
  // Input validation
  const trimmed = userMessage.trim();
  if (!trimmed) {
    throw Object.assign(new Error("Message cannot be empty."), {
      statusCode: 400,
    });
  }

  const truncated =
    trimmed.length > MAX_MESSAGE_LENGTH
      ? trimmed.slice(0, MAX_MESSAGE_LENGTH)
      : trimmed;

  // Resolve or create conversation
  let conversationId = sessionId;
  if (conversationId) {
    const existing = await getConversation(conversationId);
    if (!existing) {
      // Unknown session — start fresh silently
      conversationId = undefined;
    }
  }

  if (!conversationId) {
    const conv = await createConversation();
    conversationId = conv.id;
  }

  // Fetch history before saving new message
  const history = await getMessages(conversationId);

  // Persist user message
  await insertMessage(conversationId, "user", truncated);

  // Generate AI reply
  let aiText: string;
  try {
    aiText = await generateReply(history, truncated);
  } catch (err: any) {
    console.log("========== ORIGINAL GEMINI ERROR ==========");
    console.dir(err, { depth: null });

    if (err?.message) {
      console.log("message:", err.message);
    }

    if (err?.status) {
      console.log("status:", err.status);
    }

    if (err?.stack) {
      console.log(err.stack);
    }

    throw err;   // DON'T convert it to LLM_SERVER_ERROR yet
  }

  // Persist AI reply
  await insertMessage(conversationId, "ai", aiText);

  return { reply: aiText, sessionId: conversationId };
}

export async function getConversationHistory(sessionId: string) {
  const conversation = await getConversation(sessionId);
  if (!conversation) return null;
  const messages = await getMessages(sessionId);
  return { conversation, messages };
}
