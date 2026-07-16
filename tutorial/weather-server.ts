import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createWeatherServer } from './weather-tools';

async function main() {
  const server = createWeatherServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Weather MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
