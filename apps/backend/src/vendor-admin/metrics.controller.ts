import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { VendorMetricsService } from './metrics.service';

@Controller('vendor-admin/metrics')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class VendorMetricsController {
  constructor(private readonly metricsService: VendorMetricsService) {}

  @Get()
  getMetrics(@CurrentStaff() staff: VendorPrincipal) {
    return this.metricsService.getVendorMetrics(staff.vendorId);
  }
}
