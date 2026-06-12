import { connectDB, User, encrypt, decrypt } from "@mailmind/db";
import { GOOGLE_TOKEN_URL, TOKEN_EXPIRY_BUFFER } from "@/lib/constants";

async function refreshAccessToken(
  userId:       string,
  refreshToken: string
): Promise<string> {
  // Decrypt refresh token before using with Google API
  const decryptedRefreshToken = decrypt(refreshToken);

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: decryptedRefreshToken,
      grant_type:    "refresh_token",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Token refresh failed: ${res.status} — ${error}`);
  }

  const data = await res.json();

  // Encrypt new access token before saving to MongoDB
  const encryptedAccessToken = encrypt(data.access_token);

  await User.findByIdAndUpdate(userId, {
    accessToken: encryptedAccessToken,
    tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
  });

  // Return decrypted token for immediate use
  return data.access_token as string;
}

export async function getValidAccessToken(googleId: string): Promise<string> {
  await connectDB();

  const user = await User.findOne({ googleId });
  if (!user) throw new Error(`User not found for googleId: ${googleId}`);

  // Check if token is expired or expiring within buffer window
  const expiresIn = user.tokenExpiry.getTime() - Date.now();
  const isExpired = expiresIn < TOKEN_EXPIRY_BUFFER;

  if (isExpired) {
    console.log(`Token expired for ${user.email} — refreshing...`);
    return refreshAccessToken(String(user._id), user.refreshToken);
  }

  // Decrypt access token before returning to caller
  return decrypt(user.accessToken);
}