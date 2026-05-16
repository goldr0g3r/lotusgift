export { InventoryServiceModule } from './inventory-service.module.js';
export {
  ENV_TOKEN,
  ANALYTICS_TOKEN,
  RESERVATION_PORT,
  STOCK_READ_PORT,
} from './inventory-service.tokens.js';
export { WarehouseOwnershipGuard } from './decorators/index.js';
export {
  LedgerService,
  ReservationService,
  AvailabilityService,
  TransferService,
  RedisReservationService,
  InMemoryReservationService,
} from './services/index.js';
export {
  InventoryStockLedgerAppendedV1,
  InventoryLowStockDetectedV1,
  InventoryDeadStockDetectedV1,
  InventoryReorderNeededV1,
  InventoryTransferredV1,
  InventoryReservationCreatedV1,
  InventoryReservationExtendedV1,
  InventoryReservationExpiredV1,
} from '@repo/events';
