import { MutableGraph } from '../graph/MutableGraph';
import { DatabaseService } from '../../database/DatabaseService';
import { DBScenario } from '../../database/collection-types/DBScenario';
import { FinalGraphDisplayConfiguration } from './display-configuration/FinalGraphDisplayConfiguration';
import { Neo4jDatabase } from '../../../tools/neo4j/Neo4jDatabase';
import { ScenarioPipelineStep } from './ScenarioPipelineStep';
import { LoadScenario } from './pipeline-steps/LoadScenario';
import { DBDatabase } from '../../database/collection-types/DBDatabase';
import { ExecuteInitialQuery } from './pipeline-steps/ExecuteInitialQuery';
import { CollectGraphDisplayConfiguration } from './pipeline-steps/CollectDisplayConfiguration';
import { DBScenarioGroup } from '../../database/collection-types/DBScenarioGroup';
import { CreateDatabaseConnection } from './pipeline-steps/CreateDatabaseConnection';
import { ApplyEdgeParallelCounts } from './pipeline-steps/ApplyEdgeParallelCounts';
import { ApplyLabels } from './pipeline-steps/ApplyLabels';
import { ApplyNodeBackgroundColor } from './pipeline-steps/ApplyNodeBackgroundColor';
import { ApplyNodeDegrees } from './pipeline-steps/ApplyNodeDegrees';
import { ApplyNodeDisplayText } from './pipeline-steps/ApplyNodeDisplayText';
import { ApplyNodeRadius } from './pipeline-steps/ApplyNodeRadius';
import { CompressRelationships } from './pipeline-steps/CompressRelationships';
import { ConnectNodes } from './pipeline-steps/ConnectNodes';
import { Layout } from './pipeline-steps/Layout';
import { GrowNodeBasedOnDegree } from './pipeline-steps/GrowNodeBasedOnDegree';
import { ProfilerService } from '../../profiler/ProfilerService';
import { ProfilerTask } from '../../profiler/ProfilerTask';
import { wait } from '../../../tools/Wait';
import { LoggerService } from '../../logger/LoggerService';

export class ScenarioPipeline {
  private readonly _stepCount: number = 14;
  private _stepCounter: number;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
  ) {
    this._stepCounter = 0;
  }

  public async run(
    scenarioId: string,
    onProgress: (title: string, progress: number) => void,
  ): Promise<[MutableGraph, DBScenario]> {
    this._stepCounter = 0;

    const [scenario, query, database, scenarioGroup]: [
      DBScenario,
      string,
      DBDatabase,
      DBScenarioGroup,
    ] = await this._runStep(
      new LoadScenario(this._database, scenarioId),
      onProgress,
    );
    const neo4jDatabase: Neo4jDatabase = await this._runStep(
      new CreateDatabaseConnection(database, this._logger),
      onProgress,
    );
    const graph: MutableGraph = await this._runStep(
      new ExecuteInitialQuery(query, neo4jDatabase, scenario),
      onProgress,
    );
    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._runStep(
        new CollectGraphDisplayConfiguration(database, scenario, scenarioGroup),
        onProgress,
      );

    await this._runStep(
      new ConnectNodes(graph, displayConfiguration, neo4jDatabase),
      onProgress,
    );
    await this._runStep(
      new CompressRelationships(graph, displayConfiguration),
      onProgress,
    );
    await this._runStep(new ApplyLabels(graph), onProgress);
    await this._runStep(new ApplyNodeDegrees(graph), onProgress);
    await this._runStep(new ApplyEdgeParallelCounts(graph), onProgress);
    await this._runStep(
      new ApplyNodeDisplayText(graph, displayConfiguration),
      onProgress,
    );
    await this._runStep(
      new ApplyNodeRadius(graph, displayConfiguration, this._logger),
      onProgress,
    );
    await this._runStep(
      new ApplyNodeBackgroundColor(graph, displayConfiguration),
      onProgress,
    );
    await this._runStep(
      new GrowNodeBasedOnDegree(graph, displayConfiguration),
      onProgress,
    );
    await this._runStep(new Layout(graph, this._logger), onProgress);

    return [graph, scenario];
  }

  private async _runStep<T>(
    step: ScenarioPipelineStep<T>,
    onProgress: (title: string, progress: number) => void,
  ): Promise<T> {
    onProgress(step.title, this._stepCounter / this._stepCount);
    await wait(0);
    this._stepCounter += 1;
    const profilerTask: ProfilerTask = this._profiler.profile(step.title);
    try {
      const result: T = await step.run();
      profilerTask.finish();
      return result;
    } catch (error: unknown) {
      profilerTask.finish();
      throw error;
    }
  }
}
