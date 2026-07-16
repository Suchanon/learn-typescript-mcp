import {
  McpServer,
  WebStandardStreamableHTTPServerTransport,
} from '@modelcontextprotocol/server';
import { Injectable } from '@nestjs/common';
import * as z from 'zod';
import { NwsApiError, WeatherService } from './weather.service';

/**
 * Owns the MCP layer: builds McpServer instances with the weather tools and
 * lazily connects the shared streamable-HTTP transport for the /mcp endpoint.
 * The stdio entrypoint (src/stdio.ts) calls createServer() with its own transport.
 */
@Injectable()
export class WeatherMcpService {
  private httpTransport?: Promise<WebStandardStreamableHTTPServerTransport>;

  constructor(private readonly weatherService: WeatherService) {}

  createServer(): McpServer {
    const server = new McpServer({ name: 'weather', version: '1.0.0' });

    server.registerTool(
      'get-alerts',
      {
        title: 'Get Weather Alerts',
        description: 'Get the active weather alerts for a US state',
        inputSchema: z.object({
          state: z
            .string()
            .length(2)
            .describe('Two-letter US state code, e.g. CA')
            .default('CA'),
        }),
      },
      async ({ state }) => {
        const stateCode = state.toUpperCase();
        try {
          const headlines = await this.weatherService.getActiveAlertHeadlines(stateCode);
          if (headlines.length === 0) {
            return {
              content: [{ type: 'text', text: `No active alerts for ${stateCode}.` }],
            };
          }
          return { content: [{ type: 'text', text: headlines.join('\n') }] };
        } catch (error) {
          return this.toErrorResult(error);
        }
      },
    );

    server.registerTool(
      'get-forecast',
      {
        title: 'Get Weather Forecast',
        description: 'Get the weather forecast for a US location by latitude/longitude',
        inputSchema: z.object({
          latitude: z
            .number()
            .min(-90)
            .max(90)
            .describe('Latitude of the location, e.g. 37.7749 (San Francisco)')
            .default(37.7749),
          longitude: z
            .number()
            .min(-180)
            .max(180)
            .describe('Longitude of the location, e.g. -122.4194 (San Francisco)')
            .default(-122.4194),
        }),
      },
      async ({ latitude, longitude }) => {
        try {
          const periods = await this.weatherService.getForecastPeriods(latitude, longitude);
          const lines = periods
            .slice(0, 5)
            .map(
              (period) =>
                `${period.name}: ${period.temperature}°${period.temperatureUnit}, wind ${period.windSpeed} ${period.windDirection}, ${period.shortForecast}`,
            );
          return { content: [{ type: 'text', text: lines.join('\n') }] };
        } catch (error) {
          return this.toErrorResult(error);
        }
      },
    );

    return server;
  }

  async handleHttpRequest(request: Request): Promise<Response> {
    this.httpTransport ??= this.connectHttpTransport();
    const transport = await this.httpTransport;
    return transport.handleRequest(request);
  }

  private async connectHttpTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
    const transport = new WebStandardStreamableHTTPServerTransport();
    await this.createServer().connect(transport);
    return transport;
  }

  private toErrorResult(error: unknown) {
    if (error instanceof NwsApiError) {
      return {
        content: [{ type: 'text' as const, text: error.message }],
        isError: true,
      };
    }
    throw error;
  }
}
