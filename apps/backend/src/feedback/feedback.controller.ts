import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PeriodDto } from '../finance/dto/finance.dto';
import { LedgerService } from '../finance/ledger.service';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { FeedbackService } from './feedback.service';

export class SubmitFeedbackDto {
  @IsInt() @Min(1) @Max(5)
  rating!: number;

  @IsOptional() @IsString() @MaxLength(1000)
  comment?: string;
}

/** Every role sees feedback; practitioners only about their own work. */
@Controller('vendor-admin/feedback')
@UseGuards(VendorAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(
    private readonly feedback: FeedbackService,
    private readonly ledger: LedgerService,
  ) {}

  @Get()
  async list(@CurrentStaff() me: VendorPrincipal, @Query() q: PeriodDto) {
    const r = await this.ledger.period(me.vendorId, q.from, q.to);
    return { from: r.fromDate, to: r.toDate, ...(await this.feedback.list(me, r.start, r.end)) };
  }

  @Post(':id/followed-up')
  @HttpCode(HttpStatus.NO_CONTENT)
  async followedUp(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    await this.feedback.markFollowedUp(me, id);
  }

  @Get('booking/:bookingId')
  share(@CurrentStaff() me: VendorPrincipal, @Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.feedback.shareForBooking(me, bookingId);
  }
}

/** The customer's rating page (public; the unguessable token is the access check). */
@Controller('feedback')
export class PublicFeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get(':token')
  view(@Param('token') token: string) {
    return this.feedback.publicView(token);
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  submit(@Param('token') token: string, @Body() dto: SubmitFeedbackDto) {
    return this.feedback.submit(token, dto.rating, dto.comment);
  }
}
