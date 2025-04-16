#!/usr/bin/env node

import { TestMcpServer } from "./mcp-server.js";
import { getConfiguredPorts } from "./config.js";

async function startServer(): Promise<void> {
  const { mcpPort, connectorPort } = getConfiguredPorts();

  console.log(`Initializing Screenshot MCP Server on port ${mcpPort}...`);
  console.log(`Browser connector will run on port ${connectorPort}...`);

  const server = new TestMcpServer(connectorPort, mcpPort);

  process.env.CONNECTOR_PORT = connectorPort.toString();
  await server.startHttpServer(mcpPort);

  console.log("Server initialized successfully");
  console.log("Available screenshot MCP tools:");
  console.log(
    "- capture_screenshot: Take a screenshot of the current browser tab"
  );
  console.log("- get_selected_elements: Retrieve selected HTML elements");
  console.log("- clear_selected_elements: Clear the list of selected elements");
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
