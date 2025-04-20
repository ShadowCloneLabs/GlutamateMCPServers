# UI Assist MCP Server

A Model Context Protocol (MCP) server that connects with the UI Assist Chrome extension to help with UI-based input in web development. This server implements the SSE (Server-Sent Events) transport type for MCP communication.

## Description

This MCP server provides tools to interact with a browser, allowing AI assistants to:

- Capture screenshots of current browser tabs
- Get and manipulate selected HTML elements
- Clear selections and perform other browser interactions

## Chrome Extension

To enable browser interaction capabilities, you need to install the UI Assist Chrome extension:

<img src="https://chromewebstore.google.com/detail/cgpdancbdkpljflelfjpgdafebneible/icon" width="48" height="48" alt="UI Assist Extension Icon" style="vertical-align: middle"> [UI Assist Extension](https://chromewebstore.google.com/detail/cgpdancbdkpljflelfjpgdafebneible?utm_source=item-share-cb)

### Features

- 🔍 Element selection in browser tabs
- 📸 Screenshot capture support
- 🔄 Real-time synchronization with MCP server
- 🛡️ Secure local communication

### Installation Steps

1. Click the extension link above to open the Chrome Web Store
2. Click "Add to Chrome" to install the extension
3. Once installed, you'll see the UI Assist icon in your browser toolbar
4. Make sure the MCP server is running locally before using the extension you shoud be able to see connected

Once we reach 100 stars , we will open source the code extension code as well

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

## Glutamate App Integration

To integrate your MCP server with the Glutamate app, you need to create a metadata file that describes your server's capabilities. This helps the Glutamate app understand and properly integrate with your MCP server.

### Important Note for SSE Servers

All SSE-type MCP servers must accept the `--port` command line argument to be supported in the Glutamate app. This allows the Glutamate app to dynamically assign ports and manage multiple server instances. Make sure your server implementation includes this functionality.

### Important Note for Connection Type

The `connectionType` field in the metadata file must be specified in lowercase. Only two values are supported:

- `"sse"` for Server-Sent Events
- `"stdio"` for Standard Input/Output

Any other value or capitalization will not be recognized by the Glutamate app.

### Creating Metadata File

Create a file named `glutamate.json` in your project root with the following structure:

```json
{
  "name": "UI Assist MCP Server",
  "description": "A Model Context Protocol (MCP) server that connects with the UI Assist Chrome extension to help with UI-based input in web development",
  "version": "0.1.0",
  "releaseDate": "YYYY-MM-DD",
  "author": "Your Name or Organization",
  "license": "MIT",
  "repositoryUrl": "https://github.com/username/repository",
  "implementationLanguage": "JavaScript",
  "connectionType": "sse",
  "runtimeRequirements": "Node.js",
  "packageName": "@glutamateapp/ui-assist",
  "color": "#HEXCOLOR",
  "tools": [
    {
      "name": "get_selected_elements",
      "description": "Retrieves HTML elements that have been selected in the browser"
    },
    {
      "name": "clear_selected_elements",
      "description": "Clears the list of selected elements"
    }
  ],
  "environmentVariables": [
    {
      "variableName": "PORT",
      "description": "Port for the MCP server",
      "isRequired": false,
      "defaultValue": "3332"
    },
    {
      "variableName": "CONNECTOR_PORT",
      "description": "Port for the browser connector",
      "isRequired": false,
      "defaultValue": "3025"
    }
  ]
}
```

For detailed information about each field and best practices, refer to the [Glutamate Metadata Documentation](glutamate.md).

### Integration Steps

1. Create the `glutamate.json` file in your project root
2. Fill in all required fields with accurate information about your MCP server
3. Ensure your server implements all the tools listed in the metadata
4. Test the integration with the Glutamate app
5. Update the metadata file whenever you add new tools or make significant changes

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
