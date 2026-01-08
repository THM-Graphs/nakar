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
import { userCanSeeProject } from '../../policies/userCanSeeProject';

@Injectable()
export class UserCanAccessProject implements CanActivate {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const user: Result<'plugin::users-permissions.user'> | null =
      await getUser(context);

    const projectId: unknown = req.params['projectId'];
    if (typeof projectId !== 'string') {
      throw new NotFoundException(`No project id provided.`);
    }

    const project: Result<'api::v2-project.v2-project'> =
      await this._databaseService.getProject(projectId);

    const allowed: boolean = await userCanSeeProject(
      user,
      project,
      this._databaseService,
    );

    return allowed;
  }
}
