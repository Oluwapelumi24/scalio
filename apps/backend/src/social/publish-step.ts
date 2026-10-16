import { MetaApiError, type MetaGraph } from './meta-graph';

// One attempt at getting a post onto Facebook or Instagram. Pure apart from the
// Graph calls, so the retry rules can be tested with a fake Graph.

export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000];
export const MAX_FAILED_ATTEMPTS = RETRY_DELAYS_MS.length;
/** Meta suggests checking a container once a minute for up to 5 minutes. */
export const CONTAINER_WAIT_MS = 6 * 60_000;
export const CONTAINER_POLL_MS = 60_000;

export interface StepInput {
  platform: 'facebook' | 'instagram';
  /** Exactly what gets posted — caption, call to action and hashtags, already checked. */
  text: string;
  /** Signed public URL of the photo, or null for a text post. */
  imageUrl: string | null;
  imageMimeType: string | null;
  account: { externalId: string; token: string };
  /** Instagram container from an earlier attempt still being processed. */
  containerId: string | null;
  containerCreatedAt: Date | null;
}

export type StepResult =
  | { kind: 'published'; externalId: string; permalink: string | null }
  | { kind: 'waiting'; containerId: string; containerCreatedAt: Date }
  | { kind: 'retry'; error: string; resetContainer?: boolean; containerId?: string; containerCreatedAt?: Date }
  | { kind: 'failed'; error: string; reconnect?: boolean };

const fail = (error: string): StepResult => ({ kind: 'failed', error });

function fromError(err: unknown): StepResult {
  if (err instanceof MetaApiError) {
    if (err.needsReconnect) return { kind: 'failed', error: 'The connection to Meta has expired or was removed. Reconnect your account, then try again.', reconnect: true };
    if (err.retryable) return { kind: 'retry', error: err.message };
    return fail(err.message);
  }
  return { kind: 'retry', error: err instanceof Error ? err.message : String(err) };
}

export async function publishStep(graph: MetaGraph, input: StepInput, now = new Date()): Promise<StepResult> {
  const { account } = input;
  let containerId = input.containerId;
  let createdAt = input.containerCreatedAt ?? now;
  try {
    if (input.platform === 'facebook') {
      const { postId } = input.imageUrl
        ? await graph.pagePhoto(account.externalId, account.token, input.imageUrl, input.text)
        : await graph.pageText(account.externalId, account.token, input.text);
      const permalink = await graph.pagePostPermalink(postId, account.token).catch(() => null);
      return { kind: 'published', externalId: postId, permalink };
    }

    // Instagram: create a container, wait for Instagram to process it, then publish.
    if (!input.imageUrl) return fail('Instagram posts need a photo.');
    if (input.imageMimeType !== 'image/jpeg') return fail('Instagram only takes JPEG photos from Scalio. Choose the photo again, or take a new one.');

    if (!containerId) {
      containerId = await graph.igCreateImageContainer(account.externalId, account.token, input.imageUrl, input.text);
      createdAt = now;
    }
    const status = await graph.igContainerStatus(containerId, account.token);
    if (status === 'IN_PROGRESS') {
      if (now.getTime() - createdAt.getTime() > CONTAINER_WAIT_MS) return fail('Instagram took too long to process the photo. Try publishing again.');
      return { kind: 'waiting', containerId, containerCreatedAt: createdAt };
    }
    if (status === 'ERROR') return fail("Instagram couldn't process this photo. Try a different photo.");
    if (status === 'EXPIRED') return { kind: 'retry', error: 'The upload to Instagram expired; trying again.', resetContainer: true };

    const mediaId = await graph.igPublish(account.externalId, account.token, containerId);
    const permalink = await graph.igPermalink(mediaId, account.token).catch(() => null);
    return { kind: 'published', externalId: mediaId, permalink };
  } catch (err) {
    const r = fromError(err);
    // Keep a container Instagram already accepted, so a retry doesn't upload twice.
    return r.kind === 'retry' && containerId ? { ...r, containerId, containerCreatedAt: createdAt } : r;
  }
}
