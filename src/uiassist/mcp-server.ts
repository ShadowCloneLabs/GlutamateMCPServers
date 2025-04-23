import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { IncomingMessage, ServerResponse } from "http";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { startBrowserConnector } from "./browser-connector.js";
import { DEFAULT_PORT } from "./config.js";
import * as fs from 'fs';
import * as path from 'path';
import { z } from "zod";

export const Logger = {
  log: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
};

export class TestMcpServer {
  private readonly server: McpServer;
  private sseTransport: SSEServerTransport | null = null;
  private browserConnector: any = null;
  private readonly connectorPort: number;
  private readonly mcpPort: number;

  constructor(connectorPort: number = 3025, mcpPort: number = DEFAULT_PORT) {
    this.connectorPort = connectorPort;
    this.mcpPort = mcpPort;
    this.server = new McpServer(
      {
        name: "UI Assist MCP Server",
        version: "0.1.0",
      },
      {
        capabilities: {
          logging: {},
          tools: {},
        },
      }
    );

    this.registerTools();
  }

  private registerTools(): void {
    this.server.tool(
      "get_selected_elements",
      "Get information about HTML elements selected using the browser extension using ui-assist",
      {},
      async () => {
        try {
          if (!this.browserConnector) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Browser connector not initialized. Please ensure the browser extension is running.",
                },
              ],
            };
          }

          const response = await fetch(
            `http://localhost:${this.connectorPort}/selected-elements`
          );
          if (!response.ok) {
            throw new Error(
              `Failed to get selected elements: ${response.statusText}`
            );
          }

          const data = await response.json();
          const elements = data.elements || [];

          if (elements.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No elements have been selected. Use the Element Selector in the browser extension to select elements.",
                },
              ],
            };
          }

          const formattedElements = elements
            .map((el: any, index: number) => {
              const attributesStr = el.attributes
                ? el.attributes
                    .map((attr: any) => `${attr.name}="${attr.value}"`)
                    .join(" ")
                : "";

              return `Element ${index + 1}:
  Tag: ${el.tag}
  ID: ${el.id || "none"}
  Classes: ${el.classes?.join(", ") || "none"}
  Text: ${el.text || "none"}
  Attributes: ${attributesStr || "none"}
  Instruction: ${el.instruction || "none"}
`;
            })
            .join("\n");

          return {
            content: [
              {
                type: "text",
                text: `Selected Elements (${elements.length}):\n\n${formattedElements}`,
              },
            ],
          };
        } catch (error) {
          Logger.error(`Get selected elements error:`, error);
          return {
            content: [
              {
                type: "text",
                text: `Error retrieving selected elements: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "clear_selected_elements",
      "Clear the list of selected HTML elements using ui-assist",
      {},
      async () => {
        try {
          if (!this.browserConnector) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Browser connector not initialized. Please ensure the browser extension is running.",
                },
              ],
            };
          }

          const response = await fetch(
            `http://localhost:${this.connectorPort}/selected-elements`,
            {
              method: "DELETE",
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to clear selected elements: ${response.statusText}`
            );
          }

          return {
            content: [
              {
                type: "text",
                text: "Successfully cleared all selected elements.",
              },
            ],
          };
        } catch (error) {
          Logger.error(`Clear selected elements error:`, error);
          return {
            content: [
              {
                type: "text",
                text: `Error clearing selected elements: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );
  }

  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
    Logger.log("Server connected and ready to process requests");
  }

  async startHttpServer(port: number): Promise<void> {
    const app = express();

    app.get("/sse", async (req: Request, res: Response) => {
      Logger.log("New SSE connection established");
      this.sseTransport = new SSEServerTransport(
        "/messages",
        res as unknown as ServerResponse<IncomingMessage>
      );
      await this.server.connect(this.sseTransport);
    });

    app.post("/messages", async (req: Request, res: Response) => {
      if (!this.sseTransport) {
        res.sendStatus(400);
        return;
      }
      await this.sseTransport.handlePostMessage(
        req as unknown as IncomingMessage,
        res as unknown as ServerResponse<IncomingMessage>
      );
    });

    // Initialize the browser connector
    try {
      // Use the configured port for the browser connector
      this.browserConnector = await startBrowserConnector(this.connectorPort);
      Logger.log(`Browser connector started on port ${this.connectorPort}`);
    } catch (error) {
      Logger.error("Failed to start browser connector:", error);
    }

    app.listen(port, () => {
      Logger.log(`HTTP server listening on port ${port}`);
      Logger.log(`SSE endpoint available at http://localhost:${port}/sse`);
      Logger.log(
        `Message endpoint available at http://localhost:${port}/messages`
      );
      Logger.log("Element selection tools are available and ready to use");
    });
  }

  private broadcast(message: any): void {
    if (this.browserConnector && this.browserConnector.broadcastToClients) {
      this.browserConnector.broadcastToClients(message);
    } else {
      Logger.log(
        "Cannot broadcast: browserConnector not initialized or missing broadcastToClients method"
      );
    }
  }
}
