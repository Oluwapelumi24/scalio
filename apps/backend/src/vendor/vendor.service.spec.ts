import { NotFoundException } from '@nestjs/common';
import { VendorService } from './vendor.service';

function selectResult(rows: unknown[]) {
  return { from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(rows)) })) };
}

describe('VendorService.getPublicProfile', () => {
  it('returns the business with its services and opening hours', async () => {
    const db = { select: jest.fn() };
    db.select
      .mockReturnValueOnce(selectResult([{ id: 'vendor-1', slug: 'fade-house', businessName: 'Fade House' }]))
      .mockReturnValueOnce(selectResult([{ id: 'svc-1', name: 'Haircut', priceKobo: 500000 }]))
      .mockReturnValueOnce(selectResult([{ dayOfWeek: 1, opensAtMinutes: 540, closesAtMinutes: 1080 }]));

    const profile = await new VendorService(db as any).getPublicProfile('fade-house');
    expect(profile).toEqual({
      id: 'vendor-1',
      slug: 'fade-house',
      businessName: 'Fade House',
      services: [{ id: 'svc-1', name: 'Haircut', priceKobo: 500000 }],
      businessHours: [{ dayOfWeek: 1, opensAtMinutes: 540, closesAtMinutes: 1080 }],
    });
  });

  it('404s for an unknown or unapproved business', async () => {
    const db = { select: jest.fn().mockReturnValueOnce(selectResult([])) };
    await expect(new VendorService(db as any).getPublicProfile('nope')).rejects.toBeInstanceOf(NotFoundException);
  });
});
