import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB, User } from "@mailmind/db";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // These 3 Gmail scopes are the minimum we need:
          // readonly  → fetch inbox emails
          // send      → send replies on user's behalf
          // modify    → mark emails as read
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.modify",
          ].join(" "),

          // offline = ask Google for a refresh_token
          // without this we only get an access_token (expires in 1 hour)
          access_type: "offline",

          // consent = force Google to show the permission screen every time
          // without this, Google skips the screen and doesn't send refresh_token
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    // Fires immediately after Google redirects back with tokens
    // This is where we persist the tokens to MongoDB
    async signIn({ user, account }) {
      // Only handle Google sign-ins
      if (account?.provider !== "google") return false;

      // If Google didn't send tokens, reject the sign-in
      if (!account.access_token || !account.refresh_token) {
        console.error("Missing tokens from Google — check OAuth scopes");
        return false;
      }

      try {
        await connectDB();

        // upsert = update if exists, insert if new user
        await User.findOneAndUpdate(
          { googleId: account.providerAccountId },
          {
            email:        user.email!,
            name:         user.name!,
            image:        user.image ?? undefined,
            googleId:     account.providerAccountId,
            accessToken:  account.access_token,
            refreshToken: account.refresh_token,
            // expires_in is in seconds — convert to a Date
            tokenExpiry: new Date(
              Date.now() + (account.expires_in as number) * 1000
            ),
          },
          { upsert: true, new: true }
        );

        return true; // sign-in approved
      } catch (err) {
        console.error("Failed to save user to MongoDB:", err);
        return false; // sign-in rejected
      }
    },

    // Fires when the JWT token is created or updated
    // We attach googleId here so we can access it in API routes
    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },

    // Fires when session is accessed via auth() or useSession()
    // We expose googleId on the session object
    async session({ session, token }) {
      session.user.googleId = token.googleId as string;
      return session;
    },
  },

  pages: {
    signIn: "/signin", // our custom sign-in page (we'll build this in Phase 5)
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);