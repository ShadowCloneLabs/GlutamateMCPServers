# Apple MCP Tools (TypeScript)

A Model Context Protocol server that provides native Apple application integration with Server-Sent Events (SSE) support, written in TypeScript. This server enables LLMs to interact with Apple's native applications like Messages, Notes, Contacts, Mail, Reminders, Calendar, Maps, and more.

## Features

- Written in TypeScript for better type safety and developer experience
- Uses Apple's JXA (JavaScript for Automation) for native macOS app integration
- Server-Sent Events (SSE) support for real-time communication
- Fully compatible with the Model Context Protocol
- Interacts with multiple Apple applications (Messages, Notes, Contacts, Mail, etc.)
- Provides web search capabilities through DuckDuckGo integration

### Available Endpoints

#### SSE Endpoint

- `GET /sse` - Establishes an SSE connection for streaming content
- `POST /messages` - Handles message processing for the SSE connection

The server runs on port 3000 by default.

## Tools and Capabilities

- **Messages**:
  - Send messages using the Apple Messages app
  - Read messages from conversations
  - Schedule messages for future delivery
  - Check for unread messages

- **Notes**:
  - List all notes
  - Search and read notes in Apple Notes app
  - Create new notes with custom content and folder organization

- **Contacts**:
  - Search contacts by name
  - Retrieve contact information including phone numbers
  - Find contacts for efficient message and email communication

- **Mail**:
  - Send emails with multiple recipients (to, cc, bcc) and file attachments
  - Search emails with custom queries across mailboxes
  - Check unread email counts globally or per mailbox
  - List available email accounts and mailboxes

- **Reminders**:
  - List all reminders and reminder lists
  - Search for reminders by text
  - Create new reminders with optional due dates and notes
  - Open the Reminders app to view specific reminders

- **Calendar**:
  - Search calendar events with customizable date ranges
  - List upcoming events
  - Create new calendar events with details like title, location, and notes
  - Open calendar events in the Calendar app

- **Web Search**:
  - Search the web using DuckDuckGo
  - Retrieve and process content from search results

- **Maps**:
  - Search for locations and addresses
  - Save locations to favorites
  - Get directions between locations
  - Drop pins on the map
  - Create and list guides
  - Add places to guides

### Coming Soon
- Search and open photos in Apple Photos app
- Search and open music in Apple Music app

## Advanced Usage

You can daisy-chain commands to create complex workflows. For example:

"Can you please read the note about people I met at the conference, find their contacts and emails, and send them a message saying thank you for the time."

## Installation

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

## Configuration 

To use Apple MCP tools with Claude in Cursor, add the following to your `~/.cursor/mcp.json` file:

```json
{
  "apple-mcp": {
    "url": "http://localhost:3000/sse"
  }
}
```

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- macOS (required for Apple application integration)

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Maintained by [Rudra-Sankha-Sinhamahapatra](https://github.com/Rudra-Sankha-Sinhamahapatra).
