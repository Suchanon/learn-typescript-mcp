import 'reflect-metadata';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, expect, test } from 'bun:test';
import { AppModule } from '../src/app.module';

let app: INestApplication;
let mcpUrl: URL;

beforeAll(async () => {
  app = await NestFactory.create(AppModule, { bodyParser: false, logger: false });
  await app.listen(0); // ephemeral port so a running dev server on 3000 is never disturbed
  mcpUrl = new URL('/mcp', await app.getUrl());
});

afterAll(async () => {
  await app.close();
});

test('serves the weather MCP server over streamable HTTP', async () => {
  const client = new Client({ name: 'weather-test-client', version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(mcpUrl));

  const { tools } = await client.listTools();
  const toolNames = tools.map((tool) => tool.name).sort();
  expect(toolNames).toEqual(['get-alerts', 'get-forecast']);

  await client.close();
});
