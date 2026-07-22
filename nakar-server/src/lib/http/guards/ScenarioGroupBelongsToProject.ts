import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { Request } from 'express';

@Injectable()
export class ScenarioGroupBelongsToProject implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const scenarioGroupId: unknown = req.params['scenarioGroupId'];
    const projectId: unknown = req.params['projectId'];
    if (typeof scenarioGroupId !== 'string') {
      throw new NotFoundException(`No scenario group id provided.`);
    }
    if (typeof projectId !== 'string') {
      throw new NotFoundException(`No project id provided.`);
    }

    const scenarioGroup: Modules.Documents.Result<
      'api::scenario-group.scenario-group',
      { populate: { project: { populate: [] } } }
    > | null = await strapi
      .documents('api::scenario-group.scenario-group')
      .findOne({
        documentId: scenarioGroupId,
        populate: { project: { populate: [] } },
      });

    const isOkay: boolean = scenarioGroup?.project?.documentId === projectId;

    return isOkay;
  }
}
