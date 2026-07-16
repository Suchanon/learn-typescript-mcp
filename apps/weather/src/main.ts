import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PORT = 3000;

// bodyParser stays off so the raw request body reaches the MCP transport untouched
// (see weather/express-web-bridge.ts).
const app = await NestFactory.create(AppModule, { bodyParser: false });
await app.listen(PORT);

console.log(`Weather MCP Server (NestJS) running at http://localhost:${PORT}/mcp`);
console.log('Kill this process (Ctrl+C) to stop serving every connected client.');
