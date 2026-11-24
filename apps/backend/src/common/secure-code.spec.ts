import { readFileSync } from 'fs';
import { join } from 'path';
import { sixDigitCode } from './secure-code';

describe('sixDigitCode', () => {
  it('is implemented with crypto.randomInt(100000, 1000000)', () => {
    const source = readFileSync(join(__dirname, 'secure-code.ts'), 'utf8');
    expect(source).toMatch(/crypto\.randomInt\(100000,\s*1000000\)/);
  });

  it('returns a 6-digit code in that range', () => {
    for (let i = 0; i < 20; i++) {
      const code = sixDigitCode();
      expect(code).toMatch(/^\d{6}$/);
      const n = Number(code);
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThan(1000000);
    }
  });
});
