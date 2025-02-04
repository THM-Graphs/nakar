import { DBScenarioGroup } from './DBScenarioGroup';
import { DBGraphDisplayConfiguration } from '../components/graph/DBGraphDisplayConfiguration';
import { DBMedia } from '../others/DBMedia';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SchemaScenario } from '../../../../src-gen/schema';

export class DBScenario {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly query: string | null;
  public readonly description: string | null;
  public readonly cover: DBMedia | null;
  public readonly scenarioGroup: DBScenarioGroup | null;
  public readonly graphDisplayConfiguration: DBGraphDisplayConfiguration;

  public constructor(data: {
    documentId: string;
    title: string | null;
    query: string | null;
    description: string | null;
    cover: DBMedia | null;
    scenarioGroup: DBScenarioGroup | null;
    graphDisplayConfiguration: DBGraphDisplayConfiguration;
  }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.query = data.query;
    this.description = data.description;
    this.cover = data.cover;
    this.scenarioGroup = data.scenarioGroup;
    this.graphDisplayConfiguration = data.graphDisplayConfiguration;
  }

  public static parse(
    db: Result<
      'api::scenario.scenario',
      { populate: ['graphDisplayConfiguration', 'scenarioGroup'] }
    > & {
      cover?: Result<'plugin::upload.file'> | null;
    },
  ): DBScenario {
    return new DBScenario({
      documentId: db.documentId,
      title: db.title ?? null,
      query: db.query ?? null,
      description: db.description ?? null,
      cover: db.cover != null ? DBMedia.parse(db.cover) : null,
      scenarioGroup: db.scenarioGroup
        ? DBScenarioGroup.parse(db.scenarioGroup)
        : null,
      graphDisplayConfiguration: DBGraphDisplayConfiguration.parseOrDefault(
        db.graphDisplayConfiguration,
      ),
    });
  }

  public toDto(): SchemaScenario {
    return {
      id: this.documentId,
      title: this.title,
      query: this.query,
      description: this.description,
      coverUrl: this.cover?.getPublicUrl() ?? null,
    };
  }
}
