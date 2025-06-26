#!/usr/bin/env node

import { DocsAssistMcpServer } from './server.js';

const DEFAULT_PORT = 7453;

async function startServer(): Promise<void> {
    const port = parseInt(process.env.PORT || DEFAULT_PORT.toString());
    console.log(`Initializing MicroFox Documentation Assistant server on port ${port}...`);

    const server = new DocsAssistMcpServer();
    await server.startHttpServer(port);

    console.log("Server initialized successfully");
    console.log("Available documentation tools:");
    console.log("- listByPackage: List files in a package");
    console.log("- semanticSearch: Search documentation semantically");
    console.log("- getFunctionDoc: Get function documentation");
    console.log("- checkFunctionExists: Check if a function exists");
}

startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});