import { decryptPii, encryptPii, last4 } from './crypto';

describe('PII encryption', () => {
  it('round-trips and never stores the plain number', () => {
    const sealed = encryptPii('0123456789');
    expect(sealed).not.toContain('0123456789');
    expect(decryptPii(sealed)).toBe('0123456789');
  });

  it('uses a fresh IV each time', () => {
    expect(encryptPii('0123456789')).not.toBe(encryptPii('0123456789'));
  });

  it('rejects tampered data', () => {
    const [iv, tag, data] = encryptPii('0123456789').split('.');
    const flipped = Buffer.from(data, 'base64');
    flipped[0] ^= 1;
    expect(() => decryptPii([iv, tag, flipped.toString('base64')].join('.'))).toThrow();
  });

  it('masks to the last four digits', () => {
    expect(last4('0123456789')).toBe('6789');
  });
});
