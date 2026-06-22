import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { UpdateCustomerNotesDto } from './dto/update-customer-notes.dto';
import { VendorCustomersService } from './customers.service';

@Controller('vendor-admin/customers')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'front_desk')
export class VendorCustomersController {
  constructor(private readonly customersService: VendorCustomersService) {}

  @Get()
  list(@CurrentStaff() staff: VendorPrincipal) {
    return this.customersService.list(staff.vendorId);
  }

  @Get(':id')
  getById(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.getById(staff.vendorId, id);
  }

  @Patch(':id/notes')
  updateNotes(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerNotesDto,
  ) {
    return this.customersService.updateNotes(staff.vendorId, id, dto);
  }
}
