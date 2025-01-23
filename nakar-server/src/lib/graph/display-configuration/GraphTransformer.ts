import { TransformTask } from './TransformTask';
import { MutableScenarioResult } from '../MutableScenarioResult';
import { FinalGraphDisplayConfiguration } from './FinalGraphDisplayConfiguration';
import { Neo4jDatabase } from '../../neo4j/Neo4jDatabase';
import { ConnectNodes } from './transform-tasks/ConnectNodes';
import { CompressRelationships } from './transform-tasks/CompressRelationships';
import { ApplyLabels } from './transform-tasks/ApplyLabels';
import { ApplyEdgeParallelCounts } from './transform-tasks/ApplyEdgeParallelCounts';
import { ApplyNodeDegrees } from './transform-tasks/ApplyNodeDegrees';
import { ApplyNodeDisplayText } from './transform-tasks/ApplyNodeDisplayText';
import { ApplyNodeRadius } from './transform-tasks/ApplyNodeRadius';
import { ApplyNodeBackgroundColor } from './transform-tasks/ApplyNodeBackgroundColor';
import { GrowNodeBasedOnDegree } from './transform-tasks/GrowNodeBasedOnDegree';

export class GraphTransformer {
  private readonly tasks: TransformTask[];
  private readonly config: FinalGraphDisplayConfiguration;
  private readonly database: Neo4jDatabase;

  public constructor(
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ) {
    this.tasks = [
      new ConnectNodes(),
      new CompressRelationships(),
      new ApplyLabels(),
      new ApplyNodeDegrees(),
      new ApplyEdgeParallelCounts(),
      new ApplyNodeDisplayText(),
      new ApplyNodeRadius(),
      new ApplyNodeBackgroundColor(),
      new GrowNodeBasedOnDegree(),
    ];
    this.config = config;
    this.database = database;
  }

  public async run(results: MutableScenarioResult): Promise<void> {
    for (const task of this.tasks) {
      await task.runAndProfile(results, this.config, this.database);
    }
  }
}
