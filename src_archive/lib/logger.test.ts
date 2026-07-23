import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('Logger Utility', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original console methods
    vi.restoreAllMocks();
  });

  describe('in development mode', () => {
    beforeEach(() => {
      // Force development mode for these tests
      // We need to re-instantiate or mock the internal state if it's evaluated once.
      // Since it's evaluated at module load, we can use a workaround or test the logic.
      // Actually, since `logger` is a singleton and `isDevelopment` is set once,
      // changing `process.env.NODE_ENV` here won't change the already instantiated logger's property.
      // Let's use `vi.stubEnv` if we were to re-import, or we can just access the private property for testing,
      // or better, we can set NODE_ENV before importing if possible.
      // Given vitest, the environment is usually 'test' which is not 'development'.
      // To test this properly, we might need to cast and modify the private property.
      logger['isDevelopment'] = true;
    });

    it('should log info messages', () => {
      logger.info('Test info message', { key: 'value' });
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy.mock.calls[0][0]).toMatch(/\[INFO\] Test info message/);
      expect(consoleInfoSpy.mock.calls[0][1]).toEqual({ key: 'value' });
    });

    it('should log warn messages', () => {
      logger.warn('Test warn message');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy.mock.calls[0][0]).toMatch(/\[WARN\] Test warn message/);
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/\[ERROR\] Test error message/);
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy.mock.calls[0][0]).toMatch(/\[DEBUG\] Test debug message/);
    });

    it('should redact sensitive keys from message and data', () => {
      logger.info('Using key sk-1234567890abcdef1234567890abcdef', { token: 'Bearer xyz' });
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      const msg = consoleInfoSpy.mock.calls[0][0];
      const data = consoleInfoSpy.mock.calls[0][1];
      expect(msg).toMatch(/\[INFO\] Using key \[REDACTED\]/);
      expect(data).toEqual({ token: 'Bearer [REDACTED]' });
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      logger['isDevelopment'] = false;
    });

    it('should not log info messages', () => {
      logger.info('Test info message');
      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should not log warn messages', () => {
      logger.warn('Test warn message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not log error messages', () => {
      logger.error('Test error message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should not log debug messages', () => {
      logger.debug('Test debug message');
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });
});
