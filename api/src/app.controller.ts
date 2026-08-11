import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealthCheck() {
    return {
      status: 'ok',
      message: 'Vantago API Online',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  getHealth() {
    return { status: 'up' };
  }
}