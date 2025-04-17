import express from "express";
import cors from "cors";
import WebSocket from "ws";
import { WebSocketServer } from "ws";
import fs from "fs";
import path from "path";
import { IncomingMessage } from "http";
import { Socket } from "net";
import os from "os";
import { EventEmitter } from "events";

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

  // Increase the maximum number of listeners
  EventEmitter.defaultMaxListeners = 10;

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
  const cleanup = async () => {
    console.log('Cleaning up resources...');
    await browserConnector.cleanup();
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return browserConnector;
}

export class BrowserConnector {
  protected wss: WebSocketServer;
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
            // Use the current settings path if no custom path is provided
            const savePath = data.savePath || currentSettings.screenshotPath;
            console.log("Path being used for screenshot:", savePath);
            console.log("Current settings path at time of screenshot:", currentSettings.screenshotPath);
            this.saveScreenshot(data.data, savePath);
          }
          // Handle screenshot error
          else if (data.type === "screenshot-error") {
            console.error("Received screenshot error from extension:", data.error || "Unknown error");
          }
          // Handle save path update
          else if (data.type === "update-save-path" && data.path) {
            console.log("Received save path update:", data.path);
            console.log("Previous screenshot path:", currentSettings.screenshotPath);
            currentSettings.screenshotPath = data.path;
            console.log("Updated screenshot path:", currentSettings.screenshotPath);
            // Send confirmation back to extension
            ws.send(JSON.stringify({
              type: "path-update-confirmation",
              success: true
            }));
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
  private saveScreenshot(base64Data: string, customSavePath?: string): string {
    // Determine the target path
    let targetPath = currentSettings.screenshotPath; // Default path
    let filenamePrefix = "screenshot-";

    console.log("Current settings path:", currentSettings.screenshotPath);
    console.log("Custom save path provided:", customSavePath);

    if (customSavePath) {
      // Use custom path provided by the extension
      targetPath = path.dirname(customSavePath);
      const customFilename = path.basename(customSavePath);
      // Use custom filename if it has an extension, otherwise treat it as directory path
      if (path.extname(customFilename)) {
          filenamePrefix = customFilename.replace(/\.png$/i, "") + "-";
          // Use the directory from the custom path
      } else {
          // If no extension, assume customSavePath is a directory
          targetPath = customSavePath;
      }
      console.log(`Using custom save path: ${targetPath}`);
    } else {
      console.log(`Using default screenshot path: ${targetPath}`);
    }

    // Remove the data:image/png;base64, prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/png;base64,/, "");

    // Create the directory path if it doesn't exist
    fs.mkdirSync(targetPath, { recursive: true });

    // Generate a unique filename using timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${filenamePrefix}${timestamp}.png`;
    const fullPath = path.join(targetPath, filename);
    console.log(`Saving screenshot to: ${fullPath}`);

    // Write the file
    fs.writeFileSync(fullPath, cleanBase64, "base64");
    console.log("Screenshot saved successfully");

    return fullPath;
  }

  public cleanup(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          console.log('WebSocket server closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
