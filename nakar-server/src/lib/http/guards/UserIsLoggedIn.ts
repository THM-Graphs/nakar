import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { AuthService } from '../../auth/AuthService';

@Injectable()
export class UserIsLoggedIn implements CanActivate {
  public constructor(private readonly _authService: AuthService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const user: Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserFromContext(context);
    return user != null;
  }
}
