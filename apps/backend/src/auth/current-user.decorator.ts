import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '../db/schema';

/** Extracts the authenticated user that `UserAuthGuard` attached to the request. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): InferSelectModel<typeof users> => {
    const request = ctx.switchToHttp().getRequest<{ user: InferSelectModel<typeof users> }>();
    return request.user;
  },
);
