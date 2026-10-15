import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { resolveTargetStaff } from './access';
import { AttendanceService } from './attendance.service';
import { ClockDto } from './dto/clock.dto';
import { CreateTimeOffDto } from './dto/create-time-off.dto';
import { PeriodQueryDto } from './dto/period-query.dto';
import { SetStaffScheduleDto } from './dto/set-staff-schedule.dto';
import { PerformanceService } from './performance.service';
import { StaffScheduleService } from './staff-schedule.service';

// Everyone can see their own schedule; owners and managers set them.
@Controller('vendor-admin/staff/:staffId')
@UseGuards(VendorAuthGuard, RolesGuard)
export class StaffScheduleController {
  constructor(private readonly schedules: StaffScheduleService) {}

  @Get('schedule')
  get(@CurrentStaff() me: VendorPrincipal, @Param('staffId', ParseUUIDPipe) staffId: string) {
    return this.schedules.getSchedule(me.vendorId, resolveTargetStaff(me, staffId));
  }

  @Put('schedule')
  @Roles('owner', 'manager')
  set(@CurrentStaff() me: VendorPrincipal, @Param('staffId', ParseUUIDPipe) staffId: string, @Body() dto: SetStaffScheduleDto) {
    return this.schedules.setSchedule(me.vendorId, staffId, dto.days);
  }

  @Post('time-off')
  @Roles('owner', 'manager')
  addTimeOff(@CurrentStaff() me: VendorPrincipal, @Param('staffId', ParseUUIDPipe) staffId: string, @Body() dto: CreateTimeOffDto) {
    return this.schedules.addTimeOff(me.vendorId, staffId, dto);
  }

  @Delete('time-off/:timeOffId')
  @Roles('owner', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTimeOff(
    @CurrentStaff() me: VendorPrincipal,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Param('timeOffId', ParseUUIDPipe) timeOffId: string,
  ) {
    await this.schedules.removeTimeOff(me.vendorId, staffId, timeOffId);
  }
}

// Anyone clocks themselves in and out; owners and managers can do it for others.
@Controller('vendor-admin/attendance')
@UseGuards(VendorAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get('me')
  me(@CurrentStaff() me: VendorPrincipal) {
    return this.attendance.status(me.vendorId, me.staffId);
  }

  @Get('team')
  @Roles('owner', 'manager')
  team(@CurrentStaff() me: VendorPrincipal) {
    return this.attendance.team(me.vendorId);
  }

  @Get()
  list(@CurrentStaff() me: VendorPrincipal, @Query() query: PeriodQueryDto) {
    // Non-managers only ever see their own shifts.
    const staffId = query.staffId ? resolveTargetStaff(me, query.staffId) : resolveTargetStaffOrAll(me);
    return this.attendance.list(me.vendorId, query.from, query.to, staffId);
  }

  @Post('clock-in')
  clockIn(@CurrentStaff() me: VendorPrincipal, @Body() dto: ClockDto) {
    return this.attendance.clockIn(me.vendorId, resolveTargetStaff(me, dto.staffId), me.staffId);
  }

  @Post('clock-out')
  clockOut(@CurrentStaff() me: VendorPrincipal, @Body() dto: ClockDto) {
    return this.attendance.clockOut(me.vendorId, resolveTargetStaff(me, dto.staffId));
  }
}

@Controller('vendor-admin/performance')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'practitioner')
export class PerformanceController {
  constructor(private readonly performance: PerformanceService) {}

  @Get()
  get(@CurrentStaff() me: VendorPrincipal, @Query() query: PeriodQueryDto) {
    const staffId = query.staffId ? resolveTargetStaff(me, query.staffId) : resolveTargetStaffOrAll(me);
    return this.performance.get(me.vendorId, { ...query, staffId });
  }
}

/** Managers see everyone when no one is named; others see only themselves. */
function resolveTargetStaffOrAll(me: VendorPrincipal): string | undefined {
  return ['owner', 'manager'].includes(me.role) ? undefined : me.staffId;
}
