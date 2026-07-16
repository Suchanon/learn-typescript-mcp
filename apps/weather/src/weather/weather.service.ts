import { Injectable } from '@nestjs/common';

const NWS_API = 'https://api.weather.gov';
const USER_AGENT = 'mcp-weather-tutorial/1.0';

export class NwsApiError extends Error {
  constructor(readonly status: number) {
    super(`NWS API error: HTTP ${status}`);
  }
}

interface AlertsResponse {
  features: { properties: { event?: string; headline?: string } }[];
}

interface PointsResponse {
  properties: { forecast: string };
}

export interface ForecastPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
}

interface ForecastResponse {
  properties: { periods: ForecastPeriod[] };
}

/** Talks to the National Weather Service API. Throws NwsApiError on non-2xx responses. */
@Injectable()
export class WeatherService {
  async getActiveAlertHeadlines(stateCode: string): Promise<string[]> {
    const alerts = await this.fetchJson<AlertsResponse>(
      `${NWS_API}/alerts/active?area=${stateCode}`,
    );
    return alerts.features.map(
      (feature) => feature.properties.headline ?? feature.properties.event ?? 'Unnamed alert',
    );
  }

  async getForecastPeriods(latitude: number, longitude: number): Promise<ForecastPeriod[]> {
    const points = await this.fetchJson<PointsResponse>(
      `${NWS_API}/points/${latitude},${longitude}`,
    );
    const forecast = await this.fetchJson<ForecastResponse>(points.properties.forecast);
    return forecast.properties.periods;
  }

  private async fetchJson<ResponseBody>(url: string): Promise<ResponseBody> {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) {
      throw new NwsApiError(response.status);
    }
    return (await response.json()) as ResponseBody;
  }
}
