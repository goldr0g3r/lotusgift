import {
  ALL_ERROR_CODES,
  ERROR_CODE_DEFAULT_STATUS,
  ERROR_CODES_4XX,
  ERROR_CODES_5XX,
} from './error-codes.js';

describe('error-code catalog', () => {
  it('groups codes into 4xx + 5xx', () => {
    expect(ERROR_CODES_4XX.length).toBeGreaterThan(0);
    expect(ERROR_CODES_5XX.length).toBeGreaterThan(0);
  });

  it('ALL_ERROR_CODES is the union of 4xx + 5xx', () => {
    expect(ALL_ERROR_CODES.length).toBe(ERROR_CODES_4XX.length + ERROR_CODES_5XX.length);
  });

  it('maps every code in ALL_ERROR_CODES to a default HTTP status', () => {
    for (const code of ALL_ERROR_CODES) {
      const status = ERROR_CODE_DEFAULT_STATUS[code];
      expect(typeof status).toBe('number');
      expect(status).toBeGreaterThanOrEqual(400);
      expect(status).toBeLessThan(600);
    }
  });

  it('4xx codes map to 4xx statuses', () => {
    for (const code of ERROR_CODES_4XX) {
      expect(ERROR_CODE_DEFAULT_STATUS[code]).toBeLessThan(500);
    }
  });

  it('5xx codes map to 5xx statuses', () => {
    for (const code of ERROR_CODES_5XX) {
      expect(ERROR_CODE_DEFAULT_STATUS[code]).toBeGreaterThanOrEqual(500);
    }
  });

  it('includes the corporate-gifting domain codes', () => {
    expect(ERROR_CODES_4XX).toContain('ORDER_RFQ_ROUTE_REQUIRED');
    expect(ERROR_CODES_4XX).toContain('RECIPIENT_LIST_INVALID_ROW');
    expect(ERROR_CODES_4XX).toContain('CUSTOMIZATION_INVALID_TRANSITION');
  });
});
