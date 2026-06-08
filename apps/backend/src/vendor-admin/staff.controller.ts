import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { VendorStaffService } from './staff.service';

@Controller('vendor-admin/staff')
@UseGuards(VendorAuthGuard)
export class VendorStaffController {
  constructor(private readonly staffService: VendorStaffService) {}

  @Get()
  list(@CurrentStaff() staff: VendorPrincipal) {
    return this.staffService.list(staff.vendorId);
  }

  @Post()
  create(@CurrentStaff() staff: VendorPrincipal, @Body() dto: CreateStaffDto) {
    return this.staffService.create(staff.vendorId, dto);
  }

  @Patch(':id')
  update(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(staff.vendorId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.staffService.remove(staff.vendorId, id);
  }
}
