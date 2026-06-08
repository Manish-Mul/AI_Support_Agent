import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { handleChat, getConversationHistory } from "../services/chat";

const router = Router();

const MessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  sessionId: z.string().uuid().optional(),
});

// POST /chat/message
router.post(
  "/message",
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = MessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.errors.map((e) => e.message).join(", "),
      });
      return;
    }

    try {
      const { reply, sessionId } = await handleChat(
        parsed.data.message,
        parsed.data.sessionId
      );
      res.json({ reply, sessionId });
    } catch (err: unknown) {
      next(err);
    }
  }
);

// GET /chat/history/:sessionId
router.get(
  "/history/:sessionId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;
    // basic UUID format check
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      res.status(400).json({ error: "Invalid session ID format." });
      return;
    }

    try {
      const data = await getConversationHistory(sessionId);
      if (!data) {
        res.status(404).json({ error: "Session not found." });
        return;
      }
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
