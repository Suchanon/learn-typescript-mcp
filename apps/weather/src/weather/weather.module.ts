import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { WeatherMcpService } from './weather-mcp.service';
import { WeatherService } from './weather.service';

@Module({
  controllers: [McpController],
  providers: [WeatherService, WeatherMcpService],
  exports: [WeatherMcpService],
})
export class WeatherModule {}
