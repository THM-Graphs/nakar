import { ExecutionContext, Injectable } from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents';
import * as undici from 'undici';
import { getConfig } from '../config/getConfig';
import { DatabaseService } from '../database/DatabaseService';
import { Request } from 'express';

@Injectable()
export class AuthService {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public static getJWTFromRequest(request: Request): string | null {
    const authHeader: string | null = request.headers.authorization ?? null;
    if (authHeader == null) {
      return null;
    }
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }
    const jwt: string = authHeader.substring(7, authHeader.length);
    return jwt;
  }

  public static getJWT(ctx: ExecutionContext): string | null {
    const request: Request = ctx.switchToHttp().getRequest();
    return AuthService.getJWTFromRequest(request);
  }

  public async getUserByJWT(
    jwt: string | null,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
    if (jwt == null) {
      return null;
    }
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
    const user: Result<'plugin::users-permissions.user'> | null =
      await this._databaseService.getUser(userId);

    return user;
  }

  public async getUserFromContext(
    context: ExecutionContext,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
    return await this.getUserFromRequest(context.switchToHttp().getRequest());
  }

  public async getUserFromRequest(
    request: Request,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
    const jwt: string | null = AuthService.getJWTFromRequest(request);
    return await this.getUserByJWT(jwt);
  }
}
