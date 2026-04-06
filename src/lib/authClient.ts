import { createAuthClient } from 'better-auth/client';

const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
});

export { authClient };
