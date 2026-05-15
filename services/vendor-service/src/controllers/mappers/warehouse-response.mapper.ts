import type { WarehouseDocument } from '../../schemas/warehouse.schema.js';

export function mapWarehouseToResponse(warehouse: WarehouseDocument): {
  id: string;
  vendorId: string;
  orgId: string;
  displayName: string;
  ownerType: string;
  address: WarehouseDocument['address'];
  contact: WarehouseDocument['contact'];
  location: WarehouseDocument['location'];
  operatingHours: WarehouseDocument['operatingHours'];
  carrierCutoffs: WarehouseDocument['carrierCutoffs'];
  serviceZone: WarehouseDocument['serviceZone'];
  pickupSlaHours: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: warehouse.id as unknown as string,
    vendorId: warehouse.vendorId,
    orgId: warehouse.orgId,
    displayName: warehouse.displayName,
    ownerType: warehouse.ownerType,
    address: warehouse.address,
    contact: warehouse.contact,
    location: warehouse.location,
    operatingHours: warehouse.operatingHours,
    carrierCutoffs: warehouse.carrierCutoffs,
    serviceZone: warehouse.serviceZone,
    pickupSlaHours: warehouse.pickupSlaHours,
    enabled: warehouse.enabled,
    createdAt: warehouse.createdAt.toISOString(),
    updatedAt: warehouse.updatedAt.toISOString(),
  };
}
