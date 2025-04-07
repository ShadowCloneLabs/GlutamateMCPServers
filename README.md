# Browser Tools MCP Server

This package provides a Model Context Protocol (MCP) server for browser tools and screenshot capture functionality.

## Features

- Screenshot capture from browser tabs
- Get selected HTML elements
- Clear selected elements
- Browser connection management

## Installation

### Global Installation

```bash
npm install -g @modelcontextprotocol/server-browser-tools
```

Once installed globally, you can run the server with:

```bash
mcp-server-browser-tools
```

### Running without Installation

You can run the MCP server without installation using npx:

```bash
npx @modelcontextprotocol/server-browser-tools
```

### Local Installation

To install as a project dependency:

```bash
npm install @modelcontextprotocol/server-browser-tools
```

## Configuration

You can configure the server using environment variables or command-line arguments:

- `MCP_PORT`: Port for the MCP server (default: 3332)
- `CONNECTOR_PORT`: Port for the browser connector (default: 3025)

Examples:

```bash
# Using environment variables
MCP_PORT=3333 CONNECTOR_PORT=3026 mcp-server-browser-tools

# Using command line arguments
mcp-server-browser-tools --mcp-port=3333 --connector-port=3026
```

## Cursor Integration

### Setting up in Cursor

To use this MCP server with Cursor:

1. First, ensure the MCP server is running:

   ```bash
   # If installed globally
   mcp-server-browser-tools

   # Or using npx without installation
   npx @modelcontextprotocol/server-browser-tools
   ```

2. Add the following configuration to Cursor's MCP section in Settings:

   ```json
   {
     "mcpServers": {
       "browser-tools": {
         "url": "http://localhost:3332/sse"
       }
     }
   }
   ```

3. Create or update your `mcp.json` file in your project root with the same configuration:

   ```json
   {
     "mcpServers": {
       "browser-tools": {
         "url": "http://localhost:3332/sse"
       }
     }
   }
   ```

4. Make sure to adjust the port number if you've configured a different port than the default (3332).

5. Restart Cursor if necessary for the changes to take effect.

6. You can now use browser tools in your Cursor AI conversations.

## Available Tools

This MCP server provides the following tools:

- `capture_screenshot`: Take a screenshot of the current browser tab
- `get_selected_elements`: Retrieve selected HTML elements
- `clear_selected_elements`: Clear the list of selected elements

## Development

### Clone the Repository

```bash
git clone https://github.com/ShadowCloneLabs/GlutamateMCPServers.git
cd GlutamateMCPServers
```

### Install Dependencies

```bash
npm install
```

### Building the project

```bash
npm run build
```

### Watching for changes

```bash
npm run watch
```

### Running locally during development

```bash
npm run dev
```

## Repository

[https://github.com/ShadowCloneLabs/GlutamateMCPServers](https://github.com/ShadowCloneLabs/GlutamateMCPServers)

## License

MIT
