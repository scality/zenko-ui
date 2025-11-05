import { formatExpiryDate } from '../utils';

describe('formatExpiryDate', () => {
  const now = new Date('2024-01-15T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('healthy status (more than 14 days)', () => {
    it('should format date with "In X days" prefix and healthy status when expiring in 15 days', () => {
      const expiresOn = new Date('2024-01-30T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('healthy');
      expect(result.shortFormatWithPrefix).toMatch(
        /^In 15 days - \d{4}-\d{2}-\d{2}$/,
      );
      expect(result.shortFormat).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.longFormatWithPrefix).toMatch(
        /^In 15 days - \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      );
      expect(result.longFormat).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      );
    });

    it('should format date with healthy status when expiring in 100 days', () => {
      const expiresOn = new Date('2024-04-24T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('healthy');
      expect(result.shortFormatWithPrefix).toMatch(/^In 100 days - /);
    });
  });

  describe('warning status (1-14 days)', () => {
    it('should format date with warning status when expiring in 14 days', () => {
      const expiresOn = new Date('2024-01-29T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('warning');
      expect(result.shortFormatWithPrefix).toMatch(/^In 14 days - /);
    });

    it('should format date with warning status when expiring in 2 days', () => {
      const expiresOn = new Date('2024-01-17T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('warning');
      expect(result.shortFormatWithPrefix).toMatch(/^In 2 days - /);
    });

    it('should format date with singular "day" when expiring in 1 day', () => {
      const expiresOn = new Date('2024-01-16T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('warning');
      expect(result.shortFormatWithPrefix).toMatch(/^In 1 day - /);
      expect(result.shortFormatWithPrefix).not.toMatch(/days/);
    });
  });

  describe('critical status (today or past)', () => {
    it('should format date with "Expiration date is today" when expiring today (future time)', () => {
      const expiresOn = new Date('2024-01-15T18:00:00Z'); // Later today
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('critical');
      expect(result.shortFormatWithPrefix).toMatch(
        /^Expiration date is today - /,
      );
    });

    it('should format date with "Expired today" when expired today (past time)', () => {
      const expiresOn = new Date('2024-01-15T06:00:00Z'); // Earlier today
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('critical');
      expect(result.shortFormatWithPrefix).toMatch(/^Expired today - /);
    });

    it('should format date with "Expired 1 day ago" when expired yesterday', () => {
      const expiresOn = new Date('2024-01-14T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('critical');
      expect(result.shortFormatWithPrefix).toMatch(/^Expired 1 day ago - /);
      expect(result.shortFormatWithPrefix).not.toMatch(/days/);
    });

    it('should format date with "Expired X days ago" when expired multiple days ago', () => {
      const expiresOn = new Date('2024-01-05T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.status).toBe('critical');
      expect(result.shortFormatWithPrefix).toMatch(/^Expired 10 days ago - /);
    });
  });

  describe('format consistency', () => {
    it('should always return shortFormat without prefix', () => {
      const expiresOn = new Date('2024-01-20T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.shortFormat).not.toMatch(/In \d+ days/);
      expect(result.shortFormat).not.toMatch(/Expired/);
      expect(result.shortFormat).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should always return longFormat without prefix', () => {
      const expiresOn = new Date('2024-01-20T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.longFormat).not.toMatch(/In \d+ days/);
      expect(result.longFormat).not.toMatch(/Expired/);
      expect(result.longFormat).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      );
    });

    it('should return shortFormatWithPrefix containing shortFormat', () => {
      const expiresOn = new Date('2024-01-20T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.shortFormatWithPrefix).toContain(result.shortFormat);
    });

    it('should return longFormatWithPrefix containing longFormat', () => {
      const expiresOn = new Date('2024-01-20T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result.longFormatWithPrefix).toContain(result.longFormat);
    });
  });

  describe('all return properties', () => {
    it('should always return all 5 properties', () => {
      const expiresOn = new Date('2024-01-20T12:00:00Z');
      const result = formatExpiryDate(expiresOn);

      expect(result).toHaveProperty('shortFormat');
      expect(result).toHaveProperty('shortFormatWithPrefix');
      expect(result).toHaveProperty('longFormat');
      expect(result).toHaveProperty('longFormatWithPrefix');
      expect(result).toHaveProperty('status');

      expect(result.shortFormat).toBeTruthy();
      expect(result.shortFormatWithPrefix).toBeTruthy();
      expect(result.longFormat).toBeTruthy();
      expect(result.longFormatWithPrefix).toBeTruthy();
      expect(result.status).toBeTruthy();
    });
  });
});
