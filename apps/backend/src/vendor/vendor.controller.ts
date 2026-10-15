import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';

@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  list() {
    return this.vendorService.list();
  }

  // Declared before ':id' so 'by-slug' is never parsed as a vendor id.
  @Get('by-slug/:slug')
  getPublicProfile(@Param('slug') slug: string) {
    return this.vendorService.getPublicProfile(slug);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorService.getById(id);
  }

  @Get(':id/services')
  listServices(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorService.listServices(id);
  }

  @Get(':id/availability')
  getAvailability(@Param('id', ParseUUIDPipe) id: string, @Query() query: AvailabilityQueryDto) {
    return this.vendorService.getAvailability(id, query);
  }
}
