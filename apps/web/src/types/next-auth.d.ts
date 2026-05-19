import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      googleId: string;
    } & DefaultSession["user"];
  }
}