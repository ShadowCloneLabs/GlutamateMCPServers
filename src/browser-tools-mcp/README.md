# Browser Tools MCP Server

A Model Context Protocol (MCP) server for browser tools and screenshot capture.

## Description

This MCP server provides tools to interact with a browser, allowing AI assistants to:

- Capture screenshots of current browser tabs
- Get and manipulate selected HTML elements
- Clear selections and perform other browser interactions

## Installation

### Global Installation

```bash
npm install -g @modelcontextprotocol/server-browser-tools
```

Once installed globally, you can run the server directly:

```bash
mcp-server-browser-tools
```

### Using npx

You can run the server without installation using npx:

```bash
npx @modelcontextprotocol/server-browser-tools
```

## Configuration

The server can be configured using:

- `MCP_PORT`: Port for the MCP server (default: 3332)
- `CONNECTOR_PORT`: Port for the browser connector (default: 3025)

Examples:

```bash
# Using environment variables
MCP_PORT=3333 CONNECTOR_PORT=3026 mcp-server-browser-tools

# Using command line arguments
mcp-server-browser-tools --mcp-port=3333 --connector-port=3026
```

## Available Tools

### `capture_screenshot`

Takes a screenshot of the current browser tab.

**Example usage in Cursor AI:**

```
Please capture a screenshot of my current browser tab.
```

### `get_selected_elements`

Retrieves HTML elements that have been selected in the browser.

**Example usage in Cursor AI:**

```
I've selected some elements in my browser. Can you retrieve them and tell me about their structure?
```

### `clear_selected_elements`

Clears the list of selected elements.

**Example usage in Cursor AI:**

```
Please clear any selected elements from previous operations.
```

## Complete Example Workflow

Here's a complete workflow example:

1. Start the MCP server
2. Open Cursor and ensure it's configured to use the MCP server
3. In a browser, navigate to a webpage
4. In Cursor, ask the AI: "Take a screenshot of my current browser page."
5. Select some HTML elements in the browser
6. In Cursor, ask the AI: "Retrieve the HTML elements I just selected and explain their structure."
7. Once finished, ask the AI: "Clear the selected elements."

## Integration with AI Assistants

### Cursor Setup

To use this MCP server with Cursor:

1. Ensure the server is running:

   ```bash
   # If installed globally
   mcp-server-browser-tools

   # Or using npx
   npx @modelcontextprotocol/server-browser-tools
   ```

2. Add the following configuration to Cursor's MCP section:

```json
{
  "mcpServers": {
    "browser-tools": {
      "url": "http://localhost:3332/sse"
    }
  }
}
```

3. Create or update your `mcp.json` file in your project root with the same configuration.

4. Adjust the port number if you've configured a different port.

5. Restart Cursor if necessary for the changes to take effect.

## Development

### Building from source

```bash
npm run build
```

### Watching for changes during development

```bash
npm run watch
```

## Repository

[https://github.com/ShadowCloneLabs/GlutamateMCPServers](https://github.com/ShadowCloneLabs/GlutamateMCPServers)

## License

MIT
