// Assertions read jest mocks off the fake Graph object.
/* eslint-disable @typescript-eslint/unbound-method */
import { MetaApiError, type MetaGraph } from './meta-graph';
import { CONTAINER_WAIT_MS, publishStep, type StepInput } from './publish-step';

const now = new Date('2026-10-16T12:00:00Z');
const base: StepInput = {
  platform: 'instagram', text: 'Fresh sets ✨\n\n#LekkiNails', imageUrl: 'https://api.example.com/public/content-media/m1?exp=1&sig=x',
  imageMimeType: 'image/jpeg', account: { externalId: 'ig1', token: 'tok' }, containerId: null, containerCreatedAt: null,
};

function fakeGraph(over: Partial<Record<keyof MetaGraph, jest.Mock>> = {}) {
  return {
    pagePhoto: jest.fn(() => Promise.resolve({ postId: 'page_post' })),
    pageText: jest.fn(() => Promise.resolve({ postId: 'page_text' })),
    pagePostPermalink: jest.fn(() => Promise.resolve('https://facebook.com/p/1')),
    igCreateImageContainer: jest.fn(() => Promise.resolve('c1')),
    igContainerStatus: jest.fn(() => Promise.resolve('FINISHED')),
    igPublish: jest.fn(() => Promise.resolve('media1')),
    igPermalink: jest.fn(() => Promise.resolve('https://instagram.com/p/1')),
    ...over,
  } as unknown as MetaGraph & Record<string, jest.Mock>;
}

const metaError = (code: number, status = 400, transient = false) => new MetaApiError('nope', status, code, undefined, transient);

describe('publishStep — Facebook', () => {
  it('posts a photo with the caption and returns the link', async () => {
    const g = fakeGraph();
    const r = await publishStep(g, { ...base, platform: 'facebook', account: { externalId: 'page1', token: 'tok' } }, now);
    expect(r).toEqual({ kind: 'published', externalId: 'page_post', permalink: 'https://facebook.com/p/1' });
    expect(g.pagePhoto).toHaveBeenCalledWith('page1', 'tok', base.imageUrl, base.text);
  });

  it('posts text when there is no photo', async () => {
    const g = fakeGraph();
    await publishStep(g, { ...base, platform: 'facebook', imageUrl: null, imageMimeType: null }, now);
    expect(g.pageText).toHaveBeenCalled();
    expect(g.pagePhoto).not.toHaveBeenCalled();
  });
});

describe('publishStep — Instagram', () => {
  it('creates a container, publishes it and returns the permalink', async () => {
    const g = fakeGraph();
    expect(await publishStep(g, base, now)).toEqual({ kind: 'published', externalId: 'media1', permalink: 'https://instagram.com/p/1' });
    expect(g.igPublish).toHaveBeenCalledWith('ig1', 'tok', 'c1');
  });

  it('waits while Instagram is still processing, then gives up after the wait limit', async () => {
    const g = fakeGraph({ igContainerStatus: jest.fn(() => Promise.resolve('IN_PROGRESS')) });
    expect(await publishStep(g, base, now)).toEqual({ kind: 'waiting', containerId: 'c1', containerCreatedAt: now });
    const late = new Date(now.getTime() + CONTAINER_WAIT_MS + 1);
    const r = await publishStep(g, { ...base, containerId: 'c1', containerCreatedAt: now }, late);
    expect(r.kind).toBe('failed');
    expect(g.igCreateImageContainer).toHaveBeenCalledTimes(1); // the second attempt reused the container
  });

  it('keeps the container when a later call fails, so a retry does not upload twice', async () => {
    const g = fakeGraph({ igContainerStatus: jest.fn(() => Promise.reject(metaError(2, 500, true))) });
    const r = await publishStep(g, base, now);
    expect(r).toMatchObject({ kind: 'retry', containerId: 'c1' });
  });

  it('starts over when the container expired', async () => {
    const g = fakeGraph({ igContainerStatus: jest.fn(() => Promise.resolve('EXPIRED')) });
    expect(await publishStep(g, { ...base, containerId: 'old', containerCreatedAt: now }, now)).toMatchObject({ kind: 'retry', resetContainer: true });
  });

  it('refuses non-JPEG photos and text-only posts', async () => {
    const g = fakeGraph();
    expect((await publishStep(g, { ...base, imageMimeType: 'image/png' }, now)).kind).toBe('failed');
    expect((await publishStep(g, { ...base, imageUrl: null }, now)).kind).toBe('failed');
    expect(g.igCreateImageContainer).not.toHaveBeenCalled();
  });
});

describe('publishStep — errors', () => {
  it('asks for a reconnect when the token is no longer valid', async () => {
    const g = fakeGraph({ igCreateImageContainer: jest.fn(() => Promise.reject(metaError(190))) });
    expect(await publishStep(g, base, now)).toMatchObject({ kind: 'failed', reconnect: true });
  });

  it('retries rate limits and Meta outages', async () => {
    for (const err of [metaError(4), metaError(1, 500), metaError(99, 400, true)]) {
      const g = fakeGraph({ igCreateImageContainer: jest.fn(() => Promise.reject(err)) });
      expect((await publishStep(g, base, now)).kind).toBe('retry');
    }
  });

  it('fails without retrying on other errors, with Meta’s message', async () => {
    const g = fakeGraph({ igCreateImageContainer: jest.fn(() => Promise.reject(metaError(100))) });
    expect(await publishStep(g, base, now)).toEqual({ kind: 'failed', error: 'nope' });
  });
});
