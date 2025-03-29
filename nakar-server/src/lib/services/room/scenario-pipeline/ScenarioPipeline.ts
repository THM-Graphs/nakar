import { MutableGraph } from '../graph/MutableGraph';
import { DatabaseService } from '../../database/DatabaseService';
import { GetScenarioDBDTO } from '../../database/dto/GetScenarioDBDTO';
import { FinalGraphDisplayConfiguration } from './display-configuration/FinalGraphDisplayConfiguration';
import { Neo4jService } from '../../neo4j/Neo4jService';
import { ScenarioPipelineStep } from './ScenarioPipelineStep';
import { LoadScenario } from './pipeline-steps/LoadScenario';
import { GetDatabaseDBDTO } from '../../database/dto/GetDatabaseDBDTO';
import { ExecuteInitialQuery } from './pipeline-steps/ExecuteInitialQuery';
import { CollectGraphDisplayConfiguration } from './pipeline-steps/CollectDisplayConfiguration';
import { GetScenarioGroupDBDTO } from '../../database/dto/GetScenarioGroupDBDTO';
import { ParseNeo4jLoginCredentials } from './pipeline-steps/ParseNeo4jLoginCredentials';
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
import { RemoveDanglingRelationships } from './pipeline-steps/RemoveDanglingRelationships';
import { Neo4jLoginCredentials } from '../../neo4j/Neo4jLoginCredentials';

export class ScenarioPipeline {
  private readonly _stepCount: number = 15;
  private _stepCounter: number;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _neo4j: Neo4jService,
  ) {
    this._stepCounter = 0;
  }

  public async run(
    scenarioId: string,
    onProgress: (title: string, progress: number) => void,
  ): Promise<[MutableGraph, GetScenarioDBDTO]> {
    this._stepCounter = 0;
    this._logger.debug(this, '----------- Scenario Pipeline Start -----------');

    const [scenario, query, database, scenarioGroup]: [
      GetScenarioDBDTO,
      string,
      GetDatabaseDBDTO,
      GetScenarioGroupDBDTO,
    ] = await this._runStep(
      new LoadScenario(this._database, scenarioId),
      onProgress,
    );
    const credentials: Neo4jLoginCredentials = await this._runStep(
      new ParseNeo4jLoginCredentials(database, this._logger),
      onProgress,
    );
    const graph: MutableGraph = await this._runStep(
      new ExecuteInitialQuery(
        query,
        credentials,
        scenario,
        this._logger,
        this._neo4j,
      ),
      onProgress,
    );
    await this._runStep(
      new RemoveDanglingRelationships(graph, this._logger),
      onProgress,
    );
    const displayConfiguration: FinalGraphDisplayConfiguration =
      await this._runStep(
        new CollectGraphDisplayConfiguration(
          database,
          scenario,
          scenarioGroup,
          this._logger,
        ),
        onProgress,
      );

    await this._runStep(
      new ConnectNodes(graph, displayConfiguration, credentials, this._neo4j),
      onProgress,
    );
    await this._runStep(
      new CompressRelationships(graph, displayConfiguration),
      onProgress,
    );
    await this._runStep(new ApplyLabels(graph, this._logger), onProgress);
    await this._runStep(new ApplyNodeDegrees(graph), onProgress);
    await this._runStep(new ApplyEdgeParallelCounts(graph), onProgress);
    await this._runStep(
      new ApplyNodeDisplayText(graph, displayConfiguration, this._logger),
      onProgress,
    );
    await this._runStep(
      new ApplyNodeRadius(graph, displayConfiguration, this._logger),
      onProgress,
    );
    await this._runStep(
      new ApplyNodeBackgroundColor(graph, displayConfiguration, this._logger),
      onProgress,
    );
    await this._runStep(
      new GrowNodeBasedOnDegree(graph, displayConfiguration),
      onProgress,
    );
    await this._runStep(
      new Layout(graph, this._logger, this._profiler),
      onProgress,
    );

    this._logger.debug(this, '----------- Scenario Pipeline End -----------');
    return [graph, scenario];
  }

  private async _runStep<T>(
    step: ScenarioPipelineStep<T>,
    onProgress: (title: string, progress: number) => void,
  ): Promise<T> {
    if (this._stepCounter >= this._stepCount) {
      this._logger.warn(
        this,
        `Step Counter >= Step Count. Step Counter: ${this._stepCounter.toString()}. Step Count: ${this._stepCount.toString()}`,
      );
    }
    onProgress(step.title, this._stepCounter / this._stepCount);
    await wait(0);
    this._stepCounter += 1;
    const profilerTask: ProfilerTask = this._profiler.profile(this, step.title);
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
