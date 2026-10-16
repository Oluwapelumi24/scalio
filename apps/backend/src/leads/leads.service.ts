import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { contentPosts, customers, leads, staff } from '../db/schema';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import type { CreateLeadDto, ListLeadsDto, UpdateLeadDto } from './dto/leads.dto';
import { isLeadDue, leadDueCondition } from './lead-due';

type LeadRow = typeof leads.$inferSelect;

// Practitioners work the leads assigned to them; everyone else sees the whole list.
const seesAll = (me: VendorPrincipal) => me.role !== 'practitioner';

@Injectable()
export class LeadsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private scope(me: VendorPrincipal): SQL[] {
    const where: SQL[] = [eq(leads.vendorId, me.vendorId)];
    if (!seesAll(me)) where.push(eq(leads.assignedStaffId, me.staffId));
    return where;
  }

  private select() {
    return this.db
      .select({
        lead: leads,
        assignedStaffName: staff.name,
        customerName: customers.name,
      })
      .from(leads)
      .leftJoin(staff, eq(leads.assignedStaffId, staff.id))
      .leftJoin(customers, eq(leads.customerId, customers.id));
  }

  private present(r: { lead: LeadRow; assignedStaffName: string | null; customerName: string | null }, now: Date) {
    const l = r.lead;
    const due = isLeadDue(l, now);
    return {
      ...l,
      assignedStaff: l.assignedStaffId ? { id: l.assignedStaffId, name: r.assignedStaffName } : null,
      customer: l.customerId ? { id: l.customerId, name: r.customerName } : null,
      due,
    };
  }

  async list(me: VendorPrincipal, q: ListLeadsDto, now = new Date()) {
    const where = this.scope(me);
    if (q.status) where.push(eq(leads.status, q.status as LeadRow['status']));
    if (q.due) where.push(leadDueCondition(now));
    const rows = await this.select()
      .where(and(...where))
      // Open leads first, then by when they need attention.
      .orderBy(
        sql`case when ${leads.status} in ('new', 'contacted') then 0 else 1 end`,
        sql`coalesce(${leads.followUpAt}, ${leads.createdAt}) asc`,
        desc(leads.createdAt),
      )
      .limit(300);
    return rows.map((r) => this.present(r, now));
  }

  async counts(me: VendorPrincipal, now = new Date()) {
    const [row] = await this.db
      .select({
        open: sql<number>`count(*) filter (where ${leads.status} in ('new', 'contacted'))`.mapWith(Number),
        due: sql<number>`count(*) filter (where ${leadDueCondition(now)})`.mapWith(Number),
        won30d: sql<number>`count(*) filter (where ${leads.status} = 'won' and ${leads.convertedAt} >= ${new Date(now.getTime() - 30 * 86_400_000)})`.mapWith(Number),
      })
      .from(leads)
      .where(and(...this.scope(me)));
    return row ?? { open: 0, due: 0, won30d: 0 };
  }

  private async own(me: VendorPrincipal, id: string, now = new Date()) {
    const [row] = await this.select().where(and(eq(leads.id, id), ...this.scope(me)));
    if (!row) throw new NotFoundException('Lead not found');
    return { row: row.lead, view: this.present(row, now) };
  }

  async get(me: VendorPrincipal, id: string) {
    return (await this.own(me, id)).view;
  }

  private async assertStaff(vendorId: string, staffId: string) {
    const [s] = await this.db.select({ id: staff.id }).from(staff).where(and(eq(staff.id, staffId), eq(staff.vendorId, vendorId)));
    if (!s) throw new NotFoundException('Staff member not found');
  }

  async create(me: VendorPrincipal, dto: CreateLeadDto) {
    let assignedStaffId = dto.assignedStaffId ?? null;
    if (!seesAll(me)) assignedStaffId = me.staffId; // practitioners log leads for themselves
    if (assignedStaffId) await this.assertStaff(me.vendorId, assignedStaffId);
    if (dto.contentPostId) {
      const [p] = await this.db.select({ id: contentPosts.id }).from(contentPosts).where(and(eq(contentPosts.id, dto.contentPostId), eq(contentPosts.vendorId, me.vendorId)));
      if (!p) throw new NotFoundException('Post not found');
    }
    const [row] = await this.db
      .insert(leads)
      .values({
        vendorId: me.vendorId,
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim().toLowerCase() || null,
        source: dto.source as LeadRow['source'],
        note: dto.note?.trim() || null,
        assignedStaffId,
        followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : null,
        contentPostId: dto.contentPostId ?? null,
        createdById: me.staffId,
      })
      .returning({ id: leads.id });
    return this.get(me, row.id);
  }

  async update(me: VendorPrincipal, id: string, dto: UpdateLeadDto) {
    const { row } = await this.own(me, id);
    if (row.status === 'won') throw new BadRequestException('This lead is already a customer.');
    const set: Partial<typeof leads.$inferInsert> = { updatedAt: new Date() };
    if (dto.name !== undefined) set.name = dto.name.trim();
    if (dto.phone !== undefined) set.phone = dto.phone?.trim() || null;
    if (dto.email !== undefined) set.email = dto.email?.trim().toLowerCase() || null;
    if (dto.source !== undefined) set.source = dto.source as LeadRow['source'];
    if (dto.note !== undefined) set.note = dto.note?.trim() || null;
    if (dto.status !== undefined) set.status = dto.status as LeadRow['status'];
    if (dto.followUpAt !== undefined) set.followUpAt = dto.followUpAt ? new Date(dto.followUpAt) : null;
    if (dto.assignedStaffId !== undefined) {
      if (!seesAll(me)) throw new BadRequestException('Ask a manager to reassign this lead.');
      if (dto.assignedStaffId) await this.assertStaff(me.vendorId, dto.assignedStaffId);
      set.assignedStaffId = dto.assignedStaffId;
    }
    await this.db.update(leads).set(set).where(eq(leads.id, row.id));
    return this.get(me, row.id);
  }

  /**
   * Turns the lead into a customer record, reusing an existing one with the same
   * phone or email so the CRM doesn't get duplicates. Safe to repeat.
   */
  async convert(me: VendorPrincipal, id: string) {
    const { row } = await this.own(me, id);
    if (row.status === 'won' && row.customerId) return this.get(me, row.id);

    const customerId = await this.db.transaction(async (tx) => {
      const match: SQL[] = [];
      if (row.phone) match.push(eq(customers.phone, row.phone));
      if (row.email) match.push(sql`lower(${customers.email}) = ${row.email}`);
      if (match.length) {
        const [existing] = await tx
          .select({ id: customers.id })
          .from(customers)
          .where(and(eq(customers.vendorId, me.vendorId), sql`(${sql.join(match, sql` or `)})`))
          .limit(1);
        if (existing) return existing.id;
      }
      const [created] = await tx
        .insert(customers)
        .values({ vendorId: me.vendorId, name: row.name, phone: row.phone, email: row.email, notes: row.note })
        .returning({ id: customers.id });
      return created.id;
    });

    const now = new Date();
    await this.db
      .update(leads)
      .set({ status: 'won', customerId, convertedAt: now, followUpAt: null, updatedAt: now })
      .where(eq(leads.id, row.id));
    return this.get(me, row.id);
  }

  async remove(me: VendorPrincipal, id: string) {
    const { row } = await this.own(me, id);
    await this.db.delete(leads).where(eq(leads.id, row.id));
  }
}
