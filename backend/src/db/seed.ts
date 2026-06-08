import pool from "./pool";

// This file seeds the FAQ knowledge base into a dedicated table (optional extension).
// For now, the knowledge is embedded in the LLM service prompt.
// Run this to verify DB connectivity and optionally insert a test conversation.

async function seed() {
  const client = await pool.connect();
  try {
    const result = await client.query("SELECT NOW() AS now");
    console.log("✅ DB connected at:", result.rows[0].now);
    console.log("✅ Seed complete. Knowledge base is embedded in system prompt.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
