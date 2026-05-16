import { ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { VendorService } from '@lotusgift/vendor-service';

import { VendorActiveGuard } from './vendor-active.guard.js';

describe('VendorActiveGuard', () => {
  const getByOrgId = jest.fn();
  const fakeVendorService = { getByOrgId } as unknown as VendorService;

  let guard: VendorActiveGuard;

  const buildContext = (req: unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
    }) as unknown as Parameters<VendorActiveGuard['canActivate']>[0];

  beforeEach(async () => {
    getByOrgId.mockReset();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        VendorActiveGuard,
        { provide: VendorService, useValue: fakeVendorService },
      ],
    }).compile();
    guard = moduleRef.get(VendorActiveGuard);
  });

  it('allows requests when vendor.status === ACTIVATED', async () => {
    getByOrgId.mockResolvedValue({ status: 'ACTIVATED' });
    const ok = await guard.canActivate(
      buildContext({
        user: { roles: ['member'] },
        session: { activeOrganizationId: 'o1' },
      }),
    );
    expect(ok).toBe(true);
  });

  it('bypasses the gate when user has admin role', async () => {
    const ok = await guard.canActivate(
      buildContext({
        user: { roles: ['admin'] },
        session: { activeOrganizationId: 'o1' },
      }),
    );
    expect(ok).toBe(true);
    expect(getByOrgId).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when active org is missing', async () => {
    await expect(
      guard.canActivate(
        buildContext({
          user: { roles: ['member'] },
          session: {},
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException (VENDOR_NOT_FOUND) when no vendor bound to org', async () => {
    getByOrgId.mockResolvedValue(null);
    await expect(
      guard.canActivate(
        buildContext({
          user: { roles: ['member'] },
          session: { activeOrganizationId: 'orphan-org' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws VENDOR_NOT_ACTIVATED for vendor.status in DRAFT/PENDING/REJECTED/SUSPENDED', async () => {
    for (const status of ['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'SUSPENDED']) {
      getByOrgId.mockResolvedValue({ status });
      await expect(
        guard.canActivate(
          buildContext({
            user: { roles: ['member'] },
            session: { activeOrganizationId: 'o1' },
          }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    }
  });
});
