import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as undici from 'undici';
import { getConfig } from '../../config/getConfig';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Request } from 'express';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const User: () => ParameterDecorator = createParamDecorator(
  async (
    data: unknown,
    ctx: ExecutionContext,
  ): Promise<Result<'plugin::users-permissions.user'> | null> => {
    const request: Request = ctx.switchToHttp().getRequest();

    const authHeader: string | null = request.headers.authorization ?? null;
    if (authHeader == null) {
      return null;
    }
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }
    const jwt: string = authHeader.substring(7, authHeader.length);

    const result: undici.Response = await undici.fetch(
      `http://localhost:${getConfig().port}/api/users/me`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    );
    if (!result.ok) {
      return null;
    }
    const userId: string =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      ((await result.json()) as Result<'plugin::users-permissions.user'>)
        .documentId;
    const user: Result<'plugin::users-permissions.user'> | null = await strapi
      .documents('plugin::users-permissions.user')
      .findOne({ documentId: userId });

    return user;
  },
);
