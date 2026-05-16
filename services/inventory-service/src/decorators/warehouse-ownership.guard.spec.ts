import { ForbiddenException } from '@nestjs/common';

import { WarehouseOwnershipGuard } from './warehouse-ownership.guard.js';

describe('WarehouseOwnershipGuard', () => {
  const findById = jest.fn();
  const guard = new WarehouseOwnershipGuard({ findById } as never);

  const ctx = (req: object) =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
    }) as never;

  it('allows admin bypass', async () => {
    await expect(
      guard.canActivate(ctx({ user: { role: 'admin' }, params: {} })),
    ).resolves.toBe(true);
    expect(findById).not.toHaveBeenCalled();
  });

  it('allows matching orgId', async () => {
    findById.mockResolvedValue({ orgId: 'org-1' });
    await expect(
      guard.canActivate(
        ctx({
          user: { role: 'warehouse-manager' },
          session: { activeOrganizationId: 'org-1' },
          params: { warehouseId: 'wh-1' },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('forbids org mismatch', async () => {
    findById.mockResolvedValue({ orgId: 'org-other' });
    await expect(
      guard.canActivate(
        ctx({
          user: { role: 'warehouse-manager' },
          session: { activeOrganizationId: 'org-1' },
          params: { warehouseId: 'wh-1' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
