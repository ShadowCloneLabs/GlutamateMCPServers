# MCP Server Metadata Template

This document provides a template and instructions for creating standardized metadata files for Model Context Protocol (MCP) servers. Add this to your repository to help users understand your server's capabilities.

## Metadata Template

Create a file named `mcp-server-metadata.json` in your repository with the following structure:

```json
{
  "name": "Your MCP Server Name",
  "description": "A detailed description of your server and its capabilities",
  "version": "0.1.0",
  "releaseDate": "YYYY-MM-DD",
  "author": "Your Name or Organization",
  "license": "License Type (e.g., MIT, Apache 2.0)",
  "repositoryUrl": "https://github.com/username/repository",
  "implementationLanguage": "Programming Language Used",
  "connectionType": "Communication Protocol (e.g., stdio, SSE)",
  "runtimeRequirements": "Runtime Requirements (e.g., Node.js, Docker)",
  "packageName": "npm-package-name",
  "color": "#HEXCOLOR",
  "defaultPort": 5000,
  "imageUrl": "https://example.com/server-icon.svg",
  "tools": [
    {
      "name": "tool_name",
      "description": "Description of what this tool does"
    }
  ],
  "environmentVariables": [
    {
      "variableName": "VARIABLE_NAME",
      "description": "Purpose of this environment variable",
      "isRequired": true/false,
      "defaultValue": "default value if any"
    }
  ]
}
```

## Field Descriptions

### Basic Information

| Field         | Description                                                          | Example                                                                                     |
| ------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `name`        | The name of your MCP server                                          | "PostgreSQL MCP Server"                                                                     |
| `description` | A detailed description of what your server does and its capabilities | "A Model Context Protocol server that provides read-only access to PostgreSQL databases..." |
| `version`     | The current version of your server                                   | "0.1.0"                                                                                     |
| `releaseDate` | The release date in YYYY-MM-DD format                                | "2025-04-16"                                                                                |
| `author`      | Individual or organization that created the server                   | "ShadowCloneLabs"                                                                           |
| `license`     | The license under which the server is released                       | "MIT"                                                                                       |

### Technical Details

| Field                    | Description                                | Example                                  |
| ------------------------ | ------------------------------------------ | ---------------------------------------- |
| `repositoryUrl`          | URL to the GitHub or other repository      | "https://github.com/username/repository" |
| `implementationLanguage` | The primary programming language used      | "JavaScript", "Python", "Rust"           |
| `connectionType`         | The communication protocol the server uses | Must be lowercase "sse" or "stdio" only  |
| `runtimeRequirements`    | What's needed to run the server            | "Node.js", "Docker", "Python 3.9+"       |
| `packageName`            | Package name in the relevant registry      | "@namespace/package-name"                |
| `color`                  | A hex color code representing your server  | "#3ECF8E"                                |
| `defaultPort`            | Default port number for the server         | 3000                                     |
| `imageUrl`               | URL to the server's icon or logo image     | "https://example.com/server-icon.png"    |

### Important Requirements

1. **Connection Type Case Sensitivity**

   - The `connectionType` field must be specified in lowercase
   - Only two values are supported: `"sse"` or `"stdio"`
   - Any other value or capitalization will not be recognized

2. **SSE Server Requirements**
   - All SSE-type servers must accept the `--port` command line argument
   - This allows the Glutamate app to dynamically assign ports
   - Required for proper server instance management

### Functional Components

| Field                 | Description                        | Example                                                         |
| --------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `tools`               | Array of tools the server provides | See below                                                       |
| `tools[].name`        | Name of the tool                   | "query", "get_selected_elements"                                |
| `tools[].description` | Description of what the tool does  | "Executes read-only SQL queries against the connected database" |

### Configuration

| Field                                 | Description                       | Example                   |
| ------------------------------------- | --------------------------------- | ------------------------- |
| `environmentVariables`                | Array of environment variables    | See below                 |
| `environmentVariables[].variableName` | Name of the variable              | "PORT", "ACCESS_TOKEN"    |
| `environmentVariables[].description`  | Purpose of the variable           | "Port for the MCP server" |
| `environmentVariables[].isRequired`   | Whether this variable is required | `true` or `false`         |
| `environmentVariables[].defaultValue` | Default value if not provided     | "3000", ""                |

## Examples

### Minimal Example

```json
{
  "name": "Simple MCP Server",
  "description": "A basic MCP server for demonstration purposes",
  "version": "0.0.1",
  "releaseDate": "2025-04-16",
  "author": "Your Name",
  "license": "MIT",
  "repositoryUrl": "https://github.com/yourusername/simple-mcp-server",
  "implementationLanguage": "JavaScript",
  "connectionType": "stdio",
  "runtimeRequirements": "Node.js",
  "packageName": "@yourusername/simple-mcp-server",
  "color": "#4287f5",
  "defaultPort": 3000,
  "imageUrl": "https://example.com/simple-mcp-server-icon.png",
  "tools": [
    {
      "name": "hello_world",
      "description": "Returns a hello world message"
    }
  ],
  "environmentVariables": []
}
```

### Complete Example

```json
{
  "name": "UI Assist MCP Server",
  "description": "A Model Context Protocol (MCP) server that connects with the UI Assist Chrome extension to help with UI-based input in web development. It provides tools to interact with a browser, allowing AI assistants to capture screenshots of current browser tabs, get and manipulate selected HTML elements, and perform other browser interactions.",
  "version": "0.0.1",
  "releaseDate": "2025-04-16",
  "author": "ShadowCloneLabs",
  "license": "MIT",
  "repositoryUrl": "https://github.com/ShadowCloneLabs/GlutamateMCPServers",
  "implementationLanguage": "JavaScript",
  "connectionType": "sse",
  "runtimeRequirements": "Node.js",
  "packageName": "@glutamateapp/ui-assist",
  "color": "#FFFFFF",
  "defaultPort": 3025,
  "imageUrl": "https://shadowclonelabs.com/ui-assist-icon.png",
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
      "variableName": "CONNECTOR_PORT",
      "description": "Port for the browser connector",
      "isRequired": true,
      "defaultValue": "3025"
    }
  ],
  "notes": {
    "connectionType": "Must be lowercase 'sse' or 'stdio' only",
    "sseRequirements": "SSE servers must accept --port command line argument"
  }
}
```

## Best Practices

1. **Keep descriptions concise but informative** - Aim for clear explanations without unnecessary details
2. **Use semantic versioning** - Follow [SemVer](https://semver.org/) for version numbers
3. **Choose a relevant color** - Pick a color that matches your branding or the technology your server integrates with
4. **Document all tools** - Each tool should have a clear description of its purpose
5. **Include all environment variables** - Document every configuration option available
6. **Update metadata when making changes** - Keep the metadata file in sync with your server's capabilities

## Integration

Add this metadata file to:

1. The root of your repository
2. Your documentation website
3. Your package registry metadata (if applicable)

This helps AI assistants and other tools discover and understand your MCP server's capabilities.
