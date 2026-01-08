import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Request } from 'express';
import { DatabaseService } from '../../database/DatabaseService';

@Injectable()
export class DatabaseBelongsToRoom implements CanActivate {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const databaseId: unknown = req.params['databaseId'];
    if (typeof databaseId !== 'string') {
      throw new NotFoundException(`No database connection id provided.`);
    }
    const database: Result<'api::v2-database-connection.v2-database-connection'> =
      await this._databaseService.getDatabase(databaseId);

    const roomId: unknown = req.params['roomId'];
    if (typeof roomId !== 'string') {
      throw new NotFoundException(`No room id provided.`);
    }
    const room: Result<'api::v2-room.v2-room'> =
      await this._databaseService.getRoom(roomId);

    const projectOfDatabase: Result<'api::v2-project.v2-project'> =
      await this._databaseService.getProjectOfDatabase(database);
    const projectOfRoom: Result<'api::v2-project.v2-project'> =
      await this._databaseService.getProjectOfRoom(room);

    const isOkay: boolean =
      projectOfDatabase.documentId === projectOfRoom.documentId;

    return isOkay;
  }
}
