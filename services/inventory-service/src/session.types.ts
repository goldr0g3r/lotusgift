import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface SessionPayload {
  activeOrganizationId?: string;
}

export interface CurrentUserPayload {
  id: string;
  role?: string;
  roles?: readonly string[];
}

interface RequestLike {
  session?: SessionPayload;
  user?: CurrentUserPayload;
}

export const Session = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionPayload | undefined => {
    return ctx.switchToHttp().getRequest<RequestLike>().session;
  },
);

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload | undefined => {
    return ctx.switchToHttp().getRequest<RequestLike>().user;
  },
);
