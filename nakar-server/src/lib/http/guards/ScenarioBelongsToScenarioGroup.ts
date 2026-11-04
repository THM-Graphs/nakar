import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Modules } from '@strapi/types';
import { Request } from 'express';

@Injectable()
export class ScenarioBelongsToScenarioGroup implements CanActivate {
  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const scenarioGroupId: unknown = req.params['scenarioGroupId'];
    const scenarioId: unknown = req.params['scenarioId'];
    if (typeof scenarioGroupId !== 'string') {
      throw new NotFoundException(`No scenario group id provided.`);
    }
    if (typeof scenarioId !== 'string') {
      throw new NotFoundException(`No scenario id provided.`);
    }

    const scenario: Modules.Documents.Result<'api::scenario.scenario'> | null =
      await strapi.documents('api::scenario.scenario').findFirst({
        filters: {
          documentId: scenarioId,
          group: { documentId: scenarioGroupId },
        },
        status: 'published',
      });
    if (scenario == null) {
      throw new NotFoundException();
    }
    return true;
  }
}
