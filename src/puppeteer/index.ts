#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js"
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
    TextContent,
    ImageContent,
    Tool,
    CallToolResult
} from "@modelcontextprotocol/sdk/types.js"
import type { Browser, Page } from "puppeteer-core";
import express from "express";
import {IncomingMessage,ServerResponse} from "http";
import { findChrome } from './chrome-finder.js';
import puppeteerCore from 'puppeteer-core';
import { ALLOW_DANGEROUS_ARGS, DEFAULT_PORT, DOCKER_CONTAINER, getConfiguredPort, getPuppeteerEnvConfig, PUPPETEER_SKIP_DOWNLOAD } from './config.js';

// Set environment variables for Puppeteer
if (PUPPETEER_SKIP_DOWNLOAD) {
  process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';
  process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
}

export const Logger = {
    log: (...args:any[]) => console.log(...args),
    error: (...args:any[]) => console.error(...args),
    warn: (...args:any[]) => console.warn(...args),
}

const TOOLS : Tool[] = [
    {
        name: "puppeteer_navigate",
        description: "Navigate to a URL",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "URL to navigate to" },
          },
          required: ["url"],
        },
      },
      {
        name: "puppeteer_screenshot",
        description: "Take a screenshot of the current page or a specific element",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Name for the screenshot" },
            selector: { type: "string", description: "CSS selector for element to screenshot" },
            width: { type: "number", description: "Width in pixels (default: 800)" },
            height: { type: "number", description: "Height in pixels (default: 600)" },
          },
          required: ["name"],
        },
      },
      {
        name: "puppeteer_click",
        description: "Click an element on the page",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector for element to click" },
          },
          required: ["selector"],
        },
      },
      {
        name: "puppeteer_fill",
        description: "Fill out an input field",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector for input field" },
            value: { type: "string", description: "Value to fill" },
          },
          required: ["selector", "value"],
        },
      },
      {
        name: "puppeteer_select",
        description: "Select an element on the page with Select tag",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector for element to select" },
            value: { type: "string", description: "Value to select" },
          },
          required: ["selector", "value"],
        },
      },
      {
        name: "puppeteer_hover",
        description: "Hover an element on the page",
        inputSchema: {
          type: "object",
          properties: {
            selector: { type: "string", description: "CSS selector for element to hover" },
          },
          required: ["selector"],
        },
      },
      {
        name: "puppeteer_evaluate",
        description: "Execute JavaScript in the browser console",
        inputSchema: {
          type: "object",
          properties: {
            script: { type: "string", description: "JavaScript code to execute" },
          },
          required: ["script"],
        },
      },
    ];

    let browser: Browser | null = null;
    let page: Page | null = null;
    const consoleLogs: string[] = [];
    const screenshots = new Map<string,string>();
    let previousLaunchOptions:any = null;

    async function ensureBrowser({launchOptions,allowDangerous}:any) {
        const DANGEROUS_ARGS = [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--single-process",
            "--disable-web-security",
            "--ignore-certificate-errors",
            "--disable-features=IsolateOrigins",
            "--disable-site-isolation-trials",
            "--allow-running-insecure-content",
        ];

        // Use config function to get environment configuration
        const envConfig = getPuppeteerEnvConfig();

        // Deep merge environment config with user-provided options
        const mergedConfig = deepMerge(envConfig, launchOptions || {});
 
        //security validation for merged config
        if(mergedConfig?.args) {
            const dangerousArgs = mergedConfig.args?.filter?.((arg: string) => DANGEROUS_ARGS.some((dangerousArg: string) => arg.startsWith(dangerousArg)));
            if (dangerousArgs?.length > 0 && !(allowDangerous || ALLOW_DANGEROUS_ARGS)) {
              throw new Error(`Dangerous browser arguments detected: ${dangerousArgs.join(', ')}. Found from environment variable and tool call argument. ` +
                'Set allowDangerous: true in the tool call arguments to override.');
            }
        }

        try {
            if ((browser && !browser.connected) ||
              (launchOptions && (JSON.stringify(launchOptions) != JSON.stringify(previousLaunchOptions)))) {
              await browser?.close();
              browser = null;
            }
          }
          catch (error) {
            browser = null;
          }

          if(!browser) {
             // Use system Chrome instead of downloading Chromium
             const chromePath = await findChrome();
             const baseNpxArgs: any = {headless: false};
             const baseDockerArgs: any = {headless: true, args: ["--no-sandbox","--single-process","--no-zygote"]};
             
             try {
               if (!chromePath) {
                 throw new Error('No system Chrome installation found. Puppeteer-core requires a Chrome executable path.');
               }
               
               Logger.log(`Using system Chrome at: ${chromePath}`);
               baseNpxArgs.executablePath = chromePath;
               baseDockerArgs.executablePath = chromePath;
               
               browser = await puppeteerCore.launch(deepMerge(
                 DOCKER_CONTAINER ? baseDockerArgs : baseNpxArgs,
                 mergedConfig
               )) as unknown as Browser;
               
             } catch (error) {
               Logger.error('Failed to launch browser with puppeteer-core:', error);
               throw new Error(`Failed to launch browser. Please ensure Chrome/Chromium is installed on your system. Error: ${error}`);
             }
             
           const pages = await browser.pages();
           page = pages[0];

           page.on("console", (msg) => {
            const logEntry = `[${msg.type()}] ${msg.text()}`;
            consoleLogs.push(logEntry);
            server.notification({
              method: "notifications/resources/updated",
              params: { uri: "console://logs" },
            });
          });
        }
        return page!;
      }
       
// Deep merge utility function
function deepMerge(target: any, source: any): any {
    const output = Object.assign({}, target);
    if (typeof target !== 'object' || typeof source !== 'object') return source;
  
    for (const key of Object.keys(source)) {
      const targetVal = target[key];
      const sourceVal = source[key];
      if (Array.isArray(targetVal) && Array.isArray(sourceVal)) {
        // Deduplicate args/ignoreDefaultArgs, prefer source values
        output[key] = [...new Set([
          ...(key === 'args' || key === 'ignoreDefaultArgs' ?
            targetVal.filter((arg: string) => !sourceVal.some((launchArg: string) => arg.startsWith('--') && launchArg.startsWith(arg.split('=')[0]))) :
            targetVal),
          ...sourceVal
        ])];
      } else if (sourceVal instanceof Object && key in target) {
        output[key] = deepMerge(targetVal, sourceVal);
      } else {
        output[key] = sourceVal;
      }
    }
    return output;
  }

  declare global {
    interface Window {
        mcpHelper: {
            logs: string[],
            originalConsole: Partial<typeof console>,
        }
    }
  }
  async function handleToolCall(name: string, args: any): Promise<CallToolResult> {
    const page = await ensureBrowser(args);
  
    switch (name) {
      case "puppeteer_navigate":
        await page.goto(args.url);
        return {
          content: [{
            type: "text",
            text: `Navigated to ${args.url}`,
          }],
          isError: false,
        };
  
      case "puppeteer_screenshot": {
        const width = args.width ?? 800;
        const height = args.height ?? 600;
        await page.setViewport({ width, height });
  
        const screenshot = await (args.selector ?
          (await page.$(args.selector))?.screenshot({ encoding: "base64" }) :
          page.screenshot({ encoding: "base64", fullPage: false }));
  
        if (!screenshot) {
          return {
            content: [{
              type: "text",
              text: args.selector ? `Element not found: ${args.selector}` : "Screenshot failed",
            }],
            isError: true,
          };
        }
  
        screenshots.set(args.name, screenshot as string);
        server.notification({
          method: "notifications/resources/list_changed",
        });
  
        return {
          content: [
            {
              type: "text",
              text: `Screenshot '${args.name}' taken at ${width}x${height}`,
            } as TextContent,
            {
              type: "image",
              data: screenshot,
              mimeType: "image/png",
            } as ImageContent,
          ],
          isError: false,
        };
      }
  
      case "puppeteer_click":
        try {
          await page.click(args.selector);
          return {
            content: [{
              type: "text",
              text: `Clicked: ${args.selector}`,
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to click ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      case "puppeteer_fill":
        try {
          await page.waitForSelector(args.selector);
          await page.type(args.selector, args.value);
          return {
            content: [{
              type: "text",
              text: `Filled ${args.selector} with: ${args.value}`,
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to fill ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      case "puppeteer_select":
        try {
          await page.waitForSelector(args.selector);
          await page.select(args.selector, args.value);
          return {
            content: [{
              type: "text",
              text: `Selected ${args.selector} with: ${args.value}`,
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to select ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      case "puppeteer_hover":
        try {
          await page.waitForSelector(args.selector);
          await page.hover(args.selector);
          return {
            content: [{
              type: "text",
              text: `Hovered ${args.selector}`,
            }],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to hover ${args.selector}: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      case "puppeteer_evaluate":
        try {
          // Use non-namespaced evaluate method
          await page!.evaluate(() => {
            window.mcpHelper = {
              logs: [],
              originalConsole: { ...console },
            };
  
            ['log', 'info', 'warn', 'error'].forEach(method => {
              (console as any)[method] = (...args: any[]) => {
                window.mcpHelper.logs.push(`[${method}] ${args.join(' ')}`);
                (window.mcpHelper.originalConsole as any)[method](...args);
              };
            });
          });
  
          const result = await page!.evaluate(args.script);
  
          const logs = await page!.evaluate(() => {
            Object.assign(console, window.mcpHelper.originalConsole);
            const logs = window.mcpHelper.logs;
            delete (window as any).mcpHelper;
            return logs;
          });
  
          return {
            content: [
              {
                type: "text",
                text: `Execution result:\n${JSON.stringify(result, null, 2)}\n\nConsole output:\n${logs.join('\n')}`,
              },
            ],
            isError: false,
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Script execution failed: ${(error as Error).message}`,
            }],
            isError: true,
          };
        }
  
      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${name}`,
          }],
          isError: true,
        };
    }
  }
  
  const server = new Server(
    {
      name: "example-servers/puppeteer",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListResourcesRequestSchema,async () => ({
    resources: [
        {
            uri: "console://logs",
            mimeType: "text/plain",
            name: "Browser console logs"
        },
        ...Array.from(screenshots.keys()).map(name => ({
            uri: `screenshot://${name}`,
            mimeType: "image/png",
            name: `Screenshot: ${name}`
        })),
    ],
  }));

 server.setRequestHandler(ReadResourceRequestSchema,async (request) => {
    const uri = request.params.uri;

    if(uri === "console://logs") {
      return {
        contents: [{
            uri,
            mimeType: "text/plain",
            data: consoleLogs.join("\n"),
        }],
      };
    }

    if (uri.startsWith("screenshot://")) {
        const name = uri.split("://")[1];
        const screenshot = screenshots.get(name);
        if (screenshot) {
          return {
            contents: [{
              uri,
              mimeType: "image/png",
              blob: screenshot,
            }],
          };
        }
      }
    
      throw new Error(`Resource not found: ${uri}`);
 });

 server.setRequestHandler(ListToolsRequestSchema,async () => ({
    tools:TOOLS,
 }));

 server.setRequestHandler(CallToolRequestSchema,async (request) => 
  handleToolCall(request.params.name,request.params.arguments ?? {})
 );

 //SSE Server setup

 class PuppeteerSSEServer {
    private sseTransport: SSEServerTransport | null = null;

    async startHttpServer(port:number = 3000) {
        const app = express();

        app.get("/sse", async(req,res) => {
            Logger.log("New SSE connection established");
            this.sseTransport = new SSEServerTransport(
                "/messages",
                res as unknown as ServerResponse<IncomingMessage>
            );
            await server.connect(this.sseTransport)
        });

        app.post("/messages", async(req,res) => {
            if (!this.sseTransport) {
                res.sendStatus(400);
                return;
            }
            await this.sseTransport.handlePostMessage(
                req as unknown as IncomingMessage,
                res as unknown as ServerResponse<IncomingMessage>
            );
        });

        app.listen(port, () => {
            Logger.log(`HTTP server listening on port ${port}`);
            Logger.log(`SSE endpoint available at http://localhost:${port}/sse`);
            Logger.log(`Message endpoint available at http://localhost:${port}/messages`);
            Logger.log("Puppeteer tools are available and ready to use");
        });
    }
 }

 // starting the server
 const port = getConfiguredPort();
 Logger.log(`Starting server with port configuration:`);
 Logger.log(`- DEFAULT_PORT: ${DEFAULT_PORT}`);
 Logger.log(`- Environment PORT: ${process.env.PORT || 'not set'}`);
 Logger.log(`- Final selected port: ${port}`);

 const sseServer = new PuppeteerSSEServer();
 sseServer.startHttpServer(port).catch(error => {
    Logger.error("Failed to start HTTP server:", error);
    process.exit(1);
 })
