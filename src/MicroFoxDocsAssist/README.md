# MicroFox Documentation Assistant

This MCP server provides tools to interact with the MicroFox documentation that is stored in a Supabase database.

## Environment Variables

To run this server, you need to create a `.env` file in the `src/MicroFoxDocsAssist` directory with the following environment variables:

- `SUPABASE_URL`: The URL of your Supabase project.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key.
- `GEMINI_API_KEY`: Your Gemini API key for embeddings.

## Available Tools

- `listByPackage`: List documentation files for a given package.

  - `pkg`: The name of the package.
  - `docType` (optional): The type of document to filter by.
  - `limit` (optional): The maximum number of results to return (default: 10).

- `semanticSearch`: Perform a semantic search on the documentation.

  - `pkg`: The package to search in. Use `"*"` for a global search.
  - `query`: The search query.
  - `docType` (optional): The type of document to filter by.
  - `limit` (optional): The maximum number of results to return (default: 10).

- `getFunctionDoc`: Get the documentation for a specific function in a package.

  - `packageName`: The name of the package.
  - `functionName`: The name of the function.

- `checkFunctionExists`: Check if a function's documentation exists within a package.
  - `packageName`: The name of the package.
  - `functionName`: The name of the function.

## Running the Server

1. Navigate to the `src/MicroFoxDocsAssist` directory.
2. Make sure you have a `.env` file with the required variables.
3. Run `npm install` to install the dependencies.
4. Run `npm start` to start the server.

## Features

- Documentation search and retrieval
- Context-aware responses
- Integration with MCP protocol

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

3. Start the server:

```bash
npm start
```

By default, the server runs on `http://localhost:3000`. You can configure the port and host using environment variables:

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)

## Development

To watch for changes during development:

```bash
npm run watch
```

## API Functions

### search_docs

Search through MicroFox documentation.

Parameters:

- `query` (string): The search query for documentation
- `context` (string, optional): Additional context for the search

## License

MIT
