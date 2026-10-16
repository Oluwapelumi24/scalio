import { checkPost, cleanHashtags, composePostText } from './platforms';

const post = { caption: 'Fresh fades all week ✂️', hashtags: ['LagosBarber', 'fade'], callToAction: 'Book at scalio.app/book/fade-house', hasMedia: true };

describe('composePostText', () => {
  it('joins caption, call to action and hashtags the way they will be pasted', () => {
    expect(composePostText(post, 'instagram')).toBe(
      'Fresh fades all week ✂️\n\nBook at scalio.app/book/fade-house\n\n#LagosBarber #fade',
    );
  });

  it('leaves hashtags out where the platform has none', () => {
    expect(composePostText(post, 'whatsapp')).toBe('Fresh fades all week ✂️\n\nBook at scalio.app/book/fade-house');
  });
});

describe('checkPost', () => {
  it('passes a normal post', () => {
    expect(checkPost(post, 'instagram').problems).toEqual([]);
  });

  it('flags too many hashtags for Instagram', () => {
    const many = Array.from({ length: 31 }, (_, i) => `tag${i}`);
    expect(checkPost({ ...post, hashtags: many }, 'instagram').problems).toEqual([
      'Instagram allows up to 30 hashtags — this has 31.',
    ]);
  });

  it('flags captions over the length limit', () => {
    const r = checkPost({ ...post, caption: 'x'.repeat(800), hashtags: [] }, 'whatsapp');
    expect(r.problems[0]).toMatch(/^WhatsApp Status allows 700 characters/);
  });

  it('needs a photo for Instagram and TikTok but not Facebook', () => {
    const noPhoto = { ...post, hasMedia: false };
    expect(checkPost(noPhoto, 'instagram').problems).toContain('Instagram posts need a photo or video.');
    expect(checkPost(noPhoto, 'tiktok').problems).toContain('TikTok posts need a photo or video.');
    expect(checkPost(noPhoto, 'facebook').problems).toEqual([]);
  });

  it('notes dropped hashtags on WhatsApp instead of blocking', () => {
    const r = checkPost(post, 'whatsapp');
    expect(r.problems).toEqual([]);
    expect(r.notes).toEqual(['Hashtags are left out for WhatsApp Status.']);
  });

  it('requires a caption', () => {
    expect(checkPost({ ...post, caption: '  ' }, 'facebook').problems).toContain('Add a caption.');
  });
});

describe('cleanHashtags', () => {
  it('strips #, spaces and case-insensitive duplicates', () => {
    expect(cleanHashtags(['#Lagos', 'lagos', '  #nail art ', '', '##Spa'])).toEqual(['Lagos', 'nailart', 'Spa']);
  });
});
