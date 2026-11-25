import { applyDecorators, SetMetadata, type ExecutionContext } from '@nestjs/common';
import { hours, minutes, Throttle, type ThrottlerOptions } from '@nestjs/throttler';
import { resolveClientIp } from './client-ip';

/** Metadata listing which named auth throttlers apply to a route. */
export const APPLY_THROTTLERS = 'veno_apply_throttlers';

export function isThrottlerApplied(context: ExecutionContext, name: string): boolean {
  const handler = context.getHandler();
  const classRef = context.getClass();
  const fromHandler = Reflect.getMetadata(APPLY_THROTTLERS, handler) as string[] | undefined;
  const fromClass = Reflect.getMetadata(APPLY_THROTTLERS, classRef) as string[] | undefined;
  return (fromHandler ?? fromClass ?? []).includes(name);
}

/** Skip named auth throttlers unless the route opted in via {@link ApplyThrottlers}. */
export function skipUnlessApplied(name: string): NonNullable<ThrottlerOptions['skipIf']> {
  return (context) => !isThrottlerApplied(context, name);
}

function ApplyThrottlers(...names: string[]) {
  return SetMetadata(APPLY_THROTTLERS, names);
}

/** Login / signin: 10/min per IP and 5/min per email. */
export function LoginThrottle() {
  return applyDecorators(
    ApplyThrottlers('authLoginIp', 'authLoginEmail'),
    Throttle({
      authLoginIp: { limit: 10, ttl: minutes(1) },
      authLoginEmail: { limit: 5, ttl: minutes(1) },
    }),
  );
}

/** forgot-password / signup-code / invite: 5/hour per email, 20/hour per IP. */
export function AuthEmailThrottle() {
  return applyDecorators(
    ApplyThrottlers('authEmailHour', 'authIpHour'),
    Throttle({
      authEmailHour: { limit: 5, ttl: hours(1) },
      authIpHour: { limit: 20, ttl: hours(1) },
    }),
  );
}

/** reset-password / verify / accept-invite / handoff exchange: 10/min per IP. */
export function AuthStrictIpThrottle() {
  return applyDecorators(
    ApplyThrottlers('authStrictIp'),
    Throttle({
      authStrictIp: { limit: 10, ttl: minutes(1) },
    }),
  );
}

/** Tracker keyed on the email in the JSON body (falls back to client IP if missing). */
export async function emailTracker(req: Record<string, unknown>): Promise<string> {
  const body = req.body as { email?: unknown } | undefined;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email) return `email:${email}`;
  return `ip:${resolveClientIp(req)}`;
}
