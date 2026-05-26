import cron from "node-cron";
import mongoose from "mongoose";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

async function refreshUserToken(user: any): Promise<void> {
  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: user.refreshToken,
        grant_type:    "refresh_token",
      }),
    });

    if (!res.ok) {
      console.error(`Token refresh failed for ${user.email}: ${res.status}`);
      return;
    }

    const data = await res.json();

    // Save new token to MongoDB
    const User = mongoose.model("User");
    await User.findByIdAndUpdate(user._id, {
      accessToken: data.access_token,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
    });

    console.log(`Token refreshed for ${user.email}`);

  } catch (err) {
    console.error(`Token refresh error for ${user.email}:`, err);
  }
}

// Runs every 30 minutes
export function startTokenRefreshJob(): void {
  cron.schedule("*/30 * * * *", async () => {
    console.log("Running token refresh job...");

    try {
      const User = mongoose.model("User");

      // Find users whose token expires in next 10 minutes
      const expiryThreshold = new Date(Date.now() + 10 * 60 * 1000);

      const users = await User.find({
        tokenExpiry: { $lte: expiryThreshold },
      });

      if (users.length === 0) {
        console.log("No tokens need refreshing");
        return;
      }

      console.log(`Refreshing ${users.length} tokens...`);

      // Refresh all expiring tokens in parallel
      await Promise.allSettled(users.map(refreshUserToken));

      console.log("Token refresh job completed");

    } catch (err) {
      console.error("Token refresh job error:", err);
    }
  });

  console.log("Token refresh cron job started — runs every 30 minutes");
}