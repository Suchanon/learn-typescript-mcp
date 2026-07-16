import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';

const NWS_API = 'https://api.weather.gov';
const USER_AGENT = 'mcp-weather-tutorial/1.0';

interface AlertsResponse {
  features: { properties: { event?: string; headline?: string } }[];
}

interface PointsResponse {
  properties: { forecast: string };
}

interface ForecastResponse {
  properties: {
    periods: {
      name: string;
      temperature: number;
      temperatureUnit: string;
      windSpeed: string;
      windDirection: string;
      shortForecast: string;
    }[];
  };
}

export function createWeatherServer(): McpServer {
  const server = new McpServer({ name: 'weather', version: '1.0.0' });

  server.registerTool(
    'get-alerts',
    {
      title: 'Get Weather Alerts',
      description: 'Get the active weather alerts for a US state',
      inputSchema: z.object({
        state: z.string().length(2).describe('Two-letter US state code, e.g. CA'),
      }),
    },
    async ({ state }) => {
      const code = state.toUpperCase();
      const res = await fetch(`${NWS_API}/alerts/active?area=${code}`, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!res.ok) {
        return {
          content: [{ type: 'text', text: `NWS API error: HTTP ${res.status}` }],
          isError: true,
        };
      }

      const { features } = (await res.json()) as AlertsResponse;
      if (features.length === 0) {
        return { content: [{ type: 'text', text: `No active alerts for ${code}.` }] };
      }

      const lines = features.map(
        (f) => f.properties.headline ?? f.properties.event ?? 'Unnamed alert',
      );
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
  );

  server.registerTool(
    'get-forecast',
    {
      title: 'Get Weather Forecast',
      description: 'Get the weather forecast for a US location by latitude/longitude',
      inputSchema: z.object({
        latitude: z.number().describe('Latitude of the location'),
        longitude: z.number().describe('Longitude of the location'),
      }),
    },
    async ({ latitude, longitude }) => {
      const pointsRes = await fetch(`${NWS_API}/points/${latitude},${longitude}`, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!pointsRes.ok) {
        return {
          content: [{ type: 'text', text: `NWS API error: HTTP ${pointsRes.status}` }],
          isError: true,
        };
      }

      const { properties } = (await pointsRes.json()) as PointsResponse;
      const forecastRes = await fetch(properties.forecast, {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!forecastRes.ok) {
        return {
          content: [{ type: 'text', text: `NWS API error: HTTP ${forecastRes.status}` }],
          isError: true,
        };
      }

      const {
        properties: { periods },
      } = (await forecastRes.json()) as ForecastResponse;

      const lines = periods
        .slice(0, 5)
        .map(
          (p) =>
            `${p.name}: ${p.temperature}°${p.temperatureUnit}, wind ${p.windSpeed} ${p.windDirection}, ${p.shortForecast}`,
        );
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
  );

  return server;
}
