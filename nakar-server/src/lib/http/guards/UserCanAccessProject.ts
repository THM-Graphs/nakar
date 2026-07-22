import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { Request } from 'express';
import { DatabaseService } from '../../database/DatabaseService';
import { userCanSeeAndEditProject } from '../../policies/userCanSeeAndEditProject';
import { AuthService } from '../../auth/AuthService';

@Injectable()
export class UserCanAccessProject implements CanActivate {
  public constructor(
    private readonly _databaseService: DatabaseService,
    private readonly _authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const user: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
      await this._authService.getUserFromRequest(req);

    const projectId: unknown = req.params['projectId'];
    if (typeof projectId !== 'string') {
      throw new NotFoundException(`No project id provided.`);
    }

    const project: Modules.Documents.Result<'api::project.project'> | null =
      await this._databaseService.getProjectOrNull(projectId);

    if (project == null) {
      throw new NotFoundException();
    }

    const allowed: boolean = await userCanSeeAndEditProject(
      user,
      project,
      this._databaseService,
    );

    return allowed;
  }
}
