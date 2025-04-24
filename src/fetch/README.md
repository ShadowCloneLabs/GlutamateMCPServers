# Fetch MCP Server (TypeScript)

A Model Context Protocol server that provides web content fetching capabilities with Server-Sent Events (SSE) support, written in TypeScript. This server enables LLMs to retrieve and process content from web pages, converting HTML to markdown for easier consumption.

## Features

- Written in TypeScript for better type safety and developer experience
- Uses Cheerio for HTML processing and Turndown for markdown conversion
- Server-Sent Events (SSE) support for real-time content streaming
- Fully compatible with the Model Context Protocol
- Configurable user agent
- Automatic removal of script, style, noscript, iframe, and img tags for cleaner content

### Available Endpoints

#### SSE Endpoint

- `GET /sse` - Establishes an SSE connection for streaming content
- `POST /messages` - Handles message processing for the SSE connection

The server runs on port 3030 by default.

## Installation

### Option 1: One-Click Installation via Glutamate App (Recommended)

The easiest way to install and set up the Fetch MCP Server is through the Glutamate app:

1. Download and install [Glutamate](https://glutamate.app)
2. Open Glutamate and navigate to the Extensions section
3. Find Fetch MCP Server and click "Install"
4. The app will automatically configure everything for you and runs locally

### Option 2: Manual Setup

If you prefer to set up the Fetch MCP Server manually, you have two options:

#### Global Installation

```bash
npm install -g @glutamateapp/fetchts
```

Once installed globally, you can run the server directly:

```bash
fetch
```

#### Using npx

You can run the server without installation using npx:

```bash
npx @glutamateapp/fetchts
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
npm run dev
```

## Usage

The server implements the Model Context Protocol's fetch tool with the following parameters:

- `url` (string, required): URL to fetch
- `maxLength` (number, optional): Maximum number of characters to return (default: 5000)
- `startIndex` (number, optional): Start content from this character index (default: 0)
- `raw` (boolean, optional): Get raw content without markdown conversion (default: false)

### Example Response Format

```json
{
  "content": [
    {
      "type": "text",
      "text": "Processed content here..."
    }
  ],
  "metadata": {
    "truncated": true,
    "totalLength": 10000
  }
}
```

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Testing

```bash
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
