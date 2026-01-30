import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Result } from '@strapi/types/dist/modules/documents/result';
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

    const scenario: Result<
      'api::scenario.scenario',
      { populate: { group: { populate: [] } } }
    > | null = await strapi.documents('api::scenario.scenario').findOne({
      documentId: scenarioId,
      populate: { group: { populate: [] } },
    });

    const isOkay: boolean = scenario?.group?.documentId === scenarioGroupId;

    return isOkay;
  }
}
