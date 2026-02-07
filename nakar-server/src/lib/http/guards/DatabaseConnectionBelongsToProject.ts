import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
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

    const databaseConnection: Result<
      'api::database-connection.database-connection',
      { populate: { project: { populate: [] } } }
    > | null = await strapi
      .documents('api::database-connection.database-connection')
      .findOne({
        documentId: databaseConnectionId,
        populate: { project: { populate: [] } },
      });

    const isOkay: boolean =
      databaseConnection?.project?.documentId === projectId;

    return isOkay;
  }
}
