import { connectDB, User } from "@mailmind/db";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Silently refresh the access token using the stored refresh token
async function refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token refresh failed: ${res.status} — ${error}`);
  }

  const data = await res.json();

  // Save the new access token and expiry back to MongoDB
  await User.findByIdAndUpdate(userId, {
    accessToken: data.access_token,
    // expires_in is in seconds — convert to a future Date
    tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  });

  return data.access_token as string;
}

// Call this before EVERY Gmail API request
// Returns a valid access token — refreshes automatically if expired
export async function getValidAccessToken(googleId: string): Promise<string> {
  await connectDB();

  const user = await User.findOne({ googleId });
  if (!user) throw new Error(`User not found for googleId: ${googleId}`);

  // Check if token is expired or expiring within the next 60 seconds
  // 60 second buffer prevents edge case where token expires mid-request
  const expiresIn = user.tokenExpiry.getTime() - Date.now();
  const isExpired = expiresIn < 60_000;

  if (isExpired) {
    console.log(`Token expired for ${user.email} — refreshing...`);
    return refreshAccessToken(String(user._id), user.refreshToken);
  }

  return user.accessToken;
}