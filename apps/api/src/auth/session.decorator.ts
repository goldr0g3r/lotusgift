import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Session = createParamDecorator(
  (data: 'user' | 'session' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data === 'user') return request.user;
    if (data === 'session') return request.session;
    return { user: request.user, session: request.session };
  },
);
