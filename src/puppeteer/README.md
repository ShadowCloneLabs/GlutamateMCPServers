# Puppeteer MCP Server (TypeScript)

A Model Context Protocol server that provides browser automation capabilities with Server-Sent Events (SSE) support, written in TypeScript. This server enables LLMs to interact with web pages, take screenshots, and execute JavaScript in a real browser environment.

## Features

- Written in TypeScript for better type safety and developer experience
- Uses Puppeteer for browser automation with system Chrome browser
- Server-Sent Events (SSE) support for real-time communication
- Fully compatible with the Model Context Protocol
- Screenshot capabilities (full page or specific elements)
- Web interaction (navigation, clicking, form filling)
- JavaScript execution in browser context

### Available Endpoints

#### SSE Endpoint

- `GET /sse` - Establishes an SSE connection for streaming content
- `POST /messages` - Handles message processing for the SSE connection

The server runs on port 9003 by default.

## Acknowledgments

This project is built upon the Model Context Protocol (MCP) Server framework from [modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer). We extend our thanks to the MCP team for creating an excellent foundation for this implementation. 

We've significantly modified and extended the original implementation by:
- Converting the transport layer from stdio to Server-Sent Events (SSE)
- Adding enhanced browser automation capabilities

Maintained by [Rudra-Sankha-Sinhamahapatra](https://github.com/Rudra-Sankha-Sinhamahapatra).

## Installation

### Option 1: One-Click Installation via Glutamate App (Recommended)

The easiest way to install and set up the Puppeteer MCP Server is through the Glutamate app:

1. Download and install [Glutamate](https://glutamate.app)
2. Open Glutamate and navigate to the Extensions section
3. Find Puppeteer MCP Server and click "Install"
4. The app will automatically configure everything for you and runs locally

### Option 2: Manual Setup

If you prefer to set up the Puppeteer MCP Server manually, you have two options:

#### Global Installation

```bash
npm install -g @glutamateapp/puppeteer
```

Once installed globally, you can run the server directly:

```bash
puppeteer
```

#### Using npx

You can run the server without installation using npx:

```bash
npx @glutamateapp/puppeteer
```

#### From Source

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

4. Start the server:

```bash
npm start
```

For development with hot reload:

```bash
npm run watch
```

## Usage

The server implements several Model Context Protocol tools for browser automation:

### Available Tools

1. **puppeteer_navigate**
   - Navigate to any URL in the browser
   - Parameters:
     - `url` (string, required): URL to navigate to

2. **puppeteer_screenshot**
   - Capture screenshots of the entire page or specific elements
   - Parameters:
     - `name` (string, required): Name for the screenshot
     - `selector` (string, optional): CSS selector for element to screenshot
     - `width` (number, optional): Screenshot width (default: 800)
     - `height` (number, optional): Screenshot height (default: 600)

3. **puppeteer_click**
   - Click elements on the page
   - Parameter: `selector` (string): CSS selector for element to click

4. **puppeteer_fill**
   - Fill out input fields
   - Parameters:
     - `selector` (string): CSS selector for input field
     - `value` (string): Value to fill

5. **puppeteer_select**
   - Select an option in a dropdown
   - Parameters:
     - `selector` (string): CSS selector for select element
     - `value` (string): Value to select

6. **puppeteer_hover**
   - Hover over elements on the page
   - Parameter: `selector` (string): CSS selector for element to hover

7. **puppeteer_evaluate**
   - Execute JavaScript in the browser console
   - Parameter: `script` (string): JavaScript code to execute

## Using System Chrome

This server uses `puppeteer-core` to connect to the system's installed Chrome browser instead of downloading Chromium. This approach:

- Reduces installation size and time
- Uses your existing Chrome browser
- May provide better compatibility with certain websites

The server will automatically search for Chrome installations in common paths. If Chrome is not found, it will fallback to using Puppeteer's bundled Chromium browser.


## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
