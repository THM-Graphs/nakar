import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { getUser } from '../tools/getUser';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Request } from 'express';
import { DatabaseService } from '../../database/DatabaseService';
import { userCanSeeRoom } from '../../policies/userCanSeeRoom';

@Injectable()
export class UserCanAccessRoom implements CanActivate {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const user: Result<'plugin::users-permissions.user'> | null =
      await getUser(context);

    const roomId: unknown = req.params['id'];
    if (typeof roomId !== 'string') {
      throw new NotFoundException(`No room id provided.`);
    }

    const room: Result<'api::v2-room.v2-room'> =
      await this._databaseService.getRoom(roomId);

    const allowed: boolean = await userCanSeeRoom(
      user,
      room,
      this._databaseService,
    );

    return allowed;
  }
}
