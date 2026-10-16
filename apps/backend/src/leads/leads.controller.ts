import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { leadSourceValues } from '../db/schema';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { CreateLeadDto, ListLeadsDto, UpdateLeadDto } from './dto/leads.dto';
import { LeadsService } from './leads.service';

// Every role works leads; practitioners only see the ones assigned to them.

@Controller('vendor-admin/leads')
@UseGuards(VendorAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get('sources')
  sources() {
    return leadSourceValues;
  }

  @Get('summary')
  summary(@CurrentStaff() me: VendorPrincipal) {
    return this.leads.counts(me);
  }

  @Get()
  list(@CurrentStaff() me: VendorPrincipal, @Query() q: ListLeadsDto) {
    return this.leads.list(me, q);
  }

  @Post()
  create(@CurrentStaff() me: VendorPrincipal, @Body() dto: CreateLeadDto) {
    return this.leads.create(me, dto);
  }

  @Get(':id')
  get(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.leads.get(me, id);
  }

  @Patch(':id')
  update(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.leads.update(me, id, dto);
  }

  @Post(':id/convert')
  @HttpCode(HttpStatus.OK)
  convert(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.leads.convert(me, id);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    await this.leads.remove(me, id);
  }
}
