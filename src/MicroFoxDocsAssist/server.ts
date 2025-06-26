import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createClient } from '@supabase/supabase-js';
import { embed } from './embed.js';
import dotenv from 'dotenv';
import { IncomingMessage, ServerResponse } from "http";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase URL or Key is not set in the environment variables.");
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLE = 'docs_embeddings';

export const Logger = {
    log: (...args: any[]) => console.log(...args),
    error: (...args: any[]) => console.error(...args),
};

export class DocsAssistMcpServer {
    private readonly server: McpServer;
    private sseTransport: SSEServerTransport | null = null;

    constructor() {
        Logger.log("Initializing DocsAssistMcpServer...");
        this.server = new McpServer(
            {
                name: "MicroFox Documentation Assistant",
                version: "1.0.0",
            },
            {
                capabilities: {
                    logging: {},
                    tools: {
                        listByPackage: {},
                        semanticSearch: {},
                        getFunctionDoc: {},
                        checkFunctionExists: {}
                    },
                },
            }
        );
        Logger.log("McpServer created.");

        this.registerTools();
        Logger.log("DocsAssistMcpServer initialized.");
    }

    private registerTools(): void {
        Logger.log("Registering tools...");
        this.server.tool(
            "listByPackage",
            "List files in a package, optionally filtering by document type.",
            {
                pkg: z.string().describe('The name of the package.'),
                docType: z.string().optional().describe('The type of document to filter by.'),
                limit: z.number().default(10).optional().describe('The maximum number of results to return.'),
            },
            async (params: { pkg: string, docType?: string, limit?: number }) => {
                try {
                    const { pkg, docType, limit } = params;
                    const query = supabase
                        .from(TABLE)
                        .select('file_path,package_name,function_name,doc_type,updated_at')
                        .eq('package_name', pkg)
                        .order('updated_at', { ascending: false })
                        .limit(limit || 10);

                    if (docType) {
                        query.eq('doc_type', docType);
                    }

                    const { data, error } = await query;
                    if (error) {
                        throw error;
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(data, null, 2)
                            }
                        ]
                    };
                } catch (error) {
                    Logger.error('Error listing by package:', error);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error listing by package: ${error instanceof Error ? error.message : String(error)}`
                            }
                        ]
                    };
                }
            }
        );
        Logger.log("Registered tool: listByPackage");

        this.server.tool(
            "semanticSearch",
            "Perform a semantic search for documentation.",
            {
                pkg: z.string().describe('The package to search in. Use "*" for a global search.'),
                query: z.string().describe('The search query.'),
                docType: z.string().optional().describe('The type of document to filter by.'),
                limit: z.number().default(10).optional().describe('The maximum number of results to return.'),
            },
            async (params: { pkg: string, query: string, docType?: string, limit?: number }) => {
                try {
                    const { pkg, query, docType, limit } = params;
                    const qEmb = await embed(query);

                    const fnName = pkg === '*' ? 'match_docs' : 'match_docs_in_package';
                    const rpcArgs: any = {
                        query_embedding: qEmb,
                        k: limit || 10,
                        doc_type_filter: docType || null,
                    };
                    if (pkg !== '*') {
                        rpcArgs.pkg_name = pkg;
                    }

                    const { data, error } = await supabase.rpc(fnName, rpcArgs);
                    if (error) {
                        throw error;
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(data, null, 2)
                            }
                        ]
                    };
                } catch (error) {
                    Logger.error('Error during semantic search:', error);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error during semantic search: ${error instanceof Error ? error.message : String(error)}`
                            }
                        ]
                    };
                }
            }
        );
        Logger.log("Registered tool: semanticSearch");

        this.server.tool(
            "getFunctionDoc",
            "Get the documentation for a specific function in a package.",
            {
                packageName: z.string().describe('The name of the package.'),
                functionName: z.string().describe('The name of the function.'),
            },
            async (params: { packageName: string, functionName: string }) => {
                try {
                    const { packageName, functionName } = params;
                    const { data, error } = await supabase
                        .from(TABLE)
                        .select('content')
                        .eq('package_name', packageName)
                        .eq('function_name', functionName)
                        .single();

                    if (error) {
                        throw error;
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: data?.content || "No documentation found."
                            }
                        ]
                    };
                } catch (error) {
                    Logger.error('Error getting function doc:', error);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error getting function documentation: ${error instanceof Error ? error.message : String(error)}`
                            }
                        ]
                    };
                }
            }
        );
        Logger.log("Registered tool: getFunctionDoc");

        this.server.tool(
            "checkFunctionExists",
            "Check if a function exists in a package.",
            {
                packageName: z.string().describe('The name of the package.'),
                functionName: z.string().describe('The name of the function.'),
            },
            async (params: { packageName: string, functionName: string }) => {
                try {
                    const { packageName, functionName } = params;
                    const { data, error } = await supabase
                        .from(TABLE)
                        .select('id', { count: 'exact' })
                        .eq('package_name', packageName)
                        .eq('function_name', functionName);
                    
                    if (error) {
                        throw error;
                    }

                    return {
                        content: [
                            {
                                type: "text",
                                text: `Function ${functionName} ${data && data.length > 0 ? 'exists' : 'does not exist'} in package ${packageName}`
                            }
                        ]
                    };
                } catch (error) {
                    Logger.error('Error checking function existence:', error);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Error checking function existence: ${error instanceof Error ? error.message : String(error)}`
                            }
                        ]
                    };
                }
            }
        );
        Logger.log("Registered tool: checkFunctionExists");
        Logger.log("All tools registered.");
    }

    async startHttpServer(port: number): Promise<void> {
        const app = express();
        app.use(cors());

        app.get("/sse", async (req, res) => {
            Logger.log("New SSE connection established at /sse");
            this.sseTransport = new SSEServerTransport(
                "/messages",
                res as unknown as ServerResponse<IncomingMessage>
            );
            Logger.log("SSEServerTransport created. Connecting to McpServer...");
            try {
                await this.server.connect(this.sseTransport);
                Logger.log("McpServer connected to transport successfully.");
            } catch (error) {
                Logger.error("Error connecting McpServer to transport:", error);
            }
        });

        app.post("/messages", async (req, res) => {
            if (!this.sseTransport) {
                res.status(400).json({ error: "No active SSE connection" });
                return;
            }
            await this.sseTransport.handlePostMessage(
                req as unknown as IncomingMessage,
                res as unknown as ServerResponse<IncomingMessage>
            );
        });

        return new Promise((resolve, reject) => {
            try {
                app.listen(port, () => {
                    console.log(`MicroFox Documentation Assistant server running at http://localhost:${port}`);
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    async connect(transport: Transport): Promise<void> {
        await this.server.connect(transport);
        Logger.log("Server connected and ready to process requests");
    }
} 