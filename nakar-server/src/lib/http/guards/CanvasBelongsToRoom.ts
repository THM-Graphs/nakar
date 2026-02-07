import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Request } from 'express';

@Injectable()
export class CanvasBelongsToRoom implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const roomId: unknown = req.params['roomId'];
    const canvasId: unknown = req.params['canvasId'];
    if (typeof roomId !== 'string') {
      throw new NotFoundException(`No room id provided.`);
    }
    if (typeof canvasId !== 'string') {
      throw new NotFoundException(`No canvas id provided.`);
    }

    const canvas: Result<
      'api::canvas.canvas',
      { populate: { room: { populate: [] } } }
    > | null = await strapi.documents('api::canvas.canvas').findOne({
      documentId: canvasId,
      populate: { room: { populate: [] } },
    });

    const isOkay: boolean = canvas?.room?.documentId === roomId;

    return isOkay;
  }
}
