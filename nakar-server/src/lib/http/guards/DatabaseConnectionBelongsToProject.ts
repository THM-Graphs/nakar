import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { Request } from 'express';

@Injectable()
export class DatabaseConnectionBelongsToProject implements CanActivate {
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

    const database: Modules.Documents.Result<'api::database-connection.database-connection'> | null =
      await strapi
        .documents('api::database-connection.database-connection')
        .findFirst({
          filters: {
            documentId: databaseConnectionId,
            project: { documentId: projectId },
          },
          status: 'published',
        });
    if (database == null) {
      throw new NotFoundException();
    }
    return true;
  }
}
