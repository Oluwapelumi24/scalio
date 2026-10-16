import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { ContentStudioService } from './content-studio.service';
import { GenerateCaptionDto, ListPostsDto, MarkPostedDto, PlanPostDto, SavePostDto, UploadMediaDto } from './dto/content.dto';

// Marketing is run by whoever faces customers: owners, managers and front desk.

@Controller('vendor-admin/content')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'front_desk')
export class ContentStudioController {
  constructor(private readonly studio: ContentStudioService) {}

  /** AI availability, tones, and what each platform accepts. */
  @Get('studio')
  info(@CurrentStaff() me: VendorPrincipal) {
    return this.studio.studio(me.vendorId);
  }

  @Post('media')
  upload(@CurrentStaff() me: VendorPrincipal, @Body() dto: UploadMediaDto) {
    return this.studio.uploadMedia(me.vendorId, me.staffId, dto);
  }

  @Get('media/:id')
  @Header('Cache-Control', 'private, max-age=86400')
  async media(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    const m = await this.studio.media(me.vendorId, id);
    return new StreamableFile(Buffer.from(m.dataBase64, 'base64'), { type: m.mimeType });
  }

  @Post('captions')
  @HttpCode(HttpStatus.OK)
  generate(@CurrentStaff() me: VendorPrincipal, @Body() dto: GenerateCaptionDto) {
    return this.studio.generate(me.vendorId, dto);
  }

  @Get('posts')
  list(@CurrentStaff() me: VendorPrincipal, @Query() q: ListPostsDto) {
    return this.studio.list(me.vendorId, q);
  }

  @Post('posts')
  create(@CurrentStaff() me: VendorPrincipal, @Body() dto: SavePostDto) {
    return this.studio.create(me.vendorId, me.staffId, dto);
  }

  @Get('posts/:id')
  get(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.studio.get(me.vendorId, id);
  }

  @Patch('posts/:id')
  update(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SavePostDto) {
    return this.studio.update(me.vendorId, id, dto);
  }

  @Post('posts/:id/plan')
  @HttpCode(HttpStatus.OK)
  plan(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PlanPostDto) {
    return this.studio.plan(me.vendorId, id, dto.plannedFor);
  }

  @Post('posts/:id/unplan')
  @HttpCode(HttpStatus.OK)
  unplan(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.studio.unplan(me.vendorId, id);
  }

  @Post('posts/:id/posted')
  @HttpCode(HttpStatus.OK)
  posted(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MarkPostedDto) {
    return this.studio.markPosted(me.vendorId, id, dto.platforms);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    await this.studio.remove(me.vendorId, id);
  }
}
