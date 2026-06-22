import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../super-admin-auth/admin-auth.guard';
import { SuperAdminMetricsService } from './metrics.service';

@Controller('super-admin/metrics')
@UseGuards(AdminAuthGuard)
export class SuperAdminMetricsController {
  constructor(private readonly metricsService: SuperAdminMetricsService) {}

  @Get()
  getPlatformMetrics() {
    return this.metricsService.getPlatformMetrics();
  }
}
