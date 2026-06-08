import { OtpService, OTP_TTL_SECONDS } from './otp.service';

function makeMail() {
  return { sendOtpEmail: jest.fn().mockResolvedValue(undefined) };
}

describe('OtpService', () => {
  it('builds a key namespaced by lower-cased email', () => {
    const service = new OtpService({} as any, makeMail() as any);

    expect(service.buildKey('Jane@Example.com')).toBe('otp:jane@example.com');
  });

  it('generates a 6-digit code, stores it with a TTL, and emails it', async () => {
    const set = jest.fn().mockResolvedValue('OK');
    const mail = makeMail();
    const service = new OtpService({ set } as any, mail as any);

    await service.requestCode('jane@example.com');

    expect(set).toHaveBeenCalledWith(
      'otp:jane@example.com',
      expect.stringMatching(/^\d{6}$/),
      'EX',
      OTP_TTL_SECONDS,
    );
    const [, code] = set.mock.calls[0] as [string, string];
    expect(mail.sendOtpEmail).toHaveBeenCalledWith('jane@example.com', code);
  });

  it('verifies and consumes a matching code via the compare-and-delete script', async () => {
    const evalFn = jest.fn().mockResolvedValue(1);
    const service = new OtpService({ eval: evalFn } as any, makeMail() as any);

    const verified = await service.verifyCode('jane@example.com', '123456');

    expect(verified).toBe(true);
    expect(evalFn).toHaveBeenCalledWith(
      expect.any(String),
      1,
      'otp:jane@example.com',
      '123456',
    );
  });

  it('rejects a code that is wrong, expired, or already consumed', async () => {
    const evalFn = jest.fn().mockResolvedValue(0);
    const service = new OtpService({ eval: evalFn } as any, makeMail() as any);

    const verified = await service.verifyCode('jane@example.com', '000000');

    expect(verified).toBe(false);
  });
});
