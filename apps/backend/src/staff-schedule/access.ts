import { ForbiddenException } from '@nestjs/common';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';

export const MANAGER_ROLES = ['owner', 'manager'] as const;
/** Roles that clock in for shifts. Owners and managers oversee; they don't clock. */
export const CLOCKABLE_ROLES = ['practitioner', 'front_desk'] as const;

export const isManager = (principal: VendorPrincipal) =>
  (MANAGER_ROLES as readonly string[]).includes(principal.role);

export const isClockableRole = (role: string) =>
  (CLOCKABLE_ROLES as readonly string[]).includes(role);

/**
 * Whose records this request may touch: owners and managers may act on anyone
 * in the business; everyone else only on themselves.
 */
export function resolveTargetStaff(principal: VendorPrincipal, requested?: string): string {
  if (!requested || requested === principal.staffId) return principal.staffId;
  if (!isManager(principal)) throw new ForbiddenException('You can only see or change your own records.');
  return requested;
}
