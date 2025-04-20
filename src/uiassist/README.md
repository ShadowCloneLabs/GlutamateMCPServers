# UI Assist MCP Server

A Model Context Protocol (MCP) server that connects with the UI Assist Chrome extension to help with UI-based input in web development. This server implements the SSE (Server-Sent Events) transport type for MCP communication.

## Description

This MCP server provides tools to interact with a browser, allowing AI assistants to:

- Capture screenshots of current browser tabs
- Get and manipulate selected HTML elements
- Clear selections and perform other browser interactions

## Installation

### Global Installation

```bash
npm install -g @glutamateapp/ui-assist
```

Once installed globally, you can run the server directly:

```bash
ui-assist
```

### Using npx

You can run the server without installation using npx:

```bash
npx @glutamateapp/ui-assist
```

## Configuration

The server can be configured using:

- `PORT`: Port for the MCP server (default: 3332)
- `CONNECTOR_PORT`: Port for the browser connector (default: 3025)

Examples:

```bash
# Using environment variables
PORT=3333 CONNECTOR_PORT=3026 ui-assist

# Using command line arguments
ui-assist --port=3333 --connector-port=3026
```

## Available Tools

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
   ui-assist

   # Or using npx
   npx @glutamateapp/ui-assist
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

### Claude Desktop Setup

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "uiassist": {
      "url": "http://localhost:3332/sse"
    }
  }
}
```


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
