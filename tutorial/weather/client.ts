import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const client = new Client({ name: 'weather-client', version: '1.0.0' });

const transport = new StdioClientTransport({
  command: 'bun',
  args: [`${import.meta.dir}/server-stdio.ts`],
});

await client.connect(transport);

const { tools } = await client.listTools();
console.log(
  'Available tools:',
  tools.map((tool) => tool.name),
);

const result = await client.callTool({
  name: 'get-alerts',
  arguments: { state: 'CA' },
});
console.log('\nget-alerts result:');
console.log(result.content);

await client.close();
