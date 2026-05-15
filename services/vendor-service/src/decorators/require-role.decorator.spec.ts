import { Reflector } from '@nestjs/core';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import 'reflect-metadata';

import { REQUIRE_ROLE_KEY, RequireRole } from './require-role.decorator.js';
import { RoleGuard } from './role.guard.js';

class DummyController {}

describe('@RequireRole decorator', () => {
  it('sets metadata at REQUIRE_ROLE_KEY when applied as a class decorator', () => {
    @RequireRole('admin')
    class GuardedController {}
    const metadata = Reflect.getMetadata(REQUIRE_ROLE_KEY, GuardedController) as
      | string[]
      | undefined;
    expect(metadata).toEqual(['admin']);
  });

  it('supports multiple roles (any-match)', () => {
    @RequireRole('admin', 'owner')
    class MultiRoleController {}
    const metadata = Reflect.getMetadata(REQUIRE_ROLE_KEY, MultiRoleController) as string[];
    expect(metadata).toEqual(['admin', 'owner']);
  });

  it('does not affect unrelated classes', () => {
    expect(Reflect.getMetadata(REQUIRE_ROLE_KEY, DummyController)).toBeUndefined();
  });
});

function buildContext(opts: { user?: { role?: string; roles?: string[] } }): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ user: opts.user }),
    }),
  } as unknown as ExecutionContext;
}

function reflectorReturning(value: unknown): Reflector {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(value as never);
  return reflector;
}

describe('RoleGuard', () => {
  it('returns true when no role metadata is set (open endpoint)', () => {
    const reflector = reflectorReturning(undefined);
    const guard = new RoleGuard(reflector);
    expect(guard.canActivate(buildContext({}))).toBe(true);
  });

  it('throws ForbiddenException with code AUTH_FORBIDDEN when user has no role', () => {
    const reflector = reflectorReturning(['admin']);
    const guard = new RoleGuard(reflector);
    expect(() => guard.canActivate(buildContext({ user: {} }))).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user role does not match', () => {
    const reflector = reflectorReturning(['admin']);
    const guard = new RoleGuard(reflector);
    expect(() =>
      guard.canActivate(buildContext({ user: { role: 'member' } })),
    ).toThrow(ForbiddenException);
  });

  it('allows the request when user.role matches one of the required roles', () => {
    const reflector = reflectorReturning(['admin', 'owner']);
    const guard = new RoleGuard(reflector);
    expect(guard.canActivate(buildContext({ user: { role: 'admin' } }))).toBe(true);
  });

  it('allows the request when user.roles[] contains a required role', () => {
    const reflector = reflectorReturning(['admin']);
    const guard = new RoleGuard(reflector);
    expect(
      guard.canActivate(buildContext({ user: { roles: ['member', 'admin'] } })),
    ).toBe(true);
  });
});
