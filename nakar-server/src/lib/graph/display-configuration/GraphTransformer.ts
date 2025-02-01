import { TransformTask } from './TransformTask';
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
import { MutableGraph } from '../MutableGraph';
import { ForceSimulation } from './transform-tasks/ForceSimulation';

export class GraphTransformer {
  private readonly _tasks: TransformTask[];
  private readonly _config: FinalGraphDisplayConfiguration;
  private readonly _database: Neo4jDatabase;

  public constructor(
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ) {
    this._tasks = [
      new ConnectNodes(),
      new CompressRelationships(),
      new ApplyLabels(),
      new ApplyNodeDegrees(),
      new ApplyEdgeParallelCounts(),
      new ApplyNodeDisplayText(),
      new ApplyNodeRadius(),
      new ApplyNodeBackgroundColor(),
      new GrowNodeBasedOnDegree(),
      new ForceSimulation(),
    ];
    this._config = config;
    this._database = database;
  }

  public async run(results: MutableGraph): Promise<void> {
    for (const task of this._tasks) {
      await task.runAndProfile(results, this._config, this._database);
    }
  }
}
