import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@packages/helpers';

export function currentUserFactory(data: keyof JwtPayload | undefined, ctx: ExecutionContext) {
  const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
  const user = request.user;
  return data ? user?.[data] : user;
}

export const CurrentUser = createParamDecorator(currentUserFactory);
