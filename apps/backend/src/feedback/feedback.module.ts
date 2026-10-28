import { Global, Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { FeedbackController, PublicFeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

/** Global like PushModule, so completing a booking can ask for feedback without a module cycle. */
@Global()
@Module({
  imports: [VendorAuthModule, FinanceModule],
  controllers: [FeedbackController, PublicFeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
