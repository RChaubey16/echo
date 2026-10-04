import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      timezone: string | null;
      onboardedAt: Date | null;
    } & DefaultSession["user"];
  }
}
