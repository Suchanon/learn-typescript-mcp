import 'reflect-metadata';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { NestFactory } from '@nestjs/core';
import { WeatherMcpService } from './weather/weather-mcp.service';
import { WeatherModule } from './weather/weather.module';

// stdout carries the MCP protocol itself, so Nest's logger (which writes to
// stdout) must stay disabled — anything human-readable goes to stderr.
const appContext = await NestFactory.createApplicationContext(WeatherModule, {
  logger: false,
});

const weatherMcpService = appContext.get(WeatherMcpService);
await weatherMcpService.createServer().connect(new StdioServerTransport());

console.error('Weather MCP Server (NestJS) running on stdio');
