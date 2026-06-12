# 🛍️ Spark & Co. — AI Support Chat Agent

A full-stack AI-powered live chat support widget for a fictional e-commerce store. Built as a hiring assignment for Spur.

**Live demo:** https://ai-support-agent-xi.vercel.app/

---

## 🗂️ Project Structure

```
spur-chat-agent/
├── backend/         # Node.js + TypeScript + Express API
│   └── src/
│       ├── db/          # PostgreSQL pool, migrations, repository
│       ├── routes/      # Express route handlers
│       ├── services/    # Business logic (chat, LLM)
│       ├── middleware/  # Error handling
│       └── index.ts     # App entry point
└── frontend/        # React + TypeScript + Vite
    └── src/
        ├── components/  # MessageBubble, TypingIndicator, ChatInput
        ├── hooks/       # useChat (core state)
        ├── lib/         # API client
        ├── App.tsx
        └── index.css
```

---

## ⚡ Running Locally — Step by Step

### Prerequisites

- **Node.js** v18+
- **pgAdmin 4** (PostgreSQL) — already installed
- **Google Gemini API key** — 100% free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

---

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/spur-chat-agent.git
cd spur-chat-agent
```

### 2. Install dependencies

```bash
npm run install:all
```

---

### 3. Set up the database (pgAdmin 4)

Open **pgAdmin 4**, then:

1. In the left panel, right-click **Databases** → **Create** → **Database…**
2. Set **Database name** to: `spur_chat`
3. Click **Save**

That's it — the migration script (step 6) will create the tables automatically.

---

### 4. Get your free Gemini API key

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Copy the key — it looks like `AIzaSy...`

---

### 5. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in:

```env
# Your free Gemini API key from Google AI Studio
GEMINI_API_KEY=AIzaSy_your_key_here

# Your pgAdmin4 password is what you set when installing PostgreSQL
DATABASE_URL=postgresql://postgres:YOUR_PGADMIN_PASSWORD@localhost:5432/spur_chat

PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

> 💡 **Finding your PostgreSQL password:** It's the password you set during PostgreSQL installation. In pgAdmin 4, right-click your server → **Properties** → **Connection** tab to see the host/port.

---

### 6. Run database migrations

```bash
cd backend
npm run migrate
```

You should see: `✅ Migration complete.`

You can verify in pgAdmin 4: expand `spur_chat` → **Schemas** → **public** → **Tables** — you'll see `conversations` and `messages`.

---

### 7. Start the backend (Terminal 1)

```bash
cd backend
npm run dev
```

You should see: `🚀 Backend running at http://localhost:4000`

---

### 8. Start the frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser. 🎉

---

## 🌐 Deployment

### Backend — [Render](https://render.com) (free tier)

1. Push to GitHub.
2. New → **Web Service** → connect your repo.
3. **Root directory:** `backend`
4. **Build command:** `npm install && npm run build`
5. **Start command:** `node dist/index.js`
6. Add env vars (`GEMINI_API_KEY`, `DATABASE_URL`, `PORT=10000`, `NODE_ENV=production`).
7. Add a **PostgreSQL** database in Render → copy the internal `DATABASE_URL` into env vars.
8. After first deploy, open Render **Shell** → `npm run migrate`.

### Frontend — [Vercel](https://vercel.com) (free tier)

1. New project → import repo.
2. **Root directory:** `frontend`
3. Framework preset: **Vite**
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com`
5. In `frontend/src/lib/api.ts`, change:
   ```ts
   const BASE = `${import.meta.env.VITE_API_URL ?? ""}/chat`;
   ```

---

## 🏗️ Architecture Overview

### Backend Layers

```
Request → Route (Zod validation)
               ↓
         Chat Service (orchestration)
         ├── DB Repository  (PostgreSQL via pg pool)
         └── LLM Service    (Google Gemini 2.5 Flash)
               ↓
         Response
```

- `routes/` — HTTP parsing, input validation, response shaping only
- `services/chat.ts` — conversation lifecycle, error mapping
- `services/llm.ts` — all LLM interaction isolated here (easy to swap providers)
- `db/repository.ts` — all SQL isolated here (easy to swap DB)

### Frontend Layers

- `useChat` hook — all state, API calls, session persistence in localStorage
- Components are purely presentational (no business logic)
- Vite proxy avoids CORS issues in development

---

## 🤖 LLM Notes

**Provider:** Google Gemini 2.5 Flash (via `@google/generative-ai`)

**Why Gemini Flash?**
- Completely **free** on Google AI Studio (generous quota)
- Fast response times — ideal for live chat
- Great instruction-following for support use cases

**Prompting strategy:**
- A system prompt encodes the full store knowledge base (shipping, returns, hours, payment, contact)
- Last 20 messages of conversation history included for context
- `maxOutputTokens` capped at 512 — support answers should be concise
- All Gemini API errors are caught, classified, and surfaced as friendly messages

**FAQ Knowledge Base:**
Hardcoded in the system prompt in `backend/src/services/llm.ts`. Moving it to a DB + vector search would be the natural next step.

---

## ⚖️ Trade-offs & "If I had more time…"

| Area | Current | With more time |
|---|---|---|
| Knowledge base | Hardcoded in system prompt | Store in DB, embed + retrieve via pgvector |
| Auth | No auth; session ID in localStorage | JWT or session cookies |
| Streaming | Full response before display | Stream tokens for perceived speed |
| Tests | None | Jest unit tests for services, Playwright E2E |
| Rate limiting | Per-IP via express-rate-limit | Per-session + global budgets |
| Observability | Console logs | Structured logs (Pino), Sentry for errors |
| Multi-channel | Not implemented | Clean abstraction makes it easy to add WhatsApp/IG |

---

## 🔌 Extensibility

To add a new channel (WhatsApp, Instagram DMs, etc.):
1. Add a new route in `backend/src/routes/` that normalises the inbound payload.
2. Call `handleChat(message, sessionId)` from `services/chat.ts` — unchanged.
3. Format the reply for the channel and send.

To swap LLM providers (e.g. back to Anthropic or OpenAI):
- Only `backend/src/services/llm.ts` needs to change. Nothing else.

---

## 📦 API Reference

### `POST /chat/message`

```json
// Request
{ "message": "What is your return policy?", "sessionId": "optional-uuid" }

// Response
{ "reply": "...", "sessionId": "uuid" }
```

### `GET /chat/history/:sessionId`

```json
{
  "conversation": { "id": "uuid", "created_at": "..." },
  "messages": [
    { "id": "uuid", "sender": "user", "text": "...", "created_at": "..." },
    { "id": "uuid", "sender": "ai",   "text": "...", "created_at": "..." }
  ]
}
```

### `GET /health`

```json
{ "status": "ok", "timestamp": "..." }
```
