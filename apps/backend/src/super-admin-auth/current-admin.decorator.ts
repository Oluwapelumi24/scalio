import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AdminPrincipal } from './admin-jwt.strategy';

export const CurrentAdmin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AdminPrincipal => {
    const request = ctx.switchToHttp().getRequest<{ user: AdminPrincipal }>();
    return request.user;
  },
);
