import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { CreateBlackoutDateDto } from './dto/create-blackout-date.dto';
import { SetBusinessHoursDto } from './dto/set-business-hours.dto';
import { VendorScheduleService } from './schedule.service';

@Controller('vendor-admin/schedule')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class VendorScheduleController {
  constructor(private readonly scheduleService: VendorScheduleService) {}

  @Get('hours')
  getHours(@CurrentStaff() staff: VendorPrincipal) {
    return this.scheduleService.getBusinessHours(staff.vendorId);
  }

  @Put('hours')
  setHours(
    @CurrentStaff() staff: VendorPrincipal,
    @Body() dto: SetBusinessHoursDto,
  ) {
    return this.scheduleService.setBusinessHours(staff.vendorId, dto);
  }

  @Get('blackout-dates')
  getBlackoutDates(@CurrentStaff() staff: VendorPrincipal) {
    return this.scheduleService.getBlackoutDates(staff.vendorId);
  }

  @Post('blackout-dates')
  addBlackoutDate(
    @CurrentStaff() staff: VendorPrincipal,
    @Body() dto: CreateBlackoutDateDto,
  ) {
    return this.scheduleService.addBlackoutDate(staff.vendorId, dto);
  }

  @Delete('blackout-dates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBlackoutDate(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.scheduleService.removeBlackoutDate(staff.vendorId, id);
  }
}
