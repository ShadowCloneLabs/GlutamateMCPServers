export * from './server.js';

console.log('Starting server...');
console.log('Command line args:', process.argv);

// Parse port from command line arguments
const portArg = process.argv.find(arg => arg.startsWith('--port='));
const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3030;
console.log('Using port:', port);

const { FetchMcpServer } = await import('./server.js');
const server = new FetchMcpServer();
server.startHttpServer(port).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
}); 