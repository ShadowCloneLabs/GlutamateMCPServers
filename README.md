<div align="center">
  <a href="https://discord.gg/6fXp2yTbMd" style="display: inline-block; border-radius: 10px; overflow: hidden;">
    <img src="https://img.shields.io/badge/Join%20Our%20Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white&rounded=true" alt="Join Our Discord" width="200"/>
  </a>
</div>

# Glutamate MCP Servers

Welcome to the Glutamate MCP Servers repository! This project contains a collection of MCPs (Model Context Protocol) servers that are made by gluamate team can be easily deployed and managed through the Glutamate platform. We support all stdio and sse servers by any creators.

## 🎥 Introduction Video

<div align="center">
  <img src="./assets\GlutamateIntro__.gif" alt="Glutamate Intro GIF" width="600" style="max-width: 100%; height: auto; display: block; margin: 0 auto;"/>
  
  <p align="center">
    <a href="https://youtu.be/Qwt_6Y0RLXw" style="display: inline-block; border-radius: 10px; overflow: hidden;">
      <img src="https://img.shields.io/badge/Watch%20on%20YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white&rounded=true" alt="Watch on YouTube" width="180"/>
    </a>
  </p>
</div>

## About Glutamate

[Glutamate](https://glutamateapp.com) is a powerful desktop platform that simplifies the deployment and management of Model Context Protocol servers. It provides a user-friendly interface and robust tools for server administration, making it easier than ever to run and customize your MCP servers.

Key Features:

- 🔒 All keys are securely stored locally
- ⚡ Install & Start/Stop MCP servers on your local machine
- 💻 Full support for both stdio & SSE protocols
- 📦 No Node.js installation required on your system
- 🎁 100% free to use , now and forever
- Avaible on Windows , Linux and Mac (coming soon)

## Road Map:

- Auto Sync (server config and port) with any client (cursor , windsurf , cline , roocode etc..) (coming in next update!!)
- Auto start of mcp severs on start of glutamate (based on user settings)
- Oath login for mcps to fetch api keys
- User submission of servers

## Custom Made Servers

Our repository includes several custom MCP servers that are created by Glutamate Team , We support all stdio and sse server that are node based on our glutamate app

### UI Assist

Located in the `src/uiassist` directory, UI Assist is a specialized server that provides enhanced user interface capabilities for MCP servers. It offers:

- Custom UI components
- Improved user experience
- Streamlined navigation
- Modern interface design

More servers will be added to this repository in the future, expanding the available options for MCP administrators.

## Getting Started

1. Visit [glutamateapp.com](https://glutamateapp.com)
2. Download the app
3. Choose your desired MCP server from the available options
4. Click to install and just connect

## Available MCP Servers (adding more everyday )

For a comprehensive list of available MCP servers and their descriptions, please see our [SERVERS.md](SERVERS.md) file.

## Contributing

We welcome contributions to improve our MCP servers. Please feel free to submit pull requests, report issues, or suggest new features.

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

## Support

For support and questions, please visit our community channels.

## License

This repo (the mcp servers created by glutamate team) is licensed under the MIT License - see the LICENSE file for details.
