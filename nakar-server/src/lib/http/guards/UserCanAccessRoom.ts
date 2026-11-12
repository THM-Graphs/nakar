import type { Response } from 'express';
import { Unauthorized } from 'http-errors';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { Request } from 'express';
import { DatabaseService } from '../../database/DatabaseService';
import { AuthService } from '../../auth/AuthService';
import { userCanSeeAndJoinRoom } from '../../policies/userCanSeeAndJoinRoom';

@Injectable()
export class UserCanAccessRoom implements CanActivate {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserFromRequest(req);

    const roomId: unknown = req.params['roomId'];
    if (typeof roomId !== 'string') {
      throw new NotFoundException(`No room id provided.`);
    }

    const room: Modules.Documents.Result<
      'api::room.room',
      { populate: ['project'] }
    > | null = await strapi.documents('api::room.room').findOne({
      documentId: roomId,
      status: 'published',
      populate: ['project'],
    });
    if (room?.project == null) {
      throw new NotFoundException();
    }

    const allowed: boolean = await userCanSeeAndJoinRoom(
      user,
      room,
      this._databaseService,
    );

    if (!allowed && user == null) {
      context
        .switchToHttp()
        .getResponse<Response>()
        .setHeader('WWW-Authenticate', 'Bearer');
      throw new Unauthorized();
    }
    return allowed;
  }
}
