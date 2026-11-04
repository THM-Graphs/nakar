import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { Request } from 'express';

@Injectable()
export class CommonPropertyBelongsToProject implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const commonPropertyId: unknown = req.params['commonPropertyId'];
    const projectId: unknown = req.params['projectId'];
    if (typeof commonPropertyId !== 'string') {
      throw new NotFoundException(`No common property id provided.`);
    }
    if (typeof projectId !== 'string') {
      throw new NotFoundException(`No project id provided.`);
    }

    const commonProperty: Modules.Documents.Result<'api::common-property.common-property'> | null =
      await strapi.documents('api::common-property.common-property').findFirst({
        filters: {
          documentId: commonPropertyId,
          project: { documentId: projectId },
        },
        status: 'published',
      });
    if (commonProperty == null) {
      throw new NotFoundException();
    }
    return true;
  }
}
