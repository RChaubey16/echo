import { vi } from "vitest";
import { requestHeaders } from "./request-context";

// Route handlers read the session through next/headers, which only exists inside a Next.js
// request. Tests set the headers for the request they are about to send.
vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
  cookies: async () => {
    throw new Error("cookies() is not available in integration tests");
  },
}));
