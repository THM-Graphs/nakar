import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { Request } from 'express';
import { DatabaseService } from '../../database/DatabaseService';
import { databaseBelongsToCanvas } from '../../policies/databaseBelongsToCanvas';

@Injectable()
export class DatabaseBelongsToCanvas implements CanActivate {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const databaseId: unknown = req.params['databaseId'];
    if (typeof databaseId !== 'string') {
      throw new NotFoundException(`No database connection id provided.`);
    }
    const database: Modules.Documents.Result<'api::database-connection.database-connection'> =
      await this._databaseService.getDatabase(databaseId);

    const canvasId: unknown = req.params['canvasId'];
    if (typeof canvasId !== 'string') {
      throw new NotFoundException(`No canvas id provided.`);
    }
    const canvas: Modules.Documents.Result<'api::canvas.canvas'> =
      await this._databaseService.getCanvas(canvasId);

    return await databaseBelongsToCanvas(
      database,
      canvas,
      this._databaseService,
    );
  }
}
