
<div align="center">
  <img src="https://img.shields.io/badge/MailMind-AI%20Email%20Assistant-3674B5?style=for-the-badge&logo=gmail&logoColor=white" alt="MailMind"/>
  
  <h3>AI-Powered Email Assistant</h3>
  <p>Triage, summarize, and reply to emails intelligently using AI — powered by a serverless AWS pipeline</p>

  <a href="https://mail-mind-web-zeta.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Visit%20App-3674B5?style=for-the-badge" alt="Live Demo"/>
  </a>

  <br/><br/>

  ![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
  ![AWS Lambda](https://img.shields.io/badge/AWS%20Lambda-FF9900?style=flat-square&logo=awslambda&logoColor=white)
  ![Amazon S3](https://img.shields.io/badge/Amazon%20S3-569A31?style=flat-square&logo=amazons3&logoColor=white)
  ![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
</div>

---

## ✦ Overview

MailMind is a full-stack AI-powered email assistant that connects to your Gmail account and automatically:

- **Triages** every email into categories (Urgent, Needs Reply, FYI, Spam)
- **Summarizes** emails in one sentence using AI
- **Generates reply drafts** in your personal writing tone, streamed token-by-token
- **Notifies** you in real time when new emails arrive — Gmail Pub/Sub pushes directly to an AWS Lambda function, no polling
- **Tracks** your email productivity with a stats dashboard, exportable to S3 as CSV/JSON

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

### Backend & AI
| Technology | Purpose |
|---|---|
| MongoDB Atlas | Database for users, emails, drafts, audit logs |
| Mongoose | MongoDB ODM |
| Groq (LLaMA 3.3) | AI triage + streaming reply draft generation |
| Gmail API | Email fetch, send, real-time watch registration |
| Google Cloud Pub/Sub | Real-time email push notifications |

### AWS / Cloud Infrastructure
| Technology | Purpose |
|---|---|
| AWS Lambda | Serverless triage worker — triggered directly by Pub/Sub push, replaces the original always-on Express server |
| Amazon S3 | Stores stats exports (CSV/JSON), served via presigned URLs |
| AWS IAM | Least-privilege roles and policies scoping Lambda and application credentials to specific resources |
| Amazon CloudWatch | Lambda invocation logs, error rates, and duration metrics |

### Other Infrastructure
| Technology | Purpose |
|---|---|
| Vercel | Frontend + API routes deployment |
| Turborepo | Monorepo build system |
| NextAuth v5 | Google OAuth authentication |
| Upstash Redis | Rate limiting (fail-open on outage) |

## ✨ Features

- **🔐 Google OAuth** — secure sign-in with Gmail access, OAuth tokens encrypted at rest (AES-256)
- **⚡ AI Triage** — every email categorized by priority using LLaMA 3.3
- **✍️ Draft Generation** — streaming AI reply drafts in your tone
- **📨 Real-time Sync** — Gmail Pub/Sub → AWS Lambda, no polling, no idle server cost
- **☁️ S3 Export** — download your stats as CSV/JSON via secure, time-limited presigned URLs
- **📊 Stats Dashboard** — email productivity insights
- **📱 Mobile Responsive** — dedicated mobile layout with bottom navigation
- **♾️ Infinite Scroll** — paginated inbox with lazy loading
- **🔄 Background Sync** — silent Gmail sync with a 5-minute cooldown cache
- **🛡️ Security** — CSRF-protected API routes, rate-limited endpoints, prompt-injection sanitization on all AI-bound content, and full audit logging of every email access

## 🏗 Architecture

```
MailMind/
├── apps/
│   ├── web/              → Next.js (UI + API routes) → Vercel
│   ├── server/            → Express (legacy cron jobs — token refresh, watch renewal)
│   └── lambda-triage/      → Standalone Lambda deployment package (own node_modules)
├── packages/
│   ├── ai/                → Groq AI prompts (triage + drafts) + sanitization
│   ├── db/                → Mongoose models, encryption helpers, audit logging
│   └── types/              → Shared TypeScript types
├── turbo.json              → Turborepo pipeline
└── package.json            → Workspace config
```

**Data flow for real-time triage:**
```
New email → Gmail watch → Pub/Sub topic → push subscription
  → AWS Lambda (Function URL) → Gmail API fetch → Groq AI triage
  → MongoDB → Next.js frontend reads instantly, already categorized
```

**Why Lambda instead of an always-on server:** the triage workload is event-driven — a few seconds of work per email, then nothing until the next one arrives. Lambda only runs (and only costs anything) for the moment it's actually needed, with MongoDB connections cached across warm invocations to keep latency low.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Google Cloud project with Gmail API + Pub/Sub enabled
- Groq API key
- AWS account (Lambda, S3, IAM) for the real-time triage pipeline
- Upstash Redis database (optional — rate limiting fails open without it)

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
ENCRYPTION_KEY=your-64-char-hex-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-s3-bucket
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

Create `apps/lambda-triage`'s environment variables directly in the Lambda console (Configuration → Environment variables):
```bash
MONGODB_URI=mongodb+srv://...
GROQ_API_KEY=your-groq-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
PUBSUB_VERIFICATION_TOKEN=your-token
```

### 4. Run the frontend locally
```bash
cd apps/web
npm run dev
```
Frontend: `http://localhost:3000`

### 5. Deploy the Lambda triage worker
```bash
cd apps/lambda-triage
npm install
# zip index.mjs, node_modules, package.json, package-lock.json together
# upload via Lambda console → Code → Update from a .zip file
```

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for NextAuth JWT |
| `NEXTAUTH_URL` | ✅ | App URL (localhost or production) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |
| `GROQ_API_KEY` | ✅ | Groq API key for AI features |
| `ENCRYPTION_KEY` | ✅ | AES-256 key for encrypting OAuth tokens at rest |
| `AWS_ACCESS_KEY_ID` | ✅ | Scoped IAM user credentials for S3 access |
| `AWS_SECRET_ACCESS_KEY` | ✅ | Scoped IAM user credentials for S3 access |
| `AWS_REGION` | ✅ | AWS region (e.g. `ap-south-1`) |
| `AWS_S3_BUCKET` | ✅ | S3 bucket for stats exports |
| `UPSTASH_REDIS_REST_URL` | Optional | Rate limiting — fails open if not set |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Rate limiting — fails open if not set |
| `PUBSUB_VERIFICATION_TOKEN` | ✅ | Shared secret verifying Pub/Sub → Lambda requests |

## ☁️ AWS Setup Summary

- **IAM** — a dedicated `mailmind-dev` user with scoped policies (S3, Lambda, CloudWatch) is used for application credentials; a separate admin identity is used only for provisioning infrastructure through the console — least-privilege separation between "human" and "application" access.
- **Lambda** — Node.js 24 runtime, Function URL enabled (auth type `NONE`, with manual token verification inside the handler), MongoDB connection cached across warm invocations, timeout raised to 60s to comfortably cover the Mongo + Gmail + Groq call chain.
- **S3** — a private bucket (`mailmind-exports`) with all public access blocked; files are only ever accessed via short-lived presigned URLs generated server-side.
- **CloudWatch** — used to debug a real production issue: a Pub/Sub retry storm caused by a stale OAuth refresh token, diagnosed directly from Lambda's error logs and fixed by correcting the subscription's retry policy to exponential backoff.

## 📁 Key Files

| File | Purpose |
|---|---|
| `apps/web/src/app/api/emails/route.ts` | Inbox fetch with background Gmail sync |
| `apps/web/src/app/api/emails/[id]/triage/route.ts` | AI triage endpoint |
| `apps/web/src/app/api/emails/[id]/draft/route.ts` | Streaming draft generation |
| `apps/web/src/app/api/export/route.ts` | S3 stats export (CSV/JSON via presigned URL) |
| `apps/web/src/app/api/gmail/watch/route.ts` | Registers Gmail push notifications with Pub/Sub |
| `apps/web/src/lib/s3.ts` | S3 upload + presigned URL helper |
| `apps/web/src/lib/ratelimit.ts` | Upstash rate limiter with fail-open fallback |
| `apps/web/src/lib/audit.ts` | Audit logging for every sensitive action |
| `packages/ai/triage.ts` | Groq triage prompt, JSON parsing, strict schema validation |
| `packages/ai/prompts.ts` | Prompt construction + prompt-injection sanitization |
| `packages/ai/draft-reply.ts` | Streaming reply draft generation |
| `packages/db/lib/crypto.ts` | AES-256 encryption/decryption for OAuth tokens |
| `apps/lambda-triage/index.mjs` | Standalone Lambda handler — Pub/Sub webhook, Gmail fetch, AI triage, MongoDB write |

## 🧭 Known Gaps

Being upfront about what's not finished:

- Legacy Express cron jobs (token refresh, Gmail watch renewal) haven't been migrated to scheduled Lambda functions yet
- No automated CI/CD for Lambda deployment — currently built and uploaded manually
- Email body content is not encrypted at rest, only OAuth tokens are
- Integration/E2E test coverage is thin — only unit tests exist for the AI package

## 📄 License

MIT License — feel free to use this project as inspiration.

---

<div align="center">
  Built with ❤️ by <a href="https://github.com/aryanathane">Aryan Athane</a>
</div>
