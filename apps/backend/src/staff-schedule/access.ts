import { ForbiddenException } from '@nestjs/common';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';

export const MANAGER_ROLES = ['owner', 'manager'];

export const isManager = (principal: VendorPrincipal) => MANAGER_ROLES.includes(principal.role);

/**
 * Whose records this request may touch: owners and managers may act on anyone
 * in the business; everyone else only on themselves.
 */
export function resolveTargetStaff(principal: VendorPrincipal, requested?: string): string {
  if (!requested || requested === principal.staffId) return principal.staffId;
  if (!isManager(principal)) throw new ForbiddenException('You can only see or change your own records.');
  return requested;
}
