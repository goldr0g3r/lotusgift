/** Append-only stock ledger reason codes (P8 inventory-service). */
export const STOCK_LEDGER_REASONS = [
  'RECEIVED',
  'RECEIVED_RETURN',
  'RESERVED',
  'RESERVATION_EXPIRED',
  'RESERVATION_RELEASED',
  'ORDER_DECREMENTED',
  'ORDER_CANCELLED',
  'TRANSFER_OUT',
  'TRANSFER_IN',
  'ADJUSTMENT_INCREASE',
  'ADJUSTMENT_DECREASE',
  'COUNT_CORRECTION',
  'DAMAGED_OUT',
  'EXPIRED_OUT',
] as const;

export type StockLedgerReason = (typeof STOCK_LEDGER_REASONS)[number];

/** Reservation lifecycle status keys (audit trail + Redis JSON). */
export const RESERVATION_STATUS_KEYS = [
  'PENDING',
  'EXTENDED',
  'EXPIRED',
  'RELEASED',
  'CONSUMED',
] as const;

export type ReservationStatusKey = (typeof RESERVATION_STATUS_KEYS)[number];

export type ReservationId = string & { readonly __brand: 'ReservationId' };
export type LedgerEntryId = string & { readonly __brand: 'LedgerEntryId' };

/** Default reservation TTL — 15 minutes (D3). */
export const DEFAULT_RESERVATION_TTL_SEC = 900;

/** Max TTL extensions per reservation (D12). */
export const RESERVATION_TTL_MAX_EXTENSIONS = 1;
