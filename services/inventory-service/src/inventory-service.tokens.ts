import { RESERVATION_PORT, STOCK_READ_PORT } from '@repo/utils';

export const ENV_TOKEN = Symbol.for('@lotusgift/inventory-service#Env');
export const ANALYTICS_TOKEN = Symbol.for('@lotusgift/inventory-service#Analytics');
export const RESERVATION_BACKEND_TOKEN = Symbol.for(
  '@lotusgift/inventory-service#ReservationBackend',
);

export { RESERVATION_PORT, STOCK_READ_PORT };
