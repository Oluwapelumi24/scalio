import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';
import { HealthService } from './health/health.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly health: HealthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth(@Res({ passthrough: true }) res: Response) {
    const result = await this.health.check();
    res.status(result.status === 'ok' ? 200 : 503);
    return result;
  }
}
