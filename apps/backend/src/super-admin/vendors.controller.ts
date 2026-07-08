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
import { IsOptional, IsString } from 'class-validator';
import { AdminAuthGuard } from '../super-admin-auth/admin-auth.guard';
import { CurrentAdmin } from '../super-admin-auth/current-admin.decorator';
import type { AdminPrincipal } from '../super-admin-auth/admin-jwt.strategy';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { SuperAdminVendorsService } from './vendors.service';

class RejectVendorDto {
  @IsString() @IsOptional() note?: string;
}

@Controller('super-admin/vendors')
@UseGuards(AdminAuthGuard)
export class SuperAdminVendorsController {
  constructor(private readonly vendorsService: SuperAdminVendorsService) {}

  @Get()
  list() {
    return this.vendorsService.list();
  }

  @Get('pending')
  listPending() {
    return this.vendorsService.listPending();
  }

  @Post()
  create(@Body() dto: CreateVendorDto) {
    return this.vendorsService.create(dto);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorsService.getById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVendorDto) {
    return this.vendorsService.update(id, dto);
  }

  @Post(':id/approve')
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdmin() admin: AdminPrincipal,
  ) {
    return this.vendorsService.approve(id, admin.adminId);
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentAdmin() admin: AdminPrincipal,
    @Body() dto: RejectVendorDto,
  ) {
    return this.vendorsService.reject(id, admin.adminId, dto.note);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.vendorsService.delete(id);
  }
}
