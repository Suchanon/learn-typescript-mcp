import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { toWebRequest, writeWebResponse } from './express-web-bridge';
import { WeatherMcpService } from './weather-mcp.service';

@Controller('mcp')
export class McpController {
  constructor(private readonly weatherMcpService: WeatherMcpService) {}

  @All()
  async handle(
    @Req() request: ExpressRequest,
    @Res() response: ExpressResponse,
  ): Promise<void> {
    const webRequest = await toWebRequest(request);
    const webResponse = await this.weatherMcpService.handleHttpRequest(webRequest);
    await writeWebResponse(webResponse, response);
  }
}
