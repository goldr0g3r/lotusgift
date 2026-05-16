import { ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { ProductOwnershipGuard } from './product-ownership.guard.js';
import { PRODUCT_MODEL } from '../schemas/product.schema.js';

describe('ProductOwnershipGuard', () => {
  const findOne = jest.fn();

  let guard: ProductOwnershipGuard;

  const buildContext = (req: unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => req }),
    }) as unknown as Parameters<ProductOwnershipGuard['canActivate']>[0];

  beforeEach(async () => {
    findOne.mockReset();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductOwnershipGuard,
        {
          provide: getModelToken(PRODUCT_MODEL),
          useValue: { findOne: () => ({ exec: () => findOne() }) },
        },
      ],
    }).compile();
    guard = moduleRef.get(ProductOwnershipGuard);
  });

  it('allows requests when the active org matches the product owner', async () => {
    findOne.mockResolvedValue({ id: 'p1', orgId: 'o1' });
    const ok = await guard.canActivate(
      buildContext({
        params: { productId: 'p1' },
        user: { roles: ['member'] },
        session: { activeOrganizationId: 'o1' },
      }),
    );
    expect(ok).toBe(true);
  });

  it('bypasses ownership when user has admin role', async () => {
    const ok = await guard.canActivate(
      buildContext({
        params: { productId: 'p1' },
        user: { roles: ['admin'] },
        session: { activeOrganizationId: 'unrelated' },
      }),
    );
    expect(ok).toBe(true);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when active org mismatches the product owner', async () => {
    findOne.mockResolvedValue({ id: 'p1', orgId: 'o1' });
    await expect(
      guard.canActivate(
        buildContext({
          params: { productId: 'p1' },
          user: { roles: ['member'] },
          session: { activeOrganizationId: 'o2' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when productId param is missing', async () => {
    await expect(
      guard.canActivate(
        buildContext({
          params: {},
          user: { roles: ['member'] },
          session: { activeOrganizationId: 'o1' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws ForbiddenException when product does not exist', async () => {
    findOne.mockResolvedValue(null);
    await expect(
      guard.canActivate(
        buildContext({
          params: { productId: 'missing' },
          user: { roles: ['member'] },
          session: { activeOrganizationId: 'o1' },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
