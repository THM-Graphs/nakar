import { DatabaseService } from '../../database/DatabaseService';
import { Neo4jService } from '../../neo4j/Neo4jService';
import { ScenarioPipelineStep } from './ScenarioPipelineStep';
import { LoadScenario } from './pipeline-steps/LoadScenario';
import { ExecuteInitialQuery } from './pipeline-steps/ExecuteInitialQuery';
import { CollectGraphDisplayConfiguration } from './pipeline-steps/CollectDisplayConfiguration';
import { ParseNeo4jLoginCredentials } from './pipeline-steps/ParseNeo4jLoginCredentials';
import { ApplyEdgeParallelCounts } from './pipeline-steps/ApplyEdgeParallelCounts';
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
import { ScenarioPipelineState } from './ScenarioPipelineState';
import { ScenarioPipelineResult } from './ScenarioPipelineResult';
import { ExcecuteAdditionalQueries } from './pipeline-steps/ExcecuteAdditionalQueries';

export class ScenarioPipeline {
  private readonly _stepCount: number = 15;

  public constructor(
    private readonly _database: DatabaseService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _neo4j: Neo4jService,
  ) {}

  public async run(
    scenarioId: string,
    onProgress: (title: string, progress: number) => void,
  ): Promise<ScenarioPipelineResult> {
    const state: ScenarioPipelineState = new ScenarioPipelineState(
      scenarioId,
      this._database,
      this._neo4j,
      this._logger,
      this._profiler,
    );
    this._logger.debug(this, '----------- Scenario Pipeline Start -----------');

    await this._runStep(state, new LoadScenario(), onProgress);
    await this._runStep(
      state,
      new CollectGraphDisplayConfiguration(),
      onProgress,
    );
    await this._runStep(state, new ParseNeo4jLoginCredentials(), onProgress);
    await this._runStep(state, new ExecuteInitialQuery(), onProgress);
    await this._runStep(state, new ExcecuteAdditionalQueries(), onProgress);
    await this._runStep(state, new RemoveDanglingRelationships(), onProgress);
    await this._runStep(state, new ConnectNodes(), onProgress);
    await this._runStep(state, new CompressRelationships(), onProgress);
    await this._runStep(state, new ApplyNodeDegrees(), onProgress);
    await this._runStep(state, new ApplyEdgeParallelCounts(), onProgress);
    await this._runStep(state, new ApplyNodeDisplayText(), onProgress);
    await this._runStep(state, new ApplyNodeRadius(), onProgress);
    await this._runStep(state, new ApplyNodeBackgroundColor(), onProgress);
    await this._runStep(state, new GrowNodeBasedOnDegree(), onProgress);
    await this._runStep(state, new Layout(), onProgress);

    state.graph.metaData.pipelineSummary = state.pipelineSummary;

    this._logger.debug(this, '----------- Scenario Pipeline End -----------');
    return new ScenarioPipelineResult(state);
  }

  private async _runStep(
    state: ScenarioPipelineState,
    step: ScenarioPipelineStep,
    onProgress: (title: string, progress: number) => void,
  ): Promise<void> {
    if (state.stepCounter >= this._stepCount) {
      this._logger.warn(
        this,
        `Step Counter >= Step Count. Step Counter: ${state.stepCounter.toString()}. Step Count: ${this._stepCount.toString()}`,
      );
    }
    onProgress(step.title, state.stepCounter / this._stepCount);
    await wait(0);
    state.stepCounter += 1;
    const profilerTask: ProfilerTask = this._profiler.profile(this, step.title);
    try {
      await step.run(state);
      profilerTask.finish();
      state.pipelineSummary.push([step.title, profilerTask.elapsedTimeMs]);
    } catch (error: unknown) {
      profilerTask.finish();
      state.pipelineSummary.push([step.title, profilerTask.elapsedTimeMs]);
      this._logger.error(this, `Pipeline crashed on ${step.title}:`);
      this._logger.error(this, error);
      throw error;
    }
  }
}
