import { GetScenarioGroupDBDTO } from './GetScenarioGroupDBDTO';
import { GetGraphDisplayConfigurationDBDTO } from './GetGraphDisplayConfigurationDBDTO';
import { GetMediaDBDTO } from '../others/GetMediaDBDTO';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SchemaScenario } from '../../../../../src-gen/schema';
import { ConfigService } from '../../config/ConfigService';

export class GetScenarioDBDTO {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly query: string | null;
  public readonly description: string | null;
  public readonly cover: GetMediaDBDTO | null;
  public readonly scenarioGroup: GetScenarioGroupDBDTO | null;
  public readonly graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;

  public constructor(data: {
    documentId: string;
    title: string | null;
    query: string | null;
    description: string | null;
    cover: GetMediaDBDTO | null;
    scenarioGroup: GetScenarioGroupDBDTO | null;
    graphDisplayConfiguration: GetGraphDisplayConfigurationDBDTO;
  }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.query = data.query;
    this.description = data.description;
    this.cover = data.cover;
    this.scenarioGroup = data.scenarioGroup;
    this.graphDisplayConfiguration = data.graphDisplayConfiguration;
  }

  public toDto(configService: ConfigService): SchemaScenario {
    return {
      id: this.documentId,
      title: this.title,
      query: this.query,
      description: this.description,
      coverUrl: this.cover?.getPublicUrl(configService) ?? null,
    };
  }
}
