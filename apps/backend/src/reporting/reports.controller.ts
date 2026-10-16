import { Controller, Get, Param, ParseEnumPipe, Query, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PeriodDto } from '../finance/dto/finance.dto';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { REPORT_KINDS, type ReportKind } from './reports';
import { ReportsService } from './reports.service';

export class RecordsQueryDto extends PeriodDto {
  /** A group key from the summary, e.g. `service:<id>`; leave out for every record. */
  @IsOptional() @IsString() @MaxLength(120)
  key?: string;
}

/** Reports cover the whole business's money and customers: owners and managers. */
@Controller('vendor-admin/reports')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  overview(@CurrentStaff() me: VendorPrincipal, @Query() q: PeriodDto) {
    return this.reports.overview(me.vendorId, q.from, q.to);
  }

  @Get(':kind/records')
  records(
    @CurrentStaff() me: VendorPrincipal,
    @Param('kind', new ParseEnumPipe(Object.fromEntries(REPORT_KINDS.map((k) => [k, k])))) kind: ReportKind,
    @Query() q: RecordsQueryDto,
  ) {
    return this.reports.records(me.vendorId, kind, q.key, q.from, q.to);
  }
}
