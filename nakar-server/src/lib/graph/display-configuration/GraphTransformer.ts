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
import { Layout } from './transform-tasks/ForceSimulation';
import { Observable, Subject } from 'rxjs';
import { GraphTransformerProgress } from './GraphTransformerProgress';
import { wait } from '../../tools/Wait';

export class GraphTransformer {
  private static readonly _tasks: TransformTask[] = [
    new ConnectNodes(),
    new CompressRelationships(),
    new ApplyLabels(),
    new ApplyNodeDegrees(),
    new ApplyEdgeParallelCounts(),
    new ApplyNodeDisplayText(),
    new ApplyNodeRadius(),
    new ApplyNodeBackgroundColor(),
    new GrowNodeBasedOnDegree(),
    new Layout(),
  ];
  private readonly _config: FinalGraphDisplayConfiguration;
  private readonly _database: Neo4jDatabase;
  private readonly _onProgress: Subject<GraphTransformerProgress>;

  public constructor(
    config: FinalGraphDisplayConfiguration,
    database: Neo4jDatabase,
  ) {
    this._onProgress = new Subject();
    this._config = config;
    this._database = database;
  }

  public static get taskCount(): number {
    return GraphTransformer._tasks.length;
  }

  public get onProgress$(): Observable<GraphTransformerProgress> {
    return this._onProgress.asObservable();
  }

  public async run(results: MutableGraph): Promise<void> {
    for (const task of GraphTransformer._tasks) {
      this._sendProgressUpdate(task);
      await wait();
      await task.runAndProfile(results, this._config, this._database);
    }
  }

  private _sendProgressUpdate(task: TransformTask): void {
    this._onProgress.next(
      new GraphTransformerProgress(
        GraphTransformer._tasks.indexOf(task),
        task.title,
      ),
    );
  }
}
