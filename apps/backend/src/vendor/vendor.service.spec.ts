import { NotFoundException } from '@nestjs/common';
import { VendorService } from './vendor.service';

function selectResult(rows: unknown[]) {
  return { from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(rows)) })) };
}

function makePreview(matches = false) {
  return { matches: jest.fn(async () => matches) };
}

describe('VendorService.getPublicProfile', () => {
  it('returns the business with its services and opening hours', async () => {
    const db = { select: jest.fn() };
    db.select
      .mockReturnValueOnce(selectResult([{ id: 'vendor-1', slug: 'fade-house', businessName: 'Fade House' }]))
      .mockReturnValueOnce(selectResult([{ id: 'svc-1', name: 'Haircut', priceKobo: 500000 }]))
      .mockReturnValueOnce(selectResult([{ dayOfWeek: 1, opensAtMinutes: 540, closesAtMinutes: 1080 }]));

    const profile = await new VendorService(db as any, makePreview() as any).getPublicProfile('fade-house');
    expect(profile).toEqual({
      id: 'vendor-1',
      slug: 'fade-house',
      businessName: 'Fade House',
      services: [{ id: 'svc-1', name: 'Haircut', priceKobo: 500000 }],
      businessHours: [{ dayOfWeek: 1, opensAtMinutes: 540, closesAtMinutes: 1080 }],
      preview: false,
    });
  });

  it('404s for an unknown or unapproved business', async () => {
    const db = { select: jest.fn().mockReturnValueOnce(selectResult([])) };
    await expect(new VendorService(db as any, makePreview() as any).getPublicProfile('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns an unapproved business when the preview token matches', async () => {
    const preview = makePreview(true);
    const db = { select: jest.fn() };
    db.select
      .mockReturnValueOnce(selectResult([{ id: 'vendor-1', slug: 'glow', businessName: 'Glow' }]))
      .mockReturnValueOnce(selectResult([]))
      .mockReturnValueOnce(selectResult([]));

    const profile = await new VendorService(db as any, preview as any).getPublicProfile('glow', 'abc');
    expect(preview.matches).toHaveBeenCalledWith('abc', 'glow');
    expect(profile.preview).toBe(true);
    expect(profile.businessName).toBe('Glow');
  });

  it('still 404s when the preview token is wrong', async () => {
    const db = { select: jest.fn().mockReturnValueOnce(selectResult([])) };
    await expect(
      new VendorService(db as any, makePreview(false) as any).getPublicProfile('glow', 'bad'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
