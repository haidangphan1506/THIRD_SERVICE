import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { JwtPayload } from "@packages/helpers";

export const CurrentUser = createParamDecorator(
    (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
      const request = ctx
        .switchToHttp()
        .getRequest<{ user: JwtPayload }>();
  
      const user = request.user;
  
      return data ? user?.[data] : user;
    },
  );