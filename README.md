<div align="center">
  <img src="https://img.shields.io/badge/MailMind-AI%20Email%20Assistant-3674B5?style=for-the-badge&logo=gmail&logoColor=white" alt="MailMind"/>
  
  <h3>AI-Powered Email Assistant</h3>
  <p>Triage, summarize, and reply to emails intelligently using AI</p>

  <a href="https://mail-mind-web-zeta.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20App-3674B5?style=for-the-badge" alt="Live Demo"/>
  </a>

  <br/><br/>

  ![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
  ![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
  ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
  ![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)
</div>

---

## ✦ Overview

MailMind is a full-stack AI-powered email assistant that connects to your Gmail account and automatically:

- **Triages** every email into categories (Urgent, Needs Reply, FYI, Spam)
- **Summarizes** emails in one sentence using AI
- **Generates reply drafts** in your personal writing tone
- **Notifies** you in real-time when new emails arrive via Gmail Pub/Sub
- **Tracks** your email productivity with a stats dashboard

## 🚀 Live Demo

**[https://mail-mind-web-zeta.vercel.app](https://mail-mind-web-zeta.vercel.app)**

> Sign in with Google to try it with your own Gmail inbox.

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Frontend framework + API routes |
| TypeScript | Type safety across the entire codebase |
| Tailwind CSS | Styling |

### Backend
| Technology | Purpose |
|---|---|
| Express.js | Background server for webhooks + cron jobs |
| MongoDB Atlas | Database for emails, users, drafts |
| Mongoose | MongoDB ODM |
| Groq (LLaMA 3.3) | AI triage + reply draft generation |
| Gmail API | Email fetch, send, real-time watch |
| Google Pub/Sub | Real-time email push notifications |

### Infrastructure
| Technology | Purpose |
|---|---|
| Vercel | Frontend + API routes deployment |
| Railway | Express server deployment |
| Turborepo | Monorepo build system |
| NextAuth v5 | Google OAuth authentication |

## ✨ Features

- **🔐 Google OAuth** — Secure sign-in with Gmail access
- **⚡ AI Triage** — Every email categorized by priority using LLaMA 3.3
- **✍️ Draft Generation** — Streaming AI reply drafts in your tone
- **📨 Real-time Sync** — Gmail Pub/Sub webhook for instant notifications
- **📊 Stats Dashboard** — Email productivity insights
- **📱 Mobile Responsive** — Works on all screen sizes
- **♾️ Infinite Scroll** — Paginated inbox with lazy loading
- **🔄 Background Sync** — Silent Gmail sync with 5-minute cache

## 🏗 Architecture

```
MailMind/
├── apps/
│   ├── web/          → Next.js (UI + API routes) → Vercel
│   └── server/       → Express (webhook + cron) → Railway
├── packages/
│   ├── ai/           → Groq AI prompts (triage + drafts)
│   ├── db/           → Mongoose models (User, Email, Draft)
│   └── types/        → Shared TypeScript types
├── turbo.json        → Turborepo pipeline
└── package.json      → Workspace config
```

**Data flow for real-time triage:**
```
New email → Gmail API → Pub/Sub topic → Railway webhook
  → fetch email → Groq AI triage → MongoDB → UI
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud project with Gmail API enabled
- Groq API key

### 1. Clone the repository
```bash
git clone https://github.com/aryanathane/MailMind.git
cd MailMind
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create `apps/web/.env.local`:
```bash
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GROQ_API_KEY=your-groq-key
```

Create `apps/server/.env.local`:
```bash
MONGODB_URI=mongodb+srv://...
GROQ_API_KEY=your-groq-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
PUBSUB_VERIFICATION_TOKEN=your-token
PORT=4000
```

### 4. Run development server
```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for NextAuth JWT |
| `NEXTAUTH_URL` | ✅ | App URL (localhost or production) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GROQ_API_KEY` | ✅ | Groq API key for AI features |
| `PUBSUB_VERIFICATION_TOKEN` | ✅ | Secret token for Gmail webhook |

## 📁 Key Files

| File | Purpose |
|---|---|
| `apps/web/src/app/api/emails/route.ts` | Inbox fetch with background Gmail sync |
| `apps/web/src/app/api/emails/[id]/triage/route.ts` | AI triage endpoint |
| `apps/web/src/app/api/emails/[id]/draft/route.ts` | Streaming draft generation |
| `packages/ai/triage.ts` | Groq triage prompt + JSON parsing |
| `packages/ai/draft-reply.ts` | Streaming reply draft generation |
| `apps/server/src/routes/gmail-webhook.ts` | Gmail Pub/Sub webhook handler |
| `apps/server/src/jobs/triage-worker.ts` | Background email processing |
| `apps/server/src/jobs/token-refresh.ts` | OAuth token refresh cron job |

## 📄 License

MIT License — feel free to use this project as inspiration.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/aryanathane">Aryan Athane</a>
</div>