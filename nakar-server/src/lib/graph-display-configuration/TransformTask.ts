import { MutableScenarioResult } from '../graph-transformer/MutableScenarioResult';
import { FinalGraphDisplayConfiguration } from './FinalGraphDisplayConfiguration';
import { Neo4jDatabase } from '../neo4j/Neo4jDatabase';
import { Profiler } from '../profile/Profiler';

export abstract class TransformTask {
  public readonly title: string;

  protected constructor(title: string) {
    this.title = title;
  }

  public async runAndProfile(
    input: MutableScenarioResult,
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ): Promise<void> {
    const task = Profiler.shared.profile(this.title);
    await this.run(input, config, database);
    task.finish();
  }

  protected abstract run(
    input: MutableScenarioResult,
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ): Promise<void> | void;
}
