import { DBDatabase } from './DBDatabase';
import { DBGraphDisplayConfiguration } from '../components/graph/DBGraphDisplayConfiguration';
import type { Result } from '@strapi/types/dist/modules/documents/result';
import { SchemaScenarioGroup } from '../../../../src-gen/schema';

export class DBScenarioGroup {
  public readonly documentId: string;
  public readonly title: string | null;
  public readonly database: DBDatabase | null;
  public readonly graphDisplayConfiguration: DBGraphDisplayConfiguration;

  public constructor(data: {
    documentId: string;
    title: string | null;
    database: DBDatabase | null;
    graphDisplayConfiguration: DBGraphDisplayConfiguration;
  }) {
    this.documentId = data.documentId;
    this.title = data.title;
    this.database = data.database;
    this.graphDisplayConfiguration = data.graphDisplayConfiguration;
  }

  public static parse(
    db: Result<'api::scenario-group.scenario-group', { populate: ['graphDisplayConfiguration', 'database'] }>,
  ): DBScenarioGroup {
    return new DBScenarioGroup({
      documentId: db.documentId,
      title: db.title ?? null,
      database: db.database ? DBDatabase.parse(db.database) : null,
      graphDisplayConfiguration: DBGraphDisplayConfiguration.parseOrDefault(db.graphDisplayConfiguration),
    });
  }

  public toDto(): SchemaScenarioGroup {
    return {
      id: this.documentId,
      title: this.title,
    };
  }
}
