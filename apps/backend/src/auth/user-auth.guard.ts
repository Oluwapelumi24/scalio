import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Gates customer-session routes behind a valid `user-jwt` bearer token. Apply with `@UseGuards(UserAuthGuard)`. */
@Injectable()
export class UserAuthGuard extends AuthGuard('user-jwt') {}
