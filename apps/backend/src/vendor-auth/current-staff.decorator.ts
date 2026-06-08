import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { VendorPrincipal } from './vendor-jwt.strategy';

/** Extracts the authenticated staff principal that `VendorAuthGuard` attached to the request. */
export const CurrentStaff = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): VendorPrincipal => {
    const request = ctx.switchToHttp().getRequest<{ user: VendorPrincipal }>();
    return request.user;
  },
);
