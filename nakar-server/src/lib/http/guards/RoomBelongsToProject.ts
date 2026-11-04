import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { Request } from 'express';

@Injectable()
export class RoomBelongsToProject implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const roomId: unknown = req.params['roomId'];
    const projectId: unknown = req.params['projectId'];
    if (typeof roomId !== 'string') {
      throw new NotFoundException(`No room id provided.`);
    }
    if (typeof projectId !== 'string') {
      throw new NotFoundException(`No project id provided.`);
    }

    const room: Modules.Documents.Result<'api::room.room'> | null = await strapi
      .documents('api::room.room')
      .findFirst({
        filters: { documentId: roomId, project: { documentId: projectId } },
        status: 'published',
      });
    if (room == null) {
      throw new NotFoundException();
    }
    return true;
  }
}
