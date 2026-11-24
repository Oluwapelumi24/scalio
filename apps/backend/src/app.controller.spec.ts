import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthService } from './health/health.service';

describe('AppController', () => {
  let appController: AppController;
  const health = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: HealthService, useValue: health }],
    }).compile();

    appController = app.get<AppController>(AppController);
    health.check.mockReset();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('returns 200 when probes are ok', async () => {
      health.check.mockResolvedValue({ status: 'ok', db: 'ok', redis: 'ok' });
      const res = { status: jest.fn() };
      const body = await appController.getHealth(res as never);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(body).toEqual({ status: 'ok', db: 'ok', redis: 'ok' });
    });

    it('returns 503 when degraded', async () => {
      health.check.mockResolvedValue({ status: 'degraded', db: 'error', redis: 'ok' });
      const res = { status: jest.fn() };
      const body = await appController.getHealth(res as never);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(body.status).toBe('degraded');
    });
  });
});
