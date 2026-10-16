import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { staff, vendors } from './vendors';

// Phase 4 growth: the content studio and leads. Publishing to Instagram, Facebook
// and TikTok waits on those platforms' approvals, so for now a vendor posts by
// hand from each app and marks the post as posted here.

export const contentPlatformValues = ['instagram', 'facebook', 'tiktok', 'whatsapp'] as const;
export type ContentPlatform = (typeof contentPlatformValues)[number];

/**
 * An image a vendor added to the studio. Kept in Postgres while posts carry one
 * small image each; move to object storage before media volume grows.
 */
export const contentMedia = pgTable('content_media', {
  id: uuid('id').defaultRandom().primaryKey(),
  vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  mimeType: text('mime_type').notNull(),
  dataBase64: text('data_base64').notNull(),
  byteSize: integer('byte_size').notNull(),
  createdById: uuid('created_by_id').references(() => staff.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contentPostStatusValues = ['draft', 'planned', 'posted'] as const;

export const contentPosts = pgTable(
  'content_posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id').references(() => contentMedia.id, { onDelete: 'set null' }),
    /** What the vendor said the post is about — the input to caption writing. */
    brief: text('brief'),
    tone: text('tone'),
    caption: text('caption').notNull().default(''),
    /** Stored without the leading '#'. */
    hashtags: text('hashtags').array().notNull().default([]),
    callToAction: text('call_to_action'),
    platforms: text('platforms', { enum: contentPlatformValues }).array().notNull().default([]),
    status: text('status', { enum: contentPostStatusValues }).notNull().default('draft'),
    plannedFor: timestamp('planned_for', { withTimezone: true }),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    postedPlatforms: text('posted_platforms', { enum: contentPlatformValues }).array().notNull().default([]),
    /** True once any caption text came from AI — kept even after the vendor edits it. */
    aiGenerated: boolean('ai_generated').notNull().default(false),
    createdById: uuid('created_by_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('content_posts_vendor_status_idx').on(t.vendorId, t.status)],
);

export const leadSourceValues = ['instagram', 'facebook', 'tiktok', 'whatsapp', 'booking_page', 'referral', 'walk_in', 'other'] as const;
export const leadStatusValues = ['new', 'contacted', 'won', 'lost'] as const;

/** Someone interested in the business who hasn't become a customer yet. */
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    source: text('source', { enum: leadSourceValues }).notNull(),
    note: text('note'),
    status: text('status', { enum: leadStatusValues }).notNull().default('new'),
    assignedStaffId: uuid('assigned_staff_id').references(() => staff.id, { onDelete: 'set null' }),
    followUpAt: timestamp('follow_up_at', { withTimezone: true }),
    /** Set when the lead becomes a customer record. */
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    /** The post that brought them in, when the vendor knows it. */
    contentPostId: uuid('content_post_id').references(() => contentPosts.id, { onDelete: 'set null' }),
    convertedAt: timestamp('converted_at', { withTimezone: true }),
    createdById: uuid('created_by_id').references(() => staff.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('leads_vendor_status_idx').on(t.vendorId, t.status)],
);
