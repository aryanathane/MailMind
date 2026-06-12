import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { connectDB, User, encrypt } from "@mailmind/db";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.modify",
          ].join(" "),
          access_type: "offline",
          prompt:      "consent",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;
      if (!account.access_token || !account.refresh_token) {
        console.error("Missing tokens from Google");
        return false;
      }

      try {
        await connectDB();

        // Encrypt tokens before storing in MongoDB
        const encryptedAccessToken  = encrypt(account.access_token);
        const encryptedRefreshToken = encrypt(account.refresh_token);

        await User.findOneAndUpdate(
          { googleId: account.providerAccountId },
          {
            email:        user.email!,
            name:         user.name!,
            image:        user.image ?? undefined,
            googleId:     account.providerAccountId,
            accessToken:  encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiry:  new Date(
              Date.now() + (account.expires_in as number) * 1000
            ),
          },
          { upsert: true, new: true }
        );

        return true;
      } catch (err) {
        console.error("signIn error:", err);
        return false;
      }
    },

    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.googleId = token.googleId as string;
      return session;
    },
  },

  pages: {
    signIn: "/signin",
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);