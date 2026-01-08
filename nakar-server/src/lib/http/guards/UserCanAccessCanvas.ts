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
import { userCanSeeCanvas } from '../../policies/userCanSeeCanvas';

@Injectable()
export class UserCanAccessCanvas implements CanActivate {
  public constructor(private readonly _databaseService: DatabaseService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const user: Result<'plugin::users-permissions.user'> | null =
      await getUser(context);

    const canvasId: unknown = req.params['id'];
    if (typeof canvasId !== 'string') {
      throw new NotFoundException(`No canvas id provided.`);
    }

    const canvas: Result<'api::v2-canvas.v2-canvas'> =
      await this._databaseService.getCanvas(canvasId);

    const allowed: boolean = await userCanSeeCanvas(
      user,
      canvas,
      this._databaseService,
    );

    return allowed;
  }
}
