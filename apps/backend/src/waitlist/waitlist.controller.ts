import { Body, Controller, Post } from '@nestjs/common';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  @Post()
  join(@Body() dto: JoinWaitlistDto) {
    return this.waitlist.join(dto.email, dto.audience);
  }
}
