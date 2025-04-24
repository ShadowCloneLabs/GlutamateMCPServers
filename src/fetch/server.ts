import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import express, { Request, Response } from "express";
import cors from 'cors';
import { IncomingMessage, ServerResponse } from "http";
import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';
import { z } from "zod";

const DEFAULT_PORT = 3030;

export const Logger = {
  log: (...args: any[]) => console.log(...args),
  error: (...args: any[]) => console.error(...args),
};

const FetchOptionsSchema = z.object({
  url: z.string().url(),
  maxLength: z.number().optional().default(5000),
  startIndex: z.number().optional().default(0),
  raw: z.boolean().optional().default(false),
});

type FetchOptions = z.infer<typeof FetchOptionsSchema>;

export class FetchMcpServer {
  private readonly server: McpServer;
  private sseTransport: SSEServerTransport | null = null;
  private readonly userAgent: string;
  private readonly turndownService: TurndownService;

  constructor(port: number = DEFAULT_PORT) {
    this.userAgent = 'ModelContextProtocol/1.0 (+https://github.com/modelcontextprotocol/servers)';
    this.turndownService = new TurndownService();

    this.server = new McpServer(
      {
        name: "Fetch MCP Server",
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

  private async fetchUrl(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent
        }
      });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(`Failed to fetch URL: ${error.message}`);
      }
      throw error;
    }
  }

  private processHtml(html: string, raw: boolean): string {
    if (raw) {
      return html;
    }

    const $ = cheerio.load(html);
    $('script, style, noscript, iframe, img').remove();
    const content = $('body').html() || '';
    return this.turndownService.turndown(content);
  }

  private registerTools(): void {
    this.server.tool(
      "fetch",
      "Fetch and process content from a URL, with options for raw HTML or processed markdown",
      {
        schema: FetchOptionsSchema,
      },
      async (args: unknown) => {
        try {
          Logger.log('Received args:', args);
          Logger.log('Args type:', typeof args);
          // Handle both nested and direct args structure
          const argsToValidate = 'schema' in (args as any) ? (args as any).schema : args;
          const { url, maxLength, startIndex, raw } = FetchOptionsSchema.parse(argsToValidate);
          Logger.log('Parsed URL:', url);
          
          const html = await this.fetchUrl(url);
          const processedContent = this.processHtml(html, raw);
          const totalLength = processedContent.length;

          let content = processedContent.slice(startIndex, startIndex + maxLength);
          const truncated = content.length < (processedContent.length - startIndex);

          return {
            content: [
              {
                type: "text",
                text: content,
              },
            ],
            metadata: {
              truncated,
              totalLength,
            },
          };
        } catch (error) {
          Logger.error(`Fetch error:`, error);
          return {
            content: [
              {
                type: "text",
                text: `Error fetching content: ${error instanceof Error ? error.message : String(error)}`,
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
    app.use(cors());

    Logger.log(`Setting up server on port ${port}...`);

    app.get("/sse", async (req: Request, res: Response) => {
      Logger.log("New SSE connection established");
      this.sseTransport = new SSEServerTransport(
        "/messages",
        res as unknown as ServerResponse<IncomingMessage>
      );
      await this.server.connect(this.sseTransport);
    });

    app.post("/messages", async (req: Request, res: Response) => {
      Logger.log("Received POST message");
      if (!this.sseTransport) {
        Logger.error("No SSE transport available");
        res.sendStatus(400);
        return;
      }

      await this.sseTransport.handlePostMessage(
        req as unknown as IncomingMessage,
        res as unknown as ServerResponse<IncomingMessage>
      );
    });

    app.listen(port, () => {
      Logger.log(`Server listening on port ${port}`);
      Logger.log(`SSE endpoint: http://localhost:${port}/sse`);
      Logger.log(`Messages endpoint: http://localhost:${port}/messages`);
    });
  }
}

// Replace the require check with proper ESM entry point
if (import.meta.url === import.meta.resolve('./server.ts')) {
  const server = new FetchMcpServer();
  server.startHttpServer(DEFAULT_PORT).catch(console.error);
} 