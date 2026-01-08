import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { getUser } from '../tools/getUser';
import { Result } from '@strapi/types/dist/modules/documents/result';

@Injectable()
export class UserIsLoggedIn implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const user: Result<'plugin::users-permissions.user'> | null =
      await getUser(context);
    return user != null;
  }
}
