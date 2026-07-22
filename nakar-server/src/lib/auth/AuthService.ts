import { ExecutionContext, Injectable } from '@nestjs/common';
import * as undici from 'undici';
import { getConfig } from '../config/getConfig';
import { DatabaseService } from '../database/DatabaseService';
import { Request } from 'express';
import type { Modules } from '@strapi/types';

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
  ): Promise<Modules.Documents.Result<'plugin::users-permissions.user'> | null> {
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
    const userResult: Modules.Documents.Result<'plugin::users-permissions.user'> =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (await result.json()) as Modules.Documents.Result<'plugin::users-permissions.user'>;

    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._databaseService.getUser(userResult.documentId);

    return user;
  }

  public async getUserFromContext(
    context: ExecutionContext,
  ): Promise<Modules.Documents.Result<'plugin::users-permissions.user'> | null> {
    return await this.getUserFromRequest(context.switchToHttp().getRequest());
  }

  public async getUserFromRequest(
    request: Request,
  ): Promise<Modules.Documents.Result<'plugin::users-permissions.user'> | null> {
    const jwt: string | null = AuthService.getJWTFromRequest(request);
    return await this.getUserByJWT(jwt);
  }
}
