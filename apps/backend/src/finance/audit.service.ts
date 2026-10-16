import { Inject, Injectable } from '@nestjs/common';
import { DB, type Database } from '../db/db.module';
import { auditEvents } from '../db/schema';

@Injectable()
export class AuditService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Never stores full bank account numbers — callers pass last-4 only. */
  async record(e: { vendorId: string; actorStaffId?: string | null; action: string; entityType: string; entityId?: string | null; details?: Record<string, unknown> }) {
    await this.db.insert(auditEvents).values({
      vendorId: e.vendorId,
      actorStaffId: e.actorStaffId ?? null,
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId ?? null,
      details: e.details ?? {},
    });
  }
}
