import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Request } from 'express';
import { DatabaseService } from '../../database/DatabaseService';
import { userCanSeeProject } from '../../policies/userCanSeeProject';
import { AuthService } from '../../auth/AuthService';

@Injectable()
export class UserCanAccessProject implements CanActivate {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const user: Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserFromRequest(req);

    const projectId: unknown = req.params['projectId'];
    if (typeof projectId !== 'string') {
      throw new NotFoundException(`No project id provided.`);
    }

    const project: Result<'api::project.project'> =
      await this._databaseService.getProject(projectId);

    const allowed: boolean = await userCanSeeProject(
      user,
      project,
      this._databaseService,
    );

    return allowed;
  }
}
