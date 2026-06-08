import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Gates vendor-admin routes behind a valid `vendor-jwt` bearer token. Apply with `@UseGuards(VendorAuthGuard)`. */
@Injectable()
export class VendorAuthGuard extends AuthGuard('vendor-jwt') {}
