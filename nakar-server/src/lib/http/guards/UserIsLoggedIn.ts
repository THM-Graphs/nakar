import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { AuthService } from '../../auth/AuthService';

@Injectable()
export class UserIsLoggedIn implements CanActivate {
  public constructor(private readonly _authService: AuthService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserFromContext(context);
    return user != null;
  }
}
