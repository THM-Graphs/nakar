import { Injectable } from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents';
import * as undici from 'undici';
import { getConfig } from '../config/getConfig';
import { DatabaseService } from '../database/DatabaseService';

@Injectable()
export class AuthService {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public async getUserByJWT(
    jwt: string,
  ): Promise<Result<'plugin::users-permissions.user'> | null> {
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
}
