import dotenv from "dotenv";

dotenv.config();

export const DEFAULT_MCP_PORT = 3332;
export const DEFAULT_CONNECTOR_PORT = 3025;

export function getConfiguredPorts() {
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