import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { databaseBelongsToProject } from '../../policies/databaseBelongsToProject';
import { DatabaseService } from '../../database/DatabaseService';

@Injectable()
export class DatabaseConnectionBelongsToProject implements CanActivate {
  constructor(private readonly _databaseService: DatabaseService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const databaseConnectionId: unknown = req.params['databaseConnectionId'];
    const projectId: unknown = req.params['projectId'];
    if (typeof databaseConnectionId !== 'string') {
      throw new NotFoundException(`No database connection id provided.`);
    }
    if (typeof projectId !== 'string') {
      throw new NotFoundException(`No project id provided.`);
    }

    return await databaseBelongsToProject(
      await this._databaseService.getDatabase(databaseConnectionId),
      await this._databaseService.getProject(projectId),
      this._databaseService,
    );
  }
}
