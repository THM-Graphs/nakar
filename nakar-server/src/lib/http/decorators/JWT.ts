import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import { AuthService } from '../../auth/AuthService';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const JWT: () => ParameterDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    return AuthService.getJWT(ctx);
  },
);
