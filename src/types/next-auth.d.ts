import type { DefaultSession } from "next-auth";
import type { Theme } from "@/lib/theme";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      timezone: string | null;
      onboardedAt: Date | null;
      theme: Theme | null;
    } & DefaultSession["user"];
  }
}
