import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { getUser } from '../tools/getUser';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const User: () => ParameterDecorator = createParamDecorator(
  async (
    data: unknown,
    ctx: ExecutionContext,
  ): Promise<Result<'plugin::users-permissions.user'> | null> => {
    return await getUser(ctx);
  },
);
