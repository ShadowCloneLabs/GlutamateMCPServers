import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express, { Request, Response } from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { IncomingMessage, ServerResponse } from "http";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { startBrowserConnector } from "./browser-connector.js";

export const Logger = {
  log: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
};

export class TestMcpServer {
  private readonly server: McpServer;
  private sseTransport: SSEServerTransport | null = null;
  private browserConnector: any = null;

  constructor() {
    this.server = new McpServer(
      {
        name: "Screenshot MCP Server",
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
      "capture_screenshot",
      "Capture a screenshot of the current browser tab",
      {},
      async () => {
        try {
          const format = "png";

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

          const screenshotResult = await new Promise<{
            path: string;
            filename: string;
          }>(async (resolve, reject) => {
            try {
              const response = await fetch(
                "http://localhost:3025/capture-screenshot",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ format }),
                }
              );

              if (!response.ok) {
                throw new Error(
                  `Screenshot capture failed: ${response.statusText}`
                );
              }

              const result = await response.json();
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });

          return {
            content: [
              {
                type: "text",
                text: `Screenshot captured successfully!\nPath: ${screenshotResult.path}\nFilename: ${screenshotResult.filename}`,
              },
            ],
          };
        } catch (error) {
          Logger.error(`Screenshot capture error:`, error);
          return {
            content: [
              {
                type: "text",
                text: `Error capturing screenshot: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "get_selected_elements",
      "Get information about HTML elements selected using the browser extension",
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
            "http://localhost:3025/selected-elements"
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
      "Clear the list of selected HTML elements",
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
            "http://localhost:3025/selected-elements",
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
      // Use a different port for the browser connector
      const browserConnectorPort = 3025;
      this.browserConnector = await startBrowserConnector(browserConnectorPort);
      Logger.log(`Browser connector started on port ${browserConnectorPort}`);
    } catch (error) {
      Logger.error("Failed to start browser connector:", error);
    }

    app.listen(port, () => {
      Logger.log(`HTTP server listening on port ${port}`);
      Logger.log(`SSE endpoint available at http://localhost:${port}/sse`);
      Logger.log(
        `Message endpoint available at http://localhost:${port}/messages`
      );
      Logger.log("Screenshot functionality is available and ready to use");
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
