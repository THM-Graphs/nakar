import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../database/DatabaseService';
import { userCanSeeAndJoinRoom } from '../../policies/userCanSeeAndJoinRoom';
import { AuthService } from '../../auth/AuthService';
import { Request } from 'express';

@Injectable()
export class UserCanAccessRoom implements CanActivate {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const user: Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserFromRequest(request);

    const roomId: unknown = request.params['roomId'];
    if (typeof roomId !== 'string') {
      throw new NotFoundException(`No room id provided.`);
    }

    const room: Result<'api::room.room'> = await this._databaseService
      .getRoom(roomId)
      .catch((): never => {
        throw new NotFoundException();
      });

    const allowed: boolean = await userCanSeeAndJoinRoom(
      user,
      room,
      this._databaseService,
    );

    return allowed;
  }
}
