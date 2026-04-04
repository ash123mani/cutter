// No 'use client' directive = this is a Server Component
import React from 'react';
import Counter from './Counter.client.js';

async function getData() {
    // You can do async work directly here — DB calls, fetch, etc.
    return { message: 'Hello from the Server Component!' };
}

export default async function App() {
    const data = await getData();

    return (
        <main>
            <h1>{data.message}</h1>
            <p>This was rendered on the server.</p>

            {/* Client Component used inside a Server Component */}
            <Counter />
        </main>
    );
}
