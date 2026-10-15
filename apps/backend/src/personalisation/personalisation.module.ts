import { Module } from '@nestjs/common';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { HomeDataService } from './home-data.service';
import { PersonalisationController } from './personalisation.controller';
import { PreferencesService } from './preferences.service';

@Module({
  imports: [VendorAuthModule],
  controllers: [PersonalisationController],
  providers: [PreferencesService, HomeDataService],
  exports: [PreferencesService, HomeDataService],
})
export class PersonalisationModule {}
