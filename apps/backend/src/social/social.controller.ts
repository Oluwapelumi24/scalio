import { Body, Controller, Delete, Get, Header, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { IsDateString, IsIn, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { randomBytes } from 'node:crypto';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { renderConnectPage } from './connect-page';
import { MetaConfig } from './meta-config';
import { parseSignedRequest } from './meta-graph';
import { PublisherService } from './publisher.service';
import { SocialConnectionsService, type ReturnTo } from './social-connections.service';

export class ConnectDto {
  @IsOptional() @IsIn(['web', 'mobile'])
  from?: ReturnTo;
}

export class PublishDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(2) @IsIn(['facebook', 'instagram'], { each: true })
  platforms!: ('facebook' | 'instagram')[];

  /** Leave out to publish now. */
  @IsOptional() @IsDateString()
  at?: string;
}

/** Connecting accounts is owner/manager business; anyone who runs marketing can publish. */
@Controller('vendor-admin')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'front_desk')
export class SocialController {
  constructor(
    private readonly connections: SocialConnectionsService,
    private readonly publisher: PublisherService,
  ) {}

  @Get('social/connections')
  list(@CurrentStaff() me: VendorPrincipal) {
    return this.connections.list(me.vendorId);
  }

  @Post('social/meta/connect')
  @Roles('owner', 'manager')
  @HttpCode(HttpStatus.OK)
  async connect(@CurrentStaff() me: VendorPrincipal, @Body() dto: ConnectDto) {
    return { url: await this.connections.connectUrl(me.vendorId, me.staffId, dto.from ?? 'web') };
  }

  @Delete('social/meta')
  @Roles('owner', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(@CurrentStaff() me: VendorPrincipal) {
    await this.connections.disconnect(me.vendorId);
  }

  @Post('content/posts/:id/publish')
  @HttpCode(HttpStatus.OK)
  publish(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishDto) {
    return this.publisher.request(me.vendorId, me.staffId, id, [...new Set(dto.platforms)], dto.at ? new Date(dto.at) : null);
  }

  @Post('content/publications/:id/retry')
  @HttpCode(HttpStatus.OK)
  retry(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.publisher.retry(me.vendorId, me.staffId, id);
  }

  @Post('content/publications/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    await this.publisher.cancel(me.vendorId, id);
  }
}

/** Public endpoints Meta calls. No Scalio sign-in: each one is verified another way. */
@Controller('social/meta')
export class MetaCallbackController {
  constructor(
    private readonly connections: SocialConnectionsService,
    private readonly meta: MetaConfig,
  ) {}

  /** Facebook Login returns here. The single-use `state` ties it to the business that asked. */
  @Get('callback')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async callback(@Query() q: { code?: string; state?: string; error?: string }) {
    return renderConnectPage(await this.connections.handleCallback(q));
  }

  @Post('choose')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async choose(@Body() body: { pendingId?: string; pageId?: string }) {
    return renderConnectPage(await this.connections.choosePage(String(body.pendingId ?? ''), String(body.pageId ?? '')));
  }

  /** Someone removed Scalio from their Facebook settings. */
  @Post('deauthorize')
  @HttpCode(HttpStatus.OK)
  async deauthorize(@Body() body: { signed_request?: string }) {
    const userId = this.verify(body.signed_request);
    if (userId) await this.connections.forgetMetaUser(userId);
    return { ok: true };
  }

  /** Meta's data-deletion request: delete what we hold and give Meta a confirmation code. */
  @Post('data-deletion')
  @HttpCode(HttpStatus.OK)
  async dataDeletion(@Body() body: { signed_request?: string }) {
    const userId = this.verify(body.signed_request);
    if (userId) await this.connections.forgetMetaUser(userId);
    const code = randomBytes(8).toString('hex');
    return { url: `${this.meta.publicApiUrl ?? ''}/social/meta/data-deletion/${code}`, confirmation_code: code };
  }

  @Get('data-deletion/:code')
  @Header('Content-Type', 'text/html; charset=utf-8')
  deletionStatus() {
    return renderConnectPage({
      kind: 'connected', title: 'Your data was deleted', returnUrl: null,
      message: 'Scalio has removed the Facebook and Instagram access you gave it. Posts already published stay on Facebook and Instagram.',
    });
  }

  private verify(signed: string | undefined): string | null {
    if (!signed || !this.meta.appSecret) return null;
    return parseSignedRequest(signed, this.meta.appSecret)?.user_id ?? null;
  }
}
