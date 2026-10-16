import { sniffImageType } from './content-studio.service';

describe('sniffImageType', () => {
  it('recognises JPEG, PNG and WebP from their first bytes', () => {
    expect(sniffImageType('/9j/4AAQSkZJRgABAQ')).toBe('image/jpeg');
    expect(sniffImageType('iVBORw0KGgoAAAANSUhEUg')).toBe('image/png');
    expect(sniffImageType(Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ').toString('base64'))).toBe('image/webp');
  });

  it('rejects anything else', () => {
    expect(sniffImageType(Buffer.from('GIF89a').toString('base64'))).toBeNull();
    expect(sniffImageType(Buffer.from('%PDF-1.7').toString('base64'))).toBeNull();
  });
});
