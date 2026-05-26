import path from "path";
import * as fs from "fs";

// Manually parse .env.local to avoid Windows encoding issues
const envPath = path.resolve("D:\\MailMind\\apps\\server\\.env.local");
const envFile = fs.readFileSync(envPath, "utf8");
envFile.split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) return;
  const key   = trimmed.slice(0, eqIndex).trim();
  const value = trimmed.slice(eqIndex + 1).trim();
  if (key) process.env[key] = value;
});



import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { startTokenRefreshJob } from "./jobs/token-refresh";
import gmailWebhookRouter from "./routes/gmail-webhook";
import User from "./models/User";
import Email from "./models/Email";

const app  = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

User;
Email;

app.get("/health", (_, res) => {
  res.json({
    status:   "ok",
    uptime:   process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/webhooks/gmail", gmailWebhookRouter);

async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");
  await mongoose.connect(uri, { bufferCommands: false });
  console.log("MongoDB connected");
}

async function start(): Promise<void> {
  try {
    await connectDB();
    startTokenRefreshJob();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

export default app;