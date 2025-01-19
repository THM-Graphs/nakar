import { MutableScenarioResult } from '../graph-transformer/MutableScenarioResult';
import { FinalGraphDisplayConfiguration } from './FinalGraphDisplayConfiguration';
import { Neo4jDatabase } from '../neo4j/Neo4jDatabase';

export abstract class TransformTask {
  public readonly title: string;

  public constructor(title: string) {
    this.title = title;
  }

  public async runAndProfile(
    input: MutableScenarioResult,
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ): Promise<void> {
    const startDate = Date.now();
    await this.run(input, config, database);
    const elapsedMs = Date.now() - startDate;
    strapi.log.debug(`[${this.title}]: ${elapsedMs.toString()}ms`);
  }

  protected abstract run(
    input: MutableScenarioResult,
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ): Promise<void> | void;
}
