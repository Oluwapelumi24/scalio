import type { ContentPlatform } from '../db/schema';

/**
 * What each platform accepts, and whether Scalio can post there for the vendor.
 *
 * Every platform is `manual` until its API approval comes through (Meta app review
 * for Instagram/Facebook, TikTok's Content Posting API). WhatsApp Status has no
 * posting API at all, so it stays manual for good. When an approval lands, its
 * adapter flips to `automatic` here and the apps start offering "Publish".
 */
export interface PlatformSpec {
  id: ContentPlatform;
  name: string;
  captionMaxChars: number;
  hashtagMax: number;
  /** A post on this platform can't go out without an image or video. */
  needsMedia: boolean;
  publishing: 'manual' | 'automatic';
  /** Shown beside the platform while publishing is manual. */
  manualReason: string;
}

export const PLATFORMS: readonly PlatformSpec[] = [
  {
    id: 'instagram', name: 'Instagram', captionMaxChars: 2200, hashtagMax: 30, needsMedia: true, publishing: 'manual',
    manualReason: "Posting from Scalio is waiting on Instagram's approval. Copy the caption and post from the Instagram app for now.",
  },
  {
    id: 'facebook', name: 'Facebook', captionMaxChars: 63206, hashtagMax: 30, needsMedia: false, publishing: 'manual',
    manualReason: "Posting from Scalio is waiting on Facebook's approval. Copy the caption and post from the Facebook app for now.",
  },
  {
    id: 'tiktok', name: 'TikTok', captionMaxChars: 2200, hashtagMax: 30, needsMedia: true, publishing: 'manual',
    manualReason: "Posting from Scalio is waiting on TikTok's approval. Copy the caption and post from the TikTok app for now.",
  },
  {
    id: 'whatsapp', name: 'WhatsApp Status', captionMaxChars: 700, hashtagMax: 0, needsMedia: false, publishing: 'manual',
    manualReason: "WhatsApp doesn't let apps post to Status. Copy the caption and post it from WhatsApp.",
  },
];

export const platformSpec = (id: ContentPlatform): PlatformSpec => PLATFORMS.find((p) => p.id === id)!;

export interface PostForCheck {
  caption: string;
  hashtags: string[];
  callToAction: string | null;
  hasMedia: boolean;
}

/** The text exactly as it would be pasted into the platform. */
export function composePostText(post: Pick<PostForCheck, 'caption' | 'hashtags' | 'callToAction'>, platform: ContentPlatform): string {
  const parts = [post.caption.trim()];
  if (post.callToAction?.trim()) parts.push(post.callToAction.trim());
  if (platformSpec(platform).hashtagMax > 0 && post.hashtags.length > 0) {
    parts.push(post.hashtags.map((h) => `#${h}`).join(' '));
  }
  return parts.filter(Boolean).join('\n\n');
}

export interface PlatformCheck {
  platform: ContentPlatform;
  text: string;
  /** Problems that stop the post going out as written. */
  problems: string[];
  /** Fine to post, but worth knowing. */
  notes: string[];
}

/** Checks a post against one platform's rules. Pure, so both apps get identical results. */
export function checkPost(post: PostForCheck, platform: ContentPlatform): PlatformCheck {
  const spec = platformSpec(platform);
  const text = composePostText(post, platform);
  const problems: string[] = [];
  const notes: string[] = [];

  if (!post.caption.trim()) problems.push('Add a caption.');
  if (text.length > spec.captionMaxChars) {
    problems.push(`${spec.name} allows ${spec.captionMaxChars.toLocaleString('en-GB')} characters — this is ${text.length.toLocaleString('en-GB')}.`);
  }
  if (spec.hashtagMax > 0 && post.hashtags.length > spec.hashtagMax) {
    problems.push(`${spec.name} allows up to ${spec.hashtagMax} hashtags — this has ${post.hashtags.length}.`);
  }
  if (spec.hashtagMax === 0 && post.hashtags.length > 0) {
    notes.push(`Hashtags are left out for ${spec.name}.`);
  }
  if (spec.needsMedia && !post.hasMedia) problems.push(`${spec.name} posts need a photo or video.`);

  return { platform, text, problems, notes };
}

/** Normalises user- or AI-supplied hashtags: no '#', no spaces, no duplicates. */
export function cleanHashtags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().replace(/^#+/, '').replace(/\s+/g, '');
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      out.push(tag);
    }
  }
  return out;
}
