import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { createWeatherServer } from './weather-tools';

const PORT = 3000;

const server = createWeatherServer();
const transport = new WebStandardStreamableHTTPServerTransport();
await server.connect(transport);

Bun.serve({
  port: PORT,
  routes: {
    '/mcp': (req) => transport.handleRequest(req),
  },
});

console.log(`Weather MCP Server running at http://localhost:${PORT}/mcp`);
console.log('Kill this process (Ctrl+C) to stop serving every connected client.');
