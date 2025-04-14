import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // Point to your backend running on localhost:3001
    // The default path /api/auth is assumed.
    baseURL: "http://127.0.0.1:3001",
    // Ensure cookies are sent with cross-origin requests
    fetchOptions: {
        credentials: "include"
    }
}); 