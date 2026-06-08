import pool from "./pool";

export interface Message {
  id: string;
  conversation_id: string;
  sender: "user" | "ai";
  text: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export async function createConversation(): Promise<Conversation> {
  const result = await pool.query<Conversation>(
    `INSERT INTO conversations DEFAULT VALUES RETURNING *`
  );
  return result.rows[0];
}

export async function getConversation(
  id: string
): Promise<Conversation | null> {
  const result = await pool.query<Conversation>(
    `SELECT * FROM conversations WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const result = await pool.query<Message>(
    `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
  return result.rows;
}

export async function insertMessage(
  conversationId: string,
  sender: "user" | "ai",
  text: string
): Promise<Message> {
  const result = await pool.query<Message>(
    `INSERT INTO messages (conversation_id, sender, text)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversationId, sender, text]
  );

  // bump updated_at on parent conversation
  await pool.query(
    `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
    [conversationId]
  );

  return result.rows[0];
}
