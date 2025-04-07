#!/usr/bin/env node

import { TestMcpServer } from "./mcp-server.js";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_MCP_PORT = 3332;
const DEFAULT_CONNECTOR_PORT = 3025;

function getConfiguredPorts() {
  const args = process.argv.slice(2);
  const argMcpPort = args
    .find((arg) => arg.startsWith("--mcp-port="))
    ?.split("=")[1];
  const argConnectorPort = args
    .find((arg) => arg.startsWith("--connector-port="))
    ?.split("=")[1];

  // Priority: env vars > command line args > default values
  const mcpPort = parseInt(
    process.env.MCP_PORT || argMcpPort || DEFAULT_MCP_PORT.toString()
  );
  const connectorPort = parseInt(
    process.env.CONNECTOR_PORT ||
      argConnectorPort ||
      DEFAULT_CONNECTOR_PORT.toString()
  );

  return { mcpPort, connectorPort };
}

async function startServer(): Promise<void> {
  const { mcpPort, connectorPort } = getConfiguredPorts();

  console.log(`Initializing Screenshot MCP Server on port ${mcpPort}...`);
  console.log(`Browser connector will run on port ${connectorPort}...`);

  const server = new TestMcpServer();

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
