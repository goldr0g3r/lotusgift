import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:3001",
  plugins: [adminClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
