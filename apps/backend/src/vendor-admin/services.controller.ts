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
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { VendorServicesService } from './services.service';

@Controller('vendor-admin/services')
@UseGuards(VendorAuthGuard)
export class VendorServicesController {
  constructor(private readonly servicesService: VendorServicesService) {}

  @Get()
  list(@CurrentStaff() staff: VendorPrincipal) {
    return this.servicesService.list(staff.vendorId);
  }

  @Post()
  create(
    @CurrentStaff() staff: VendorPrincipal,
    @Body() dto: CreateServiceDto,
  ) {
    return this.servicesService.create(staff.vendorId, dto);
  }

  @Patch(':id')
  update(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(staff.vendorId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.servicesService.remove(staff.vendorId, id);
  }
}
