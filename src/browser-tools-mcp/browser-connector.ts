import express from "express";
import cors from "cors";
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import { IncomingMessage } from "http";
import { Socket } from "net";
import os from "os";

// Function to get default downloads folder
function getDefaultDownloadsFolder(): string {
  const homeDir = os.homedir();
  const downloadsPath = path.join(homeDir, "Downloads", "mcp-screenshots");
  return downloadsPath;
}

// Store settings just for screenshot path
let currentSettings = {
  screenshotPath: getDefaultDownloadsFolder(),
};

// Screenshot callback type
interface ScreenshotCallback {
  resolve: (value: { data: string; path?: string }) => void;
  reject: (reason: Error) => void;
}

const screenshotCallbacks = new Map<string, ScreenshotCallback>();

interface ElementSelectionData {
  tag: string;
  id: string;
  classes: string[];
  text: string;
  attributes: { name: string; value: string }[];
}

const selectedElements: ElementSelectionData[] = [];

// Create Express app
const app = express();

// Export a function to start the browser connector
export async function startBrowserConnector(PORT: number) {
  app.use(cors());
  // Increase JSON body parser limit to 50MB to handle large screenshots
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Simple endpoint for checking server status
  app.get("/status", (req, res) => {
    res.json({ status: "ok", service: "browser-connector" });
  });

  // Endpoint for saving screenshot path settings
  app.post("/settings", (req, res) => {
    const { screenshotPath } = req.body;
    if (screenshotPath) {
      currentSettings.screenshotPath = screenshotPath;
      console.log("Updated screenshot path:", screenshotPath);
    }
    res.json({ status: "ok", settings: currentSettings });
  });

  // Get current settings
  app.get("/settings", (req, res) => {
    res.json(currentSettings);
  });

  // Get port endpoint for discovery
  app.get("/.port", (req, res) => {
    res.send(PORT.toString());
  });

  // Endpoint for extension logs
  app.post("/extension-log", (req, res) => {
    console.log("\n=== Received Extension Log ===");
    console.log("Request body data type:", req.body.data?.type);

    const { data } = req.body;

    if (!data) {
      console.log("Warning: No data received in log request");
      res.status(400).json({ status: "error", message: "No data provided" });
      return;
    }

    console.log(`Processing ${data.type} log entry`);

    res.json({ status: "ok" });
  });

  // Add endpoints to get console logs and errors

  // Create server and start listening
  const server = app.listen(PORT, () => {
    console.log(`Browser connector listening on http://127.0.0.1:${PORT}`);
  });

  // Initialize browser connector with the server
  const browserConnector = new BrowserConnector(app, server);

  // Handle shutdown gracefully
  process.on("SIGINT", () => {
    server.close(() => {
      console.log("Browser connector shut down");
      process.exit(0);
    });
  });

  return browserConnector;
}

export class BrowserConnector {
  private wss: WebSocketServer;
  private activeConnection: WebSocket | null = null;
  private app: express.Application;
  private server: any;

  constructor(app: express.Application, server: any) {
    this.app = app;
    this.server = server;

    // Initialize WebSocket server
    this.wss = new WebSocketServer({
      noServer: true,
      path: "/extension-ws",
    });

    // Register the capture-screenshot endpoint
    this.app.post(
      "/capture-screenshot",
      async (req: express.Request, res: express.Response) => {
        console.log("Received request to capture screenshot");
        await this.captureScreenshot(req, res);
      }
    );

    // Handle upgrade requests for WebSocket
    this.server.on(
      "upgrade",
      (request: IncomingMessage, socket: Socket, head: Buffer) => {
        if (request.url === "/extension-ws") {
          this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            this.wss.emit("connection", ws, request);
          });
        }
      }
    );

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("Chrome extension connected via WebSocket");
      this.activeConnection = ws;

      ws.on("message", (message: Buffer | string) => {
        try {
          const data = JSON.parse(message.toString());
          console.log("Received WebSocket message type:", data.type);

          // Handle console log data via WebSocket
          if (data.type === "console-log-data" && data.data) {
            console.log("Received console log via WebSocket");

            const logData = data.data;
          }
          // Handle screenshot response
          else if (data.type === "screenshot-data" && data.data) {
            console.log("Received screenshot data");

            if (data.requestId && screenshotCallbacks.has(data.requestId)) {
              // Get the specific callback for this request
              const callback = screenshotCallbacks.get(data.requestId);
              console.log(
                `Resolving screenshot promise for requestId: ${data.requestId}`
              );
              callback?.resolve({ data: data.data, path: data.path });
              screenshotCallbacks.delete(data.requestId);
            } else {
              // No specific requestId or not found in callbacks
              // Get the callbacks for fallback behavior (old code path)
              const callbacks = Array.from(screenshotCallbacks.values());
              if (callbacks.length > 0) {
                const callback = callbacks[0];
                console.log("Resolving screenshot promise (fallback)");
                callback.resolve({ data: data.data, path: data.path });
                screenshotCallbacks.clear();
              } else {
                console.log("No callbacks found for screenshot");
                // If no callbacks waiting, save the screenshot anyway
                this.saveScreenshot(data.data);
              }
            }
          }
          // Handle screenshot error
          else if (data.type === "screenshot-error") {
            console.log("Received screenshot error:", data.error);

            if (data.requestId && screenshotCallbacks.has(data.requestId)) {
              // Get the specific callback for this request
              const callback = screenshotCallbacks.get(data.requestId);
              console.log(
                `Rejecting screenshot promise for requestId: ${data.requestId}`
              );
              callback?.reject(
                new Error(data.error || "Screenshot capture failed")
              );
              screenshotCallbacks.delete(data.requestId);
            } else {
              // Fallback behavior
              const callbacks = Array.from(screenshotCallbacks.values());
              if (callbacks.length > 0) {
                const callback = callbacks[0];
                callback.reject(
                  new Error(data.error || "Screenshot capture failed")
                );
                screenshotCallbacks.clear();
              }
            }
          }
          // Handle selected element data
          else if (data.type === "selected-element" && data.data) {
            console.log("Received selected element data:", data.data);
            selectedElements.push(data.data);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        console.log("Chrome extension disconnected");
        if (this.activeConnection === ws) {
          this.activeConnection = null;
        }
      });
    });

    // Direct screenshot saving endpoint (fallback)
    this.app.post(
      "/screenshot",
      (req: express.Request, res: express.Response): void => {
        try {
          console.log("Received direct screenshot save request");
          const { data } = req.body;

          if (!data) {
            console.log("Screenshot request missing data");
            res.status(400).json({ error: "Missing screenshot data" });
            return;
          }

          // Save and return the screenshot path
          const savedPath = this.saveScreenshot(data);
          res.json({
            path: savedPath,
            filename: path.basename(savedPath),
          });
        } catch (error: unknown) {
          console.error("Error saving screenshot:", error);
          if (error instanceof Error) {
            res.status(500).json({ error: error.message });
          } else {
            res.status(500).json({ error: "An unknown error occurred" });
          }
        }
      }
    );

    // Add a new endpoint to get selected elements
    this.app.get(
      "/selected-elements",
      (req: express.Request, res: express.Response): void => {
        res.json({
          elements: selectedElements,
        });
      }
    );

    this.app.delete(
      "/selected-elements",
      (req: express.Request, res: express.Response): void => {
        selectedElements.length = 0;
        res.json({ status: "ok" });
      }
    );
  }

  // Method to save a screenshot to disk
  private saveScreenshot(base64Data: string): string {
    // Use configured path
    const targetPath = currentSettings.screenshotPath;
    console.log(`Using screenshot path: ${targetPath}`);

    // Remove the data:image/png;base64, prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/png;base64,/, "");

    // Create the directory path if it doesn't exist
    fs.mkdirSync(targetPath, { recursive: true });

    // Generate a unique filename using timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `screenshot-${timestamp}.png`;
    const fullPath = path.join(targetPath, filename);
    console.log(`Saving screenshot to: ${fullPath}`);

    // Write the file
    fs.writeFileSync(fullPath, cleanBase64, "base64");
    console.log("Screenshot saved successfully");

    return fullPath;
  }

  // Method to capture screenshot from extension
  async captureScreenshot(req: express.Request, res: express.Response) {
    if (!this.activeConnection) {
      console.log("No active WebSocket connection to Chrome extension");
      return res.status(503).json({ error: "Chrome extension not connected" });
    }

    try {
      console.log("Starting screenshot capture...");
      const requestId = Date.now().toString();

      // Create promise that will resolve when we get the screenshot data
      const screenshotPromise = new Promise<{ data: string; path?: string }>(
        (resolve, reject) => {
          console.log(
            `Setting up screenshot callback for requestId: ${requestId}`
          );
          screenshotCallbacks.set(requestId, { resolve, reject });

          // Send screenshot request to extension via WebSocket
          if (this.activeConnection) {
            this.activeConnection.send(
              JSON.stringify({
                type: "take-screenshot",
                requestId: requestId,
              })
            );
          } else {
            reject(new Error("WebSocket connection lost"));
            screenshotCallbacks.delete(requestId);
            return;
          }

          // Set timeout for the request
          setTimeout(() => {
            if (screenshotCallbacks.has(requestId)) {
              console.log(
                `Screenshot capture timed out for requestId: ${requestId}`
              );
              screenshotCallbacks.delete(requestId);
              reject(new Error("Screenshot capture timed out"));
            }
          }, 10000);
        }
      );

      // Wait for screenshot data
      console.log("Waiting for screenshot data...");
      const { data: base64Data } = await screenshotPromise;
      console.log("Received screenshot data, saving...");

      if (!base64Data) {
        throw new Error("No screenshot data received from Chrome extension");
      }

      // Save the screenshot
      const fullPath = this.saveScreenshot(base64Data);

      res.json({
        path: fullPath,
        filename: path.basename(fullPath),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error capturing screenshot:", errorMessage);
      res.status(500).json({
        error: errorMessage,
      });
    }
  }
}
