import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Talks to /api/auth on whatever host the page is on. */
export const authClient = createAuthClient({ plugins: [anonymousClient()] });
